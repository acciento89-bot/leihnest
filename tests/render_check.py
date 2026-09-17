"""Offline Chromium layout checks using HTML served by the real ASGI application.

This does not navigate the managed browser or change its URL policy. Resources
are embedded from the local application for visual QA. Full navigation/lifecycle
coverage is in browser_check.py for CI; HTTP integration runs in test_web.py.
"""
from pathlib import Path
import base64
import json
import os
import re
import secrets
import sys
import tempfile
import time
from datetime import datetime,timedelta
from fastapi.testclient import TestClient
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from app.config import Settings
from app.main import create_app
from app.i18n import TZ

OUT=Path(os.getenv('BROWSER_OUTPUT',str(ROOT/'artifacts'/'render')))
OUT.mkdir(parents=True,exist_ok=True)

def run():
    with tempfile.TemporaryDirectory() as folder:
        config=Settings(data_dir=Path(folder),secret=secrets.token_urlsafe(48),public_url='http://testserver',allow_signup=True)
        app=create_app(config)
        s=app.state.store
        password=secrets.token_urlsafe(22)
        owner=s.create_user('owner@example.org','Mara',password)
        g=s.create_group(owner,'Freizeitfreunde')
        people=[]
        for name in ['Jonas','Leonie','Ben']:
            email=name.lower()+'@example.org'
            u=s.create_user(email,name,password)
            s.accept_invite(u,s.invite(owner,g,email))
            people.append(u)
        items=[]
        for name,qty,category,location in [('Pavillon 3 x 3 m',2,'outdoor','Vereinsheim / Lager A'),('Bluetooth-Lautsprecher',1,'tech','Vereinsheim / Regal 2'),('Spielekiste',1,'sport','Gemeinschaftsraum'),('Beamer',1,'tech','Technikschrank'),('Bierzeltgarnitur',4,'events','Vereinsheim / Lager B'),('Badminton-Set',2,'sport','Vereinsheim / Lager A')]:
            items.append(s.add_item(owner,g,name=name,quantity=qty,category=category,location=location,description='Gemeinsam nutzen und nach der Ausleihe vollstaendig zurueckbringen.',condition='Gepflegt und einsatzbereit',accessories='Transporttasche'))
        start=int((datetime.now(TZ)+timedelta(days=1)).replace(hour=10,minute=0,second=0,microsecond=0).timestamp())
        for n in range(3):
            s.reserve(people[n],g,items[n],1,start+n*86400,start+n*86400+8*3600)
        b=s.reserve(people[0],g,items[3],1,int(time.time())+120,int(time.time())+7200)
        s.transition(owner,g,b,'issue')
        with TestClient(app) as client, sync_playwright() as p:
            executable=os.getenv('BROWSER_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
            browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox'])
            context=browser.new_context(reduced_motion='reduce')
            page=None
            script_errors=[]
            checks=[]
            failures=[]
            contrasts=[]
            css=(ROOT/'app/static/style.css').read_text()
            js=(ROOT/'app/static/app.js').read_text()
            svg=(ROOT/'app/static/icons.svg').read_text().replace('<svg xmlns=', '<svg style="display:none" xmlns=',1)
            def render(path,name,width=1440,save=False):
                nonlocal page
                if page is not None:
                    page.close()
                page=context.new_page()
                page.on('pageerror',lambda exc:script_errors.append(str(exc)))
                response=client.get(path)
                assert response.status_code==200,(path,response.status_code)
                html=response.text
                html=re.sub(r'<link[^>]+rel="(?:stylesheet|icon)"[^>]*>','',html)
                html=re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',html)
                html=html.replace('</head>','<style>'+css+'</style></head>')
                html=html.replace('href="/static/icons.svg#','href="#')
                html=html.replace('</body>',svg+'<script>'+js+'</script></body>')
                def inline_photo(match):
                    data=client.get(match.group(1))
                    return 'src="data:'+data.headers['content-type']+';base64,'+base64.b64encode(data.content).decode()+'"'
                html=re.sub(r'src="(/g/[^\"]+/media/[^\"]+)"',inline_photo,html)
                page.set_viewport_size({'width':width,'height':1000 if width>700 else 844})
                page.set_content(html,wait_until='load')
                page.wait_for_timeout(70)
                overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
                if overflow:
                    failures.append({'page':name,'width':width,'elements':page.evaluate("[...document.querySelectorAll('body *')].filter(e=>{let r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right]).slice(0,20)")})
                checks.append({'page':name,'width':width,'status':response.status_code,'overflow':overflow})
                if save:
                    page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
                if name=='dashboard-mobile':
                    assert page.locator('#workspace-navigation').evaluate("e=>getComputedStyle(e).display")=='none'
                    page.locator('[data-menu]').click()
                    assert page.locator('[data-menu]').get_attribute('aria-expanded')=='true'
                    page.keyboard.press('Escape')
                    assert page.locator('[data-menu]').get_attribute('aria-expanded')=='false'
                assert page.locator('h1').count()==1
            render('/','home-desktop',save=True)
            render('/login','login-desktop',save=True)
            token=re.search(r'name="csrf" value="([^"]+)"',client.get('/login').text).group(1)
            client.post('/login',data={'csrf':token,'email':'owner@example.org','password':password})
            routes=[('/g/'+g,'dashboard'),('/g/'+g+'/items','inventory'),('/g/'+g+'/bookings','bookings'),('/g/'+g+'/calendar','calendar'),('/g/'+g+'/members','members'),('/g/'+g+'/settings','settings'),('/g/'+g+'/items/'+items[0],'item'),('/g/'+g+'/items/new','item-editor'),('/app','groups')]
            for path,name in routes:
                render(path,name+'-desktop',save=True)
                render(path,name+'-mobile',width=390,save=True)
            render('/','home-mobile',width=390,save=True)
            client.get('/language/en?next=/app')
            for path,name in routes:
                render(path,name+'-english',width=390,save=name=='inventory')
            assert not failures,json.dumps(failures,indent=2)
            assert not script_errors,script_errors
            result={'status':'passed','mode':'offline browser rendering plus HTTP integration; not browser navigation','checks':checks,'browser':browser.version}
            (OUT/'render-report.json').write_text(json.dumps(result,indent=2))
            print(json.dumps(result,indent=2))
            browser.close()

if __name__=='__main__':
    run()
