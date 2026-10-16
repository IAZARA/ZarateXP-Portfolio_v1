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
- Success criterion: Accept is fully visible on opening at 1440×900, 390×844 and 844×390; keyboard dismissal and reopening pass twice, alongside existing close/cancel/retry/restore tests and desktop/mobile smoke. External submissions remain blocked and EmailJS mocked.
- Verification uses CI because local Chromium cannot launch (`socket() failed: Operation not permitted`). Static checks pass locally. Exact-head CI and independent review required before integration; Pages and public asset parity required afterward. See [PR #3](https://github.com/IAZARA/ZarateXP-Portfolio_v1/pull/3).

## Backlog

- Information/address-book dialog clipping: reproduced and corrected in PR #3; awaiting final CI/review/publication verification. Other contact dialog layouts remain a separate, low-priority reproduction task.
- Next audit: short-viewport dialog usability and visible keyboard focus in app content. Preserve the XP aesthetic and validate interrupted/repeated flows.
