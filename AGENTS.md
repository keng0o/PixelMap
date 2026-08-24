# Deployment

- Deploy this project to GitHub Pages by pushing the validated site to `origin/main`.
- Do not deploy to OpenAI Sites unless the user explicitly changes the deployment target.
- After pushing, wait for the GitHub Pages build and verify the published URL.
- Unless the user explicitly says not to deploy, every requested project change is incomplete until its validated commit is pushed to `origin/main`, the GitHub Pages build succeeds, and the affected published page is verified.
- Do not stop at local validation or report a change as complete while deployment or published-page verification remains outstanding.

# Change scope

- Apply ordinary map change requests only to the standalone test page at `variants/map-02-refined.html`.
- Keep the production one-map, four-map, and two-map pages unchanged unless the user explicitly says `全てに反映`.
- When the test and production pages share implementation code, guard test-only behavior with standalone test-mode conditions.

# Test page change log

- Any change to `variants/map-02-refined.html` or standalone test-only behavior in shared code must update `log.html` in the same change.
- Add change-log entries newest first and include the JST date, change summary, affected mode, production impact, and verification performed.
- For ordinary changes, explicitly record `testのみ`. When the user says `全てに反映`, list every production page that received the change.
- A test-page change is incomplete until its `log.html` entry and, when applicable, the current-differences table are updated.

# Visual verification

- After every visual map fix, capture a screenshot of the corrected state before considering the change complete.
- After capturing the screenshot, delegate an independent visual review to a sub-agent and give it the screenshot plus the original user-reported problem.
- If the sub-agent finds the problem unresolved or identifies a new visual regression, continue fixing, capture a new screenshot, and repeat the sub-agent review.
- Do not deploy or report completion until the latest screenshot passes the sub-agent review.
