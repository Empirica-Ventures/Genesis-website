#!/usr/bin/env python3
"""Build the public site from a Claude Design handoff folder.

    python3 -I tools/build-from-design.py <design_handoff_genesis_website> [--no-media]

The handoff's pages are `.dc.html` design components that run on the
design tool's own runtime (`support.js` + React). We ship that same runtime
so every page renders and animates exactly as designed, but production-ready:

  * React / ReactDOM and every script, stylesheet and font are self-hosted
    (no unpkg, no Google Fonts); shared components (SiteNav, SiteFooter,
    CtaBand, DownloadForm) are bundled into each page so nothing is fetched
    at load time;
  * pages are served at clean routes (see ROUTES), links rewritten to match;
  * asset paths are absolute (pages live at nested routes like
    /projects/sample) and point at optimised copies in assets/img/
    (see tools/optimize-design-media.py, run from here unless --no-media);
  * a few performance-only patches to the global motion scripts (listed in
    patch_* below) that keep the look identical.

Re-run it whenever a new handoff arrives; it rewrites the generated pages,
dc/ and assets/img/, and leaves everything else (api/, team-uploads,
assets/images QR codes, assets/files PDF) alone.
"""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DS_PREFIX = '_ds/genesis-education-solutions-design-syste-838a57eb-b36b-4c2c-a0c7-5cd321a51c12/'
SITE = 'https://www.genesiseducation.solutions'

# design file -> (public route, output file)
ROUTES = {
    'Home': ('/', 'index.html'),
    'About': ('/about', 'about.html'),
    'Why PBL': ('/approach', 'approach.html'),
    'Program': ('/program', 'program.html'),
    'Projects': ('/projects', 'projects.html'),
    'Sample Project': ('/projects/sample', 'projects/sample.html'),
    'Partners': ('/partners', 'partners.html'),
    'FAQ': ('/faq', 'faq.html'),
    'Contact': ('/contact', 'contact.html'),
    'Thank You': ('/thank-you', 'thank-you.html'),
    'Privacy': ('/privacy', 'privacy.html'),
    # not part of the handoff; the nav search still lists it -> vercel.json redirects /terms
    'Terms': ('/terms', None),
}
# canonical URLs written inside the design files that differ from the routes above
CANONICAL_FIX = {SITE + '/why-pbl': SITE + '/approach', SITE + '/projects/the-formula': SITE + '/projects/sample'}
SHARED_JS = ['site-intro.js', 'page-curtain.js', 'site-motion.js']


def media_map(design):
    """old relative asset path -> new absolute path (from the optimiser's manifest)."""
    mf = REPO / 'assets/img/manifest.json'
    return json.loads(mf.read_text()) if mf.exists() else {}


def rewrite(text, mmap):
    # page links: "Why PBL.dc.html", "Thank You.dc.html?name=" ...
    for name, (route, _) in ROUTES.items():
        for form in {name, name.replace(' ', '%20')}:
            text = text.replace(form + '.dc.html', route)
    # optimised media (exact paths first, then string-built prefixes like 'assets/web/team-' + id + '.jpg')
    files = mmap.get('files', {})
    for old in sorted(files, key=len, reverse=True):
        text = text.replace(SITE + '/' + old, SITE + files[old])  # absolute URLs in meta tags / structured data
        text = re.sub(r'(?<![\w/.-])(\./)?' + re.escape(old), files[old], text)
    for pat, repl in mmap.get('code', []):
        text = text.replace(pat, repl)
    # remaining relative paths -> absolute (pages live at nested routes)
    text = re.sub(r'''(?<=["'(\s,=])assets/''', '/assets/', text)
    text = text.replace(DS_PREFIX, '/dc/ds/')
    text = re.sub(r'(?<=["\'])(\./)?(site-intro|page-curtain|site-motion)\.js', r'/dc/\2.js', text)
    for a, b in CANONICAL_FIX.items():
        text = text.replace(a, b)
    return text


def dc_parts(src):
    head = src[src.index('<head>') + 6:src.index('<script src="./support.js"></script>')]
    body = src[src.index('<x-dc>'):]
    body = body[:body.index('</body>')]
    return head.strip(), body.rstrip()


def imports_of(src):
    return re.findall(r'<dc-import name="([^"]+)"', src)


def build(design, mmap):
    design = Path(design)
    comp_src = {p.name[:-len('.dc.html')]: p.read_text() for p in design.glob('*.dc.html')}
    # pages the handoff leaves out (Privacy since the October handoff) are kept in tools/pages/
    for p in (REPO / 'tools' / 'pages').glob('*.dc.html'):
        comp_src.setdefault(p.name[:-len('.dc.html')], p.read_text())
    out_pages = []
    for name, (route, out) in ROUTES.items():
        if not out:
            continue
        src = patch_page(name, rewrite(comp_src[name], mmap), mmap)
        # components this page mounts, recursively
        need, stack = [], imports_of(src)
        while stack:
            c = stack.pop(0)
            if c in need:
                continue
            need.append(c)
            stack += imports_of(comp_src[c])
        head, body = dc_parts(src)
        blobs = {f'/dc/c/{c}.dc.html': patch_component(c, rewrite(comp_src[c], mmap)) for c in need}
        resources = {f'./{c}.dc.html': f'/dc/c/{c}.dc.html' for c in need}
        resources.update({
            'https://unpkg.com/react@18.3.1/umd/react.production.min.js': '/dc/react.production.min.js',
            'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': '/dc/react-dom.production.min.js',
        })
        boot = ('window.__resources=' + json.dumps(resources) + ';'
                'window.__resourceBlobs=(function(s){var o={};for(var k in s)o[k]=new Blob([s[k]],{type:"text/html"});return o})('
                + json.dumps(blobs) + ');')
        boot += ('window.__gesImg=(function(L){return function(k){return L[k]||("/assets/img/"+k)}})('
                 + json.dumps(mmap.get('lookup', {}), sort_keys=True) + ');')
        boot = boot.replace('</', '<\\/')
        preload = preloads_for(name, src, mmap)
        # Reserve the scrollbar's space from the first frame. Pages render behind the intro/curtain and only then
        # become scrollable; without this the viewport narrows ~15px mid-load and Lighthouse scores the full-screen
        # intro video as a 0.62 layout shift. Every page scrolls, so the finished page looks exactly the same.
        gutter = '<style>html{scrollbar-gutter:stable}</style>\n'
        page = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n' + head + '\n' + gutter + preload +
                '<script>' + boot + '</script>\n<script src="/dc/support.js"></script>\n</head>\n<body>\n' +
                body + '\n</body>\n</html>\n')
        dest = REPO / out
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(page)
        out_pages.append((route, out, len(page)))
    return out_pages


def preloads_for(name, src, mmap):
    links = [
        '<link rel="preload" href="/dc/react.production.min.js" as="script">',
        '<link rel="preload" href="/dc/react-dom.production.min.js" as="script">',
        '<link rel="preload" href="/dc/ds/_ds_bundle.js" as="script">',
    ] + [f'<link rel="preload" href="/dc/{j}" as="script">' for j in SHARED_JS] + [
        f'<link rel="preload" href="/dc/ds/{c}" as="style">' for c in
        ('tokens/colors.css', 'tokens/typography.css', 'tokens/spacing.css', 'tokens/effects.css', 'styles.css')
    ] + [f'<link rel="preload" href="/assets/fonts/{f}.woff2" as="font" type="font/woff2" crossorigin>'
         for f in ('lato-400', 'lato-700', 'lato-900')]
    for img in mmap.get('preload', {}).get(name, []):
        links.append(f'<link rel="preload" href="{img}" as="image" fetchpriority="high">')
    return '\n'.join(links) + '\n'


FORM_OK_OLD = "}).then((r) => { if (!r.ok) throw new Error();"
# FormSubmit answers HTTP 200 with {"success":"false"} when it won't deliver (e.g. form not yet activated):
# treat that as a failure too, so visitors see the design's own error state instead of a false "thank you".
FORM_OK_NEW = ("}).then((r) => { if (!r.ok) throw new Error(); return r.json(); })"
               ".then((d) => { if (d && (d.success === false || d.success === 'false')) throw new Error();")


def patch_page(name, text, mmap):
    if name == 'Contact':
        assert FORM_OK_OLD in text, 'Contact form handler changed; re-check the FormSubmit success patch'
        text = text.replace(FORM_OK_OLD, FORM_OK_NEW)
    if name == 'Partners':
        # "Show all photos": the design lists training photos that neither the handoff nor tools/extra-media
        # has yet; leave those out (the owner's call) instead of showing broken images.
        m = re.search(r"const restN = \[([^\]]*)\];", text)
        assert m, 'Partners gallery list changed; re-check the missing-photo patch'
        have = mmap.get('lookup', {})
        keep = [n for n in re.findall(r"'(\d+)'", m.group(1)) if f'training-{n}' in have]
        dropped = sorted(set(re.findall(r"'(\d+)'", m.group(1))) - set(keep))
        if dropped:
            print('Partners gallery: no photo for training-' + ', training-'.join(dropped) + ' (left out)')
        text = text.replace(m.group(0), 'const restN = [' + ', '.join(f"'{n}'" for n in keep) + '];')
    return text


def patch_component(name, text):
    if name == 'DownloadForm':
        old = "}).then((r) => {\n        if (!r.ok) throw new Error();"
        assert old in text, 'DownloadForm handler changed; re-check the FormSubmit success patch'
        text = text.replace(old, "}).then((r) => {\n        if (!r.ok) throw new Error(); return r.json(); }).then((d) => {\n        if (d && (d.success === false || d.success === 'false')) throw new Error();")
    if name == 'SiteNav':
        # the runtime calls componentDidUpdate(prevProps) without prevState, so this check threw on every
        # update in the design; guard it so it stays the same no-op without the console error.
        text = text.replace('if (ps.sOpen !== this.state.sOpen) {', 'if (ps && ps.sOpen !== this.state.sOpen) {')
    return text


def patch_curtain(text):
    # page-to-page curtain: the design only recognised "*.dc.html" links; recognise our clean routes instead
    # (same origin, an HTML page rather than a file download, not the team upload page or the API).
    old = "if (url.origin !== location.origin || !/\\.dc\\.html$/i.test(url.pathname)) return;"
    assert old in text
    return text.replace(old, "if (url.origin !== location.origin || /\\.(?!html?$)[a-z0-9]{2,5}$/i.test(url.pathname) || /^\\/(api|assets|dc|team-uploads)(\\/|$)/.test(url.pathname)) return;")


def patch_motion(text):
    # Poppins is self-hosted (assets/fonts, declared in dc/ds/tokens/typography.css): drop the Google @import.
    old = "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap');"
    assert old in text
    text = text.replace(old, '')
    # Teal grid drift: the design animates mask-position, which repaints every teal block on every frame.
    # Same picture, composited: the masked layer is 76px wider and slides left 76px with transform instead.
    old_kf = "@keyframes ges-tgrid-drift{from{-webkit-mask-position:0 0;mask-position:0 0}to{-webkit-mask-position:-76px 0;mask-position:-76px 0}}"
    assert old_kf in text
    text = text.replace(old_kf, "@keyframes ges-tgrid-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-76px,0,0)}}")
    # [data-teal-grid] keeps its box (inset:0) and clips; the gradient + mask + drift move to an inner layer
    old_rule = ("'[data-teal-grid]{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0.06;background-image:linear-gradient(to bottom,#FFFFFF,#0F6B66);' +")
    assert old_rule in text
    text = text.replace(old_rule, ("'[data-teal-grid]{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0.06;overflow:hidden}' +\n"
        "      '[data-teal-grid]>i{position:absolute;top:0;bottom:0;left:0;right:-76px;will-change:transform;background-image:linear-gradient(to bottom,#FFFFFF,#0F6B66);' +"))
    old_red = "'@media (prefers-reduced-motion: reduce){[data-teal-grid]{animation:none}}'"
    assert old_red in text
    text = text.replace(old_red, "'@media (prefers-reduced-motion: reduce){[data-teal-grid]>i{animation:none}}'")
    old_mk = "g.setAttribute('aria-hidden', 'true');"
    assert old_mk in text
    text = text.replace(old_mk, "g.setAttribute('aria-hidden', 'true'); g.appendChild(document.createElement('i'));")
    return text


def copy_runtime(design, mmap):
    design = Path(design)
    dc = REPO / 'dc'
    if dc.exists():
        shutil.rmtree(dc)
    (dc / 'ds' / 'tokens').mkdir(parents=True)
    shutil.copy(design / 'support.js', dc / 'support.js')
    vendor = REPO / 'tools' / 'vendor'
    for f in ('react.production.min.js', 'react-dom.production.min.js'):
        shutil.copy(vendor / f, dc / f)
    ds = design / DS_PREFIX
    shutil.copy(ds / '_ds_bundle.js', dc / 'ds' / '_ds_bundle.js')
    shutil.copy(ds / 'styles.css', dc / 'ds' / 'styles.css')
    for t in ('colors', 'spacing', 'effects'):
        shutil.copy(ds / 'tokens' / f'{t}.css', dc / 'ds' / 'tokens' / f'{t}.css')
    typo = (ds / 'tokens' / 'typography.css').read_text()
    typo = re.sub(r"@import url\('https://fonts\.googleapis\.com[^']*'\);\s*", '', typo)
    typo = re.sub(r'@font-face\s*\{[^}]*JetBrains[^}]*\}\s*', '', typo)  # --font-mono is never used
    typo = (REPO / 'tools' / 'fonts.css').read_text() + '\n' + typo
    (dc / 'ds' / 'tokens' / 'typography.css').write_text(typo)
    for j in SHARED_JS:
        t = rewrite((design / j).read_text(), mmap)
        if j == 'page-curtain.js':
            t = patch_curtain(t)
        if j == 'site-motion.js':
            t = patch_motion(t)
        (dc / j).write_text(t)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        sys.exit(__doc__)
    design = args[0]
    if '--no-media' not in sys.argv:
        subprocess.run([sys.executable, '-I', str(REPO / 'tools' / 'optimize-design-media.py'), design], check=True)
    mmap = media_map(design)
    copy_runtime(design, mmap)
    for route, out, size in build(design, mmap):
        print(f'{route:18} -> {out:22} {size // 1024}K')


if __name__ == '__main__':
    main()
