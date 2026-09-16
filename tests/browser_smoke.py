"""Optional DOM/layout smoke tests. Requirements: Playwright and Chromium.
Runs with embedded local assets so no external website is contacted.
Does not test a public deployment, DNS, TLS, or actual mail delivery.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64
import json
import os
import shutil

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
REPORT = ROOT / '.test-output' / 'browser-report.json'

def document(name, directory=SITE):
    html = (directory / name).read_text()
    css = (directory / 'assets/styles.css').read_text()
    js = (directory / 'assets/site.js').read_text()
    icon = 'data:image/svg+xml;base64,' + base64.b64encode((directory / 'assets/pied_piper_card_back.png').read_bytes()).decode()
    for prefix in ['./', '/']:
        html = html.replace(f'<link rel="stylesheet" href="{prefix}assets/styles.css">', '<style>' + css + '</style>')
        html = html.replace(f'<script src="{prefix}assets/site.js" defer></script>', '')
        html = html.replace(f'{prefix}assets/favicon.svg', icon)
    return html.replace('</body>', '<script>' + js + '</script></body>')

def run():
    results = []
    errors = []
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium')
        browser = p.chromium.launch(**({'executable_path': executable} if executable else {}), args=['--no-sandbox'])
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(5000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width in [320, 390, 720, 768, 1024, 1440]:
            page.set_viewport_size({'width': width, 'height': 900})
            for name in ['index.html','fifoo.html','contact.html','privacy.html','404.html']:
                print(f'Checking {name} @ {width}',flush=True)
                page.set_content(document(name), wait_until='domcontentloaded')
                dimensions = page.evaluate('({scroll: document.documentElement.scrollWidth, viewport: innerWidth})')
                assert dimensions['scroll'] <= dimensions['viewport'], (name, width, dimensions)
                assert page.locator('h1').count() == 1
                assert page.locator('main').is_visible()
                results.append({'check':'layout and semantic page','page':name,'width':width,'passed':True})
        page.set_viewport_size({'width':390,'height':844})
        page.set_content(document('index.html'), wait_until='domcontentloaded')
        menu = page.locator('.menu-toggle')
        assert menu.get_attribute('aria-expanded') == 'false'
        assert not page.locator('#site-nav').is_visible()
        menu.click()
        assert page.locator('#site-nav').is_visible()
        assert menu.get_attribute('aria-expanded') == 'true'
        page.keyboard.press('Escape')
        assert not page.locator('#site-nav').is_visible()
        assert menu.evaluate('(element) => element === document.activeElement')
        results.append({'check':'mobile menu open, Escape close, focus return','passed':True})
        menu.click()
        page.set_viewport_size({'width':1024,'height':800})
        page.wait_for_timeout(100)
        assert menu.get_attribute('aria-expanded') == 'false'
        assert page.locator('#site-nav').is_visible()
        results.append({'check':'desktop resize restores navigation','passed':True})
        page.set_content(document('contact.html'), wait_until='domcontentloaded')
        details=page.locator('.faq-list details').first
        details.locator('summary').click()
        assert details.get_attribute('open') is not None
        details.locator('summary').click()
        assert details.get_attribute('open') is None
        results.append({'check':'FAQ disclosure open and close','passed':True})
        nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
        nojs_page=nojs.new_page()
        nojs_page.set_content(document('index.html'), wait_until='domcontentloaded')
        assert nojs_page.locator('#site-nav').is_visible()
        assert nojs_page.get_by_role('heading',level=1).is_visible()
        results.append({'check':'content and navigation available without JavaScript','passed':True})
        reduced=browser.new_context(reduced_motion='reduce',viewport={'width':390,'height':844})
        reduced_page=reduced.new_page()
        reduced_page.set_content(document('index.html'),wait_until='domcontentloaded')
        assert reduced_page.evaluate('getComputedStyle(document.documentElement).scrollBehavior')=='auto'
        results.append({'check':'reduced-motion preference respected','passed':True})
        production=ROOT/'.test-output/production'
        if production.exists():
            page.set_viewport_size({'width':390,'height':844})
            page.set_content(document('contact.html',production),wait_until='domcontentloaded')
            assert page.locator('a[href^="mailto:"]').count() == 5
            assert page.locator('a[href^="tel:"]').count() == 1
            assert page.locator('.preview-banner').count() == 0
            results.append({'check':'configured production contact links and banner removal','passed':True})
            # Simulate clipboard availability; test both success and failure feedback.
            page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText: async () => {}}})")
            page.set_content(document('contact.html',production),wait_until='domcontentloaded')
            copy=page.get_by_role('button',name='Copy email address')
            copy.click()
            assert page.locator('#copy-feedback').inner_text()=='Email address copied.'
            page.evaluate("() => {navigator.clipboard.writeText = async () => {throw new Error('Denied')};}")
            copy.click()
            assert 'Copy was not permitted' in page.locator('#copy-feedback').inner_text()
            results.append({'check':'clipboard success and honest failure feedback with mocked API','passed':True})
        assert not errors, errors
        results.append({'check':'no uncaught JavaScript errors','passed':True})
        browser.close()
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps({'scope':'Local HTML/CSS/JS in Chromium; assets embedded for testing. No hosted or mail delivery test.','checks':results,'total':len(results)},indent=2))
    print(f'{len(results)} browser checks passed. Report: {REPORT.relative_to(ROOT)}')

if __name__ == '__main__':
    run()
