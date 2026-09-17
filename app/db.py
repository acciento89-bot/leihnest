"""One-server persistence. Every stock-changing service uses a write transaction."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3
import time
import uuid

class DomainError(Exception):
    def __init__(self, code: str, status: int = 400):
        super().__init__(code)
        self.code, self.status = code, status

def uid() -> str:
    return uuid.uuid4().hex

def now() -> int:
    return int(time.time())

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 name TEXT NOT NULL, password TEXT NOT NULL, locale TEXT NOT NULL DEFAULT 'de',
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS resets (
 token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS groups (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, approval INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS members (
 group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','member')),
 PRIMARY KEY(group_id,user_id)
);
CREATE TABLE IF NOT EXISTS invitations (
 token TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 email TEXT NOT NULL COLLATE NOCASE, role TEXT NOT NULL CHECK(role IN ('admin','member')),
 expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS items (
 id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0),
 description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'other',
 location TEXT NOT NULL DEFAULT '', accessories TEXT NOT NULL DEFAULT '',
 condition TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '',
 archived INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
 UNIQUE(id,group_id)
);
CREATE TABLE IF NOT EXISTS bookings (
 id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id),
 item_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id),
 quantity INTEGER NOT NULL CHECK(quantity > 0),
 returned INTEGER NOT NULL DEFAULT 0 CHECK(returned >= 0 AND returned <= quantity),
 start_at INTEGER NOT NULL, end_at INTEGER NOT NULL CHECK(end_at > start_at),
 status TEXT NOT NULL CHECK(status IN ('requested','confirmed','borrowed','returned','cancelled')),
 note TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL,
 FOREIGN KEY(item_id,group_id) REFERENCES items(id,group_id)
);
CREATE INDEX IF NOT EXISTS bookings_availability ON bookings(item_id,status,start_at,end_at);
CREATE INDEX IF NOT EXISTS bookings_group ON bookings(group_id,start_at);
CREATE TABLE IF NOT EXISTS activity (
 id INTEGER PRIMARY KEY AUTOINCREMENT, group_id TEXT NOT NULL REFERENCES groups(id),
 actor TEXT NOT NULL, action TEXT NOT NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
 id TEXT PRIMARY KEY, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
 created_at INTEGER NOT NULL, sent_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS limits (
 key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL
);
PRAGMA user_version=1;
"""

class Database:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.read() as c:
            version = c.execute('PRAGMA user_version').fetchone()[0]
            if version not in (0, 1):
                raise RuntimeError('Unsupported database schema version')
            c.execute('PRAGMA journal_mode=WAL')
            c.executescript(SCHEMA)

    @contextmanager
    def read(self):
        c = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        c.row_factory = sqlite3.Row
        c.execute('PRAGMA foreign_keys=ON')
        c.execute('PRAGMA busy_timeout=10000')
        try:
            yield c
        finally:
            c.close()

    @contextmanager
    def write(self):
        with self.read() as c:
            c.execute('BEGIN IMMEDIATE')
            try:
                yield c
                c.commit()
            except BaseException:
                c.rollback()
                raise

class BaseService:
    def require(self, c, user: str, group: str, manage: bool = False):
        row = c.execute('SELECT g.*,m.role FROM groups g JOIN members m ON m.group_id=g.id WHERE g.id=? AND m.user_id=?', (group,user)).fetchone()
        if not row or (manage and row['role'] == 'member'):
            raise DomainError('forbidden', 403)
        return dict(row)

    def item_row(self, c, group, item):
        row = c.execute('SELECT * FROM items WHERE id=? AND group_id=?', (item,group)).fetchone()
        if not row:
            raise DomainError('not_found', 404)
        return dict(row)

    def event(self, c, group, user, action, label):
        actor = c.execute('SELECT name FROM users WHERE id=?', (user,)).fetchone()['name']
        c.execute('INSERT INTO activity(group_id,actor,action,label,created_at) VALUES(?,?,?,?,?)', (group,actor,action,label,now()))

    def queue(self, c, key, recipient, subject, body):
        c.execute('INSERT OR IGNORE INTO outbox(id,recipient,subject,body,created_at) VALUES(?,?,?,?,?)', (key,recipient,subject,body,now()))
