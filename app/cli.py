"""Run with python -m app.cli --help. Intended for the Linux/Docker host."""
import argparse
import getpass
import json
import os
from pathlib import Path
import smtplib
import ssl
from email.message import EmailMessage
from app.config import Settings
from app.domain import Store
from app.operations import queue_reminders, deliver_outbox, create_backup


def smtp_sender():
    host=os.getenv('SMTP_HOST','')
    sender=os.getenv('MAIL_FROM','')
    if not host or not sender:
        raise RuntimeError('Configure SMTP_HOST and MAIL_FROM before sending email')
    port=int(os.getenv('SMTP_PORT','587'))
    use_ssl=os.getenv('SMTP_SSL','0')=='1'
    def send(recipient,subject,body):
        mail=EmailMessage()
        mail['From']=sender
        mail['To']=recipient
        mail['Subject']=subject
        mail.set_content(body)
        transport=smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        with transport(host,port,timeout=20) as client:
            if not use_ssl and os.getenv('SMTP_STARTTLS','1')=='1':
                client.starttls(context=ssl.create_default_context())
            username=os.getenv('SMTP_USER','')
            if username:
                client.login(username,os.getenv('SMTP_PASSWORD',''))
            client.send_message(mail)
    return send


def main():
    parser=argparse.ArgumentParser(description='LeihNest maintenance')
    commands=parser.add_subparsers(dest='command',required=True)
    user=commands.add_parser('user',help='Create an account; password is prompted securely')
    user.add_argument('--email',required=True)
    user.add_argument('--name',required=True)
    user.add_argument('--locale',choices=['de','en'],default='de')
    commands.add_parser('reminders',help='Queue due-return reminders without sending them')
    commands.add_parser('mail',help='Send pending messages using configured SMTP')
    commands.add_parser('mail-status',help='Show counts, never message bodies or credentials')
    backup=commands.add_parser('backup',help='Online backup of DB, legal text and referenced photos')
    backup.add_argument('destination',type=Path)
    args=parser.parse_args()
    settings=Settings()
    store=Store(settings.data_dir/'leihnest.sqlite3')
    if args.command=='user':
        password=getpass.getpass('Password (12+ characters): ')
        if password!=getpass.getpass('Repeat password: '):
            parser.error('Passwords do not match')
        print('Account created:',store.create_user(args.email,args.name,password,args.locale))
    elif args.command=='reminders':
        print(json.dumps({'queued':queue_reminders(store,settings.public_url)}))
    elif args.command=='mail':
        print(json.dumps(deliver_outbox(store,smtp_sender())))
    elif args.command=='mail-status':
        with store.db.read() as c:
            rows=c.execute('SELECT sent_at IS NOT NULL AS sent,attempts>=5 AS exhausted,COUNT(*) AS count FROM outbox GROUP BY sent,exhausted').fetchall()
            print(json.dumps([dict(r) for r in rows]))
    elif args.command=='backup':
        create_backup(store,args.destination)
        print('Backup created:',args.destination)

if __name__=='__main__':
    main()
