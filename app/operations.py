"""Explicit maintenance operations. No implicit email sending or hidden schedulers."""
import fcntl
from pathlib import Path
import sqlite3
import tarfile
import tempfile
from app.db import now
from app.i18n import translate, fmt_date


def queue_reminders(store,public_url):
    count=0
    with store.db.write() as c:
        rows=c.execute("SELECT b.*,u.email,u.locale,i.name FROM bookings b JOIN users u ON u.id=b.user_id JOIN items i ON i.id=b.item_id WHERE b.status='borrowed' AND b.end_at<=?",(now()+86400,)).fetchall()
        for row in rows:
            key=f"return:{row['id']}:{row['end_at']}"
            before=c.total_changes
            body=translate('reminder_body',row['locale'])+'\n\n'+row['name']+'\n'+fmt_date(row['end_at'],row['locale'])+'\n'+public_url.rstrip('/')+'/g/'+row['group_id']+'/bookings'
            store.queue(c,key,row['email'],translate('reminder_subject',row['locale']),body)
            count+=c.total_changes-before
    return count


def deliver_outbox(store,sender):
    """Single dispatcher per local volume; failures stay queued for up to five attempts.

    A crash after SMTP acceptance but before the sent marker can cause a retry. SMTP
    delivery is intentionally documented as at-least-once, not exactly-once.
    """
    result={'sent':0,'failed':0}
    with (store.db.path.parent/'.mail-dispatch.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        with store.db.read() as c:
            rows=c.execute('SELECT * FROM outbox WHERE sent_at IS NULL AND attempts<5 ORDER BY created_at LIMIT 100').fetchall()
        for row in rows:
            with store.db.write() as c:
                c.execute('UPDATE outbox SET attempts=attempts+1 WHERE id=?',(row['id'],))
            try:
                sender(row['recipient'],row['subject'],row['body'])
            except (OSError,RuntimeError):
                result['failed']+=1
                continue
            with store.db.write() as c:
                c.execute('UPDATE outbox SET sent_at=? WHERE id=?',(now(),row['id']))
            result['sent']+=1
    return result


def create_backup(store,destination:Path):
    """Online DB + referenced photos, exclusive output with private permissions."""
    destination=Path(destination)
    destination.parent.mkdir(parents=True,exist_ok=True)
    # Exclusive open is the authority. Never delete somebody else's racing file.
    with destination.open('xb') as output:
        destination.chmod(0o600)
        try:
            with tempfile.TemporaryDirectory() as work:
                snapshot=Path(work)/'leihnest.sqlite3'
                with store.db.write():
                    with store.db.read() as source, sqlite3.connect(snapshot) as target:
                        source.backup(target)
                        photos=[r[0] for r in target.execute("SELECT DISTINCT photo FROM items WHERE photo<>''")]
                    with tarfile.open(fileobj=output,mode='w:gz') as archive:
                        archive.add(snapshot,arcname='leihnest.sqlite3')
                        for photo in photos:
                            if Path(photo).name!=photo:
                                raise RuntimeError('Unsafe stored photo name')
                            archive.add(store.db.path.parent/'photos'/photo,arcname='photos/'+photo)
                        for page in ('imprint','privacy'):
                            file=store.db.path.parent/'legal'/f'{page}.txt'
                            if file.is_file():
                                archive.add(file,arcname='legal/'+file.name)
        except BaseException:
            destination.unlink(missing_ok=True)
            raise
