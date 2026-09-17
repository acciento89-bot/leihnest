"""Every product string has German and English versions. No remote translation."""
from datetime import datetime
from zoneinfo import ZoneInfo
from app.db import DomainError

TZ=ZoneInfo('Europe/Berlin')
TEXT={
 'tagline':('Gemeinsam nutzen. Einfach organisiert.','Shared things. Simply organised.'),
 'hero_title':('Weniger suchen.\nMehr gemeinsam.','Less searching.\nMore sharing.'),
 'hero_desc':('Euer Pavillon. Eure Spiele. Eure Technik. Ein gemeinsamer Ort, damit alle wissen, was frei ist und wer es gerade hat.','Your gazebo. Your games. Your equipment. One shared space to see what is available and who has it.'),
 'eyebrow':('DAS ZUHAUSE F\u00dcR EURE DINGE','A HOME FOR THE THINGS YOU SHARE'),
 'together':('Gemeinsam wird\u2019s einfacher.','Together feels simpler.'),
 'start':('Euer Nest erstellen','Create your nest'), 'open_app':('Zu meinem Nest','Open my nest'),
 'explore':('So funktioniert\u2019s','See how it works'), 'features':('Funktionen','Features'),
 'login':('Anmelden','Log in'), 'logout':('Abmelden','Log out'), 'signup':('Konto erstellen','Create account'),
 'pilot':('Pilotzugang','Pilot access'), 'pilot_note':('Keine Zahlungsdaten. Kein Warenhandel. Einfach gemeinsam nutzen.','No payment details. No marketplace. Just sharing, organised.'),
 'example':('Beispielansicht','Example workspace'), 'example_group':('Freizeitfreunde','Weekend crew'),
 'dashboard':('\u00dcbersicht','Overview'), 'inventory':('Gegenst\u00e4nde','Inventory'), 'bookings':('Ausleihen','Loans'),
 'calendar':('Kalender','Calendar'), 'members':('Mitglieder','Members'), 'settings':('Einstellungen','Settings'),
 'your_nest':('EUER LEIHNEST','YOUR LEIHNEST'), 'workspace':('Arbeitsbereich','Workspace'),
 'overview_title':('Alles da. Alles im Blick.','Everything in its place.'),
 'overview_desc':('Euer gemeinsamer Bestand und die n\u00e4chsten Ausleihen.','Your shared inventory and upcoming loans, at a glance.'),
 'add_item':('Gegenstand hinzuf\u00fcgen','Add an item'), 'new_booking':('Jetzt reservieren','Reserve now'),
 'view_all':('Alle ansehen','View all'), 'active_loans':('Aktuell ausgeliehen','Currently borrowed'),
 'upcoming':('N\u00e4chste Reservierungen','Upcoming reservations'), 'due':('R\u00fcckgaben f\u00e4llig','Returns due'),
 'total_items':('Gegenst\u00e4nde im Nest','Items in your nest'), 'people':('Menschen im Nest','People in your nest'),
 'available':('Verf\u00fcgbar','Available'), 'unavailable':('Belegt','Unavailable'), 'of':('von','of'), 'units':('St\u00fcck','units'),
 'today':('Heute','Today'), 'activity':('Zuletzt passiert','Recent activity'), 'empty_activity':('Hier beginnt eure gemeinsame Geschichte.','Your shared story starts here.'),
 'no_bookings':('Noch keine Ausleihen.','No loans yet.'), 'no_bookings_desc':('W\u00e4hlt einen Gegenstand und reserviert euren Wunschzeitraum.','Choose an item and reserve the dates you need.'),
 'no_items':('Euer Nest wartet auf die ersten Dinge.','Your nest is ready for its first items.'),
 'no_items_desc':('Ein Foto, ein Name und ein Lagerort. Schon k\u00f6nnen alle darauf zugreifen.','A photo, a name and a storage location. Then your group is ready to share.'),
 'no_results':('Keine passenden Gegenst\u00e4nde.','No matching items.'), 'clear_filters':('Filter zur\u00fccksetzen','Clear filters'),
 'search':('Gegenstand oder Lagerort suchen','Search items or locations'), 'search_button':('Suchen','Search'),
 'all':('Alle','All'), 'all_categories':('Alle Kategorien','All categories'),
 'outdoor':('Drau\u00dfen','Outdoor'), 'tech':('Technik','Technology'), 'events':('Veranstaltung','Events'),
 'sport':('Sport & Spiel','Sport & games'), 'tools':('Werkzeug','Tools'), 'other':('Sonstiges','Other'),
 'name':('Name','Name'), 'email':('E-Mail-Adresse','Email address'), 'password':('Passwort','Password'),
 'password_hint':('Mindestens 12 Zeichen. Nutze eine einzigartige Passphrase.','At least 12 characters. Use a unique passphrase.'),
 'welcome_back':('Willkommen zur\u00fcck im Nest.','Welcome back to your nest.'),
 'login_desc':('Alles, was ihr gemeinsam nutzt. An einem Ort.','Everything you share. All in one place.'),
 'signup_title':('Ein Nest f\u00fcr eure Gruppe.','A nest for your group.'), 'signup_desc':('Erstelle dein Konto. Danach richtest du eure Gruppe ein.','Create your account, then set up your group.'),
 'already_account':('Schon ein Konto?','Already have an account?'), 'no_account':('Neu bei LeihNest?','New to LeihNest?'),
 'forgot':('Passwort vergessen?','Forgot your password?'), 'forgot_title':('Zur\u00fcck in dein Konto.','Back into your account.'),
 'forgot_desc':('Fordere einen Link zum Zur\u00fccksetzen deines Passworts an.','Request a link to reset your password.'),
 'request_link':('Link anfordern','Request a link'), 'reset_title':('Ein neues Passwort.','A new password.'),
 'reset_done':('Passwort aktualisiert. Melde dich erneut an.','Password updated. Please log in again.'),
 'reset_requested':('Anfrage aufgenommen. Falls ein Konto existiert, wird ein Link \u00fcber den eingerichteten Mailversand zugestellt.','Request received. If an account exists, a link will be delivered through the configured mail service.'),
 'reset_subject':('LeihNest: Passwort zur\u00fccksetzen','LeihNest: reset your password'),
 'reset_body':('Mit diesem Link kannst du dein Passwort innerhalb einer Stunde zur\u00fccksetzen:','Use this link within one hour to reset your password:'),
 'choose_group':('Deine Nester','Your nests'), 'choose_desc':('Ein eigener Bereich f\u00fcr jede Gruppe.','A separate space for every group.'),
 'new_group':('Ein neues Nest erstellen','Create a new nest'), 'group_name':('Name eurer Gruppe','Your group name'),
 'create_group':('Nest erstellen','Create nest'), 'switch_group':('Nest wechseln','Switch nest'),
 'group_hint':('Zum Beispiel euer Verein, eure WG oder euer Freundeskreis.','For your club, shared home or circle of friends.'),
 'title':('Bezeichnung','Item name'), 'quantity':('St\u00fcckzahl','Quantity'), 'category':('Kategorie','Category'),
 'location':('Lagerort','Storage location'), 'description':('Beschreibung','Description'), 'accessories':('Zubeh\u00f6r','Accessories'),
 'condition':('Zustand / Hinweise','Condition / notes'), 'photo':('Foto','Photo'), 'photo_hint':('JPG, PNG oder WebP, maximal 5 MB. Fotos bleiben in eurer Gruppe.','JPG, PNG or WebP, up to 5 MB. Photos stay inside your group.'),
 'save':('Speichern','Save'), 'cancel':('Stornieren','Cancel'), 'back':('Zur\u00fcck','Back'), 'edit':('Bearbeiten','Edit'),
 'edit_item':('Gegenstand bearbeiten','Edit item'), 'archive':('Archivieren','Archive'), 'archive_confirm':('Diesen Gegenstand archivieren?','Archive this item?'),
 'item_form_desc':('Damit alle wissen, was es gibt und wo es steht.','Help everyone see what you have and where it belongs.'),
 'reserve_title':('F\u00fcr euch reservieren.','Make it yours for a while.'), 'start_at':('Abholung','Pickup'), 'end_at':('R\u00fcckgabe','Return'),
 'time_hint':('Alle Zeiten: Europe/Berlin. Verf\u00fcgbarkeit wird beim Reservieren erneut gepr\u00fcft.','All times: Europe/Berlin. Availability is checked again when you reserve.'),
 'note':('Notiz (optional)','Note (optional)'), 'approval_hint':('Eure Verwaltung best\u00e4tigt jede Reservierung.','Your administrator approves each reservation.'),
 'direct_hint':('Passende Reservierungen werden direkt best\u00e4tigt.','Available reservations are confirmed immediately.'),
 'item_history':('Reservierungen f\u00fcr diesen Gegenstand','Reservations for this item'),
 'requested':('Wartet auf Freigabe','Awaiting approval'), 'confirmed':('Reserviert','Reserved'), 'borrowed':('Ausgeliehen','Borrowed'),
 'returned':('Zur\u00fcckgegeben','Returned'), 'cancelled':('Storniert','Cancelled'), 'overdue':('\u00dcberf\u00e4llig','Overdue'),
 'approve':('Freigeben','Approve'), 'issue':('Ausgeben','Hand over'), 'return':('R\u00fcckgabe erfassen','Record return'),
 'return_quantity':('R\u00fcckgabemenge','Return quantity'), 'borrower':('Ausgeliehen an','Borrower'), 'period':('Zeitraum','Dates'),
 'status':('Status','Status'), 'actions':('Aktionen','Actions'), 'remaining':('Noch ausstehend','Still outstanding'),
 'confirm_action':('Diesen Schritt verbindlich ausf\u00fchren?','Confirm this action?'),
 'bookings_desc':('Vom ersten Plan bis zur letzten R\u00fcckgabe.','From the first plan to the final return.'),
 'active':('Aktiv','Active'), 'history':('Abgeschlossen','Completed'), 'calendar_desc':('Seht, wann eure Dinge unterwegs sind.','See when your shared things are out and about.'),
 'previous':('Vorheriger Monat','Previous month'), 'next':('N\u00e4chster Monat','Next month'), 'empty_calendar':('Keine Reservierungen in diesem Monat.','No reservations this month.'),
 'members_desc':('Gemeinsam nutzen beginnt mit den richtigen Menschen.','Sharing starts with your people.'),
 'invite_member':('Mitglied einladen','Invite a member'), 'role':('Rolle','Role'), 'owner':('Inhaber','Owner'),
 'admin':('Verwaltung','Administrator'), 'member':('Mitglied','Member'), 'remove':('Entfernen','Remove'),
 'invite_hint':('Der Link gilt 7 Tage und nur f\u00fcr die angegebene E-Mail-Adresse.','The link is valid for 7 days and only for the email address entered.'),
 'invite_created':('Einladung erstellt','Invitation created'), 'invite_link_hint':('Teile diesen pers\u00f6nlichen Link mit der eingeladenen Person. Die E-Mail liegt zus\u00e4tzlich im Versandpostfach.','Share this personal link with the invitee. The email is also queued in the outbox.'),
 'copy':('Link kopieren','Copy link'), 'copied':('Kopiert','Copied'), 'pending_invites':('Offene Einladungen','Pending invitations'),
 'revoke':('Widerrufen','Revoke'), 'expires':('G\u00fcltig bis','Expires'), 'join':('Einladung annehmen','Accept invitation'),
 'join_title':('Ein Platz im Nest wartet.','There is a place for you here.'),
 'join_desc':('Du kannst die Einladung mit dem Konto der eingeladenen E-Mail-Adresse annehmen.','Accept using the account belonging to the invited email address.'),
 'join_login':('Melde dich mit der eingeladenen E-Mail-Adresse an oder erstelle ein Konto.','Log in with the invited email address or create an account.'),
 'settings_desc':('So funktioniert das Teilen bei euch.','Make sharing work for your group.'),
 'approval':('Reservierungen durch die Verwaltung freigeben','Require administrator approval for reservations'),
 'approval_detail':('Offene Anfragen halten den Bestand bereits frei. Eine \u00c4nderung betrifft nur neue Reservierungen.','Pending requests already hold inventory. Changes only affect new reservations.'),
 'export':('Bestand als CSV exportieren','Export inventory as CSV'), 'export_desc':('Eure Daten geh\u00f6ren euch. Exportiert den aktuellen Bestand f\u00fcr eure Unterlagen.','Your data belongs to you. Export your current inventory for your records.'),
 'plan_title':('Euer Pilotzugang','Your pilot access'), 'plan_desc':('In dieser Version gibt es keinen kostenpflichtigen Tarif und keine automatische Abbuchung.','This version has no paid plan or automatic charges.'),
 'saved':('Gespeichert.','Saved.'), 'reserved':('Reservierung angelegt.','Reservation created.'),
 'success':('Erledigt.','Done.'), 'menu':('Men\u00fc \u00f6ffnen','Open menu'), 'skip':('Zum Inhalt springen','Skip to content'),
 'private':('Nur f\u00fcr eure Gruppe','Private to your group'), 'private_desc':('Keine \u00f6ffentlichen Angebote. Ihr entscheidet, wer dazugeh\u00f6rt.','No public listings. You decide who belongs.'),
 'stock_feature':('Ein Platz f\u00fcr alle Dinge.','A place for every shared thing.'),
 'stock_desc':('Fotos, Zubeh\u00f6r und Lagerorte statt verstreuter Listen.','Photos, accessories and storage locations instead of scattered lists.'),
 'calendar_feature':('Ein Kalender, der mitdenkt.','A calendar that keeps up.'),
 'calendar_feature_desc':('Zeitraum w\u00e4hlen. Menge pr\u00fcfen. Doppelbuchungen vermeiden.','Choose your dates. Check the quantity. Avoid double bookings.'),
 'return_feature':('Wieder da? Abgehakt.','Back where it belongs.'),
 'return_desc':('Ausgaben und R\u00fcckgaben nachvollziehen, auch wenn nur ein Teil zur\u00fcckkommt.','Track handovers and returns, even when only part of a loan comes back.'),
 'steps_title':('Vom Durcheinander zum Miteinander.','From scattered to shared.'),
 'step1':('Nest anlegen','Create your nest'), 'step1_desc':('Gebt eurer Gruppe ein Zuhause.','Give your group a home.'),
 'step2':('Dinge hinzuf\u00fcgen','Add your things'), 'step2_desc':('Mit Foto, Menge und Lagerort.','With a photo, quantity and location.'),
 'step3':('Gemeinsam loslegen','Start sharing'), 'step3_desc':('Einladen, reservieren, zur\u00fcckbringen.','Invite, reserve, return. Repeat.'),
 'cta':('Alles bereit f\u00fcr euer Nest?','Ready for your own nest?'),
 'cta_desc':('Weniger Abstimmung. Mehr Zeit f\u00fcr das, was ihr zusammen vorhabt.','Less coordinating. More time for the things you do together.'),
 'club':('F\u00fcr Vereine','For clubs'), 'friends':('F\u00fcr Freundeskreise','For friends'), 'homes':('F\u00fcr Hausgemeinschaften','For shared homes'),
 'imprint':('Impressum','Legal notice'), 'privacy':('Datenschutz','Privacy'), 'contact':('Kontakt','Contact'),
 'legal_unavailable':('Diese Installation ist ein geschlossener Pilot. Die Betreiberangaben f\u00fcr einen \u00f6ffentlichen Start sind noch nicht hinterlegt.','This installation is a closed pilot. Operator information for a public launch has not been supplied yet.'),
 'powered':('Ein Produkt von Kamilunavo','A product by Kamilunavo'), 'closed':('Die Registrierung ist derzeit geschlossen.','Registration is currently closed.'),
 'error_title':('Das hat noch nicht geklappt.','That did not work yet.'),
 'forbidden':('Du hast daf\u00fcr keine Berechtigung.','You do not have permission for this action.'),
 'csrf':('Die Sitzung ist abgelaufen. Lade die Seite neu und versuche es erneut.','Your form has expired. Reload the page and try again.'),
 'not_found':('Dieser Eintrag wurde nicht gefunden.','This entry was not found.'),
 'stock':('F\u00fcr diesen Zeitraum sind nicht gen\u00fcgend St\u00fccke frei. Pr\u00fcfe Menge und offene R\u00fcckgaben.','Not enough units are available for those dates. Check quantities and outstanding returns.'),
 'dates':('Bitte w\u00e4hle einen g\u00fcltigen zuk\u00fcnftigen Zeitraum (maximal 366 Tage). Zeiten bei einer Zeitumstellung m\u00fcssen eindeutig sein.','Choose valid future dates (up to 366 days). Times around clock changes must be unambiguous.'),
 'quantity_error':('Bitte gib eine g\u00fcltige St\u00fcckzahl an.','Please enter a valid quantity.'),
 'email_invalid':('Bitte gib eine g\u00fcltige E-Mail-Adresse an.','Please enter a valid email address.'),
 'email_exists':('Diese E-Mail-Adresse wird bereits verwendet. Melde dich an oder setze dein Passwort zur\u00fcck.','This email address is already in use. Log in or reset your password.'),
 'name_invalid':('Bitte gib einen Namen in zul\u00e4ssiger L\u00e4nge an.','Please enter a name within the allowed length.'),
 'password_short':('Das Passwort muss zwischen 12 und 256 Zeichen lang sein.','Your password must be between 12 and 256 characters.'),
 'credentials':('E-Mail-Adresse oder Passwort stimmen nicht.','The email address or password is incorrect.'),
 'photo_invalid':('Das Foto ist ung\u00fcltig oder zu gro\u00df. Erlaubt: JPG, PNG, WebP bis 5 MB und 20 Megapixel.','Invalid or oversized photo. Use JPG, PNG or WebP up to 5 MB and 20 megapixels.'),
 'rate_limit':('Zu viele Versuche. Bitte versuche es sp\u00e4ter erneut.','Too many attempts. Please try again later.'),
 'invite':('Diese Einladung ist ung\u00fcltig, abgelaufen oder f\u00fcr eine andere E-Mail-Adresse bestimmt.','This invitation is invalid, expired or intended for another email address.'),
 'already_member':('Diese Person ist bereits Mitglied.','This person is already a member.'),
 'reset':('Dieser Link ist ung\u00fcltig oder abgelaufen. Fordere einen neuen an.','This link is invalid or expired. Request a new one.'),
 'state':('Dieser Schritt passt nicht zum aktuellen Status. Lade die Seite neu.','This action does not match the current status. Reload the page.'),
 'open_bookings':('Zuerst m\u00fcssen offene Reservierungen und Ausleihen abgeschlossen oder storniert werden.','Complete or cancel outstanding reservations and loans first.'),
 'owner_error':('Der Inhaber kann nicht entfernt oder herabgestuft werden.','The owner cannot be removed or demoted.'),
 'too_long':('Ein Text ist zu lang. Maximal 2.000 Zeichen.','A text is too long. Maximum 2,000 characters.'),
 'group_created':('hat ein Nest erstellt','created a nest'), 'settings_changed':('hat Einstellungen ge\u00e4ndert','updated settings'),
 'invited':('hat jemanden eingeladen','invited someone'), 'joined':('ist dem Nest beigetreten','joined the nest'),
 'member_changed':('hat eine Mitgliedschaft ge\u00e4ndert','updated membership'), 'item_added':('hat einen Gegenstand hinzugef\u00fcgt','added an item'),
 'item_updated':('hat einen Gegenstand bearbeitet','updated an item'), 'item_archived':('hat einen Gegenstand archiviert','archived an item'),
 'invite_subject':('Du bist zu LeihNest eingeladen','You are invited to LeihNest'),
 'invite_body':('Du bist eingeladen. Dieser Link gilt 7 Tage und nur f\u00fcr deine E-Mail-Adresse:','You are invited. This link is valid for 7 days and only for your email address:'),
 'reminder_subject':('LeihNest: Deine R\u00fcckgabe steht an','LeihNest: your return is coming up'),
 'reminder_body':('Bitte denke an deine R\u00fcckgabe. Details findest du in deinem Nest:','Please remember your return. Find the details in your nest:'),
 'demo_tent':('Pavillon 3 \u00d7 3 m','Garden gazebo'), 'demo_speaker':('Bluetooth-Lautsprecher','Bluetooth speaker'), 'demo_games':('Spielekiste','Board game box'),
 'demo_location':('Vereinsheim \u00b7 Lager A','Clubhouse \u00b7 Storage A'), 'inventory_desc':('Alles, was ihr teilt. An einem Ort.','Everything you share. All in one place.'),
 'not_provided':('Nicht angegeben','Not specified'), 'noscript':('Alle Kernfunktionen funktionieren auch ohne JavaScript.','All core features also work without JavaScript.'),
}
TEXT.update({
 'hero_title':('Gute Dinge.\nTeilt man.','Good things.\nAre for sharing.'),
 'hero_desc':('Der Pavillon f\u00fcrs Sommerfest. Der Beamer f\u00fcr den Filmabend. Ein gemeinsamer Platz f\u00fcr alles, was ihr teilt \u2013 und alles, was ihr zusammen vorhabt.','The gazebo for the summer party. The projector for movie night. One shared home for your things \u2014 and everything you plan together.'),
 'eyebrow':('WENIGER BESITZEN. MEHR MITEINANDER.','LESS STUFF. MORE TOGETHER.'),
 'hero_small':('F\u00fcr kleine Gruppen. Und gro\u00dfe gemeinsame Pl\u00e4ne.','For small groups. And big plans together.'),
 'hero_visual_note':('Ein Nest. Viele M\u00f6glichkeiten.','One nest. Endless possibilities.'),
 'stamp_top':('Besser','Better'), 'stamp_bottom':('zusammen.','together.'),
 'shelf_caption':('Wieder da. Bereit f\u00fcr eure n\u00e4chste Idee.','Back home. Ready for your next idea.'),
 'for_everyone':('GEMEINSAM STATT ALLEIN','A PLACE FOR YOUR PEOPLE'),
 'steps_subtitle':('Kein Hin und Her im Gruppenchat. Sondern ein Platz, an dem alles zusammenkommt.','No endless group chat. Just one place where everything comes together.'),
 'welcome_nest':('SCH\u00d6N, DASS DU DA BIST','WELCOME BACK'),
 'overview_title':('Euer Nest. Eure M\u00f6glichkeiten.','Your nest. Your possibilities.'),
 'overview_desc':('Was ist frei? Wer hat was? Hier laufen eure gemeinsamen Pl\u00e4ne zusammen.','What is available? Who has what? This is where your shared plans come together.'),
 'find_something':('Etwas zum Ausleihen finden','Find something to borrow'),
 'together_short':('GEMEINSAM GENUTZT','BETTER SHARED'),
 'on_the_agenda':('ALS N\u00c4CHSTES','COMING UP'),
 'nest_life':('AUS EUREM NEST','AROUND YOUR NEST'),
 'shared_shelf':('EUER GEMEINSAMES REGAL','YOUR SHARED SHELF'),
 'no_photo':('Noch kein Foto','No photo yet'),
})
MONTHS={'de':['Januar','Februar','M\u00e4rz','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'], 'en':['January','February','March','April','May','June','July','August','September','October','November','December']}
DAYS={'de':['Mo','Di','Mi','Do','Fr','Sa','So'],'en':['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}

def translate(key, locale='de'):
    return TEXT[key][0 if locale=='de' else 1]

def error_key(code):
    return {'quantity':'quantity_error','owner':'owner_error'}.get(code,code)

def locale_from_header(header):
    options=[]
    for entry in header.split(','):
        parts=entry.strip().lower().split(';q=')
        try:
            quality=float(parts[1]) if len(parts)==2 else 1
        except ValueError:
            continue
        language=parts[0].split('-')[0]
        if quality>0 and language in ('de','en'):
            options.append((quality,-len(options),language))
    return max(options)[2] if options else 'en'

def fmt_date(value,locale='de'):
    if not value:
        return ''
    d=datetime.fromtimestamp(value,TZ)
    return d.strftime('%d.%m.%Y, %H:%M') if locale=='de' else d.strftime('%d %b %Y, %H:%M')

def parse_date(value):
    try:
        date=datetime.fromisoformat(value)
        if date.tzinfo or date.year>2100:
            raise ValueError()
        local=date.replace(tzinfo=TZ)
        if local.utcoffset()!=date.replace(tzinfo=TZ,fold=1).utcoffset() or datetime.fromtimestamp(local.timestamp(),TZ).replace(tzinfo=None)!=date:
            raise ValueError()
        return int(local.timestamp())
    except (ValueError,TypeError,OverflowError):
        raise DomainError('dates')
