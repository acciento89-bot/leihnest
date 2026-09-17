from starlette.responses import PlainTextResponse

class BodyLimitMiddleware:
    """Bound even chunked requests before multipart parsing (no trusting Content-Length)."""
    def __init__(self, app, limit=6*1024*1024):
        self.app,self.limit=app,limit

    async def __call__(self, scope, receive, send):
        if scope['type']!='http' or scope['method'] not in ('POST','PUT','PATCH'):
            return await self.app(scope,receive,send)
        chunks=[]
        size=0
        while True:
            message=await receive()
            if message['type']=='http.disconnect':
                return
            chunk=message.get('body',b'')
            size+=len(chunk)
            if size>self.limit:
                return await PlainTextResponse('Request body too large',status_code=413)(scope,receive,send)
            chunks.append(chunk)
            if not message.get('more_body',False):
                break
        body=b''.join(chunks)
        sent=False
        async def replay():
            nonlocal sent
            if not sent:
                sent=True
                return {'type':'http.request','body':body,'more_body':False}
            return await receive()
        await self.app(scope,replay,send)
