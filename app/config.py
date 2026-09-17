from dataclasses import dataclass, field
import os
from pathlib import Path
import secrets
from urllib.parse import urlsplit

@dataclass
class Settings:
    data_dir: Path = field(default_factory=lambda:Path(os.getenv('DATA_DIR','data')))
    secret: str = field(default_factory=lambda:os.getenv('SECRET_KEY',''))
    public_url: str = field(default_factory=lambda:os.getenv('PUBLIC_URL','http://localhost:8000').rstrip('/'))
    production: bool = field(default_factory=lambda:os.getenv('LEIHNEST_ENV','development')=='production')
    allow_signup: bool = field(default_factory=lambda:os.getenv('ALLOW_SIGNUP','0')=='1')

    def __post_init__(self):
        self.data_dir=Path(self.data_dir)
        self.data_dir.mkdir(parents=True,exist_ok=True)
        if self.production:
            if len(self.secret)<32 or urlsplit(self.public_url).scheme!='https':
                raise RuntimeError('Production requires SECRET_KEY (32+ characters) and an HTTPS PUBLIC_URL')
            if self.allow_signup and (not os.getenv('SMTP_HOST') or not all((self.data_dir/'legal'/f'{p}.txt').is_file() for p in ('imprint','privacy'))):
                raise RuntimeError('Open production signup requires SMTP_HOST and data/legal/imprint.txt + privacy.txt')
        elif not self.secret:
            # Development only. A persisted key avoids logging everybody out on restart.
            keyfile=self.data_dir/'.development-key'
            if not keyfile.exists():
                keyfile.write_text(secrets.token_urlsafe(48))
                keyfile.chmod(0o600)
            self.secret=keyfile.read_text().strip()

    @property
    def hosts(self):
        return list(set([urlsplit(self.public_url).hostname,'localhost','127.0.0.1']))
