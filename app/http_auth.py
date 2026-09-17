from urllib.parse import quote
from fastapi import Request
from app.db import DomainError, uid, now
from app.security import safe_next, digest
from app.i18n import translate, error_key
from app.web import render, form, store, redirect, sign_in, language, person, require_user, rate, message


def register(app):
    @app.get('/')
    def home(request:Request):
        return render(request,'home.html')

    @app.get('/language/{locale}')
    def set_language(request:Request,locale:str,next:str='/'):
        if locale not in ('de','en'):
            raise DomainError('not_found',404)
        request.session['lang']=locale
        user=person(request)
        if user:
            with store(request).db.write() as c:
                c.execute('UPDATE users SET locale=? WHERE id=?',(locale,user['id']))
        return redirect(request,next)

    def invitation_allows_signup(request, next_path, email=None):
        if not next_path.startswith('/join/'):
            return False
        value=next_path.removeprefix('/join/')
        with store(request).db.read() as c:
            row=c.execute('SELECT email FROM invitations WHERE token=? AND expires>? AND used=0',(digest(value),now())).fetchone()
        return bool(row and (email is None or email.strip().casefold()==row['email'].casefold()))

    @app.get('/login')
    @app.get('/signup')
    @app.get('/forgot')
    @app.get('/reset/{reset_token}')
    def auth_page(request:Request,reset_token:str='',next:str='/app'):
        mode=request.url.path.strip('/').split('/')[0]
        next=safe_next(next)
        if mode=='signup' and not app.state.settings.allow_signup and not invitation_allows_signup(request,next):
            return message(request,'closed',status=403)
        return render(request,'auth.html',mode=mode,next=next,reset_token=reset_token,values={})

    @app.post('/signup')
    async def signup(request:Request):
        data=await form(request)
        next_path=safe_next(str(data.get('next','/app')))
        if not app.state.settings.allow_signup and not invitation_allows_signup(request,next_path,str(data.get('email',''))):
            raise DomainError('closed',403)
        rate(request,'signup',5,3600)
        try:
            user=store(request).create_user(str(data.get('email','')),str(data.get('name','')),str(data.get('password','')),language(request))
        except DomainError as exc:
            return render(request,'auth.html',status=exc.status,mode='signup',next=next_path,values=data,error=error_key(exc.code))
        sign_in(request,user)
        return redirect(request,next_path)

    @app.post('/login')
    async def login(request:Request):
        data=await form(request)
        email=str(data.get('email','')).strip().casefold()
        rate(request,'login-ip',60,900)
        rate(request,'login-account',10,900,email)
        user=store(request).authenticate(email,str(data.get('password','')))
        next_path=safe_next(str(data.get('next','/app')))
        if not user:
            return render(request,'auth.html',status=400,mode='login',next=next_path,values=data,error='credentials')
        sign_in(request,user)
        return redirect(request,next_path)

    @app.post('/logout')
    async def logout(request:Request):
        await form(request)
        store(request).end_session(request.session.get('sid',''))
        lang=language(request)
        request.session.clear()
        request.session['lang']=lang
        return redirect(request,'/')

    @app.post('/forgot')
    async def forgot(request:Request):
        data=await form(request)
        rate(request,'reset',5,3600)
        email=str(data.get('email','')).strip().casefold()
        value=store(request).reset_token(email)
        if value:
            lang=language(request)
            link=app.state.settings.public_url+'/reset/'+value
            with store(request).db.write() as c:
                store(request).queue(c,uid(),email,translate('reset_subject',lang),translate('reset_body',lang)+'\n\n'+link)
        return message(request,'reset_requested')

    @app.post('/reset/{reset_token}')
    async def reset_password(request:Request,reset_token:str):
        data=await form(request)
        rate(request,'reset-password',10,3600)
        store(request).reset_password(reset_token,str(data.get('password','')))
        request.session.clear()
        return redirect(request,'/login','reset_done')

    @app.get('/join/{invitation}')
    def join_page(request:Request,invitation:str):
        return render(request,'message.html',heading='join_title',message_key='join_desc' if person(request) else 'join_login',invitation=invitation)

    @app.post('/join/{invitation}')
    async def join(request:Request,invitation:str):
        user=require_user(request)
        await form(request)
        group=store(request).accept_invite(user['id'],invitation)
        return redirect(request,f'/g/{group}','success')

    @app.get('/legal/{page}')
    def legal(request:Request,page:str):
        if page not in ('imprint','privacy'):
            raise DomainError('not_found',404)
        file=app.state.settings.data_dir/'legal'/f'{page}.txt'
        return render(request,'message.html',heading=page,message_key='legal_unavailable' if not file.is_file() else None,legal_text=file.read_text() if file.is_file() else '')
