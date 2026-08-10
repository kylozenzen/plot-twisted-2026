from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
IMAGE_REL = "assets/social/plot-twisted-share-8e257690.png"
IMAGE_URL = f"https://plot-twisted.netlify.app/{IMAGE_REL}"


def fail(message):
    raise SystemExit(f"social-preview validation failed: {message}")


redirects = (ROOT / "_redirects").read_text(encoding="utf-8")
for line in redirects.splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        continue
    source = stripped.split()[0]
    if source == "/":
        fail("the site root must be served directly by static index.html; do not add a root redirect or rewrite")

if (ROOT / "netlify/functions/play.js").exists():
    fail("netlify/functions/play.js must not exist; the game is static")
if (ROOT / "netlify/functions/clue-overrides.js").exists():
    fail("netlify/functions/clue-overrides.js must not exist; questions.json is the runtime source")

html = (ROOT / "index.html").read_text(encoding="utf-8")
required = [
    '<link rel="canonical" href="https://plot-twisted.netlify.app/">',
    '<meta property="og:url" content="https://plot-twisted.netlify.app/">',
    f'<meta property="og:image" content="{IMAGE_URL}">',
    f'<meta property="og:image:secure_url" content="{IMAGE_URL}">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    f'<meta name="twitter:image" content="{IMAGE_URL}">',
]
for tag in required:
    if tag not in html:
        fail(f"missing required tag: {tag}")

for stale in ("social-preview.png", ".netlify/images", "?v="):
    if stale in html:
        fail(f"index.html contains stale social-preview reference: {stale}")

image_path = ROOT / IMAGE_REL
if not image_path.exists():
    fail(f"missing social image: {IMAGE_REL}")
raw = image_path.read_bytes()
if len(raw) > 5 * 1024 * 1024:
    fail("social image exceeds LinkedIn's 5 MB limit")
if raw[:8] != b"\x89PNG\r\n\x1a\n":
    fail("social image is not a PNG")
if raw[12:16] != b"IHDR":
    fail("PNG IHDR chunk is missing")
width, height = struct.unpack(">II", raw[16:24])
if width != 1200 or height != 630:
    fail(f"social image must be exactly 1200x630; found {width}x{height}")

headers = (ROOT / "_headers").read_text(encoding="utf-8")
if f"/{IMAGE_REL}" not in headers or "Content-Type: image/png" not in headers:
    fail("_headers must explicitly serve the hashed social card as image/png")

service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")
if "social-preview.png" in service_worker or IMAGE_REL in service_worker:
    fail("social preview images must not be part of the service-worker runtime cache")

netlify = (ROOT / "netlify.toml").read_text(encoding="utf-8")
if 'publish = "."' not in netlify:
    fail("netlify.toml must pin the publish directory to the repository root")

print("social-preview validation passed")
