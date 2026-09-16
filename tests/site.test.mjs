import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const run=(args=[])=>spawnSync(process.execPath,['scripts/build.mjs',...args,`--config=${previewConfigPath}`,'--out=.test-output/preview'],{cwd:root,encoding:'utf8'});
const read=(file)=>fs.readFileSync(path.join(root,'.test-output/preview',file),'utf8');
const testRoot=path.join(root,'.test-output');
fs.mkdirSync(testRoot,{recursive:true});
const save=(name,value)=>{const file=path.join(testRoot,name);fs.writeFileSync(file,JSON.stringify(value));return file;};
const previewConfig=structuredClone(base);
previewConfig.legalName='[Full registered corporation name]';
previewConfig.company.jurisdiction='[State and country of incorporation]';
previewConfig.contact={email:'[Business email address]',phoneDisplay:'[Business phone number]',phoneE164:'',addressLines:['[Business mailing address]','[City, state/province, postal code]','[Country]']};
previewConfig.product={status:'In development',websiteUrl:'',iosUrl:'',androidUrl:''};
previewConfig.privacy={effectiveDate:'[Effective date]',hostingProvider:'[Hosting provider]',emailProvider:'[Email provider]',hostingLogRetention:'[Hosting retention]',correspondenceRetention:'[Correspondence retention]'};
previewConfig.launch={companyDetailsConfirmed:false,contactMethodsTested:false,privacyReviewed:false,allowIndexing:false};
const previewConfigPath=save('preview-config.json',previewConfig);
function complete(){
 const c=structuredClone(base);
 c.displayName='Fixture Business';c.legalName='Fixture Business Inc.';c.domain='fixture.example';
 c.company.jurisdiction='Fixture jurisdiction';
 c.contact={email:'contact@fixture.example',phoneDisplay:'+1 202 555 0123',phoneE164:'+12025550123',addressLines:['Test fixture only','Not a real business address']};
 c.privacy={effectiveDate:'September 15, 2026',hostingProvider:'Test host',emailProvider:'Test email provider',hostingLogRetention:'Fixture retention text.',correspondenceRetention:'Fixture correspondence rules.'};
 c.launch={companyDetailsConfirmed:true,contactMethodsTested:true,privacyReviewed:true,allowIndexing:true};
 return c;
}
test('preview build succeeds with clearly labeled placeholders',()=>{const r=run();assert.equal(r.status,0,r.stderr);assert.match(read('index.html'),/Website preview/);});
test('all five static pages have semantic basics and no unresolved template tokens',()=>{
 for(const file of ['index.html','fifoo.html','contact.html','privacy.html','404.html']){
 const html=read(file);assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file);assert.match(html,/<html lang="en">/);assert.match(html,/id="main"/);assert.match(html,/<title>[^<]+<\/title>/);assert.doesNotMatch(html,/\{\{[A-Z_]+\}\}/);
 }
});
test('preview output is noindex and has a draft privacy warning',()=>{assert.match(read('index.html'),/noindex, nofollow/);assert.match(read('robots.txt'),/Disallow: \//);assert.match(read('privacy.html'),/Draft for owner review/);});
test('unset contact data produces no fake mailto or telephone links',()=>{assert.doesNotMatch(read('contact.html'),/href="(?:mailto:|tel:)/);assert.match(read('contact.html'),/aria-disabled="true"/);});
test('local assets and local links resolve, including anchors',()=>{
 for(const file of ['index.html','fifoo.html','contact.html','privacy.html','404.html']){
 const html=read(file);
 for(const match of html.matchAll(/(?:href|src)="([^\"]+)"/g)){
 const url=match[1];if(/^(?:https?:|mailto:|tel:)/.test(url))continue;
 const [pathname,hash]=url.split('#');const target=pathname?(pathname==='/'?'index.html':pathname.replace(/^\.\//,'').replace(/^\//,'')):file;
 const dest=path.join(root,'.test-output/preview',target);assert.ok(fs.existsSync(dest),`${file} -> ${url}`);
 if(hash && target.endsWith('.html'))assert.ok(fs.readFileSync(dest,'utf8').includes(`id="${hash}"`),`missing anchor ${url}`);
 }
 }
});
test('production is blocked while required placeholders or confirmations remain',()=>{const r=run(['--production','--out=.test-output/blocked']);assert.notEqual(r.status,0);assert.match(r.stderr,/Production build blocked/);assert.match(r.stderr,/legalName/);});
test('fully configured fixture generates working contact links and indexable production pages',()=>{
 const c=complete();const config=save('complete.json',c);const r=run(['--production',`--config=${config}`,'--out=.test-output/production']);assert.equal(r.status,0,r.stderr);
 const html=fs.readFileSync(path.join(testRoot,'production/contact.html'),'utf8');assert.match(html,/href="mailto:contact@fixture.example\?subject=/);assert.match(html,/href="tel:\+12025550123"/);assert.doesNotMatch(html,/Website preview|class="placeholder"|Draft for owner review/);
 assert.match(html,/content="index, follow"/);assert.match(html,/data-copy-email="contact@fixture.example"/);
});
test('production insists on the corporate email domain',()=>{const c=complete();c.contact.email='person@unrelated.example';const r=run(['--production',`--config=${save('wrong-domain.json',c)}`,'--out=.test-output/wrong-domain']);assert.notEqual(r.status,0);assert.match(r.stderr,/corporate domain/);});
test('configuration text is HTML escaped',()=>{const c=complete();c.legalName='<script>alert("test")</script>';const r=run([`--config=${save('escape.json',c)}`,'--out=.test-output/escaped']);assert.equal(r.status,0,r.stderr);const html=fs.readFileSync(path.join(testRoot,'escaped/contact.html'),'utf8');assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>alert/);});
test('untrusted URL protocols are rejected',()=>{const c=complete();c.product.websiteUrl='javascript:alert(1)';const r=run([`--config=${save('bad-url.json',c)}`,'--out=.test-output/bad-url']);assert.notEqual(r.status,0);assert.match(r.stderr,/HTTPS URL/);});
test('security headers prohibit forms, framing, and unneeded connections',()=>{const c=JSON.parse(read('staticwebapp.config.json'));assert.match(c.globalHeaders['Content-Security-Policy'],/form-action 'none'/);assert.match(c.globalHeaders['Content-Security-Policy'],/frame-ancestors 'none'/);assert.match(c.globalHeaders['Content-Security-Policy'],/connect-src 'none'/);assert.equal(c.responseOverrides['404'].rewrite,'/404.html');});
test('no client tracking, external dependencies, or credential placeholders',()=>{const js=read('assets/site.js');assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|document\.cookie|localStorage|sessionStorage/);const html=read('index.html');assert.doesNotMatch(html,/<(?:script|iframe)[^>]+(?:src)="https?:/);assert.doesNotMatch(html,/api[_-]?key|client[_-]?secret|password\s*=/i);});
