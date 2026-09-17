from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import RedirectResponse
from app.config import Settings
from app.domain import Store, DomainError
from app.middleware import BodyLimitMiddleware
from app.web import LoginRequired, error_message
from app import http_auth, http_workspace, http_inventory


def create_app(settings:Settings|None=None):
    settings=settings or Settings()
    app=FastAPI(title='LeihNest',docs_url=None,redoc_url=None,openapi_url=None)
    app.state.settings=settings
    app.state.store=Store(settings.data_dir/'leihnest.sqlite3')
    app.mount('/static',StaticFiles(directory=Path(__file__).parent/'static'),name='static')
    app.add_middleware(SessionMiddleware,secret_key=settings.secret,session_cookie='leihnest_session',same_site='lax',https_only=settings.production,max_age=7*86400)
    app.add_middleware(BodyLimitMiddleware)
    app.add_middleware(TrustedHostMiddleware,allowed_hosts=settings.hosts)

    @app.middleware('http')
    async def security_headers(request:Request,call_next):
        response=await call_next(request)
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='no-referrer'
        response.headers['X-Frame-Options']='DENY'
        response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
        response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        if not request.url.path.startswith('/static'):
            response.headers['Cache-Control']='private, no-store'
        if settings.production:
            response.headers['Strict-Transport-Security']='max-age=31536000'
        return response

    @app.exception_handler(DomainError)
    async def domain_error(request,exc):
        return error_message(request,exc)

    @app.exception_handler(LoginRequired)
    async def login_required(request,exc):
        return RedirectResponse(exc.path,status_code=303)

    @app.get('/health')
    def health():
        with app.state.store.db.read() as c:
            c.execute('SELECT 1').fetchone()
        return {'status':'ok'}

    http_auth.register(app)
    http_workspace.register(app)
    http_inventory.register(app)
    return app

app=create_app()
