# LeihNest visual identity - September 2026

The user requested a standalone design rather than a NavoPass/MaengelFix-like
sidebar dashboard, plus delivery to acciento89-bot/leihnest.

## Implemented

- Warm paper surfaces, forest-green ink, lime and terracotta accents.
- Editorial serif headings with system-sans interface text. No downloadable fonts.
- Original nest mark and local SVG still-life/category illustrations.
- Horizontal workspace navigation with current-page semantics; mobile dropdown.
- Shared-desk dashboard with a semantic stock ledger, upcoming loans and activity.
- Open catalogue layout rather than repetitive white rounded cards.
- Restyled authentication, inventory, item forms/details, calendar, members,
  settings, empty/error/legal screens and group selection.
- German/English copy. Missing item photographs are explicitly marked.

Routes, group isolation, storage and the lending lifecycle are unchanged.
Illustrations are decorative category imagery, not photographs of user inventory.

## Verification

New navigation, headline, placeholder and stock-ledger tests failed on the old
implementation first, then passed on the new one. The full suite has 68 tests.
See verification.md for fresh local evidence and deployment limitations.
