"""Offline layout regression check against actual Next production HTML/CSS.

Run after npm run build. QA-only requirements: beautifulsoup4 and playwright.
Set CHROMIUM_PATH to an installed browser or use Playwright's installed browser.
This checks document geometry, not authenticated workflows or hydration.
"""
import base64
import os
from pathlib import Path
import unittest

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[2]


def production_html(locale: str) -> str:
    """Keep the compiled styles and local images; disable network and scripts."""
    page = REPO / '.next/server/app' / ('index.html' if locale == 'de' else 'en.html')
    soup = BeautifulSoup(page.read_text(encoding='utf-8'), 'html.parser')
    for script in soup.find_all('script'):
        script.decompose()
    for link in list(soup.find_all('link')):
        href = link.get('href', '')
        if 'stylesheet' in link.get('rel', []) and href.startswith('/_next/'):
            style = soup.new_tag('style')
            style.string = (REPO / '.next' / href.removeprefix('/_next/')).read_text(encoding='utf-8')
            link.replace_with(style)
        else:
            link.decompose()
    for image in soup.find_all('img'):
        src = image.get('src', '')
        if src.startswith('/images/'):
            path = REPO / 'public' / src.lstrip('/')
            mime = 'image/png' if path.suffix == '.png' else 'image/webp'
            image['src'] = f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
            image.attrs.pop('srcset', None)
            image['loading'] = 'eager'
    return str(soup)


class HomeLayoutTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        options = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        cls.browser = cls.playwright.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_wrapped_copy_never_overlaps_the_audience_strip(self):
        page = self.browser.new_page()
        page.route('**/*', lambda route: route.abort())
        try:
            for locale in ('de', 'en'):
                html = production_html(locale)
                for width in (320, 390, 567, 768, 999, 1000, 1280, 1448, 1672, 1920):
                    for scale in (1, 1.25):
                        with self.subTest(locale=locale, width=width, text_scale=scale):
                            page.set_viewport_size({'width': width, 'height': 1086})
                            page.set_content(html, wait_until='load')
                            if scale != 1:
                                page.evaluate('''scale => {
                                    const elements = [...document.querySelectorAll('.lh-copy h1, .lh-copy h1 span, .lh-description')];
                                    const sizes = elements.map(e => parseFloat(getComputedStyle(e).fontSize));
                                    elements.forEach((e, i) => { e.style.fontSize = (sizes[i] * scale) + 'px'; });
                                }''', scale)
                            boxes = page.evaluate('''() => {
                                const facts = document.querySelector('.lh-facts').getBoundingClientRect();
                                const hero = document.querySelector('.lh-hero').getBoundingClientRect();
                                const audience = document.querySelector('.lh-audiences').getBoundingClientRect();
                                return {gap: audience.top - facts.bottom,
                                    contained: hero.bottom - facts.bottom,
                                    scrollWidth: document.documentElement.scrollWidth, width: innerWidth};
                            }''')
                            self.assertGreaterEqual(boxes['gap'], 16, str(boxes))
                            self.assertGreaterEqual(boxes['contained'], 0, str(boxes))
                            self.assertLessEqual(boxes['scrollWidth'], boxes['width'], str(boxes))
        finally:
            page.close()


if __name__ == '__main__':
    unittest.main()
