# Genesis Education Solutions website

Static marketing site deployed on Vercel, with a small set of serverless
functions under `api/` for the password-gated team upload page
(`team-uploads.html`, which still uses the older `css/styles.css`; see
`.env.example` for its env vars).

## How the public pages are built

The public pages are **generated** from the Claude Design handoff
(`design_handoff_genesis_website`, `.dc.html` design components). Don't edit
the generated files by hand. Get an updated handoff and rebuild:

```bash
python3 -I tools/build-from-design.py <path/to/design_handoff_genesis_website>
```

That rewrites the page files, `dc/` and `assets/img/`, and leaves everything
else alone (`api/`, team uploads, `assets/images/` QR codes, `assets/files/`
PDF). Route map (design file → URL → file), defined in `ROUTES` in the script:
Home `/` index.html · About `/about` · Why PBL `/approach` · Program
`/program` · Projects `/projects` · Sample Project `/projects/sample`
(projects/sample.html) · Partners `/partners` · FAQ `/faq` · Contact
`/contact` · Thank You `/thank-you` · Privacy `/privacy`.

How it works, so it stays pixel-identical to the design:
- Pages run the design tool's **own runtime** (`dc/support.js` + React 18.3.1,
  self-hosted, matching the runtime's integrity hashes). So every layout,
  animation and interaction (nav search, intro video, page curtain, scroll
  reveals, ring carousel, roadmap, forms…) is the design's exact code.
- Shared components (SiteNav, SiteFooter, CtaBand, DownloadForm) are bundled
  into each page (`window.__resourceBlobs`), so nothing is fetched at load
  time. Scripts, styles, fonts and hero images are preloaded.
- Performance-only patches, listed in the script's `patch_*` functions:
  - The curtain recognises clean URLs.
  - Poppins is self-hosted instead of a Google `@import`.
  - The teal-grid drift uses a GPU transform instead of repainting `mask-position`.
  - A SiteNav `componentDidUpdate` guard stops a console error the design throws.
- Verify a rebuild against the design: screenshot both at 1280px and 390px
  and diff them. Page heights must match, and differences should be limited
  to image re-encoding and animation timing.

## Images, video and fonts (keeping it fast)

`tools/optimize-design-media.py` (run by the build) writes `assets/img/`:
- **Sizing:** each image is sized to the largest it is ever drawn, from
  desktop at 2× retina to phone at 3×, including hover pop-outs. Sizes are in
  `DISPLAY`; re-measure if a layout changes.
- **Photos:** WebP quality 90, or the untouched original JPEG when that's smaller.
- **Logos and graphics:** lossless WebP, or WebP q95 with full-quality alpha
  when over 40 KB.
- **Duplicates:** byte-identical photos (the design reuses photos across the
  Home reel, Program ring and Approach hero) become one cached file.
- **Code-built paths:** paths the page code builds at runtime go through
  `window.__gesImg(name)`.
- **Intro video:** H.264 re-encode at 1080p (SSIM 0.9995), 1.9 MB → 0.4 MB.
- **Fonts:** Lato 300/400/700/900 + italics and Poppins 700 are self-hosted
  in `assets/fonts/`. Lato uses the hinted builds Google serves to Windows,
  so text renders as with Google Fonts everywhere. Don't add Google Fonts back.
- **Caching:** `vercel.json` caches `assets/img/` for 30 days, `assets/fonts/`
  for a year and React for 30 days. A replaced image needs a new filename,
  or returning visitors keep the old one. The optimiser rebuilds `assets/img/`
  from scratch, so rename anything whose content changes.

Old URLs (`/why-pbl`, `/case-studies`, `/sample-project`, `/team`, `/terms`,
`/education-solutions`, `/projects/the-formula`) permanently redirect to their
new pages in `vercel.json`, and `cleanUrls` redirects any `*.html` link.

## Deploying

Vercel project `genesis-site` (team "ultrafay's projects"). Pushes to `main`
*should* deploy to production (genesiseducation.solutions), but its GitHub
link has been unreliable. If a merge doesn't appear in Vercel's Deployments
list, trigger the project's deploy hook (Settings → Git → Deploy Hooks) with a
POST, or check the Git connection and the account's GitHub login under
Account Settings → Authentication.

## QR codes

QR codes for this project (business card, feedback form, etc.) are
generated with **[QR Code Monkey](https://www.qrcode-monkey.com)**'s custom
PNG endpoint — no account or API key needed, it's a plain GET request.

### Where they live

`assets/images/qr-code-<purpose>.png`, e.g.:
- `qr-code-business-card.png` — encodes `https://genesiseducation.solutions/assets/files/business-card.pdf`
- `qr-code-feedback-form.png` — encodes the feedback Google Form URL

### Generating a new one

```bash
curl -sS -o assets/images/qr-code-<purpose>.png \
  "https://api.qrcode-monkey.com//qr/custom?download=true&file=png&data=<URL_ENCODED_TARGET_URL>&size=1000&config=%7B%22body%22%3A%22square%22%2C%22eye%22%3A%22frame0%22%2C%22eyeBall%22%3A%22ball0%22%2C%22erf1%22%3A%5B%5D%2C%22erf2%22%3A%5B%5D%2C%22erf3%22%3A%5B%5D%2C%22brf1%22%3A%5B%5D%2C%22brf2%22%3A%5B%5D%2C%22brf3%22%3A%5B%5D%2C%22bodyColor%22%3A%22%23000000%22%2C%22bgColor%22%3A%22%23FFFFFF%22%2C%22eye1Color%22%3A%22%23000000%22%2C%22eye2Color%22%3A%22%23000000%22%2C%22eye3Color%22%3A%22%23000000%22%2C%22eyeBall1Color%22%3A%22%23000000%22%2C%22eyeBall2Color%22%3A%22%23000000%22%2C%22eyeBall3Color%22%3A%22%23000000%22%2C%22gradientColor1%22%3A%22%22%2C%22gradientColor2%22%3A%22%22%2C%22gradientType%22%3A%22linear%22%2C%22gradientOnEyes%22%3A%22true%22%2C%22logo%22%3A%22%22%2C%22logoMode%22%3A%22default%22%7D"
```

Replace `<URL_ENCODED_TARGET_URL>` with the destination URL, URL-encoded
(e.g. `python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "https://example.com/path"`).
The `config` param is the brand style — reuse it verbatim so every QR code
on this site looks the same: square body, solid black on white, no logo,
`frame0`/`ball0` eyes. Decoded, it's:

```json
{
  "body": "square",
  "eye": "frame0",
  "eyeBall": "ball0",
  "bodyColor": "#000000",
  "bgColor": "#FFFFFF",
  "eye1Color": "#000000", "eye2Color": "#000000", "eye3Color": "#000000",
  "eyeBall1Color": "#000000", "eyeBall2Color": "#000000", "eyeBall3Color": "#000000",
  "gradientColor1": "", "gradientColor2": "", "gradientType": "linear", "gradientOnEyes": "true",
  "logo": "", "logoMode": "default"
}
```

To tweak the look instead of reusing this config, build one visually at
qrcode-monkey.com and copy the `config` value out of the download URL it
gives you.

### Verify before committing

Don't trust that the request succeeded just because curl got a 200 — QR
Code Monkey can return a valid-looking PNG that doesn't decode cleanly at
small sizes or with certain configs. Actually decode it and check the
content matches:

```bash
pip install --quiet opencv-python-headless
python3 -c "
import cv2
data, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread('assets/images/qr-code-<purpose>.png'))
print(repr(data))
"
```

### Important: point QR codes at stable URLs, not files directly

`qr-code-business-card.png` encodes `/assets/files/business-card.pdf`, a
short path that `vercel.json` permanently redirects to the actual PDF
filename. It does **not** encode the PDF's filename directly. This means
swapping the PDF's content (see the redirect + `Content-Disposition` rules
in `vercel.json`) never requires regenerating or reprinting the QR code —
only the destination behind the stable path changes. Follow this same
pattern for any new printed QR code: give it a stable `/assets/...` (or
similar) path to encode, and make that path redirect to wherever the real
content currently lives.
