from datetime import datetime, timedelta
from fastapi import Request
from starlette.responses import FileResponse
from app.db import DomainError
from app.i18n import parse_date, TZ, error_key
from app.security import save_photo, MAX_UPLOAD
from app.web import render, form, store, redirect, workspace, integer


def register(app):
    @app.get('/g/{gid}/items')
    def items(request:Request,gid:str,q:str='',category:str=''):
        user,group=workspace(request,gid)
        return render(request,'items.html',group=group,items=store(request).items(user['id'],gid,q[:120],category),q=q[:120],category=category)

    @app.get('/g/{gid}/items/new')
    def new_item(request:Request,gid:str):
        _,group=workspace(request,gid,True)
        return render(request,'item_form.html',group=group,item=None,values={})

    @app.get('/g/{gid}/items/{iid}/edit')
    def edit_item(request:Request,gid:str,iid:str):
        user,group=workspace(request,gid,True)
        item=store(request).item(user['id'],gid,iid)
        return render(request,'item_form.html',group=group,item=item,values=item)

    @app.post('/g/{gid}/items/new')
    @app.post('/g/{gid}/items/{iid}/edit')
    async def save_item(request:Request,gid:str,iid:str=''):
        user,group=workspace(request,gid,True)
        data=await form(request)
        old=store(request).item(user['id'],gid,iid) if iid else None
        photo=''
        fields={key:str(data.get(key,'')) for key in ('name','quantity','description','category','location','condition','accessories')}
        try:
            upload=data.get('photo')
            if upload and getattr(upload,'filename',''):
                photo=save_photo(await upload.read(MAX_UPLOAD+1),app.state.settings.data_dir/'photos')
            if photo:
                fields['photo']=photo
            if iid:
                store(request).update_item(user['id'],gid,iid,**fields)
            else:
                iid=store(request).add_item(user['id'],gid,**fields)
        except DomainError as exc:
            if photo:
                (app.state.settings.data_dir/'photos'/photo).unlink(missing_ok=True)
            return render(request,'item_form.html',status=exc.status,group=group,item=old,values=fields,error=error_key(exc.code))
        if photo and old and old['photo']:
            (app.state.settings.data_dir/'photos'/old['photo']).unlink(missing_ok=True)
        return redirect(request,f'/g/{gid}/items/{iid}','saved')

    @app.get('/g/{gid}/items/{iid}')
    def item_page(request:Request,gid:str,iid:str):
        user,group=workspace(request,gid)
        item=store(request).item(user['id'],gid,iid)
        tomorrow=(datetime.now(TZ)+timedelta(days=1)).replace(hour=10,minute=0,second=0,microsecond=0)
        return render(request,'item.html',group=group,item=item,bookings=[b for b in store(request).bookings(user['id'],gid) if b['item_id']==iid and b['status'] in ('requested','confirmed','borrowed')],start_default=tomorrow.strftime('%Y-%m-%dT%H:%M'),end_default=(tomorrow+timedelta(hours=8)).strftime('%Y-%m-%dT%H:%M'))

    @app.post('/g/{gid}/items/{iid}/reserve')
    async def reserve(request:Request,gid:str,iid:str):
        user,_=workspace(request,gid)
        data=await form(request)
        store(request).reserve(user['id'],gid,iid,integer(data.get('quantity')),parse_date(str(data.get('start',''))),parse_date(str(data.get('end',''))),str(data.get('note','')))
        return redirect(request,f'/g/{gid}/bookings','reserved')

    @app.post('/g/{gid}/items/{iid}/archive')
    async def archive(request:Request,gid:str,iid:str):
        user,_=workspace(request,gid,True)
        await form(request)
        store(request).archive_item(user['id'],gid,iid)
        return redirect(request,f'/g/{gid}/items','saved')

    @app.get('/g/{gid}/media/{filename}')
    def photo(request:Request,gid:str,filename:str):
        user,_=workspace(request,gid)
        with store(request).db.read() as c:
            row=c.execute('SELECT 1 FROM items WHERE group_id=? AND photo=?',(gid,filename)).fetchone()
        path=app.state.settings.data_dir/'photos'/filename
        if not row or not filename.endswith('.webp') or '/' in filename or '\\' in filename or not path.is_file():
            raise DomainError('not_found',404)
        return FileResponse(path,media_type='image/webp',headers={'Cache-Control':'private, no-store'})
