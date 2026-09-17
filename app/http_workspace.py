import calendar
import csv
import io
from datetime import date, datetime, timedelta
from fastapi import Request
from starlette.responses import Response
from app.db import DomainError, now, uid
from app.i18n import TZ, MONTHS, DAYS, translate
from app.web import render, form, store, redirect, workspace, require_user, language, rate


def register(app):
    @app.get('/app')
    def choose(request:Request):
        require_user(request)
        return render(request,'groups.html')

    @app.post('/groups')
    async def create_group(request:Request):
        user=require_user(request)
        data=await form(request)
        rate(request,'group-create',10,3600,user['id'])
        group=store(request).create_group(user['id'],str(data.get('name','')))
        return redirect(request,f'/g/{group}','success')

    @app.get('/g/{gid}')
    def overview(request:Request,gid:str):
        user,group=workspace(request,gid)
        s=store(request)
        items=s.items(user['id'],gid)
        bookings=s.bookings(user['id'],gid)
        loans=[b for b in bookings if b['status']=='borrowed']
        upcoming=sorted([b for b in bookings if b['status'] in ('requested','confirmed') and b['end_at']>now()],key=lambda b:b['start_at'])
        return render(request,'dashboard.html',group=group,items=items[:3],upcoming=upcoming[:5],activity=s.activity(user['id'],gid)[:5],
                      stats=[len(items),sum(b['quantity']-b['returned'] for b in loans),len([b for b in loans if b['end_at']<now()+86400]),len(s.members(user['id'],gid))])

    @app.get('/g/{gid}/bookings')
    def bookings_page(request:Request,gid:str,status:str='active'):
        user,group=workspace(request,gid)
        rows=store(request).bookings(user['id'],gid)
        if status=='history':
            rows=[b for b in rows if b['status'] in ('returned','cancelled')]
        elif status!='all':
            status='active'
            rows=[b for b in rows if b['status'] in ('requested','confirmed','borrowed')]
        return render(request,'bookings.html',group=group,bookings=rows,filter=status)

    @app.post('/g/{gid}/bookings/{bid}/{action}')
    async def booking_action(request:Request,gid:str,bid:str,action:str):
        user,_=workspace(request,gid)
        data=await form(request)
        quantity=None
        if action=='return':
            from app.web import integer
            quantity=integer(data.get('quantity'))
        store(request).transition(user['id'],gid,bid,action,quantity)
        return redirect(request,f'/g/{gid}/bookings','success')

    @app.get('/g/{gid}/calendar')
    def calendar_page(request:Request,gid:str,month:str=''):
        user,group=workspace(request,gid)
        try:
            first=date.fromisoformat(month+'-01') if month else datetime.now(TZ).date().replace(day=1)
            if first.year<2000 or first.year>2099:
                raise ValueError()
        except ValueError:
            raise DomainError('dates')
        next_month=(first.replace(day=28)+timedelta(days=4)).replace(day=1)
        previous=(first-timedelta(days=1)).replace(day=1)
        weeks=calendar.Calendar(firstweekday=0).monthdatescalendar(first.year,first.month)
        records=store(request).bookings(user['id'],gid)
        active=[b for b in records if b['status']!='cancelled']
        def epoch(d):
            return int(datetime(d.year,d.month,d.day,tzinfo=TZ).timestamp())
        cells=[]
        for week in weeks:
            for day in week:
                entries=[b for b in active if b['start_at']<epoch(day+timedelta(days=1)) and b['end_at']>epoch(day)]
                cells.append(dict(day=day.day,current=day.month==first.month,today=day==datetime.now(TZ).date(),entries=entries))
        agenda=[b for b in active if b['start_at']<epoch(next_month) and b['end_at']>epoch(first)]
        lang=language(request)
        return render(request,'calendar.html',group=group,cells=cells,agenda=agenda,days=DAYS[lang],month_name=MONTHS[lang][first.month-1]+' '+str(first.year),previous=previous.strftime('%Y-%m'),next_month=next_month.strftime('%Y-%m'))

    @app.get('/g/{gid}/members')
    def members_page(request:Request,gid:str):
        user,group=workspace(request,gid)
        return render(request,'members.html',group=group,members=store(request).members(user['id'],gid),invitations=store(request).invitations(user['id'],gid) if group['role']!='member' else [])

    @app.post('/g/{gid}/invite')
    async def invite(request:Request,gid:str):
        user,group=workspace(request,gid,True)
        data=await form(request)
        rate(request,'invite',30,3600,gid+user['id'])
        email=str(data.get('email','')).strip().casefold()
        value=store(request).invite(user['id'],gid,email,str(data.get('role','member')))
        lang=language(request)
        link=app.state.settings.public_url+'/join/'+value
        with store(request).db.write() as c:
            store(request).queue(c,uid(),email,translate('invite_subject',lang),group['name']+'\n\n'+translate('invite_body',lang)+'\n\n'+link)
        return render(request,'message.html',group=group,heading='invite_created',message_key='invite_link_hint',copy_link=link)

    @app.post('/g/{gid}/members/{target}')
    async def change_member(request:Request,gid:str,target:str):
        user,_=workspace(request,gid,True)
        data=await form(request)
        store(request).change_member(user['id'],gid,target,str(data.get('role','')))
        return redirect(request,f'/g/{gid}/members','saved')

    @app.post('/g/{gid}/invitations/revoke')
    async def revoke_invite(request:Request,gid:str):
        user,_=workspace(request,gid,True)
        data=await form(request)
        store(request).revoke_invite(user['id'],gid,str(data.get('token','')))
        return redirect(request,f'/g/{gid}/members','saved')

    @app.get('/g/{gid}/settings')
    def settings_page(request:Request,gid:str):
        _,group=workspace(request,gid,True)
        return render(request,'settings.html',group=group)

    @app.post('/g/{gid}/settings')
    async def save_settings(request:Request,gid:str):
        user,_=workspace(request,gid,True)
        data=await form(request)
        store(request).update_group(user['id'],gid,str(data.get('name','')),data.get('approval')=='on')
        return redirect(request,f'/g/{gid}/settings','saved')

    @app.get('/g/{gid}/export')
    def export(request:Request,gid:str):
        user,_=workspace(request,gid,True)
        output=io.StringIO()
        writer=csv.writer(output)
        columns=['name','quantity','category','location','description','accessories','condition']
        writer.writerow(columns)
        for item in store(request).items(user['id'],gid):
            cells=[]
            for key in columns:
                text=str(item[key])
                cells.append("'"+text if text.lstrip().startswith(('=','+','-','@','\t','\r','\n')) else text)
            writer.writerow(cells)
        return Response('\ufeff'+output.getvalue(),media_type='text/csv',headers={'Content-Disposition':'attachment; filename="leihnest-inventory.csv"'})
