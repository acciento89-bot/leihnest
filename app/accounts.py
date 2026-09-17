import sqlite3
from app.db import DomainError, uid, now
from app.security import digest, token, email_address, password_hash, password_matches, DUMMY_HASH

class Accounts:
    def create_user(self, email, name, password, locale='de'):
        email = email_address(email)
        name = name.strip()
        if not name or len(name) > 80:
            raise DomainError('name_invalid')
        hashed = password_hash(password)
        user = uid()
        try:
            with self.db.write() as c:
                c.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', (user,email,name,hashed,'de' if locale == 'de' else 'en',now()))
        except sqlite3.IntegrityError as exc:
            raise DomainError('email_exists') from exc
        return user

    def authenticate(self, email, password):
        with self.db.read() as c:
            row = c.execute('SELECT * FROM users WHERE email=?', (email.strip().casefold(),)).fetchone()
        good = password_matches(row['password'] if row else DUMMY_HASH, password)
        return row['id'] if row and good else None

    def new_session(self, user):
        value = token()
        with self.db.write() as c:
            c.execute('DELETE FROM sessions WHERE expires<?', (now(),))
            c.execute('INSERT INTO sessions VALUES(?,?,?)', (digest(value),user,now()+7*86400))
        return value

    def session_user(self, value):
        if not value:
            return None
        with self.db.read() as c:
            row = c.execute('SELECT u.id,u.email,u.name,u.locale FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?', (digest(value),now())).fetchone()
            return dict(row) if row else None

    def end_session(self, value):
        with self.db.write() as c:
            c.execute('DELETE FROM sessions WHERE token=?', (digest(value or ''),))

    def rate_limit(self, key, maximum=10, seconds=900):
        with self.db.write() as c:
            c.execute('DELETE FROM limits WHERE expires<?', (now(),))
            row = c.execute('SELECT * FROM limits WHERE key=?', (key,)).fetchone()
            if row and row['hits'] >= maximum:
                raise DomainError('rate_limit', 429)
            if row:
                c.execute('UPDATE limits SET hits=hits+1 WHERE key=?', (key,))
            else:
                c.execute('INSERT INTO limits VALUES(?,?,?)', (key,1,now()+seconds))

    def reset_token(self, email):
        with self.db.write() as c:
            row = c.execute('SELECT id FROM users WHERE email=?', (email.strip().casefold(),)).fetchone()
            if not row:
                return None
            value = token()
            c.execute('DELETE FROM resets WHERE user_id=? OR expires<?', (row['id'],now()))
            c.execute('INSERT INTO resets VALUES(?,?,?)', (digest(value),row['id'],now()+3600))
            return value

    def reset_password(self, value, password):
        hashed = password_hash(password)
        with self.db.write() as c:
            row = c.execute('SELECT * FROM resets WHERE token=? AND expires>?', (digest(value),now())).fetchone()
            if not row:
                raise DomainError('reset')
            c.execute('UPDATE users SET password=? WHERE id=?', (hashed,row['user_id']))
            c.execute('DELETE FROM sessions WHERE user_id=?', (row['user_id'],))
            c.execute('DELETE FROM resets WHERE user_id=?', (row['user_id'],))
