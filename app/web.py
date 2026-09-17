import hashlib
import hmac
from pathlib import Path
from urllib.parse import quote, urlsplit
from fastapi import Request
from fastapi.templating import Jinja2Templates
from starlette.responses import RedirectResponse
from app.db import DomainError, now
from app.i18n import translate, fmt_date, locale_from_header, error_key
from app.inventory import CATEGORIES
from app.security import token, safe_next

TEMPLATES=Jinja2Templates(directory=Path(__file__).parent/'templates')

class LoginRequired(Exception):
    def __init__(self, path):
        self.path=path

def store(request):
    return request.app.state.store

def person(request):
    if not hasattr(request.state,'person'):
        request.state.person=store(request).session_user(request.session.get('sid'))
    return request.state.person

def require_user(request):
    user=person(request)
    if not user:
        raise LoginRequired('/login?next='+quote(request.url.path,safe=''))
    return user

def workspace(request, gid, manage=False):
    user=require_user(request)
    group=store(request).group(user['id'],gid)
    if manage and group['role']=='member':
        raise DomainError('forbidden',403)
    return user,group

def language(request):
    saved=request.session.get('lang')
    return saved if saved in ('de','en') else locale_from_header(request.headers.get('accept-language','de'))

def render(request:Request,template:str,*,status=200,**values):
    lang=language(request)
    user=person(request)
    csrf=request.session.setdefault('csrf',token())
    context=dict(request=request,user=user,group=None,groups=store(request).groups(user['id']) if user else [],
                 lang=lang,t=lambda key:translate(key,lang),date=lambda value:fmt_date(value,lang),
                 csrf=csrf,categories=CATEGORIES,path=request.url.path,
                 current_path=request.url.path+('?' + request.url.query if request.url.query else ''),now=now(),
                 flash=request.session.pop('flash',None),error=None,
                 allow_signup=request.app.state.settings.allow_signup,public_url=request.app.state.settings.public_url)
    context.update(values)
    return TEMPLATES.TemplateResponse(request=request,name=template,context=context,status_code=status)

async def form(request):
    data=await request.form(max_files=1,max_fields=30,max_part_size=5*1024*1024)
    submitted=str(data.get('csrf',''))
    expected=request.session.get('csrf','')
    origin=request.headers.get('origin')
    correct_origin=request.app.state.settings.public_url
    if not expected or not hmac.compare_digest(submitted,expected) or (origin and origin.rstrip('/')!=correct_origin.rstrip('/') and origin.rstrip('/')!=str(request.base_url).rstrip('/')):
        raise DomainError('csrf',403)
    return data

def integer(value):
    try:
        return int(value)
    except (ValueError,TypeError):
        raise DomainError('quantity')

def redirect(request,path,flash=None):
    if flash:
        request.session['flash']=flash
    return RedirectResponse(safe_next(path),status_code=303)

def sign_in(request,user):
    previous=request.session.get('sid')
    if previous:
        store(request).end_session(previous)
    lang=language(request)
    request.session.clear()
    request.session.update(sid=store(request).new_session(user),csrf=token(),lang=lang)
    request.state.person=None

def rate(request,action,maximum=10,seconds=900,extra=''):
    client=request.client.host if request.client else 'unknown'
    key=hmac.new(request.app.state.settings.secret.encode(),f'{action}:{client}:{extra}'.encode(),hashlib.sha256).hexdigest()
    store(request).rate_limit(key,maximum,seconds)

def message(request,key,*,status=200,**values):
    return render(request,'message.html',status=status,message_key=key,**values)

def error_message(request,exc,**values):
    return render(request,'message.html',status=exc.status,message_key=error_key(exc.code),heading='error_title',**values)
