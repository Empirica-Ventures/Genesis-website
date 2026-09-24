# Genesis Education Solutions website

Static marketing site (plain HTML/CSS/JS, no build step) deployed on Vercel,
with a small set of serverless functions under `api/` for the password-gated
team upload page (`team-uploads.html`). See `.env.example` for the env vars
that page needs.

Public pages (`index.html`, `why-pbl.html`, `program.html`,
`sample-project.html`, `case-studies.html`, `team.html`, `faq.html`,
`contact.html`, `terms.html`) come from the Claude Design export in
[Ultrafay/genesis-new-design](https://github.com/Ultrafay/genesis-new-design):
section styling is inline, as exported. Shared pieces live in
`css/tokens.css` (design-system tokens), `css/site.css` (header/nav, footer,
buttons, form fields) and `js/site.js` (nav dropdowns, mobile menu, FAQ
accordion, partner carousel, training slideshow, contact form via
FormSubmit). The header/nav and footer are duplicated in every page, so
change them in all of them. New-design images are in `assets/web/`.
`team-uploads.html` still uses the older `css/styles.css`.

## Keeping it fast

- **Images** in `assets/web/`: logos are lossless WebP at ~2× their on-screen
  size; team portraits and portrait training photos are WebP (quality 90,
  training photos capped at 920px tall — the slideshow is ≤460 css px).
  Hero/section photos stay as their original JPEGs (already well compressed;
  re-encoding them didn't save much without visible loss). Only switch an
  image to WebP if it comes out clearly smaller.
- **Caching**: `vercel.json` caches `assets/web/` and `assets/booklet/` for 30
  days and `assets/fonts/` for a year. When you *replace* an image, give it a
  new filename, otherwise returning visitors keep the old one for up to 30 days.
- **Loading**: the first photo on a page has `fetchpriority="high"`; every
  other `<img>` has `loading="lazy" decoding="async"`. The training slideshow
  on `case-studies.html` loads no photos until it's near the viewport.
- **Fonts**: Lato 400/700/900 is self-hosted from `assets/fonts/` (the
  hinted builds Google serves to Windows, so text renders exactly as it did
  with Google Fonts on every platform). Don't add Google Fonts links back.

## Deploying

Vercel project `genesis-site` (team "ultrafay's projects") deploys from this
repo: pushes to `main` go to production (genesiseducation.solutions), other
branches get preview deployments. If a merge doesn't show up in Vercel's
Deployments list at all, the GitHub link is broken — check the project's
Settings → Git connection and that the Vercel account has GitHub under
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
