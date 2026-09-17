from app.db import DomainError, uid, now

CATEGORIES = ('outdoor','tech','events','sport','tools','other')
ACTIVE = ('requested','confirmed','borrowed')
INFINITY = 253402300799

def occupied_peak(rows, start, end, exclude=''):
    """Half-open intervals; an end event releases stock before equal-time starts."""
    events = []
    for row in rows:
        if row['id'] == exclude or row['status'] not in ACTIVE:
            continue
        finish = INFINITY if row['status']=='borrowed' and row['end_at'] < now() else row['end_at']
        left, right = max(start,row['start_at']), min(end,finish)
        count = row['quantity'] - row['returned']
        if left < right and count:
            events.extend(((left,count),(right,-count)))
    total = peak = 0
    for _, delta in sorted(events):
        total += delta
        peak = max(peak,total)
    return peak

class Inventory:
    def _available(self, c, item, start, end, exclude=''):
        rows = c.execute('SELECT * FROM bookings WHERE item_id=?',(item['id'],)).fetchall()
        return max(0,item['quantity']-occupied_peak(rows,start,end,exclude))

    def _item_fields(self, fields):
        name = str(fields.get('name','')).strip()
        try:
            quantity = int(fields.get('quantity',1))
        except (ValueError,TypeError):
            raise DomainError('quantity')
        if not name or len(name)>120:
            raise DomainError('name_invalid')
        if quantity < 1 or quantity > 10000:
            raise DomainError('quantity')
        category = fields.get('category','other')
        if category not in CATEGORIES:
            raise DomainError('category')
        result = dict(name=name,quantity=quantity,category=category)
        for key in ('description','location','accessories','condition'):
            result[key] = str(fields.get(key,'')).strip()
            if len(result[key]) > 2000:
                raise DomainError('too_long')
        result['photo'] = fields.get('photo','')
        return result

    def add_item(self, user, group, **fields):
        fields = self._item_fields(fields)
        item = uid()
        with self.db.write() as c:
            self.require(c,user,group,True)
            c.execute('INSERT INTO items(id,group_id,name,quantity,description,category,location,accessories,condition,photo,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
                      (item,group,fields['name'],fields['quantity'],fields['description'],fields['category'],fields['location'],fields['accessories'],fields['condition'],fields['photo'],now()))
            self.event(c,group,user,'item_added',fields['name'])
        return item

    def update_item(self, user, group, item, **fields):
        fields = self._item_fields(fields)
        with self.db.write() as c:
            self.require(c,user,group,True)
            original = self.item_row(c,group,item)
            rows = c.execute('SELECT * FROM bookings WHERE item_id=?',(item,)).fetchall()
            if occupied_peak(rows,now(),INFINITY) > fields['quantity']:
                raise DomainError('stock')
            if 'photo' not in fields or not fields['photo']:
                fields['photo'] = original['photo']
            c.execute('UPDATE items SET name=?,quantity=?,description=?,category=?,location=?,accessories=?,condition=?,photo=? WHERE id=?',
                      (fields['name'],fields['quantity'],fields['description'],fields['category'],fields['location'],fields['accessories'],fields['condition'],fields['photo'],item))
            self.event(c,group,user,'item_updated',fields['name'])

    def archive_item(self, user, group, item):
        with self.db.write() as c:
            self.require(c,user,group,True)
            row = self.item_row(c,group,item)
            if c.execute("SELECT 1 FROM bookings WHERE item_id=? AND status IN ('requested','confirmed','borrowed')",(item,)).fetchone():
                raise DomainError('open_bookings')
            c.execute('UPDATE items SET archived=1 WHERE id=?',(item,))
            self.event(c,group,user,'item_archived',row['name'])

    def items(self, user, group, query='', category=''):
        with self.db.read() as c:
            self.require(c,user,group)
            rows = c.execute('SELECT * FROM items WHERE group_id=? AND archived=0 ORDER BY name',(group,)).fetchall()
            result = []
            for row in rows:
                row = dict(row)
                if query.casefold() not in (row['name']+' '+row['location']).casefold() or (category and row['category'] != category):
                    continue
                row['available'] = self._available(c,row,now(),now()+1)
                result.append(row)
            return result

    def item(self, user, group, item):
        with self.db.read() as c:
            self.require(c,user,group)
            row = self.item_row(c,group,item)
            row['available'] = self._available(c,row,now(),now()+1)
            return row
