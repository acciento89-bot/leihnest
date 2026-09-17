from app.db import DomainError, uid, now

class Loans:
    def reserve(self, user, group, item, quantity, start, end, note=''):
        if not isinstance(quantity,int) or quantity < 1 or quantity > 10000:
            raise DomainError('quantity')
        if not isinstance(start,int) or not isinstance(end,int) or end <= start or start < now()-60 or end-start > 366*86400 or end > now()+3*366*86400:
            raise DomainError('dates')
        if len(note)>2000:
            raise DomainError('too_long')
        booking = uid()
        with self.db.write() as c:
            group_info = self.require(c,user,group)
            row = self.item_row(c,group,item)
            if row['archived']:
                raise DomainError('not_found',404)
            if self._available(c,row,start,end) < quantity:
                raise DomainError('stock',409)
            status = 'requested' if group_info['approval'] else 'confirmed'
            c.execute('INSERT INTO bookings(id,group_id,item_id,user_id,quantity,start_at,end_at,status,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', (booking,group,item,user,quantity,start,end,status,note,now()))
            self.event(c,group,user,'reserved',row['name'])
        return booking

    def bookings(self, user, group):
        with self.db.read() as c:
            self.require(c,user,group)
            return [dict(r) for r in c.execute('SELECT b.*,i.name,i.photo,i.category,u.name AS borrower FROM bookings b JOIN items i ON i.id=b.item_id JOIN users u ON u.id=b.user_id WHERE b.group_id=? ORDER BY b.start_at DESC', (group,))]

    def booking(self, user, group, booking):
        with self.db.read() as c:
            self.require(c,user,group)
            row = c.execute('SELECT * FROM bookings WHERE id=? AND group_id=?', (booking,group)).fetchone()
            if not row:
                raise DomainError('not_found',404)
            return dict(row)

    def transition(self, user, group, booking, action, quantity=None):
        with self.db.write() as c:
            membership = self.require(c,user,group)
            found = c.execute('SELECT * FROM bookings WHERE id=? AND group_id=?', (booking,group)).fetchone()
            if not found:
                raise DomainError('not_found',404)
            row = dict(found)
            if membership['role']=='member' and (action != 'cancel' or row['user_id'] != user):
                raise DomainError('forbidden',403)
            item = self.item_row(c,group,row['item_id'])
            status = row['status']
            if action=='approve' and status=='requested':
                if row['end_at'] <= now():
                    raise DomainError('dates')
                status = 'confirmed'
            elif action=='issue' and status=='confirmed':
                start = min(now(),row['start_at'])
                if row['end_at']<=now():
                    raise DomainError('dates')
                if self._available(c,item,start,row['end_at'],booking)<row['quantity']:
                    raise DomainError('stock',409)
                c.execute('UPDATE bookings SET start_at=? WHERE id=?', (start,booking))
                status = 'borrowed'
            elif action=='return' and status=='borrowed':
                if not isinstance(quantity,int) or quantity<1 or quantity>row['quantity']-row['returned']:
                    raise DomainError('quantity')
                total = row['returned']+quantity
                c.execute('UPDATE bookings SET returned=? WHERE id=?',(total,booking))
                status = 'returned' if total==row['quantity'] else 'borrowed'
            elif action=='cancel' and status in ('requested','confirmed'):
                status = 'cancelled'
            else:
                raise DomainError('state',409)
            c.execute('UPDATE bookings SET status=? WHERE id=?',(status,booking))
            self.event(c,group,user,action,item['name'])
