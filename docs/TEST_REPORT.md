# Validation report — version 1.0.0

Date: September 15, 2026. Environment: Linux, Node.js 22.16.0, Chromium via Playwright.

## Completed: 12 core build/structure tests

Preview generation; five semantic pages with one main heading each; resolved template variables; noindex/draft safeguards; inactive placeholder contact actions; local asset/link/anchor integrity; production-build rejection of incomplete details; successful production build using clearly synthetic test data; corporate-domain email validation; HTML escaping; rejection of non-HTTPS product URLs; security-header configuration; absence of client tracking, storage, remote scripts, and credential values in the page code.

The tests are reproducible with `npm test`. They use isolated fixture files under `.test-output/` and do not overwrite the website’s real configuration or `site/` output.

## Completed: 38 browser checks

Thirty page-layout checks: each of the five pages at widths 320, 390, 720, 768, 1024, and 1440 CSS pixels. All remained within the viewport horizontally and retained a visible main region and a single first-level heading.

Eight additional checks: mobile menu opening/Escape closing/focus return; navigation after desktop resize; FAQ opening and closing; usable navigation/content without JavaScript; reduced-motion behavior; production-fixture email and telephone links without the preview banner; clipboard success and honest failure states with a mocked clipboard API; no uncaught page JavaScript errors.

Rendered desktop-home, mobile-home, and desktop-contact screenshots were inspected. Screenshots are in `previews/`.

The browser harness loads generated HTML with the same CSS/JS/assets embedded in an in-memory Chromium document. Network navigation was blocked by the testing environment’s browser policy, so these are DOM/layout/interaction tests, not an end-to-end hosted-site test. Clipboard behavior was simulated; actual email sending was not attempted.

## Not completed / owner launch checks

No upload to Azure or GitHub; no GitHub Actions deployment execution; no custom DNS, domain ownership, HTTPS certificate, or live-server-header verification; no real mailbox or phone verification; no Apple/Google enrollment verification; no native Safari, iOS device, Android device, Firefox, or assistive-technology audit; no legal/privacy-policy certification.

The prepared `staticwebapp.config.json` includes security headers and a custom 404 rewrite, but their behavior must be verified on the actual host. The core static pages do not rely on those headers to render correctly.
