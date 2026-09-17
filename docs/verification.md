# Verification and release boundary

## Redesign evidence - 17 September 2026

- Baseline before redesign: 60 pytest tests passed.
- Red phase: all 8 new design-contract tests failed on the old UI as expected.
- Final functional suite: 68 tests passed, including the new design contracts.
- Python compilation and git whitespace checks passed.
- Offline Chromium render suite: 30 real-application page/viewport combinations
  at 1440px and 390px, German and English. No horizontal page overflow or JavaScript
  exceptions; exactly one H1 per page. Mobile menu open/Escape-close checked.
- Start page, workspace and mobile screenshots visually inspected.
- Full lending lifecycle, image privacy, concurrent stock reservations, partial
  and complete returns remain covered by the original HTTP/domain tests.

## Limitations

The managed Chromium denies URL navigation with ERR_BLOCKED_BY_ADMINISTRATOR.
Its policy was not changed. Visual tests embed the actual ASGI application's
returned HTML and local styles with set_content. They are layout/interaction
checks, not real browser network navigation.

The full browser lifecycle and non-root Docker/health checks are defined in
GitHub Actions, but must be verified on the remote runner. Docker is not installed
in this authoring environment. No SMTP transmission or deployment was attempted.
No independent reviewer/subagent was available; this is not an external audit.

## Public launch gates

Review CI results, deploy persistent storage and HTTPS, verify backup/restore,
configure and test SMTP, supply actual operator legal information, and implement
an account retention/deletion process before public registration. Real billing
must be implemented before collecting subscription fees.

This is a closed-pilot source release, not a claim of production readiness.
No DNS records, hosting credentials, customer data or billing settings were changed.
