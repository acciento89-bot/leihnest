"""Real-browser lifecycle, DE/EN rendering and desktop/mobile overflow checks.

Run: python tests/browser_check.py. Uses a disposable server and database.
Set BROWSER_EXECUTABLE for a system Chromium; otherwise Playwright's browser.
"""
from pathlib import Path
import os
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import json
from datetime import datetime, timedelta
import httpx
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from app.domain import Store
from app.i18n import TZ

OUT=Path(os.getenv('BROWSER_OUTPUT',str(ROOT/'artifacts')))
OUT.mkdir(parents=True,exist_ok=True)


def run():
    with tempfile.TemporaryDirectory() as folder:
        password=secrets.token_urlsafe(20)
        s=Store(Path(folder)/'leihnest.sqlite3')
        owner=s.create_user('owner@example.org','Mara',password)
        g=s.create_group(owner,'Freizeitfreunde')
        people=[]
        for name in ['Jonas','Leonie','Ben']:
            email=name.lower()+'@example.org'
            u=s.create_user(email,name,password)
            s.accept_invite(u,s.invite(owner,g,email))
            people.append(u)
        inventory=[('Pavillon 3 x 3 m',2,'outdoor','Vereinsheim / Lager A'),('Bluetooth-Lautsprecher',1,'tech','Vereinsheim / Regal 2'),('Spielekiste',1,'sport','Gemeinschaftsraum'),('Beamer',1,'tech','Technikschrank'),('Bierzeltgarnitur',4,'events','Vereinsheim / Lager B'),('Badminton-Set',2,'sport','Vereinsheim / Lager A')]
        items=[]
        for name,qty,category,location in inventory:
            items.append(s.add_item(owner,g,name=name,quantity=qty,category=category,location=location,description='Gemeinsam nutzen und nach der Ausleihe vollstaendig zurueckbringen.',condition='Gepflegt und einsatzbereit',accessories='Transporttasche'))
        start=int((datetime.now(TZ)+timedelta(days=1)).replace(hour=10,minute=0,second=0,microsecond=0).timestamp())
        for n in range(3):
            s.reserve(people[n],g,items[n],1,start+n*86400,start+n*86400+8*3600)
        borrowed=s.reserve(people[0],g,items[3],1,int(time.time())+120,int(time.time())+7200)
        s.transition(owner,g,borrowed,'issue')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0))
            port=sock.getsockname()[1]
        base=f'http://127.0.0.1:{port}'
        env=dict(os.environ,DATA_DIR=folder,SECRET_KEY=secrets.token_urlsafe(48),PUBLIC_URL=base,ALLOW_SIGNUP='1',LEIHNEST_ENV='development')
        logs=(OUT/'server.log').open('w')
        server=subprocess.Popen([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port',str(port),'--no-access-log'],cwd=ROOT,env=env,stdout=logs,stderr=logs)
        try:
            for _ in range(100):
                try:
                    if httpx.get(base+'/health').status_code==200:
                        break
                except httpx.HTTPError:
                    pass
                time.sleep(.1)
            else:
                raise RuntimeError('Server did not start')
            with sync_playwright() as p:
                executable=os.getenv('BROWSER_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
                browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox'])
                context=browser.new_context(locale='de-DE',viewport={'width':1440,'height':1000},reduced_motion='reduce')
                page=context.new_page()
                errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.on('console',lambda msg:errors.append(msg.text) if msg.type=='error' else None)
                page.on('dialog',lambda dialog:dialog.accept())
                checks=[]
                def check(path,label,screenshot=False):
                    response=page.goto(base+path)
                    assert response.status==200,(path,response.status)
                    page.wait_for_load_state('networkidle')
                    assert page.locator('h1').count()==1,path
                    overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
                    assert not overflow,('horizontal overflow',path,page.viewport_size)
                    checks.append({'path':path,'width':page.viewport_size['width'],'status':response.status})
                    if screenshot:
                        page.screenshot(path=str(OUT/(label+'.png')),full_page=True)
                check('/','home-desktop',True)
                page.goto(base+'/login')
                page.get_by_label('E-Mail-Adresse',exact=True).fill('owner@example.org')
                page.get_by_label('Passwort',exact=True).fill(password)
                page.get_by_role('button',name='Anmelden',exact=True).click()
                page.wait_for_url('**/app')
                check('/g/'+g,'dashboard-desktop',True)
                for route in ['/items','/bookings','/calendar','/members','/settings','/items/'+items[0],'/items/new']:
                    check('/g/'+g+route,route.strip('/').replace('/','-')+'-desktop',route in ['/items','/calendar'])
                page.goto(base+'/language/en?next=/g/'+g)
                assert page.locator('html').get_attribute('lang')=='en'
                assert page.get_by_role('heading',name='Your nest. Your possibilities.',exact=True).is_visible()
                check('/g/'+g+'/items','inventory-english',True)
                page.goto(base+'/language/de?next=/g/'+g)
                page.set_viewport_size({'width':390,'height':844})
                for route in ['','/items','/bookings','/calendar','/members','/settings','/items/'+items[0],'/items/new']:
                    check('/g/'+g+route,('dashboard' if not route else route.strip('/').replace('/','-'))+'-mobile',route in ['','/items'])
                page.locator('[data-menu]').click()
                assert page.locator('[data-menu]').get_attribute('aria-expanded')=='true'
                page.keyboard.press('Escape')
                assert page.locator('[data-menu]').get_attribute('aria-expanded')=='false'
                check('/','home-mobile',True)
                # New account and end-to-end lending through actual browser forms.
                clean=browser.new_context(locale='de-DE',viewport={'width':390,'height':844})
                flow=clean.new_page()
                flow.on('pageerror',lambda error:errors.append(str(error)))
                flow.on('dialog',lambda dialog:dialog.accept())
                flow.goto(base+'/signup')
                flow.get_by_label('Name',exact=True).fill('Alex')
                flow.get_by_label('E-Mail-Adresse',exact=True).fill('flow@example.org')
                flow.get_by_label('Passwort',exact=True).fill(password)
                flow.get_by_role('button',name='Konto erstellen',exact=True).click()
                flow.wait_for_url('**/app')
                flow.get_by_label('Name eurer Gruppe',exact=True).fill('Browser-Testgruppe')
                flow.get_by_role('button',name='Nest erstellen',exact=True).click()
                flow.wait_for_url('**/g/*')
                flow.get_by_role('link',name='Gegenstand hinzuf\u00fcgen',exact=True).first.click()
                flow.get_by_label('Bezeichnung',exact=True).fill('Test-Zelt')
                flow.get_by_label('St\u00fcckzahl',exact=True).fill('2')
                flow.get_by_label('Kategorie',exact=True).select_option('outdoor')
                flow.get_by_label('Lagerort',exact=True).fill('Garage')
                flow.get_by_role('button',name='Speichern',exact=True).click()
                flow.get_by_role('heading',name='Test-Zelt',exact=True).wait_for()
                flow.get_by_label('St\u00fcckzahl',exact=True).fill('2')
                flow.get_by_role('button',name='Jetzt reservieren',exact=True).click()
                flow.get_by_role('button',name='Ausgeben',exact=True).click()
                flow.get_by_label('R\u00fcckgabemenge: Test-Zelt',exact=True).fill('1')
                flow.get_by_role('button',name='R\u00fcckgabe erfassen',exact=True).click()
                assert flow.get_by_text('Noch ausstehend: 1',exact=True).is_visible()
                flow.get_by_role('button',name='R\u00fcckgabe erfassen',exact=True).click()
                flow.get_by_role('link',name='Abgeschlossen',exact=True).click()
                assert flow.get_by_text('Zur\u00fcckgegeben',exact=True).is_visible()
                assert not flow.evaluate('document.documentElement.scrollWidth > window.innerWidth')
                assert not errors,errors
                summary={'browser':browser.version,'page_checks':checks,'lifecycle':'signup -> group -> item -> reservation -> handover -> partial return -> full return','console_errors':errors,'status':'passed'}
                (OUT/'browser-report.json').write_text(json.dumps(summary,indent=2))
                print(json.dumps(summary,indent=2))
                browser.close()
        finally:
            server.terminate()
            server.wait(timeout=15)
            logs.close()

if __name__=='__main__':
    run()
