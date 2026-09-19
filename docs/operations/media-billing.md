# LeihNest Media + Billing Operations

## Runtime settings

Configure these values in Portainer for the `leihnest-web` service. Do not commit secret values.

```text
UPLOADS_DIR=/data/uploads
PUBLIC_URL=https://leihnest.de
STRIPE_PLUS_MONTHLY_PRICE_ID=price_1UHRAhJy26xczTEtFrpBlXto
STRIPE_PLUS_YEARLY_PRICE_ID=price_1UHRAjJy26xczTEtPFpnqDrG
STRIPE_SECRET_KEY=<live server-side Stripe secret>
STRIPE_WEBHOOK_SECRET=<live webhook signing secret>
```

The two Price IDs are identifiers, not secrets. The live LeihNest Plus product and both recurring prices were verified in Stripe on 19 September 2026.

## Persistent uploads

The web service mounts the named Docker volume `leihnest-uploads` at `/data/uploads`. Do not delete or recreate this volume during ordinary deployments.

### Backup

First identify the actual volume name with `docker volume ls`. With the default Compose project name it is normally `leihnest_leihnest-uploads`.

```bash
docker run --rm \
  -v leihnest_leihnest-uploads:/data/uploads:ro \
  -v "$PWD":/backup \
  alpine:3.22 \
  tar -czf /backup/leihnest-uploads-$(date +%F).tar.gz -C /data/uploads .
```

Back up PostgreSQL separately. The media database rows and media volume belong to the same logical dataset and should be retained together.

### Restore

Stop `leihnest-web` before restoring. Restore the archive into the same named volume, preserve the database, then start the web service again and verify image reads for a profile, group and item.

## Database migration

Deployment runs the existing `leihnest-migrate` service before the web service starts. The media/billing migration is additive. Never reset the database or remove `leihnest-db`.

Verify after deployment:

- migrate container exits with code 0;
- web health check becomes healthy;
- existing users, groups, items and reservations remain present;
- `MediaAsset`, `GroupSubscription` and `ProcessedStripeEvent` tables exist.

## Stripe

Account: Kamilunavo

Product: LeihNest Plus (`prod_VI1DOgYMUNoc4n`)

Pricing:

- EUR 4.99 per month;
- EUR 39.99 per year.

Webhook endpoint:

```text
https://leihnest.de/api/stripe/webhook
```

Subscribe the endpoint to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

Store the endpoint signing secret only in Portainer as `STRIPE_WEBHOOK_SECRET`.

## Production smoke test

### Free group

1. Sign in with an existing account and verify existing inventory and reservations remain.
2. Upload, replace and remove a profile image.
3. Upload, replace and remove a group image as OWNER/ADMIN.
4. Confirm MEMBER cannot change the group image.
5. Upload one item image.
6. Confirm a second item image is rejected on Free.
7. Confirm a user outside the group receives 404 for the media URL.
8. Redeploy the web container and confirm uploaded images remain.

### Plus purchase

1. As OWNER open Settings → LeihNest Plus.
2. Confirm Checkout displays the selected exact price before completing payment.
3. Complete one deliberate subscription.
4. On return, confirm the UI waits for webhook synchronization rather than granting Plus from the redirect alone.
5. Confirm Plus becomes active after the signed webhook.
6. Confirm all group members receive the group entitlement.
7. Confirm five item images are accepted and a sixth is rejected.
8. Confirm Customer Portal is available to OWNER but not ADMIN/MEMBER.
9. Confirm cancellation at period end preserves Plus until the paid period ends.

### Plus value

1. Download inventory CSV.
2. Download reservation CSV.
3. Verify a text value starting with `=`, `+`, `-` or `@` is exported as text, not a spreadsheet formula.
4. Verify analytics only show data derived from the group's reservations.
5. Confirm a Free group receives 403 from the export endpoints.

## Incident notes

- If the media volume is unavailable, do not recreate it blindly; inspect the Docker volume and mount first.
- If Stripe webhooks fail, do not manually flip a group to Plus. Restore webhook delivery/signing and let Stripe resynchronize the subscription projection.
- Never paste `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` into GitHub issues, commits, logs or chat.
