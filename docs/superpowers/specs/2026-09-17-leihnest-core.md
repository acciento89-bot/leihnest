# LeihNest: closed-group lending

Approved by the owner in the conversation: LeihNest, leihnest.de, green/light visual direction, German and English, responsive website and complete group -> item -> invitation -> reservation -> handover -> return flow. SammlerRaum is separate.

## First deliverable
A working, self-hosted pilot, not a static demo. FastAPI and Jinja server-render the application; plain CSS and a small progressive-enhancement script avoid a separate frontend deployment. SQLite WAL on a local persistent volume is intentionally limited to a single server. Every stock-changing operation uses BEGIN IMMEDIATE; overlapping reservations use a peak-occupancy sweep, not a naive sum. Horizontal scaling or network filesystem storage requires a database migration first.

## Boundaries
All group reads and writes require current membership. Owner/administrator manage inventory, invitations and handovers; members reserve and cancel their own unissued bookings. Only the owner can grant administrator access. Invitations are email-bound, expire after seven days and are single-use. Sessions and password reset tokens are revocable and hashed in the database. Passwords use Argon2. Mutations require CSRF; cookies are HttpOnly, SameSite=Lax, Secure in production. Uploads are limited, decoded and re-encoded to WebP, and only served after group authorization.

## Inventory rules
Quantities are positive integers. Booking intervals are half-open [start,end), stored as UTC seconds, entered/displayed in Europe/Berlin. Pending approval holds stock. Cancelled and fully returned bookings release stock. Partial returns release only their returned quantity. Overdue, unreturned stock blocks new availability conservatively until returned. Earlier handovers are rechecked against stock from the actual handover time. Editing stock below current/future commitments is refused. No physical goods payments or deposits.

## Screens
Public home; login/signup/password reset; group chooser/onboarding; overview; searchable inventory; item detail and booking form; inventory editor/photo; bookings with state actions; month calendar with mobile agenda; members and email-bound invitations; group settings and CSV export. Landing sample data is explicitly marked as an example. Authenticated pages only show real persisted data.

## Delivery gates
Core domain, permission, CSRF, upload, language, outbox and concurrency tests. Real-browser desktop and mobile checks, screenshots, no horizontal page overflow. Container deployment and backup instructions. No secrets committed. No claim of deployment, email delivery or billing activation without evidence.

## Deliberate exclusions
No subscription checkout until prices and billing credentials are agreed. Pilot access requests no payment details. SMTP is opt-in and the outbox can be processed by an explicit CLI. Public launch additionally requires operator-provided legal pages, configured mail and a deployment/security review; the development deliverable does not silently enable these.
