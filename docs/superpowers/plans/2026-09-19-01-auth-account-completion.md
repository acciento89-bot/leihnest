# LeihNest Auth & Account Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the full LeihNest account lifecycle: verified email registration, password recovery, invitation mail, Google/Apple login, Passkeys, explicit account linking, session/security controls, optional TOTP 2FA, and auth-focused production verification.

**Architecture:** Better Auth remains the sole auth authority. SMTP sits behind a local mail adapter. Social providers use explicit linking with implicit same-email linking disabled. Passkeys and optional TOTP are Better Auth plugins layered onto the existing account/session tables through additive Prisma migrations.

**Tech Stack:** Better Auth 1.6, @better-auth/passkey, Nodemailer, jose, Prisma 7, PostgreSQL 17, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-19-auth-account-completion-design.md`

## Global Constraints

- Existing credential login remains supported.
- Credential users must verify email before normal workspace access.
- Registration/resend/reset responses avoid account enumeration.
- Google/Apple never silently merge into an existing same-email account.
- Passkeys are attached to an authenticated account first.
- Do not set `allowUnlinkingAll: true`.
- DE/EN everywhere.
- Production secrets live only in Portainer/environment.
- Database changes are additive.

## Review Focus

1. Same-email Google/Apple login against an existing account returns account-not-linked rather than merging.
2. SMTP failure in invitation delivery preserves the valid invitation and fallback link.
3. Removing a social account/Passkey cannot remove the last usable login path.
4. Password reset/change revokes the intended sessions.
5. Auth error pages do not expose raw provider/token/internal details.

---

### Task 1: Add localized SMTP mail foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Modify: `src/lib/runtime-config.ts`
- Modify: `src/lib/runtime-config.test.ts`
- Create: `src/features/mail/mailer.ts`
- Create: `src/features/mail/mailer.test.ts`
- Create: `src/features/mail/templates.ts`
- Create: `src/features/mail/templates.test.ts`

**Interfaces:**
- Produces `Mailer.send(message): Promise<void>`.
- Produces localized verification/reset/invitation/change-email/delete-account mail builders.

- [ ] **Step 1: Write failing template and secret-redaction tests**

```ts
it("renders a German verification message with the supplied URL", () => {
  const mail = verificationMail({
    locale: "de",
    to: "a@example.com",
    verificationUrl: "https://leihnest.de/api/auth/verify-email?token=opaque",
  });
  expect(mail.subject).toMatch(/E-Mail/i);
  expect(mail.text).toContain("https://leihnest.de/api/auth/verify-email?token=opaque");
});

it("does not include SMTP credentials when delivery fails", async () => {
  const mailer = createMailer(testEnv, failingTransport);
  await expect(mailer.send(message)).rejects.not.toThrow(/smtp-secret-value/);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/mail src/lib/runtime-config.test.ts`  
Expected: FAIL because mail modules/config do not exist.

- [ ] **Step 3: Install mail dependency**

Run:

```sh
npm install nodemailer
npm install -D @types/nodemailer
```

- [ ] **Step 4: Implement config and adapter**

Require:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
MAIL_FROM
```

Implement:

```ts
export interface Mailer {
  send(message: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void>;
}
```

Map transport errors to `MAIL_DELIVERY_FAILED` without echoing credentials.

- [ ] **Step 5: Implement DE/EN templates and escaping**

Dynamic group/name text is HTML-escaped. URLs come only from trusted server-generated URLs.

- [ ] **Step 6: Run GREEN**

Run: `npm test -- src/features/mail src/lib/runtime-config.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add package.json package-lock.json .env.example src/lib/runtime-config* src/features/mail
git commit -m "feat: add localized SMTP mail delivery"
```

---

### Task 2: Require email verification

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/features/auth/auth-options.ts`
- Create: `src/features/auth/auth-options.test.ts`
- Create: `src/features/auth/mail-locale.ts`
- Create: `src/features/auth/mail-locale.test.ts`
- Modify: `src/components/auth/auth-form.tsx`
- Create: `src/app/verify-email/page.tsx`
- Create: `src/components/auth/verify-email-panel.tsx`

**Interfaces:**
- Produces `buildAuthOptions(runtime)`.
- Produces `resolveAuthMailLocale(request): "de" | "en"`.

- [ ] **Step 1: Write failing auth option tests**

```ts
it("requires verification before credential login", () => {
  const options = buildAuthOptions(testRuntime);
  expect(options.emailAndPassword?.requireEmailVerification).toBe(true);
  expect(options.emailVerification?.sendOnSignUp).toBe(true);
  expect(options.emailVerification?.sendOnSignIn).toBe(true);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/auth-options.test.ts src/features/auth/mail-locale.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement auth options**

Configure Better Auth with:

```ts
emailVerification: {
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60,
  sendVerificationEmail: async ({ user, url }, request) => {
    void sendVerification(user.email, url, resolveAuthMailLocale(request));
  },
},
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  requireEmailVerification: true,
}
```

- [ ] **Step 4: Add verification-pending/resend UI**

Credential registration routes to `/verify-email` rather than `/app`. The resend flow always returns neutral copy.

- [ ] **Step 5: Handle unverified login**

A 403 from credential login shows localized “Bitte E-Mail bestaetigen” with resend action.

- [ ] **Step 6: Run GREEN/regression**

Run:

```sh
npm test -- src/features/auth src/components/auth
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add src/lib/auth.ts src/features/auth src/components/auth src/app/verify-email
git commit -m "feat: require verified email accounts"
```

---

### Task 3: Add forgot-password and reset-password

**Files:**
- Modify: `src/features/auth/auth-options.ts`
- Create: `src/features/auth/password-reset.test.ts`
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/reset-password/page.tsx`
- Create: `src/components/auth/forgot-password-form.tsx`
- Create: `src/components/auth/reset-password-form.tsx`
- Modify: `src/components/auth/auth-form.tsx`

**Interfaces:**
- Uses Better Auth `requestPasswordReset`, `resetPassword`.
- Produces generic reset-request result and one-use reset flow.

- [ ] **Step 1: Write failing reset config test**

```ts
it("revokes sessions when a password reset succeeds", () => {
  const options = buildAuthOptions(testRuntime);
  expect(options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(true);
  expect(options.emailAndPassword?.sendResetPassword).toBeTypeOf("function");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/password-reset.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Configure reset mail/session behavior**

Set `revokeSessionsOnPasswordReset: true` and send localized reset mail.

- [ ] **Step 4: Implement request form**

```ts
await authClient.requestPasswordReset({
  email,
  redirectTo: `${window.location.origin}/reset-password`,
});
```

Always display the same success message.

- [ ] **Step 5: Implement reset form**

```ts
await authClient.resetPassword({ newPassword, token });
```

Missing/invalid/expired token shows controlled localized state. Success redirects to `/login?reset=1`.

- [ ] **Step 6: Run GREEN**

Run:

```sh
npm test -- src/features/auth src/components/auth
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add src/features/auth src/app/forgot-password src/app/reset-password src/components/auth
git commit -m "feat: add password recovery"
```

---

### Task 4: Send invitation emails with fallback link

**Files:**
- Create: `src/features/invitations/invitation-mail.ts`
- Create: `src/features/invitations/invitation-mail.test.ts`
- Modify: `src/app/(app)/app/actions.ts`
- Modify: `src/components/app/workspace-controls.tsx`
- Modify: `src/features/workspace/workspace.ts`

**Interfaces:**
- Produces `sendInvitationNotification(...): Promise<{ sent: boolean }>`.
- Extends `WorkspaceResult` with `emailSent?: boolean`.

- [ ] **Step 1: Write failing SMTP fallback test**

```ts
it("returns the valid invitation token when delivery fails", async () => {
  const result = await deliverInvitation({
    token: "valid-token",
    mailer: { send: vi.fn().mockRejectedValue(new Error("offline")) },
    invitation: fixtureInvitation,
    locale: "de",
  });
  expect(result).toEqual({ invitation: "valid-token", emailSent: false });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/invitations/invitation-mail.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement trusted absolute invitation URL**

Use:

```ts
new URL(`/invite/${token}`, runtime.baseURL).toString()
```

and persisted group/role/expiry data.

- [ ] **Step 4: Integrate action/UI**

Mail failure becomes warning, not invitation deletion. Existing copyable link stays available.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/invitations src/components/app`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/invitations src/app/\(app\)/app/actions.ts src/components/app/workspace-controls.tsx src/features/workspace/workspace.ts
git commit -m "feat: send invitation emails"
```

---

### Task 5: Add Google and Apple social auth with explicit linking

**Files:**
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/lib/runtime-config.ts`
- Modify: `src/features/auth/auth-options.ts`
- Create: `src/features/auth/apple-client-secret.ts`
- Create: `src/features/auth/apple-client-secret.test.ts`
- Create: `src/features/auth/social-auth.test.ts`
- Create: `src/components/auth/social-auth-buttons.tsx`
- Modify: `src/components/auth/auth-form.tsx`

**Interfaces:**
- Produces Google/Apple providers.
- Produces `createAppleClientSecret(config, now): string`.

- [ ] **Step 1: Write failing linking/provider tests**

```ts
it("disables implicit linking while enabling configured providers", () => {
  const options = buildAuthOptions(socialRuntime);
  expect(options.account?.accountLinking?.disableImplicitLinking).toBe(true);
  expect(options.socialProviders?.google).toBeDefined();
  expect(options.socialProviders?.apple).toBeDefined();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/social-auth.test.ts src/features/auth/apple-client-secret.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add provider config**

Google env:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Apple env:

```text
APPLE_CLIENT_ID
APPLE_TEAM_ID
APPLE_KEY_ID
APPLE_PRIVATE_KEY
```

Install `jose` and generate the Apple ES256 client secret server-side.

- [ ] **Step 4: Add sign-in buttons**

```ts
await authClient.signIn.social({
  provider: "google",
  callbackURL: safeNextPath(redirectTo),
});
```

Apple uses `provider: "apple"`.

Handle `account_not_linked` with localized guidance: sign in using the existing method, then link from Security Settings.

- [ ] **Step 5: Run GREEN**

Run:

```sh
npm test -- src/features/auth src/components/auth
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json .env.example src/lib/runtime-config.ts src/features/auth src/components/auth
git commit -m "feat: add Google and Apple authentication"
```

---

### Task 6: Add Passkeys

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_passkeys/migration.sql`
- Modify: `src/features/auth/auth-options.ts`
- Modify: `src/lib/auth-client.ts`
- Create: `src/features/auth/passkeys.test.ts`
- Create: `src/components/app/passkey-controls.tsx`

**Interfaces:**
- Uses Better Auth Passkey plugin.
- Produces add/list/rename/delete/sign-in UI.

- [ ] **Step 1: Write failing plugin/runtime test**

```ts
it("configures production WebAuthn for leihnest.de", () => {
  const options = buildAuthOptions({
    ...testRuntime,
    baseURL: "https://leihnest.de",
  });
  expect(getPasskeyRuntime(options)).toMatchObject({
    rpName: "LeihNest",
    rpID: "leihnest.de",
    origin: "https://leihnest.de",
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/passkeys.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Install and configure plugin**

Run:

```sh
npm install @better-auth/passkey
```

Server uses `passkey(...)`; client uses `passkeyClient()`.

Generate/apply the Better Auth v1.6 passkey schema additively.

- [ ] **Step 4: Implement authenticated Passkey manager**

Use client plugin functions to add/list/update/delete. Login page adds “Mit Passkey anmelden”.

- [ ] **Step 5: Prevent last-route lockout**

Before passkey deletion, count credential/social accounts plus remaining passkeys. Reject removal if no login method would remain.

- [ ] **Step 6: Run GREEN**

Run:

```sh
npm test -- src/features/auth src/components/app/passkey-controls*
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add package.json package-lock.json prisma src/features/auth src/lib/auth-client.ts src/components/app/passkey-controls.tsx
git commit -m "feat: add Passkey authentication"
```

---

### Task 7: Add account linking/unlinking controls

**Files:**
- Create: `src/components/app/connected-accounts.tsx`
- Create: `src/features/auth/account-linking.ts`
- Create: `src/features/auth/account-linking.test.ts`
- Modify: `src/app/(app)/app/settings/page.tsx`

**Interfaces:**
- Uses `authClient.listAccounts()`, `linkSocial()`, `unlinkAccount()`.
- Produces `canRemoveLoginMethod(summary): boolean`.

- [ ] **Step 1: Write failing last-login-path test**

```ts
it("does not allow unlinking the final usable login method", () => {
  expect(canRemoveLoginMethod({
    accounts: [{ providerId: "google" }],
    passkeyCount: 0,
  })).toBe(false);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/account-linking.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement account summary and explicit linking**

Google/Apple buttons in settings call `authClient.linkSocial({ provider, callbackURL })`.

Unlink passes the concrete Better Auth account record `id`, not arbitrary provider-owned identifiers.

- [ ] **Step 4: Implement lockout guard**

Credential account, social accounts, and Passkeys together determine whether a method can be removed.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/auth/account-linking.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/auth/account-linking* src/components/app/connected-accounts.tsx src/app/\(app\)/app/settings/page.tsx
git commit -m "feat: manage linked login methods"
```

---

### Task 8: Add password, email, and session security controls

**Files:**
- Create: `src/components/app/security-controls.tsx`
- Create: `src/features/auth/security-controls.test.ts`
- Modify: `src/features/auth/auth-options.ts`
- Modify: `src/app/(app)/app/settings/page.tsx`

**Interfaces:**
- Uses `changePassword`, `changeEmail`, `listSessions`, `revokeSession`, `revokeOtherSessions`.
- Produces sanitized session view model with no token rendered.

- [ ] **Step 1: Write failing session-sanitization test**

```ts
it("does not expose raw session tokens to the settings view model", () => {
  const view = toSessionView(sessionFixture);
  expect(view).not.toHaveProperty("token");
  expect(view).toMatchObject({
    id: sessionFixture.id,
    userAgent: sessionFixture.userAgent,
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/security-controls.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Enable verified email change**

Configure `user.changeEmail.enabled = true`; do not enable unverified immediate replacement.

- [ ] **Step 4: Implement password/email/session UI**

Password change uses:

```ts
authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: true,
});
```

Email change uses Better Auth `changeEmail` and verification. Sessions show safe metadata and revoke controls.

- [ ] **Step 5: Run GREEN**

Run:

```sh
npm test -- src/features/auth
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/auth src/components/app/security-controls.tsx src/app/\(app\)/app/settings/page.tsx
git commit -m "feat: add account security controls"
```

---

### Task 9: Secure account deletion hook

**Files:**
- Modify: `src/features/auth/auth-options.ts`
- Create: `src/features/auth/account-deletion.ts`
- Create: `src/features/auth/account-deletion.test.ts`
- Create: `src/components/app/delete-account-control.tsx`

**Interfaces:**
- Produces `assertAccountCanBeDeleted(userId): Promise<void>`.
- Uses Better Auth `sendDeleteAccountVerification`.

- [ ] **Step 1: Write failing sole-owner test**

```ts
it("blocks deletion while the user is the sole owner of a group", async () => {
  await expect(assertAccountCanBeDeleted(ownerId))
    .rejects.toMatchObject({ code: "TRANSFER_GROUP_OWNERSHIP_REQUIRED" });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/account-deletion.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement pre-delete checks**

Reject deletion when user owns any group that has not been transferred/deleted. Do not silently cancel Stripe or orphan group ownership.

- [ ] **Step 4: Add verified deletion email**

Configure Better Auth `sendDeleteAccountVerification` with localized mail. Security settings expose delete action with explicit destructive confirmation.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/auth/account-deletion.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/auth src/components/app/delete-account-control.tsx
git commit -m "feat: secure account deletion"
```

---

### Task 10: Add optional TOTP 2FA and recovery codes

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_two_factor/migration.sql`
- Modify: `src/features/auth/auth-options.ts`
- Modify: `src/lib/auth-client.ts`
- Create: `src/components/app/two-factor-controls.tsx`
- Create: `src/features/auth/two-factor.test.ts`

**Interfaces:**
- Uses Better Auth Two-Factor plugin.
- Produces enable/disable TOTP, setup QR, recovery-code display/regeneration, challenge UI.

- [ ] **Step 1: Write failing recovery-code handling test**

```ts
it("shows recovery codes only from the one-time setup response", () => {
  const stored = persistableTwoFactorState(setupResponse);
  expect(stored).not.toHaveProperty("backupCodesPlaintext");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/auth/two-factor.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Configure plugin and additive schema**

Enable TOTP 2FA; keep it optional. Recovery codes are displayed once/regenerated through Better Auth APIs and never logged.

- [ ] **Step 4: Add setup/challenge UI**

Require fresh authentication before enabling/disabling 2FA.

- [ ] **Step 5: Run GREEN**

Run:

```sh
npm test -- src/features/auth
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json prisma src/features/auth src/lib/auth-client.ts src/components/app/two-factor-controls.tsx
git commit -m "feat: add optional two-factor authentication"
```

---

### Task 11: Auth deployment docs and E2E

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `e2e/auth-lifecycle.spec.ts`
- Create: `docs/operations/auth-production.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `compose.portainer.yaml`
- Modify: `docker-compose.portainer.yml`

**Interfaces:**
- Produces browser auth regression coverage and production config checklist.

- [ ] **Step 1: Add Playwright and failing lifecycle test**

Test at minimum: registration → verification fixture → login → reset-password → linked-provider UI → Passkey UI → session revoke.

Run initially:

```sh
npx playwright test e2e/auth-lifecycle.spec.ts
```

Expected: FAIL until complete flow is wired.

- [ ] **Step 2: Add Portainer variable pass-through**

Both compose files remain byte-identical and pass through SMTP/Google/Apple config without default secrets.

- [ ] **Step 3: Document external provider setup**

Document exact callbacks:

```
https://leihnest.de/api/auth/callback/google
https://leihnest.de/api/auth/callback/apple
```

and Passkey RP/origin.

- [ ] **Step 4: Run full auth gate**

Run:

```sh
npm test
npm run lint
npm run typecheck
npm run build
npx playwright test e2e/auth-lifecycle.spec.ts
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
```

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add package.json package-lock.json playwright.config.ts e2e docs/operations/auth-production.md .github/workflows/ci.yml compose.portainer.yaml docker-compose.portainer.yml
git commit -m "test: verify complete account lifecycle"
```
