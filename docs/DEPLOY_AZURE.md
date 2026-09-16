# Publishing fifooincorporated.com on Azure

Prepared September 15, 2026. Source references are in `SOURCES.md`.

## What this does—and does not do

This is a new corporate website, independent of your Fifoo backend and admin app. It does not change those deployments, create email accounts, or change DNS by itself. The package has not been uploaded to your Azure account or GitHub.

Use a dedicated Azure Static Web App. The provided workflow builds the pages before deployment and uploads only `site/`, following Microsoft's prebuilt-content configuration. [S2] You do not need a database, container image, app API, or server credentials for this site.

## 1. Complete and review the local website

Read the root README. Enter the real legal/contact details, review the privacy notice, and test the mailbox and phone. Then run:

```bash
npm test
npm run build:production
npm run preview
```

Inspect every page. Do not proceed if any preview banner, draft notice, or bracketed corporate placeholder remains. Do not set review flags merely to bypass the checks.

## 2. Put the source in its own repository

Create a dedicated repository, for example `fifoo-corporate-website`, under an appropriate organization or company-controlled account. Add this project’s source files. The included `.gitignore` omits generated `site/`, test outputs, local environment files, and preview screenshots. Keep `src/assets/social-card.png` committed because it is a website asset.

The website source has no secrets. Private credentials must not be pasted into source, JSON settings, HTML, or browser JavaScript.

## 3. Create the Azure resource

In Azure Portal, create a **Static Web App**, with an appropriate subscription, resource group, name such as `fifoo-corporate`, and service plan. Review Azure’s current pricing and plan terms before committing; no price or availability guarantee is included here.

Under Deployment details, select **Other** as the source. After creation, use **Overview → Manage deployment token**. This route lets you use the included workflow rather than generating a competing workflow. [S3]

Copy the deployment token directly into the repository’s **Settings → Secrets and variables → Actions** as a secret named:

```text
AZURE_STATIC_WEB_APPS_API_TOKEN
```

That secret name matches the included workflow. It must hold this new Static Web App’s deployment token, not an App Service publish profile, registry password, Apple credential, or a token for your existing backend. GitHub and Microsoft document this deployment-secret arrangement. [S4, S5]

Do not send the token in chat or put its value in the YAML file. Reset the token if it is exposed, then replace the stored secret. [S5]

## 4. Enable the workflow and publish

From the project root:

```bash
mkdir -p .github/workflows
cp deploy/azure-static-web-apps.yml .github/workflows/azure-static-web-apps.yml
```

Commit and push to `main`. In GitHub, select **Actions → Publish Fifoo corporate website → Run workflow**, selecting `main`. The template is intentionally manual; normal commits do not automatically deploy.

The workflow runs the fixture tests, performs the production build, checks for the named secret, and uploads the `site/` directory. It uses `skip_app_build: true` and an empty `output_location`, so Azure does not try to rebuild that already generated folder. [S2]

The template uses the official checkout/setup-node actions and Azure’s deployment action. Review and pin action revisions according to your organization’s security policy. This workflow has not been executed against your repository or Azure subscription. [S4, S8, S9]

## 5. Check the Azure-provided address

Open the generated address shown on the Static Web App Overview page. Verify all pages, mobile navigation, and actual contact actions. The generated and added custom domains receive managed SSL/TLS certificates from Azure Static Web Apps. [S6]

Do not announce the custom domain until it resolves to this tested build over HTTPS. Account verification does not require the Fifoo mobile app to have launched, but your corporate website should not imply the app is downloadable when it is not.

## 6. Connect www.fifooincorporated.com

In the Static Web App, use **Settings → Custom domains → Add**. For externally managed DNS, choose the external/other-DNS option. Use the exact generated hostname Azure provides—not a guessed IP address or an existing backend hostname. [S6]

The typical record is:

```text
Type:   CNAME
Host:   www
Target: <the actual generated Azure Static Web App hostname>
```

The target is a hostname only, not `https://...` and not a path. Follow the portal’s validation instructions. Do not remove unrelated email or service records. [S6]

## 7. Connect the root domain, fifooincorporated.com

The root/apex needs its own configuration. Azure documents ALIAS/ANAME/CNAME-flattening arrangements, depending on the DNS provider. Where supported, point the root to the actual Static Web App hostname and complete Azure’s domain validation. [S7]

Azure also documents an A-record option using the actual `stableInboundIP` value from the resource, plus ownership verification. Do not invent an IP or reuse one from another Azure application. Providers differ, so the exact DNS changes should be chosen after identifying where this domain’s DNS is hosted. [S10]

Register both the root and `www` names with Azure so HTTPS works on both. This project uses the root domain as the canonical address. Verify any default-domain/redirect settings in Azure or your DNS/hosting provider and avoid redirect loops.

Before changing nameservers, export the current DNS zone and plan how every existing mail and service record will be preserved. A domain registered with one company may use DNS hosted somewhere else; identify the authoritative DNS provider before editing records.

## 8. Set up email separately

A label or link in a website does not create an inbox. Create the actual corporate mailbox or correctly configured alias with your email provider. Suggested public address: `contact@fifooincorporated.com`. This is a naming suggestion, not an existing mailbox.

Use your provider’s exact domain-verification, mail-routing, and sender-authentication instructions. Test receipt from an outside account, send a reply, and check the displayed sender. Then enter the working address in `site.config.json` and rebuild.

Keep access to the domain registrar, DNS, email admin, Azure, and GitHub under appropriate corporate control. Do not make changes to the Fifoo API domain while connecting this separate corporate site.

## 9. Final verification before Apple/Google enrollment

Confirm the public homepage identifies what the company does, the product page is accurate, contact methods actually work, and the legal name matches your corporate/D&B records. Apple’s organization enrollment requirements include a functioning public website associated with the organization and an organization-domain work email. [S1]

The website’s privacy notice must reflect the deployed site and its actual providers. The mobile app needs its own separately reviewed policies and store disclosures; do not use this narrow corporate-site draft as the app’s privacy policy.

No production hosting, DNS, certificate, mailbox, app-store account, or enrollment approval has been verified as part of this code package.
