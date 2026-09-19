# LeihNest: only the homepage, aligned to the supplied reference

## Scope
Public homepage `/` and `/en` only. The last instruction explicitly excludes login and dashboard changes.
Base used for verification: main 65462ab5a98c3d3e0702bdeff0eb67e0dddb43fe.
Deployment stays on main. No deployment or GitHub write was performed in this correction.

## Visual source
The authoritative reference is the supplied `image-gen-1(6).png` (1448 x 1086).
The homepage now uses that landing scene, not the login photograph or an invented large chalkboard.
The six product motifs are extracted concept illustrations from the same reference. They are NOT represented as real product photographs.
Scenic assets exclude the original embedded interface, headline and header controls. The current interface, text, links, filters and calendar are rendered as HTML/React.
No font files or third-party image services are included. Browser typography uses the declared local font stack; no claim of universal pixel identity is made.

## Preserved
Login, registration, dashboard, workspace routes, server actions, authentication, global CSS, privacy, legal notice, database schema/migrations, dependencies and deployment configuration are unchanged.
Only four existing source files are replaced: the DE/EN homepage routes and their two homepage regression-test files.
The new CSS is scoped to `lh-home` / `lh-*`. It does not import the prior shared design stylesheet.
No fabricated adoption statistics or CO2 metrics were introduced. Public copy describes supported functionality.

## Verification
83 tests pass in 26 files, including five integration tests against an isolated in-memory PGlite test database. No skipped tests.
Lint, TypeScript and the normal Next.js production build pass.
Eight DE/EN viewport checks render the emitted production HTML/CSS offline: 1448, 1024, 768, 390 px. No broken images or horizontal overflow.
Seven isolated browser interaction checks pass, including filters, search and a six-week calendar month.
At 1448 px the measured reference positions are checked: preview x=737/y=112, audiences y=576, features y=649, how-it-works y=868.
Fourteen explicitly protected original files are byte-identical. All other original files outside the four replacements also compare identical.
The mobile decorative-lettering overlap was reproduced by a failing browser assertion, fixed with scoped CSS specificity, and rechecked successfully.
Review: author self-review, not independent review.

## Limitations
Browser HTTP navigation to localhost is blocked in this environment (ERR_BLOCKED_BY_ADMINISTRATOR). It was not retried via another address.
Screenshots are offline renders of the generated production HTML and emitted CSS, not live-site screenshots.
Interaction tests mount the actual homepage component but replace Next Link with a plain anchor. No authenticated live acceptance test or deployment was performed.

## Upload
Extract this ZIP. In a review branch, upload the included src/, public/ and docs/ directories at the repository root, preserving paths.
Do not delete existing directories, legal pages, accounts, secrets or volumes.
This package can be applied independently to the verified main baseline. It does not require uploading the previous three-page design package.
If that earlier package is also applied, apply this homepage correction AFTER it; otherwise its older homepage routes would replace the corrected ones.
Review the diff and green GitHub checks before merging into main. Portainer remains configured to main.
