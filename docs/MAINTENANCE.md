# Portfolio maintenance

## 2026-10-13: Keyboard window activation

- Baseline: main `a1dc2dafa7cdc98c48d41242b35abf334f53ffaf`; no open pull requests before this batch. Pages deployment succeeded for this commit. Public `js/windows.js` matched the repository bytes.
- Reproduction: regression-only commit `9c3b9d678887c67d5514781815acec5f1495c023`, [CI run](https://github.com/IAZARA/ZarateXP-Portfolio_v1/actions/runs/38400337836). In both 1440×900 and 390×844 viewports, keyboard focus was in the first window while the second remained active and the first taskbar button exposed `aria-pressed="false"`. Both new tests failed for that reason; all nine existing regressions passed.
- Change: synchronize window stacking, active styling and taskbar state when focus enters a background window. Keep the focused control unchanged; ignore closing/minimized windows. No layout, professional content, dependencies or app features changed.
- Success criterion: both viewport regressions pass through focus switching, Tab, keyboard minimize, restore, close and reopen; existing contact/window tests and full static/browser smoke suites remain green. EmailJS stays mocked and external submissions blocked.
- Validation: local static checks pass. Local Chromium cannot launch because this environment denies its socket operation; browser verification uses GitHub Actions. The PR check is associated with the candidate head SHA; verify its synthetic merge tree matches that head tree and main remains unchanged before merging. Review and final green CI are required before merge; deployment verification follows merge. See [PR #2](https://github.com/IAZARA/ZarateXP-Portfolio_v1/pull/2) for current status and evidence.

## 2026-10-16: Information dialog action visibility

- Baseline: main `02fb45ee240dd09b2555ef132080de1e6c938b6c`; no open PRs; Pages successful and public `js/apps.js` byte-identical. PR #2's keyboard fix remains intact.
- Reproduced in [baseline CI](https://github.com/IAZARA/ZarateXP-Portfolio_v1/actions/runs/38903371174), head `263d1a166691be8c29fbfe218df2d9942f21ad68`: Accept extended 19.78 px below the information dialog body on desktop/landscape and 22.78 px on mobile portrait. All 11 existing regressions passed; the three new visibility cases failed as expected.
- Bounded correction: raise this information dialog's preferred height from 150 to 210 px. Existing viewport clamping and body scrolling remain; no global window geometry, content, assets or dependencies changed.
- Full-suite finding: candidate CI run `38903659542` passed all 14 contact/window cases, then exposed an existing Winamp mobile transport overflow (335 px needed inside 316 px). The unchanged baseline CSS fixed seven controls in one row. Allow wrapping in the existing compact mobile media rules, preserving 44 px touch targets. The existing full smoke assertion checks overflow and target dimensions.
- Success criterion: Accept is fully visible on opening at 1440×900, 390×844 and 844×390; keyboard dismissal and reopening pass twice, alongside existing close/cancel/retry/restore tests and desktop/mobile smoke. External submissions remain blocked and EmailJS mocked.
- Verification uses CI because local Chromium cannot launch (`socket() failed: Operation not permitted`). Static checks pass locally. Independent code review found no blocking defects in the final functional diff; exact-head CI is required before integration; Pages and public asset parity required afterward. See [PR #3](https://github.com/IAZARA/ZarateXP-Portfolio_v1/pull/3).

## 2026-10-20: Contact feedback action visibility

- Baseline: main `5c78e5964c70ad65a3599d0ccd5888eb50dc1e6f`; no open PRs or in-flight runs. Pages run `39415996782` succeeded for that SHA. The cloud checkout matches every remote blob hash. Static checks pass.
- Reproduction: regression-only head `8eb2e389855166d93af9716ae671ee52a6809c3e`, [baseline CI](https://github.com/IAZARA/ZarateXP-Portfolio_v1/actions/runs/39426760326). All 14 existing cases pass; 10 of 12 new cases fail because validation, confirmation and error actions are clipped (up to 23.19 px), as is the mail-client fallback action on portrait mobile (1.56 px).
- Bounded correction: increase only the four feedback dialogs' preferred heights (validation 210 px; confirmation, error and fallback 260 px). Preserve existing viewport clamping, body scrolling, keyboard close behavior, XP styling and all content. No dependencies, services or permissions changed.
- Success criterion: all feedback actions are initially visible at 1440×900, 390×844 and 844×390, with repeated keyboard dismissal/reopening; contact retry/interruption and all static/browser smoke checks remain green. EmailJS and mail clients are mocked; external submissions are blocked.
- Local Chromium remains socket-restricted, so browser evidence comes from CI. Final independent review, exact-head green CI, merge/Pages SHA checks and public verification are required; see [PR #4](https://github.com/IAZARA/ZarateXP-Portfolio_v1/pull/4) for final evidence.

## Backlog

- Information dialog and Winamp compact controls: published in PR #3 (`00ba042f70feb725bbe5e9a549fdba61706d4fa9`); verified present in the current baseline and its successful Pages deployment.
- Contact feedback actions: reproduced and corrected in PR #4; final CI/review/publication gate recorded on the PR.
- Next rotation: visible keyboard focus in app content and long/dynamic error text. Keep contact sends mocked and check critical journeys on every run.
