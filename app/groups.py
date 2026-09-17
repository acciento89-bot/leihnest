from app.db import DomainError, now, uid
from app.security import token, digest, email_address

class Groups:
    def create_group(self, user, name):
        name = name.strip()
        if not name or len(name) > 80:
            raise DomainError('name_invalid')
        group = uid()
        with self.db.write() as c:
            c.execute('INSERT INTO groups VALUES(?,?,0,?)', (group,name,now()))
            c.execute('INSERT INTO members VALUES(?,?,?)', (group,user,'owner'))
            self.event(c,group,user,'group_created',name)
        return group

    def groups(self, user):
        with self.db.read() as c:
            return [dict(r) for r in c.execute('SELECT g.*,m.role FROM groups g JOIN members m ON m.group_id=g.id WHERE m.user_id=? ORDER BY g.name', (user,))]

    def group(self, user, group):
        with self.db.read() as c:
            return self.require(c,user,group)

    def update_group(self, user, group, name, approval):
        name = name.strip()
        if not name or len(name) > 80:
            raise DomainError('name_invalid')
        with self.db.write() as c:
            self.require(c,user,group,True)
            c.execute('UPDATE groups SET name=?,approval=? WHERE id=?', (name,int(bool(approval)),group))
            self.event(c,group,user,'settings_changed',name)

    def members(self, user, group):
        with self.db.read() as c:
            role = self.require(c,user,group)['role']
            rows = [dict(r) for r in c.execute('SELECT u.id,u.name,u.email,m.role FROM members m JOIN users u ON u.id=m.user_id WHERE m.group_id=? ORDER BY u.name', (group,))]
            if role == 'member':
                for row in rows:
                    row['email'] = ''
            return rows

    def invite(self, user, group, email, role='member'):
        email = email_address(email)
        if role not in ('admin','member'):
            raise DomainError('forbidden',403)
        value = token()
        with self.db.write() as c:
            membership = self.require(c,user,group,True)
            if role == 'admin' and membership['role'] != 'owner':
                raise DomainError('forbidden',403)
            exists = c.execute('SELECT 1 FROM members m JOIN users u ON u.id=m.user_id WHERE m.group_id=? AND u.email=?', (group,email)).fetchone()
            if exists:
                raise DomainError('already_member')
            c.execute('DELETE FROM invitations WHERE group_id=? AND email=?', (group,email))
            c.execute('INSERT INTO invitations VALUES(?,?,?,?,?,0)', (digest(value),group,email,role,now()+7*86400))
            self.event(c,group,user,'invited','')
        return value

    def invitations(self, user, group):
        with self.db.read() as c:
            self.require(c,user,group,True)
            return [dict(r) for r in c.execute('SELECT * FROM invitations WHERE group_id=? AND used=0 AND expires>?', (group,now()))]

    def accept_invite(self, user, value):
        with self.db.write() as c:
            person = c.execute('SELECT email FROM users WHERE id=?', (user,)).fetchone()
            row = c.execute('SELECT * FROM invitations WHERE token=? AND expires>? AND used=0', (digest(value),now())).fetchone()
            if not person or not row or person['email'].casefold() != row['email'].casefold():
                raise DomainError('invite')
            c.execute('INSERT OR IGNORE INTO members VALUES(?,?,?)', (row['group_id'],user,row['role']))
            c.execute('UPDATE invitations SET used=1 WHERE token=?', (digest(value),))
            self.event(c,row['group_id'],user,'joined','')
            return row['group_id']

    def revoke_invite(self, user, group, hashed_token):
        with self.db.write() as c:
            self.require(c,user,group,True)
            c.execute('DELETE FROM invitations WHERE token=? AND group_id=?', (hashed_token,group))

    def change_member(self, user, group, target, role):
        with self.db.write() as c:
            actor = self.require(c,user,group,True)
            member = c.execute('SELECT role FROM members WHERE group_id=? AND user_id=?', (group,target)).fetchone()
            if not member:
                raise DomainError('not_found',404)
            if member['role'] == 'owner':
                raise DomainError('owner')
            if actor['role'] != 'owner' and (member['role'] != 'member' or role != 'remove'):
                raise DomainError('forbidden',403)
            if role == 'remove':
                if c.execute("SELECT 1 FROM bookings WHERE group_id=? AND user_id=? AND status IN ('requested','confirmed','borrowed')",(group,target)).fetchone():
                    raise DomainError('open_bookings')
                c.execute('DELETE FROM members WHERE group_id=? AND user_id=?',(group,target))
            elif role in ('member','admin'):
                c.execute('UPDATE members SET role=? WHERE group_id=? AND user_id=?',(role,group,target))
            else:
                raise DomainError('forbidden',403)
            self.event(c,group,user,'member_changed',role)

    def activity(self, user, group):
        with self.db.read() as c:
            self.require(c,user,group)
            return [dict(r) for r in c.execute('SELECT * FROM activity WHERE group_id=? ORDER BY id DESC LIMIT 12', (group,))]
