from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import time
import pytest

from app.domain import Store, DomainError

@pytest.fixture
def env(tmp_path):
    s = Store(tmp_path / 'test.sqlite3')
    owner = s.create_user('owner@example.org', 'Owner', 'A-secure-password-23')
    member = s.create_user('member@example.org', 'Member', 'Another-password-24')
    outsider = s.create_user('outside@example.org', 'Outside', 'Another-password-25')
    group = s.create_group(owner, 'Freizeitfreunde')
    token = s.invite(owner, group, 'member@example.org', 'member')
    s.accept_invite(member, token)
    item = s.add_item(owner, group, name='Pavillon', quantity=2)
    return s, owner, member, outsider, group, item

def window():
    start = int(time.time()) + 3600
    return start, start + 7200

def test_booking_lifecycle(env):
    s, o, m, _, g, i = env
    a, b = window()
    booking = s.reserve(m, g, i, 2, a, b)
    assert s.booking(m, g, booking)['status'] == 'confirmed'
    s.transition(o, g, booking, 'issue')
    assert s.booking(m, g, booking)['status'] == 'borrowed'
    s.transition(o, g, booking, 'return', 1)
    assert s.booking(m, g, booking)['returned'] == 1
    s.transition(o, g, booking, 'return', 1)
    assert s.booking(m, g, booking)['status'] == 'returned'

def test_overlapping_bookings_are_rejected(env):
    s, o, m, _, g, i = env
    a, b = window()
    s.reserve(m, g, i, 2, a, b)
    with pytest.raises(DomainError, match='stock'):
        s.reserve(o, g, i, 1, a + 1, b + 1)

def test_adjacent_intervals_do_not_overlap(env):
    s, o, m, _, g, i = env
    a, b = window()
    s.reserve(m, g, i, 2, a, b)
    assert s.reserve(o, g, i, 2, b, b + 3600)

def test_peak_not_sum_is_used(env):
    s, o, m, _, g, i = env
    a, b = window()
    s.reserve(m, g, i, 1, a, b)
    s.reserve(m, g, i, 1, b, b + 3600)
    assert s.reserve(o, g, i, 1, a, b + 3600)

def test_outsider_cannot_read_or_reserve(env):
    s, _, _, x, g, i = env
    a, b = window()
    with pytest.raises(DomainError, match='forbidden'):
        s.items(x, g)
    with pytest.raises(DomainError, match='forbidden'):
        s.reserve(x, g, i, 1, a, b)

def test_member_cannot_manage_inventory_or_issue(env):
    s, _, m, _, g, i = env
    with pytest.raises(DomainError, match='forbidden'):
        s.add_item(m, g, name='Test', quantity=1)
    bid = s.reserve(m, g, i, 1, *window())
    with pytest.raises(DomainError, match='forbidden'):
        s.transition(m, g, bid, 'issue')

def test_other_members_cannot_cancel_booking(env):
    s, o, m, x, g, i = env
    token = s.invite(o, g, 'outside@example.org', 'member')
    s.accept_invite(x, token)
    bid = s.reserve(m, g, i, 1, *window())
    with pytest.raises(DomainError, match='forbidden'):
        s.transition(x, g, bid, 'cancel')

def test_pending_approval_holds_stock(env):
    s, o, m, _, g, i = env
    s.update_group(o, g, 'Freizeitfreunde', True)
    bid = s.reserve(m, g, i, 2, *window())
    assert s.booking(m, g, bid)['status'] == 'requested'
    with pytest.raises(DomainError, match='stock'):
        s.reserve(o, g, i, 1, *window())
    s.transition(o, g, bid, 'approve')
    assert s.booking(m, g, bid)['status'] == 'confirmed'

def test_cancellation_releases_stock(env):
    s, o, m, _, g, i = env
    bid = s.reserve(m, g, i, 2, *window())
    s.transition(m, g, bid, 'cancel')
    assert s.reserve(o, g, i, 2, *window())

def test_no_double_return_or_cancel_after_handover(env):
    s, o, m, _, g, i = env
    bid = s.reserve(m, g, i, 1, *window())
    s.transition(o, g, bid, 'issue')
    with pytest.raises(DomainError, match='state'):
        s.transition(o, g, bid, 'cancel')
    with pytest.raises(DomainError, match='quantity'):
        s.transition(o, g, bid, 'return', 2)
    s.transition(o, g, bid, 'return', 1)
    with pytest.raises(DomainError, match='state'):
        s.transition(o, g, bid, 'return', 1)

def test_invitation_is_email_bound_and_single_use(env):
    s, o, m, x, g, _ = env
    token = s.invite(o, g, 'outside@example.org', 'member')
    with pytest.raises(DomainError, match='invite'):
        s.accept_invite(m, token)
    assert s.accept_invite(x, token) == g
    with pytest.raises(DomainError, match='invite'):
        s.accept_invite(x, token)

def test_invitation_expiry(env):
    s, o, _, x, g, _ = env
    token = s.invite(o, g, 'outside@example.org', 'member')
    with s.db.write() as c:
        c.execute('UPDATE invitations SET expires=0')
    with pytest.raises(DomainError, match='invite'):
        s.accept_invite(x, token)

def test_quantity_edit_cannot_break_commitments(env):
    s, o, m, _, g, i = env
    s.reserve(m, g, i, 2, *window())
    with pytest.raises(DomainError, match='stock'):
        s.update_item(o, g, i, name='Pavillon', quantity=1)

def test_archiving_with_open_booking_is_refused(env):
    s, o, m, _, g, i = env
    s.reserve(m, g, i, 1, *window())
    with pytest.raises(DomainError, match='open_bookings'):
        s.archive_item(o, g, i)

def test_early_issue_rechecks_previous_reservations(env):
    s, o, m, _, g, i = env
    a, b = window()
    s.reserve(m, g, i, 2, int(time.time()) + 10, a)
    later = s.reserve(o, g, i, 2, a, b)
    with pytest.raises(DomainError, match='stock'):
        s.transition(o, g, later, 'issue')

def test_overdue_loan_blocks_future_reservation(env):
    s, o, m, _, g, i = env
    bid = s.reserve(m, g, i, 2, *window())
    s.transition(o, g, bid, 'issue')
    with s.db.write() as c:
        c.execute('UPDATE bookings SET start_at=?,end_at=? WHERE id=?', (int(time.time())-7200,int(time.time())-3600,bid))
    a,b = window()
    with pytest.raises(DomainError, match='stock'):
        s.reserve(o, g, i, 1, a + 86400, b + 86400)

def test_two_simultaneous_bookings_cannot_oversell(env):
    s, o, m, _, g, i = env
    gate = Barrier(2)
    def book(uid):
        gate.wait()
        try:
            return s.reserve(uid, g, i, 2, *window())
        except DomainError as exc:
            return exc.code
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(book, [o,m]))
    assert results.count('stock') == 1
    assert len(s.bookings(o,g)) == 1

@pytest.mark.parametrize('quantity,start,end', [(0,1,2),(-1,1,2),(1,2,1),(1,1,1)])
def test_invalid_booking_input(env, quantity, start, end):
    s, _, m, _, g, i = env
    with pytest.raises(DomainError):
        s.reserve(m,g,i,quantity,start,end)

def test_email_is_case_insensitive_and_password_hashed(env):
    s, _, _, _, _, _ = env
    with pytest.raises(DomainError, match='email_exists'):
        s.create_user('OWNER@EXAMPLE.ORG','Other','A-secure-password-23')
    with s.db.read() as c:
        row = c.execute('SELECT password FROM users WHERE email=?',('owner@example.org',)).fetchone()
    assert row['password'].startswith('$argon2')
    assert s.authenticate('OWNER@example.org','A-secure-password-23')
    assert s.authenticate('owner@example.org','incorrect') is None

def test_sessions_can_be_revoked(env):
    s,o,*_ = env
    token = s.new_session(o)
    assert s.session_user(token)['id'] == o
    s.end_session(token)
    assert s.session_user(token) is None

def test_password_reset_is_single_use_and_revokes_sessions(env):
    s,o,*_ = env
    session = s.new_session(o)
    token = s.reset_token('owner@example.org')
    s.reset_password(token,'My-new-password-123')
    assert s.session_user(session) is None
    assert s.authenticate('owner@example.org','My-new-password-123') == o
    with pytest.raises(DomainError, match='reset'):
        s.reset_password(token,'My-next-password-456')

def test_owner_cannot_remove_self(env):
    s,o,_,_,g,_ = env
    with pytest.raises(DomainError, match='owner'):
        s.change_member(o,g,o,'remove')

def test_member_activity_does_not_expose_invitation_emails(env):
    s,o,m,_,g,_=env
    s.invite(o,g,'private-invite@example.org')
    assert all('@' not in row['label'] for row in s.activity(m,g))
