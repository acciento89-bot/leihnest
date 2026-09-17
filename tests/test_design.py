"""Visible and accessible contracts of the independent LeihNest design."""
import re
import secrets
from html.parser import HTMLParser
import pytest
from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


@pytest.fixture
def workspace(tmp_path):
    app = create_app(Settings(data_dir=tmp_path, secret=secrets.token_urlsafe(48), public_url='http://testserver', allow_signup=True))
    password = secrets.token_urlsafe(20)
    uid = app.state.store.create_user('design@example.org', 'Mara', password)
    gid = app.state.store.create_group(uid, 'Freizeitfreunde')
    iid = app.state.store.add_item(uid, gid, name='Campingzelt', quantity=2, category='outdoor')
    with TestClient(app) as client:
        client.get('/language/de?next=/')
        csrf = re.search(r'name="csrf" value="([^"]+)"', client.get('/login').text).group(1)
        client.post('/login', data={'csrf': csrf, 'email': 'design@example.org', 'password': password})
        yield client, gid, iid


@pytest.mark.parametrize('locale,headline', [('de', 'Gute Dinge.'), ('en', 'Good things.')])
def test_home_has_distinct_editorial_headline(workspace, locale, headline):
    client, _, _ = workspace
    html = client.get('/language/' + locale + '?next=/').text
    assert headline in html
    assert len(Elements(html).find('h1')) == 1
    assert 'class="sharing-still-life"' in html


@pytest.mark.parametrize('suffix', ['', '/items', '/calendar', '/bookings'])
def test_workspace_has_named_top_navigation_and_current_page(workspace, suffix):
    client, gid, _ = workspace
    html = client.get('/g/' + gid + suffix).text
    elements = Elements(html)
    assert elements.find('nav', id='workspace-navigation')
    assert not elements.find('aside', id='sidebar')
    current = elements.find('a', **{'aria-current': 'page'})
    assert len(current) == 1
    assert current[0]['href'] == '/g/' + gid + suffix
    assert elements.find('button', **{'aria-controls': 'workspace-navigation', 'aria-expanded': 'false'})


def test_no_photo_is_explicit_instead_of_fake_item_photo(workspace):
    client, gid, iid = workspace
    html = client.get('/g/' + gid + '/items/' + iid).text
    assert 'Noch kein Foto' in html
    assert 'class="category-illustration"' in html


def test_dashboard_uses_description_list_for_real_stock_counts(workspace):
    client, gid, _ = workspace
    elements = Elements(client.get('/g/' + gid).text)
    assert elements.find('dl', **{'class': 'nest-ledger'})
    assert len(elements.find('dt')) == 4
    assert len(elements.find('dd')) == 4
