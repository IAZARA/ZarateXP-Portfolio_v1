# Portfolio maintenance

## 2026-10-13: Keyboard window activation

- Baseline: main `a1dc2dafa7cdc98c48d41242b35abf334f53ffaf`; no open pull requests before this batch. Pages deployment succeeded for this commit. Public `js/windows.js` matched the repository bytes.
- Reproduction: regression-only commit `9c3b9d678887c67d5514781815acec5f1495c023`, [CI run](https://github.com/IAZARA/ZarateXP-Portfolio_v1/actions/runs/38400337836). In both 1440×900 and 390×844 viewports, keyboard focus was in the first window while the second remained active and the first taskbar button exposed `aria-pressed="false"`. Both new tests failed for that reason; all nine existing regressions passed.
- Change: synchronize window stacking, active styling and taskbar state when focus enters a background window. Keep the focused control unchanged; ignore closing/minimized windows. No layout, professional content, dependencies or app features changed.
- Success criterion: both viewport regressions pass through focus switching, Tab, keyboard minimize, restore, close and reopen; existing contact/window tests and full static/browser smoke suites remain green. EmailJS stays mocked and external submissions blocked.
- Validation: local static checks pass. Local Chromium cannot launch because this environment denies its socket operation; browser verification uses GitHub Actions. The PR check is associated with the candidate head SHA; verify its synthetic merge tree matches that head tree and main remains unchanged before merging. Review and final green CI are required before merge; deployment verification follows merge. See [PR #2](https://github.com/IAZARA/ZarateXP-Portfolio_v1/pull/2) for current status and evidence.

## Backlog

- Reproduce low-priority contact dialog height clipping on short viewports before changing it. The Accept action was previously reachable by scrolling. No change in this batch.
- Next audit: short-viewport dialog usability and visible keyboard focus in app content. Preserve the XP aesthetic and validate interrupted/repeated flows.
