import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const production = process.argv.includes('--production');
const option = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const out = path.resolve(root, option('out', 'site'));
if (out !== path.join(root, 'site') && !out.startsWith(path.join(root, '.test-output') + path.sep)) {
  throw new Error('Output must be site/ or a directory below .test-output/. Source directories cannot be overwritten.');
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const unfinished = value => typeof value !== 'string' || !value.trim() || /\[[^\]]+\]|\b(?:TODO|REPLACE_ME)\b/i.test(value);
const emailOK = value => typeof value === 'string' && /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}$/i.test(value) && !/[\r\n]/.test(value);
const phoneOK = value => /^\+[1-9]\d{7,14}$/.test(value ?? '');
const URLok = value => {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
};
const read = file => fs.readFile(path.join(root, file), 'utf8');

try {
  const configPath = path.resolve(root, option('config', 'site.config.json'));
  const c = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const errors = [];
  for (const section of ['company','contact','product','privacy','launch']) {
    if (!c[section] || typeof c[section] !== 'object') errors.push(`Missing section: ${section}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(c.domain ?? '')) errors.push('domain must be a hostname only, such as fifooincorporated.com.');
  if (unfinished(c.displayName)) errors.push('displayName is required.');
  if (!Array.isArray(c.contact.addressLines) || !c.contact.addressLines.length || c.contact.addressLines.some(v => typeof v !== 'string')) errors.push('contact.addressLines must be a non-empty array of strings.');
  if (!unfinished(c.contact.email) && !emailOK(c.contact.email)) errors.push('contact.email must be a valid email or a labeled placeholder.');
  if (c.contact.phoneE164 && !phoneOK(c.contact.phoneE164)) errors.push('contact.phoneE164 must use a + and country code, for example +12025550123.');
  for (const key of ['websiteUrl','iosUrl','androidUrl']) {
    if (c.product[key] && !URLok(c.product[key])) errors.push(`product.${key} must be blank or a full HTTPS URL.`);
  }
  if (unfinished(c.product.status)) errors.push('product.status is required.');
  if (production) {
    const required = {
      legalName:c.legalName,
      'company.jurisdiction':c.company.jurisdiction,
      'contact.email':c.contact.email,
      'contact.phoneDisplay':c.contact.phoneDisplay,
      'privacy.effectiveDate':c.privacy.effectiveDate,
      'privacy.hostingProvider':c.privacy.hostingProvider,
      'privacy.emailProvider':c.privacy.emailProvider,
      'privacy.hostingLogRetention':c.privacy.hostingLogRetention,
      'privacy.correspondenceRetention':c.privacy.correspondenceRetention
    };
    for (const [name,value] of Object.entries(required)) if (unfinished(value)) errors.push(`Replace placeholder: ${name}`);
    if (Array.isArray(c.contact.addressLines) && c.contact.addressLines.some(unfinished)) errors.push('Replace all contact.addressLines placeholders.');
    if (!phoneOK(c.contact.phoneE164)) errors.push('Set contact.phoneE164 for the telephone link.');
    if (emailOK(c.contact.email) && c.contact.email.split('@')[1].toLowerCase() !== c.domain.toLowerCase()) errors.push('Use a working email on the corporate domain for this enrollment-oriented site.');
    for (const key of ['companyDetailsConfirmed','contactMethodsTested','privacyReviewed']) if (c.launch[key] !== true) errors.push(`Set launch.${key} to true only after completing that review.`);
  }
  if (errors.length) throw new Error(`${production ? 'Production' : 'Preview'} build blocked:\n- ${errors.join('\n- ')}`);
  const ready = production;
  const emailReady = emailOK(c.contact.email);
  const phoneReady = phoneOK(c.contact.phoneE164) && !unfinished(c.contact.phoneDisplay);
  const field = value => unfinished(value) ? `<span class="placeholder">${escape(value)}</span>` : escape(value);
  const mail = subject => `mailto:${escape(c.contact.email)}?subject=${escape(encodeURIComponent(subject))}`;
  const emailHTML = className => emailReady
    ? `<a class="${className}" href="${mail('Fifoo — company inquiry')}">${escape(c.contact.email)}</a>`
    : `<span class="${className} placeholder">${escape(c.contact.email)}</span>`;
  const topic = (label,subject) => emailReady
    ? `<a class="topic-link" href="${mail(subject)}"><span>${label}</span><span aria-hidden="true">↗</span></a>`
    : `<span class="topic-link" aria-disabled="true" title="Configure a working email address before publishing"><span>${label}</span><span aria-hidden="true">—</span></span>`;
  const icon = paths => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const icons = {
    ICON_MEAL:icon('<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M18 3c-3 2-4 5-4 9h4m0-9v18"/>'),
    ICON_WALK:icon('<circle cx="13" cy="4" r="2"/><path d="m7 13 3-4 4 1 3 4 3 1M14 10l-2 6-5 5m5-5 4 5M10 9l-3 1-2 4"/>'),
    ICON_MOON:icon('<path d="M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10Z"/>'),
    ICON_CHECK:icon('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/>'),
    ICON_ROUTE:icon('<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h10a3 3 0 0 1 0 6H7a4 4 0 0 0 0 8h10"/>'),
    ICON_ARROW:icon('<path d="M5 19 19 5M5 5h14v14"/>'),
    ICON_REFRESH:icon('<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M18 18A8 8 0 0 1 5 15"/>')
  };
  const links = [
    ['websiteUrl','Visit the Fifoo product website'],
    ['iosUrl','Fifoo on the App Store'],
    ['androidUrl','Fifoo on Google Play']
  ].filter(([key]) => c.product[key]).map(([key,label]) => `<a href="${escape(c.product[key])}" rel="external">${label} <span aria-hidden="true">↗</span></a>`).join('');
  const hasStores = Boolean(c.product.iosUrl || c.product.androidUrl);
  const tokens = {
    ...icons,
    DISPLAY_NAME:escape(c.displayName),
    LEGAL_NAME:field(c.legalName),
    COPYRIGHT_NAME:ready ? escape(c.legalName) : `${escape(c.displayName)} · Legal name to be confirmed`,
    YEAR:String(new Date().getFullYear()),
    DOMAIN:escape(c.domain),
    PRODUCT_STATUS:escape(c.product.status),
    JURISDICTION:field(c.company.jurisdiction),
    ADDRESS:c.contact.addressLines.map(field).join('<br>'),
    CONTACT_EMAIL_INLINE:emailHTML(''),
    CONTACT_EMAIL_LARGE:emailHTML('contact-email-value'),
    CONTACT_PHONE:phoneReady ? `<a href="tel:${escape(c.contact.phoneE164)}">${escape(c.contact.phoneDisplay)}</a>` : field(c.contact.phoneDisplay),
    COPY_EMAIL_BUTTON:emailReady ? `<button type="button" class="copy-button" data-copy-email="${escape(c.contact.email)}" hidden>Copy email address</button><p class="copy-feedback" id="copy-feedback" role="status" aria-live="polite"></p>` : '<p class="copy-feedback">Preview only · Add a working email in site.config.json.</p>',
    TOPIC_GENERAL:topic('General inquiries','Fifoo — general company inquiry'),
    TOPIC_PARTNERSHIPS:topic('Partnerships','Fifoo — partnership inquiry'),
    TOPIC_PRODUCT:topic('Product questions','Fifoo — product question'),
    TOPIC_PRIVACY:topic('Privacy questions','Fifoo — privacy inquiry'),
    PREVIEW_BANNER:ready ? '' : '<div class="preview-banner"><strong>Website preview</strong> · Company details are placeholders. Complete and verify them before publishing.</div>',
    DETAILS_NOTICE:ready ? '' : '<p class="details-notice">Display name shown for design purposes. Replace the legal name and contact placeholders with the corporation’s verified details before publishing.</p>',
    PRIVACY_NOTICE:ready ? '' : '<p class="draft-notice"><strong>Draft for owner review — not ready to publish.</strong> Complete the provider, retention, effective-date, and legal-entity fields. Review this notice against your actual practices and applicable requirements before setting privacyReviewed to true. This is not the Fifoo app’s privacy policy.</p>',
    PRIVACY_DATE:field(c.privacy.effectiveDate),
    HOST_PROVIDER:field(c.privacy.hostingProvider),
    EMAIL_PROVIDER:field(c.privacy.emailProvider),
    HOST_RETENTION:field(c.privacy.hostingLogRetention),
    CORRESPONDENCE_RETENTION:field(c.privacy.correspondenceRetention),
    AVAILABILITY_TEXT:hasStores ? 'Use the official product and store links below for the latest availability. Access may vary by platform and location.' : 'Fifoo is currently in development, with iOS and Android releases planned. Download links will be added when the app is available.',
    PLATFORM_NOTE: hasStores ? 'Use official links for current availability' : 'iOS &amp; Android planned',
    AVAILABILITY_TITLE: hasStores ? 'Find Fifoo.' : 'We’re building what’s next.',
    STORE_LINKS:links ? `<div class="store-links">${links}</div>` : ''
  };
  function render(text, extra={}) {
    const values = {...tokens,...extra};
    return text.replace(/\{\{([A-Z_]+)\}\}/g, (_,key) => {
      if (!(key in values)) throw new Error(`Unknown template token: ${key}`);
      return values[key];
    });
  }
  tokens.DAY_ILLUSTRATION = render(await read('src/partials/day-illustration.html'));
  const header = await read('src/partials/header.html');
  const footer = render(await read('src/partials/footer.html'));
  const pages = [
    ['index.html', `${c.displayName}`, 'The company behind Fifoo, a daily planning game connecting meals, movement, rest, and tasks. Learn about our company, our product, and how to contact us.', 'company'],
    ['fifoo.html', `Fifoo app | ${c.displayName}`, 'Meet Fifoo: a daily planning game designed to make weight loss easier to organize through connected daily activities and adaptable schedules.', 'product'],
    ['contact.html', `Contact | ${c.displayName}`, 'Contact the company behind Fifoo for business inquiries, product questions, partnerships, and corporate information.', 'contact'],
    ['privacy.html', `Website privacy | ${c.displayName}`, 'Privacy information for the Fifoo corporate website, including business correspondence and site services.', ''],
    ['404.html', `Page not found | ${c.displayName}`, 'The page could not be found. Return to the Fifoo corporate website or contact the company.', '']
  ];
  // Only clean the generated directory after configuration validation has succeeded.
  await fs.rm(out,{recursive:true,force:true});
  await fs.mkdir(out,{recursive:true});
  await fs.cp(path.join(root,'src/assets'),path.join(out,'assets'),{recursive:true});
  for (const [file,title,description,active] of pages) {
    const canonical = `https://${c.domain}/${file === 'index.html' ? '' : file}`;
    const indexable = ready && c.launch.allowIndexing === true && file !== '404.html';
    const pageHeader = render(header,{NAV_COMPANY:active==='company'?'aria-current="page"':'',NAV_PRODUCT:active==='product'?'aria-current="page"':'',NAV_CONTACT:active==='contact'?'aria-current="page"':''});
    let document = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}">\n<meta name="robots" content="${indexable?'index, follow':'noindex, nofollow'}">\n<meta name="theme-color" content="#193e34">\n<link rel="canonical" href="${escape(canonical)}">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="${escape(c.displayName)}">\n<meta property="og:title" content="${escape(title)}">\n<meta property="og:description" content="${escape(description)}">\n<meta property="og:url" content="${escape(canonical)}">\n<meta property="og:image" content="https://${escape(c.domain)}/assets/social-card.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${escape(c.displayName)} — A clearer path through your everyday.">\n<meta name="twitter:card" content="summary_large_image">\n<link rel="icon" href="./assets/pied_piper_card_back.png" type="image/png">\n<link rel="stylesheet" href="./assets/styles.css">\n<script src="./assets/site.js" defer></script>\n</head>\n<body>\n${pageHeader}\n${render(await read(`src/pages/${file}`))}\n${footer}\n</body>\n</html>\n`;
    if (file==='404.html') {
      // A missing nested URL must not break asset paths or the route back home.
      document = document.replaceAll('href="./','href="/').replaceAll('src="./','src="/');
    }
    await fs.writeFile(path.join(out,file),document);
  }
  const headers = {
    'Content-Security-Policy':"default-src 'none'; base-uri 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'",
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    ...(!ready || c.launch.allowIndexing!==true ? {'X-Robots-Tag':'noindex, nofollow'}:{})
  };
  const azure = {routes:[{route:'/index.html',redirect:'/',statusCode:301}],responseOverrides:{'404':{rewrite:'/404.html'}},globalHeaders:headers,mimeTypes:{'.svg':'image/svg+xml'}};
  await fs.writeFile(path.join(out,'staticwebapp.config.json'),JSON.stringify(azure,null,2)+'\n');
  await fs.writeFile(path.join(out,'robots.txt'), ready && c.launch.allowIndexing ? `User-agent: *\nAllow: /\nSitemap: https://${c.domain}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const sitemap = pages.filter(([file])=>file!=='404.html').map(([file])=>`  <url><loc>https://${c.domain}/${file==='index.html'?'':file}</loc></url>`).join('\n');
  await fs.writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
  await fs.writeFile(path.join(out,'_headers'),`/*\n${Object.entries(headers).map(([k,v])=>`  ${k}: ${v}`).join('\n')}\n`);
  console.log(`${ready?'PRODUCTION':'PREVIEW'} build created: ${path.relative(root,out)}/ (5 pages).`);
  if (!ready) console.log('Placeholders are labeled and indexing is disabled. Complete site.config.json, review the privacy notice, then run npm run build:production.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
