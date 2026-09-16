# Fifoo corporate website

**Version 1.0.0 · Prepared September 15, 2026**  
Corporate domain: `fifooincorporated.com`

A small, professional corporate website for the company developing Fifoo. The design uses warm off-white, forest green, an original route-inspired brand mark, and an illustrative day map. It explains the company and product without invented testimonials, metrics, credentials, or store-approval claims.

**This package is a local preview, not a deployed website.** “Fifoo Incorporated” is a provisional display name; the exact registered corporation name has not been confirmed. The corporate details are visibly labeled placeholders. No mailbox, phone service, domain record, hosting resource, or developer account has been created.

## See the site immediately

Unzip the package. Open `site/index.html` in your browser. The five pages and their assets are already built and included. A local web server is preferable when checking browser clipboard behavior and HTTP headers.

With Node.js 22 or later installed:

```bash
cd fifoo-corporate-website
npm run preview
```

Open the local address printed in Terminal, normally `http://127.0.0.1:4173`. Press Control-C to stop. No `npm install` is needed: the website, builder, local server, and core tests use no third-party npm packages.

## What is included

| Page | Purpose |
|---|---|
| `index.html` | Company overview, product introduction, approach, and contact links. |
| `fifoo.html` | Fifoo’s daily journey, stops, paths, progress concept, and development status. |
| `contact.html` | Corporate legal/contact information, email topics, telephone link, and FAQ. |
| `privacy.html` | A clearly marked draft notice for this corporate website only. |
| `404.html` | A helpful missing-page screen. |

The illustration is labeled as an illustrative schedule, not a screenshot of the app. The product is described as in development. No store download buttons appear until you supply their actual URLs.

## Edit your details in one place

Open **`site.config.json`** in a text editor. Replace the bracketed values, keeping valid JSON: quoted strings, commas between entries, and no comments. You do not need to edit each page separately.

| Setting | What to enter |
|---|---|
| `displayName` | Approved public corporate display name. Currently provisional. |
| `legalName` | Exact registered legal corporation name, including suffix. |
| `domain` | Already set to `fifooincorporated.com`; no protocol or trailing slash. |
| `company.jurisdiction` | Actual state/province and country of incorporation. |
| `contact.email` | A working business email on the corporate domain. For example, `contact@fifooincorporated.com` **only after you create and test it**. |
| `contact.phoneDisplay` | The business telephone number as visitors should see it. |
| `contact.phoneE164` | The same number as `+` followed by country code and digits, without spaces. |
| `contact.addressLines` | A genuine public business mailing address. This is public, not a private application field. |
| `product.status` | Current accurate status. Review the page copy when the app launches. |
| `product.websiteUrl` | Optional actual product-site HTTPS URL. Leave blank until ready. |
| `product.iosUrl`, `product.androidUrl` | Optional real store URLs. Leave blank before availability. |
| `privacy.*` | Actual providers, retention practices, and effective date after review. |

**Do not put passwords, private keys, API tokens, an EIN, personal identity documents, or developer-account credentials in this file.** The populated contact and company fields are intended to be public. No website login credentials are required by this static site.

To change wording, edit the HTML templates in `src/pages/`. To change navigation, branding text, or footer wording, edit `src/partials/`. The temporary graphic brand mark is `src/assets/favicon.svg`. Colors and spacing are in `src/assets/styles.css`. A static social-sharing graphic is in `src/assets/social-card.png`; update that graphic separately if the branding changes.

After edits:

```bash
npm run build
npm run preview
```

`build` intentionally keeps the preview label and noindex settings. Refresh the browser after rebuilding. Changes made directly to `site/` will be overwritten by the next build.

## How contacting the company works

When a real email is configured, the Contact page enables General inquiries, Partnerships, Product questions, and Privacy questions. All four use the same mailbox, with different subject lines. They open the visitor’s email application; **they do not send anything automatically**. A copy-address button appears when the browser provides a clipboard API and reports success only after a successful copy. Otherwise the visible address can be copied manually. A valid telephone configuration creates a click-to-call link.

The preview deliberately leaves unconfigured contact topics inactive. There is no backend form, “message sent” simulation, account collection, analytics script, tracking pixel, remote font, or external media embed. The hosting and email services you eventually choose may separately process connection information and business correspondence.

## Prepare the public version

1. Complete the corporate fields and create/test the real mailbox and phone number.
2. Review and finish `src/pages/privacy.html` and the `privacy` settings. This is not the mobile app privacy policy and is not a determination of legal compliance.
3. In `launch`, set `companyDetailsConfirmed`, `contactMethodsTested`, and `privacyReviewed` to `true` only after those steps are complete. Set `allowIndexing` to `true` when you want the public website indexed.
4. Run:

```bash
npm test
npm run build:production
```

The production build refuses to proceed while required fields are blank, marked as placeholders, or missing review confirmations. It also checks email/URL/phone formats. **It cannot verify whether your business records are authentic, a mailbox receives mail, or a privacy statement is legally sufficient.** Those are manual checks.

A successful production build removes the preview banner and draft notice. It enables indexing only if requested. The generated `site/` folder is the only folder to publish. Core tests build isolated fixtures under `.test-output/`; running tests does not replace your generated public site.

## Publish

See **`docs/DEPLOY_AZURE.md`** for the recommended Azure Static Web Apps route and custom-domain instructions. This site is separate from the Fifoo API and admin services; it has no dependency on their credentials, databases, or container deployments.

The deployment workflow is stored as an **inactive template** in `deploy/azure-static-web-apps.yml`. Copy it into `.github/workflows/` only after the instructions are complete. It is manually triggered and includes the production checks.

Apple currently requires an organization website that is publicly available, functional, and associated with the organization’s domain; a work email on that domain is also required for organization enrollment. This design supplies substantive company/product/contact content, but placeholders must be replaced and the site must be published. This package does not guarantee Apple or Google approval. [S1]

## Checks and limits

Core checks: `npm test` — 12 tests.  
Optional browser checks: `python tests/browser_smoke.py` — requires Python, Playwright, and a Chromium installation. Run the core tests first to create the synthetic production fixture.

The browser harness embeds the local assets in a Chromium document. It checks page layout, navigation, disclosures, no-JavaScript behavior, reduced motion, and contact markup. It does not test a public domain or native Safari/iOS/Android browsers. See `docs/TEST_REPORT.md` for the exact completed checks and remaining launch tests.

## Folder guide

```text
site.config.json           Edit your corporate information here
src/pages/                 Editable page content
src/partials/              Shared header, footer, illustrative map
src/assets/                CSS, JS, favicon, sharing image
scripts/                   Dependency-free build and local preview server
site/                      Generated five-page preview; publish after production build
previews/                  Desktop/mobile design screenshots
tests/                     Build/structure and optional browser checks
deploy/                    Inactive Azure workflow template
docs/                      Deployment guide, checklist, test report, source references
```

Source references: `docs/SOURCES.md`.
# fifoo-corporate-website
