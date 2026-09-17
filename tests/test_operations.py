import io
import tarfile
import sqlite3
import time
import pytest
from app.domain import Store
from app.operations import queue_reminders, create_backup, deliver_outbox
from app.config import Settings
from app.security import safe_next
from app.i18n import parse_date, locale_from_header

@pytest.fixture
def source(tmp_path):
    s=Store(tmp_path/'source'/'leihnest.sqlite3')
    owner=s.create_user('alex@example.org','Alex','Long-password-123',locale='en')
    group=s.create_group(owner,'Camping')
    item=s.add_item(owner,group,name='Tent',quantity=2)
    start=int(time.time())+120
    bid=s.reserve(owner,group,item,1,start,start+3600)
    s.transition(owner,group,bid,'issue')
    return s,tmp_path,owner,group,item

def test_reminders_are_queued_once_per_due_date(source):
    s,*_=source
    assert queue_reminders(s,'https://leihnest.de')==1
    assert queue_reminders(s,'https://leihnest.de')==0
    with s.db.read() as c:
        mail=dict(c.execute('SELECT * FROM outbox').fetchone())
    assert 'return' in mail['subject']
    assert mail['recipient']=='alex@example.org'
    assert 'https://leihnest.de/g/' in mail['body']

def test_returned_bookings_do_not_get_reminders(source):
    s,_,o,g,_=source
    bid=s.bookings(o,g)[0]['id']
    s.transition(o,g,bid,'return',1)
    assert queue_reminders(s,'https://leihnest.de')==0

def test_backup_contains_consistent_database_and_private_photos(source):
    s,tmp,o,g,item=source
    folder=s.db.path.parent/'photos'
    folder.mkdir()
    (folder/'sample.webp').write_bytes(b'photo-content')
    with s.db.write() as c:
        c.execute('UPDATE items SET photo=? WHERE id=?',('sample.webp',item))
    archive=tmp/'backup.tar.gz'
    create_backup(s,archive)
    with tarfile.open(archive) as tar:
        assert tar.extractfile('photos/sample.webp').read()==b'photo-content'
        data=tar.extractfile('leihnest.sqlite3').read()
    restored=tmp/'restored.sqlite3'
    restored.write_bytes(data)
    with sqlite3.connect(restored) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert db.execute('SELECT COUNT(*) FROM bookings').fetchone()[0]==1

def test_backup_refuses_to_overwrite(source):
    s,tmp,*_=source
    existing=tmp/'backup.tar.gz'
    existing.write_bytes(b'precious')
    with pytest.raises(FileExistsError):
        create_backup(s,existing)
    assert existing.read_bytes()==b'precious'

def test_mail_failure_does_not_claim_delivery(source):
    s,*_=source
    queue_reminders(s,'https://leihnest.de')
    def fail(*args):
        raise OSError('offline')
    result=deliver_outbox(s,fail)
    assert result=={'sent':0,'failed':1}
    with s.db.read() as c:
        row=c.execute('SELECT * FROM outbox').fetchone()
    assert row['sent_at'] is None
    assert row['attempts']==1

def test_successful_mail_not_sent_again(source):
    s,*_=source
    queue_reminders(s,'https://leihnest.de')
    delivered=[]
    def sender(recipient,subject,body):
        delivered.append((recipient,subject,body))
    assert deliver_outbox(s,sender)['sent']==1
    assert deliver_outbox(s,sender)['sent']==0
    assert len(delivered)==1

def test_production_refuses_missing_secret(tmp_path):
    with pytest.raises(RuntimeError):
        Settings(data_dir=tmp_path,secret='',production=True,public_url='https://leihnest.de')

def test_open_production_signup_requires_launch_configuration(tmp_path,monkeypatch):
    monkeypatch.delenv('SMTP_HOST',raising=False)
    with pytest.raises(RuntimeError):
        Settings(data_dir=tmp_path,secret='a'*40,production=True,public_url='https://leihnest.de',allow_signup=True)

@pytest.mark.parametrize('value',['//evil.org','/\\evil.org','/%2f%2fevil.org','https://evil.org','/\n/evil.org'])
def test_open_redirect_variants(value):
    assert safe_next(value)=='/app'

@pytest.mark.parametrize('value',['2026-03-29T02:30','2026-10-25T02:30','nonsense','2026-09-17T10:00+03:00'])
def test_dst_and_invalid_dates_are_rejected(value):
    with pytest.raises(Exception,match='dates'):
        parse_date(value)

def test_language_respects_priority():
    assert locale_from_header('en-US,en;q=0.9,de;q=0.8')=='en'
    assert locale_from_header('de-DE,de;q=0.9,en;q=0.8')=='de'
    assert locale_from_header('fr-FR')=='en'

def test_backup_exclusive_open_preserves_file_created_during_precheck(source,monkeypatch):
    from pathlib import Path
    s,tmp,*_=source
    existing=tmp/'racing-backup.tar.gz'
    existing.write_bytes(b'precious')
    original_exists=Path.exists
    monkeypatch.setattr(Path,'exists',lambda path: False if path==existing else original_exists(path))
    with pytest.raises(FileExistsError):
        create_backup(s,existing)
    assert existing.read_bytes()==b'precious'
