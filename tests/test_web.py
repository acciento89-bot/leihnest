import io
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import create_app
from app.config import Settings

@pytest.fixture
def client(tmp_path):
    settings = Settings(data_dir=tmp_path, secret='test-secret-not-a-real-deployment-key-123456789', public_url='http://testserver', allow_signup=True)
    with TestClient(create_app(settings)) as c:
        yield c

def csrf(c, path='/login'):
    text = c.get(path).text
    return re.search(r'name="csrf" value="([^"]+)"',text).group(1)

def signup(c, email='owner@example.org'):
    return c.post('/signup',data={'csrf':csrf(c,'/signup'),'email':email,'name':'Alex','password':'Correct-password-123','next':'/app'})

def group(c):
    signup(c)
    response = c.post('/groups',data={'csrf':csrf(c,'/app'),'name':'Freizeitfreunde'})
    return response.url.path.split('/')[2]

def test_public_pages_and_headers(client):
    for path in ['/', '/login','/signup','/forgot','/legal/imprint','/legal/privacy']:
        response = client.get(path)
        assert response.status_code == 200
        assert 'LeihNest' in response.text
        assert 'frame-ancestors' in response.headers['content-security-policy']
        assert response.headers['x-content-type-options']=='nosniff'

def test_signup_requires_csrf(client):
    result = client.post('/signup',data={'email':'test@example.org','name':'Test','password':'Secure-password-123'})
    assert result.status_code == 403

def test_signup_login_logout_and_protected_pages(client):
    response = signup(client)
    assert response.status_code == 200
    assert response.url.path == '/app'
    response = client.post('/logout',data={'csrf':csrf(client,'/app')})
    assert response.url.path == '/'
    assert client.get('/app').url.path == '/login'
    response = client.post('/login',data={'csrf':csrf(client),'email':'owner@example.org','password':'Correct-password-123'})
    assert response.url.path == '/app'

def test_tenant_isolation_at_http_layer(client):
    gid = group(client)
    client.post('/logout',data={'csrf':csrf(client,'/app')})
    signup(client,'outsider@example.org')
    for suffix in ['', '/items','/bookings','/calendar','/members','/settings','/export']:
        assert client.get(f'/g/{gid}{suffix}').status_code == 403

def test_german_and_english(client):
    de = client.get('/language/de?next=/').text
    en = client.get('/language/en?next=/').text
    assert 'Gemeinsam' in de
    assert 'Together' in en
    assert 'Gegenst' not in en
    assert '<html lang="en">' in en

def test_external_redirect_is_rejected(client):
    signup(client)
    response = client.get('/language/en?next=//evil.example')
    assert response.url.host == 'testserver'
    assert response.url.path == '/app'

def test_origin_mismatch_rejected(client):
    response = client.post('/signup',headers={'origin':'https://evil.example'},data={'csrf':csrf(client,'/signup'),'name':'A','email':'a@example.org','password':'Correct-password-123'})
    assert response.status_code == 403

def test_complete_web_lifecycle_and_photo(client):
    gid = group(client)
    picture=io.BytesIO()
    Image.new('RGB',(20,20)).save(picture,'PNG')
    response=client.post(f'/g/{gid}/items/new',data={'csrf':csrf(client,f'/g/{gid}/items/new'),'name':'Pavillon','quantity':'2','category':'outdoor','location':'Vereinsheim'},files={'photo':('image.png',picture.getvalue(),'image/png')})
    assert response.status_code == 200
    iid=response.url.path.split('/')[-1]
    assert 'Pavillon' in response.text
    image_url=re.search(r'src="(/g/[^" ]+/media/[^" ]+)"',response.text).group(1)
    photo=client.get(image_url)
    assert photo.headers['content-type']=='image/webp'
    start=datetime.now(ZoneInfo('Europe/Berlin'))+timedelta(days=1)
    end=start+timedelta(hours=2)
    response=client.post(f'/g/{gid}/items/{iid}/reserve',data={'csrf':csrf(client,f'/g/{gid}/items/{iid}'),'quantity':'2','start':start.strftime('%Y-%m-%dT%H:%M'),'end':end.strftime('%Y-%m-%dT%H:%M')})
    assert response.status_code==200
    store=client.app.state.store
    owner=store.authenticate('owner@example.org','Correct-password-123')
    bid=store.bookings(owner,gid)[0]['id']
    for action,quantity in [('issue',''),('return','1'),('return','1')]:
        result=client.post(f'/g/{gid}/bookings/{bid}/{action}',data={'csrf':csrf(client,f'/g/{gid}/bookings'),'quantity':quantity})
        assert result.status_code==200
    assert store.booking(owner,gid,bid)['status']=='returned'
    for suffix in ['', '/items','/calendar','/members','/settings']:
        assert client.get(f'/g/{gid}{suffix}').status_code==200
    client.post('/logout',data={'csrf':csrf(client,'/app')})
    assert client.get(image_url).headers.get('content-type','').startswith('text/html')

def test_bad_image_rejected(client):
    gid=group(client)
    result=client.post(f'/g/{gid}/items/new',data={'csrf':csrf(client,f'/g/{gid}/items/new'),'name':'Bad','quantity':'1','category':'other'},files={'photo':('evil.svg',b'<svg onload="alert(1)"></svg>','image/svg+xml')})
    assert result.status_code==400

def test_missing_csrf_rejected_on_inventory(client):
    gid=group(client)
    assert client.post(f'/g/{gid}/items/new',data={'name':'Bad','quantity':'1'}).status_code==403

def test_invalid_dates_are_validation_error(client):
    gid=group(client)
    store=client.app.state.store
    owner=store.authenticate('owner@example.org','Correct-password-123')
    iid=store.add_item(owner,gid,name='Pavillon',quantity=1)
    result=client.post(f'/g/{gid}/items/{iid}/reserve',data={'csrf':csrf(client,f'/g/{gid}/items/{iid}'),'quantity':'1','start':'nonsense','end':'bad'})
    assert result.status_code==400

def test_closed_signup_is_really_closed(tmp_path):
    with TestClient(create_app(Settings(data_dir=tmp_path,secret='another-long-secret-for-tests-only',public_url='http://testserver',allow_signup=False))) as c:
        token=csrf(c)
        assert c.post('/signup',data={'csrf':token,'email':'a@example.org','name':'A','password':'Correct-password-123'}).status_code==403

def test_csv_export_neutralizes_spreadsheet_formulas(client):
    gid=group(client)
    s=client.app.state.store
    owner=s.authenticate('owner@example.org','Correct-password-123')
    s.add_item(owner,gid,name='=HYPERLINK("evil")',quantity=1)
    response=client.get(f'/g/{gid}/export')
    assert "'=HYPERLINK" in response.text

def test_unknown_host_and_large_body_rejected(client):
    assert client.get('/',headers={'host':'evil.example'}).status_code==400
    assert client.post('/signup',content=b'x'*(6*1024*1024+1)).status_code==413

def test_language_switch_preserves_invitation_destination(client):
    from html import unescape
    from urllib.parse import urlsplit,parse_qs
    text=client.get('/login?next=%2Fjoin%2Fexample-token').text
    link=unescape(re.search(r'href="(/language/en[^\"]+)"',text).group(1))
    destination=parse_qs(urlsplit(link).query)['next'][0]
    assert destination=='/login?next=%2Fjoin%2Fexample-token'
