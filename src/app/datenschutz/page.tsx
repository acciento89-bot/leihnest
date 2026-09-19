import Link from "next/link";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section><h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2><div className="mt-3 space-y-3">{children}</div></section>
);

export default function Datenschutz() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-[var(--brand)]">← Zurück zu LeihNest</Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Datenschutz</p>
      <h1 className="mt-3 text-4xl font-bold">Datenschutzerklärung</h1>
      <p className="mt-4 leading-7 text-[var(--muted)]">Informationen zur Verarbeitung personenbezogener Daten bei der Nutzung von LeihNest und bei der Kontaktaufnahme.</p>

      <div className="mt-10 space-y-10 leading-7 text-[var(--muted)]">
        <Section title="1. Verantwortlicher">
          <p><strong className="text-[var(--foreground)]">Piotr Kaminski – Kamilunavo</strong><br />Otto-Braun-Straße 14<br />40595 Düsseldorf<br />Deutschland<br />E-Mail: <a className="text-[var(--brand-dark)] underline" href="mailto:contact@kamilunavo.com">contact@kamilunavo.com</a><br />Kontaktformular: <Link className="text-[var(--brand-dark)] underline" href="/kontakt">leihnest.de/kontakt</Link></p>
        </Section>

        <Section title="2. Zweck und Umfang von LeihNest">
          <p>LeihNest ist ein webbasierter Dienst zur gemeinsamen Verwaltung von Gegenständen, Gruppenmitgliedschaften, Reservierungen, Ausgaben und Rückgaben. Personenbezogene Daten werden nur verarbeitet, soweit dies für die Bereitstellung, Sicherheit und Verwaltung des Dienstes, die Bearbeitung von Anfragen, die Abwicklung eines gebuchten Plus-Abonnements oder die Erfüllung gesetzlicher Pflichten erforderlich ist.</p>
        </Section>

        <Section title="3. Benutzerkonto und Anmeldung">
          <p>Bei Registrierung und Nutzung eines Kontos werden insbesondere Name, E-Mail-Adresse, Authentifizierungsdaten, Sitzungsinformationen sowie technisch erforderliche Zeitstempel verarbeitet. Passwörter werden nicht im Klartext gespeichert. Die Verarbeitung ist für die Bereitstellung des Benutzerkontos und des Dienstes erforderlich. Rechtsgrundlage ist insbesondere Art. 6 Abs. 1 lit. b DSGVO.</p>
        </Section>

        <Section title="4. Gruppen, Gegenstände und Reservierungen">
          <p>Je nach Nutzung verarbeitet LeihNest Daten zu Gruppenmitgliedschaften und Rollen sowie von Nutzern eingegebene Informationen über Gegenstände, Lagerorte, Reservierungszeiträume, Mengen, Verwendungszwecke, Freigaben, Übergaben, Rückgaben und Rückgabehinweise. Diese Daten dienen den vom Nutzer angeforderten LeihNest-Funktionen.</p>
        </Section>

        <Section title="5. Hochgeladene Bilder">
          <p>Nutzer können Profilbilder, Gruppenbilder und Gegenstandsbilder hochladen. Diese Bilder werden auf der von LeihNest verwendeten Server-Infrastruktur gespeichert, technisch in WebP umgewandelt und innerhalb der jeweiligen geschützten Gruppen- und Profilfunktionen bereitgestellt.</p>
          <p>Bilder werden grundsätzlich solange gespeichert, wie das zugehörige Profil, die Gruppe oder der Gegenstand sie für die Nutzung von LeihNest benötigt. Ersetzte oder über die vorgesehenen Produktfunktionen gelöschte Bilder werden aus der aktiven Zuordnung entfernt und anschließend aus dem Dateispeicher gelöscht. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
        </Section>

        <Section title="6. LeihNest Plus und Stripe">
          <p>Für kostenpflichtige LeihNest-Plus-Abonnements wird Stripe als Zahlungsdienstleister eingesetzt. Stripe verarbeitet die für Zahlung, Rechnungsstellung, Zahlungsstatus und Zahlungsart erforderlichen Daten in eigener technischer Umgebung. LeihNest speichert Stripe-Kunden- und Abonnementkennungen, Tarif, Status und Abrechnungszeitraum, aber keine vollständigen Zahlungskartendaten.</p>
          <p>Die Verarbeitung dient dem Abschluss und der Durchführung des Plus-Abonnements und erfolgt insbesondere auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO. Für Rechnungs- und Zahlungsunterlagen können zusätzlich gesetzliche Aufbewahrungspflichten gelten.</p>
        </Section>

        <Section title="7. Technische Bereitstellung und Server-Logs">
          <p>Beim Aufruf von LeihNest können technisch notwendige Verbindungs- und Protokolldaten verarbeitet werden. Dazu können IP-Adresse, Datum und Uhrzeit, aufgerufene URL, Referrer, Browser- und Betriebssysteminformationen, HTTP-Statuscode und übertragene Datenmenge gehören.</p>
          <p>Die Verarbeitung dient der Auslieferung, Stabilität und Sicherheit des Dienstes sowie der Erkennung von Missbrauch. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>
        </Section>

        <Section title="8. Hosting und Datenbank">
          <p>LeihNest wird auf vom Betreiber eingesetzter Server-Infrastruktur betrieben und verwendet PostgreSQL zur Speicherung der für den Dienst erforderlichen Daten sowie einen getrennten Dateispeicher für hochgeladene Bilder. Soweit ein Hosting- oder Infrastruktur-Dienstleister personenbezogene Daten im Auftrag verarbeitet, erfolgt dies auf Grundlage der datenschutzrechtlich erforderlichen Vereinbarungen.</p>
        </Section>

        <Section title="9. Erforderliche Cookies und Sitzungen">
          <p>Für Anmeldung, Sitzungsverwaltung und Zugriffsschutz verwendet LeihNest technisch erforderliche Session-Cookies. Sie sind für die vom Nutzer ausdrücklich angeforderten Funktionen notwendig und werden nicht zu Werbe- oder Profilingzwecken eingesetzt.</p>
        </Section>

        <Section title="10. Kontakt per E-Mail und Kontaktformular">
          <p>Bei einer Kontaktaufnahme per E-Mail werden E-Mail-Adresse, Nachrichteninhalt und freiwillig mitgeteilte Kontaktdaten zur Bearbeitung der Anfrage verarbeitet. Bei vertraglichen oder vorvertraglichen Anliegen ist Art. 6 Abs. 1 lit. b DSGVO maßgeblich; im Übrigen Art. 6 Abs. 1 lit. f DSGVO.</p>
          <p>Das Kontaktformular auf LeihNest übermittelt die eingegebenen Daten nicht an einen LeihNest-Formularserver. Es bereitet lokal im Browser eine E-Mail an Kamilunavo vor. Eine Verarbeitung durch Kamilunavo erfolgt erst, wenn diese E-Mail tatsächlich versendet wird.</p>
        </Section>

        <Section title="11. Analyse, Werbung und Profiling">
          <p>LeihNest setzt derzeit keine eigenen Werbedienste, kein Google Analytics, keinen Meta Pixel und kein Werbeprofiling ein. Die innerhalb von Plus angezeigten Gruppenstatistiken werden aus den vorhandenen LeihNest-Reservierungsdaten der jeweiligen Gruppe berechnet und nicht für Werbung oder gruppenübergreifendes Profiling verwendet.</p>
        </Section>

        <Section title="12. Speicherdauer">
          <p>Personenbezogene Daten werden nur so lange gespeichert, wie sie für den jeweiligen Zweck, die Bereitstellung des Kontos, das Plus-Abonnement oder gesetzliche Aufbewahrungs- und Nachweispflichten erforderlich sind. Technische Protokolldaten werden gelöscht, sobald ihr Sicherheits- oder Betriebszweck entfällt, soweit keine längere Aufbewahrung rechtlich erforderlich ist.</p>
        </Section>

        <Section title="13. Betroffenenrechte">
          <p>Unter den gesetzlichen Voraussetzungen bestehen insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Anfragen können an <a className="text-[var(--brand-dark)] underline" href="mailto:contact@kamilunavo.com">contact@kamilunavo.com</a> oder über das <Link className="text-[var(--brand-dark)] underline" href="/kontakt">Kontaktformular</Link> gerichtet werden. Außerdem besteht ein Beschwerderecht bei einer zuständigen Datenschutzaufsichtsbehörde.</p>
        </Section>

        <Section title="14. Automatisierte Entscheidungen">
          <p>LeihNest trifft keine ausschließlich auf einer automatisierten Verarbeitung beruhenden Entscheidungen im Sinne von Art. 22 DSGVO und betreibt kein Profiling zu Werbezwecken.</p>
        </Section>

        <Section title="15. Änderungen dieser Datenschutzerklärung">
          <p>Diese Datenschutzerklärung wird angepasst, wenn sich Funktionen, eingesetzte Dienstleister oder rechtliche Anforderungen ändern. Maßgeblich ist die auf dieser Seite veröffentlichte Fassung.</p>
        </Section>
      </div>

      <nav className="mt-12 flex flex-wrap gap-5 border-t border-[var(--line)] pt-6 text-sm font-semibold">
        <Link href="/impressum">Impressum</Link>
        <Link href="/kontakt">Kontakt</Link>
      </nav>
      <p className="mt-6 text-sm text-[var(--muted)]">Stand: 19. September 2026</p>
    </main>
  );
}
