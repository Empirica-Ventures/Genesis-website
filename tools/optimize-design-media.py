#!/usr/bin/env python3
"""Optimise the images and video a design handoff uses, into assets/img/.

    python3 -I tools/optimize-design-media.py <design_handoff_genesis_website>

Called by build-from-design.py. Writes assets/img/*.webp|mp4 and
assets/img/manifest.json (old relative path -> new absolute path, plus the
code patterns for paths the page scripts build at runtime).

Quality rules (no visible loss):
  * Each image is sized to the largest size it is ever drawn at — measured
    across desktop (up to 2x retina) and phone (3x) viewports, including
    hover pop-outs — and never upscaled. Sizes live in DISPLAY below; re-measure
    if a layout changes.
  * Photos -> WebP quality 90, or the untouched original JPEG when that is
    already smaller (re-encoding an already-compressed JPEG can't beat it).
  * Logos/graphics/anything with transparency -> lossless WebP; above 40 KB,
    WebP q95 with full-quality alpha (indistinguishable side by side, a
    quarter to a half of the bytes).
  * Byte-identical source photos (the design reuses one photo as a reel,
    ring and hero image) become ONE file, so it's cached once across pages.
  * Paths the page scripts build at runtime go through window.__gesImg(name)
    (a name -> URL lookup the build writes into each page).
  * Intro video: H.264 re-encode at the same resolution, checked by SSIM.
"""
import hashlib, io, json, re, shutil, subprocess, sys
from pathlib import Path
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / 'assets' / 'img'

# largest on-screen size in device pixels (w, h, object-fit) measured on the built pages
DISPLAY = {
    'assets/faq-question-3d.webp': (854, 854, 'fill'),
    'assets/web/formula-manuals.png': (1050, 1050, 'contain'),
    'assets/web/gap-project.png': (768, 1077, 'cover'),
    'assets/web/logo-white.png': (363, 93, 'fill'),
    'assets/web/project-manual-stack.png': (852, 1202, 'fill'),
    'file_000000002228820ba1883c5dc9c0f628-mv58rxhd-i3y3.png': (568, 1065, 'cover'),
    'assets/web/training-14.jpg': (1050, 1314, 'cover'),
}
RING_POP = 1.12  # the Program ring pops the hovered photo out 1.12x
for i, wh in enumerate([(407, 591), (433, 588), (399, 591), (344, 577), (344, 519), (344, 464), (344, 464), (344, 464), (344, 523), (344, 580)], 1):
    DISPLAY[f'assets/web/program-ring-{i:02d}.png'] = (round(wh[0] * RING_POP), round(wh[1] * RING_POP), 'cover')
for i, wh in enumerate([(450, 1002), (391, 483), (391, 483), (396, 645), (450, 1002), (391, 483), (391, 483), (396, 645)], 1):
    DISPLAY[f'assets/web/reel-{i:02d}.png'] = (wh[0], wh[1], 'cover')
for p in ('adil', 'hasnain', 'ibrahim', 'jawad', 'muzzammil', 'rizwan'):
    DISPLAY[f'assets/web/team-{p}.jpg'] = (789, 837, 'cover')
# Partners mosaic + "show all" grid: the largest tile is ~760x930 device px; give every training photo that budget
TRAINING_BOX = (800, 1000, 'cover')
SCHOOLS = ['al-badar', 'meb', 'stanmore', 'genex', 'avicenna', 'signature', 'graceful', 'rashid-minhas', 'al-zaytuna-round']
LOGO_BOX = (900, 384, 'contain')  # partner logo tiles, never upscaled beyond the source

PHOTO_Q = 90


def target_size(src, box):
    w, h = src.size
    bw, bh, fit = box
    if fit == 'cover':
        s = max(bw / w, bh / h)
    elif fit == 'contain':
        s = min(bw / w, bh / h)
    else:  # fill / fixed box: the image is drawn at exactly bw x bh
        s = max(bw / w, bh / h)
    s = min(1.0, s)
    return (max(1, round(w * s)), max(1, round(h * s)))


def has_alpha(im):
    return im.mode in ('RGBA', 'LA', 'P') and im.convert('RGBA').getextrema()[3][0] < 255


def psnr(a, b):
    """PSNR of b against a; images with transparency are compared composited on white (as shown)."""
    from PIL import ImageChops, ImageStat
    import math
    def flat(im):
        im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, 'white')
        return Image.alpha_composite(bg, im).convert('RGB')
    mse = sum(v * v for v in ImageStat.Stat(ImageChops.difference(flat(a), flat(b))).rms) / 3
    return 99.0 if mse == 0 else 20 * math.log10(255 / math.sqrt(mse))


def webp(im, **kw):
    buf = io.BytesIO(); im.save(buf, 'WEBP', method=6, **kw); data = buf.getvalue()
    return data, psnr(im, Image.open(io.BytesIO(data)))


def encode(src_path, box, out_name, graphic=None):
    """Photos: WebP q90, or the untouched original JPEG when that is already smaller.
    Graphics/logos (or anything with transparency): lossless WebP; above 40 KB, WebP q95 with full-quality
    alpha (checked side by side: indistinguishable at 100%, a quarter to a half of the bytes)."""
    im = Image.open(src_path); im.load()
    size = target_size(im, box)
    alpha = has_alpha(im)
    graphic = alpha if graphic is None else graphic
    im2 = im.convert('RGBA' if alpha else 'RGB')
    if size != im.size:
        im2 = im2.resize(size, Image.LANCZOS)
    if graphic:
        data, db = webp(im2, lossless=True, quality=100, exact=True); how = 'lossless'
        if len(data) > 40_000:
            data, db = webp(im2, quality=95, alpha_quality=100); how = 'q95'
    else:
        data, db = webp(im2, quality=PHOTO_Q); how = f'q{PHOTO_Q}'
    src_bytes = Path(src_path).stat().st_size
    if src_path.suffix.lower() in ('.jpg', '.jpeg') and len(data) > 0.9 * src_bytes:
        out = OUT / (Path(out_name).stem + '.jpg')
        shutil.copy(src_path, out)
        return out, im.size, im.size, src_bytes, out.stat().st_size, 'original JPEG kept (smaller)'
    out = OUT / out_name
    out.write_bytes(data)
    return out, im.size, size, src_bytes, len(data), f'{how} {db:.1f}dB'


def encode_video(src, out):
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ff, '-y', '-v', 'error', '-i', str(src), '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '20',
                    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', str(out)], check=True)
    r = subprocess.run([ff, '-v', 'info', '-i', str(out), '-i', str(src), '-lavfi', 'ssim', '-f', 'null', '-'],
                       capture_output=True, text=True)
    ssim = re.search(r'All:([\d.]+)', r.stderr)
    return float(ssim.group(1)) if ssim else None


def main(design):
    design = Path(design)
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    files, seen, rows = {}, {}, []

    owner = {}  # design path -> key of the unique source it uses

    def do(rel, box, name, lossless=None):
        src = design / rel
        key = (hashlib.md5(src.read_bytes()).hexdigest(), lossless)
        owner[rel] = key
        if key in seen:  # identical photo used elsewhere: one shared file, sized for the bigger use
            seen[key]['boxes'].append(box)
            return
        seen[key] = {'rel': rel, 'boxes': [box], 'name': name, 'lossless': lossless, 'url': None}

    for rel, box in DISPLAY.items():
        stem = Path(rel).stem
        if stem.startswith('file_'):
            stem = 'approach-hero'
        do(rel, box, stem + '.webp')
    for n in range(1, 23):
        rel = f'assets/web/training-{n:02d}.jpg'
        if rel not in DISPLAY:
            do(rel, TRAINING_BOX, f'training-{n:02d}.webp')
    for s in SCHOOLS:
        do(f'assets/web/school-{s}.png', LOGO_BOX, f'school-{s}.webp', lossless=True)

    # encode each unique source once, at the largest size any of its uses needs
    for key, e in seen.items():
        src = design / e['rel']
        im = Image.open(src)
        sizes = [target_size(im, b) for b in e['boxes']]
        big = max(sizes, key=lambda wh: wh[0] * wh[1])
        out, nat, size, b0, b1, how = encode(src, (big[0], big[1], 'fill'), e['name'], e['lossless'])
        e['url'] = '/assets/img/' + out.name
        rows.append((e['rel'], nat, size, b0, b1, how, len(e['boxes'])))
    for rel, key in owner.items():
        files[rel] = seen[key]['url']

    # Leaders' Harbor logo: the design hot-links it from leadersharbor.pk; host our copy (from the repo history)
    lh = REPO / 'tools' / 'school-leaders-harbor.png'
    out, nat, size, b0, b1, how = encode(lh, LOGO_BOX, 'school-leaders-harbor.webp', graphic=True)
    rows.append(('leadersharbor.pk logo', nat, size, b0, b1, how, 1))

    # unchanged small assets the pages reference
    for rel in ('assets/web/favicon-32.png', 'assets/web/apple-touch-icon.png', 'assets/web/icon-512.png', 'assets/web/og-image.jpg'):
        shutil.copy(design / rel, OUT / Path(rel).name)
        files[rel] = '/assets/img/' + Path(rel).name
    (OUT.parent / 'downloads').mkdir(exist_ok=True)
    pdf = 'assets/downloads/Genesis-The-Formula-Sample-Project.pdf'
    shutil.copy(design / pdf, REPO / pdf)

    ssim = encode_video(design / 'assets/web/genesis-intro.mp4', OUT / 'genesis-intro.mp4')
    v0, v1 = (design / 'assets/web/genesis-intro.mp4').stat().st_size, (OUT / 'genesis-intro.mp4').stat().st_size
    rows.append(('assets/web/genesis-intro.mp4', '1920x1080', '1920x1080', v0, v1, f'h264 SSIM {ssim:.4f}', 1))
    files['assets/web/genesis-intro.mp4'] = '/assets/img/genesis-intro.mp4'

    code = [
        ("'assets/web/team-' + id + '.jpg'", "__gesImg('team-' + id)"),
        ("'assets/web/training-' + n + '.jpg'", "__gesImg('training-' + n)"),
        ("'assets/web/' + f", "__gesImg(f)"),
        ("'https://www.leadersharbor.pk/images/logo-horizontal.png'", "'school-leaders-harbor'"),
    ] + [(f"'school-{s}.png'", f"'school-{s}'") for s in SCHOOLS]
    lookup = {Path(u).stem: u for u in set(files.values()) if u.startswith('/assets/img/')}
    lookup['school-leaders-harbor'] = '/assets/img/school-leaders-harbor.webp'
    # first-screen images each page should start fetching immediately
    preload = {
        'Home': [files[f'assets/web/reel-{i:02d}.png'] for i in range(1, 5)],  # the four hero collage photos shown first
        'Why PBL': [files['file_000000002228820ba1883c5dc9c0f628-mv58rxhd-i3y3.png']],
    }
    (OUT / 'manifest.json').write_text(json.dumps({'files': files, 'code': code, 'lookup': lookup, 'preload': preload}, indent=1))

    t0 = t1 = 0
    for rel, nat, size, b0, b1, how, uses in rows:
        t0 += b0; t1 += b1
        nat = 'x'.join(map(str, nat)) if isinstance(nat, tuple) else nat
        size = 'x'.join(map(str, size)) if isinstance(size, tuple) else size
        print(f'{rel[:46]:46} {nat:>10} -> {size:<10} {b0 // 1024:6}K -> {b1 // 1024:5}K  {how}{"  (shared by %d uses)" % uses if uses > 1 else ""}')
    print(f'TOTAL {t0 // 1024}K -> {t1 // 1024}K')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
