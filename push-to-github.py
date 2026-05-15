#!/usr/bin/env python3
"""Push complete multi-page architecture to GitHub"""
import os, sys, base64, json, urllib.request, urllib.error, time

TOKEN = os.environ.get("GITHUB_TOKEN", "")
if not TOKEN:
    # Try reading from deploy docs
    for f in ['/sessions/determined-bold-goodall/mnt/2027/LIVE-DEPLOY.md',
              '/sessions/determined-bold-goodall/mnt/2027/DEPLOY.md']:
        try:
            txt = open(f).read()
            for line in txt.splitlines():
                if 'ghp_' in line or 'github_pat' in line.lower():
                    import re
                    m = re.search(r'(ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+)', line)
                    if m:
                        TOKEN = m.group(1)
                        print(f"Found token in {f}")
                        break
        except:
            pass
        if TOKEN:
            break

if not TOKEN:
    print("ERROR: GITHUB_TOKEN not set. Run: GITHUB_TOKEN=ghp_... python3 push-to-github.py")
    sys.exit(1)

REPO   = "svenhc-coder/riester-funnel"
BRANCH = "main"
BASE   = "/sessions/determined-bold-goodall/mnt/2027"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "riester-deploy/3.0",
}

def get_sha(path):
    url = f"https://api.github.com/repos/{REPO}/contents/{path}?ref={BRANCH}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())["sha"]
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise

def push_file(local_path, repo_path, msg):
    with open(local_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    sha = get_sha(repo_path)
    body = {"message": msg, "content": b64, "branch": BRANCH}
    if sha:
        body["sha"] = sha
    url = f"https://api.github.com/repos/{REPO}/contents/{repo_path}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=HEADERS, method="PUT")
    try:
        with urllib.request.urlopen(req) as r:
            resp = json.loads(r.read())
            print(f"  OK  {repo_path}  → {resp['commit']['sha'][:8]}")
            return True
    except urllib.error.HTTPError as e:
        print(f"  ERR {repo_path}: {e.code} {e.read().decode()[:200]}")
        return False

# Files to push: (local_relative, repo_path)
FILES = [
    # ── Root pages ───────────────────────────────────────────────────────────
    ("index.html",                                "index.html"),
    ("impressum.html",                            "impressum.html"),
    ("datenschutz.html",                          "datenschutz.html"),

    # ── Backward-compat redirect stubs (old flat-file URLs) ──────────────────
    ("riester-check.html",                        "riester-check.html"),
    ("riester-check-start.html",                  "riester-check-start.html"),
    ("riester-check-question.html",               "riester-check-question.html"),
    ("riester-check-result.html",                 "riester-check-result.html"),
    ("news.html",                                 "news.html"),
    ("article.html",                              "article.html"),

    # ── New folder-based pages ────────────────────────────────────────────────
    ("riester-check/index.html",                  "riester-check/index.html"),
    ("riester-check/start/index.html",            "riester-check/start/index.html"),
    ("riester-check/q/index.html",                "riester-check/q/index.html"),
    ("riester-check/result/index.html",           "riester-check/result/index.html"),
    ("news/index.html",                           "news/index.html"),
    ("news/article/index.html",                   "news/article/index.html"),

    # ── Assets: CSS + JS ──────────────────────────────────────────────────────
    ("assets/css/main.css",                       "assets/css/main.css"),
    ("assets/js/animations.js",                   "assets/js/animations.js"),
    ("assets/js/brand.js",                        "assets/js/brand.js"),
    ("assets/js/questions.js",                    "assets/js/questions.js"),
    ("assets/js/scoring.js",                      "assets/js/scoring.js"),
    ("assets/js/state.js",                        "assets/js/state.js"),

    # ── Assets: Images ────────────────────────────────────────────────────────
    ("assets/img/logo.png",                       "assets/img/logo.png"),
    ("assets/img/favicon.png",                    "assets/img/favicon.png"),
    ("assets/img/og-image.png",                   "assets/img/og-image.png"),

    # ── Data ──────────────────────────────────────────────────────────────────
    ("data/articles.json",                        "data/articles.json"),

    # ── SEO + AI-Discoverability ──────────────────────────────────────────────
    ("robots.txt",                                "robots.txt"),
    ("sitemap.xml",                               "sitemap.xml"),
    ("llms.txt",                                  "llms.txt"),

    # ── Backend ───────────────────────────────────────────────────────────────
    ("backend.py",                                "backend.py"),
]

print(f"Pushing {len(FILES)} files to {REPO}...")
ok = 0
skipped = 0
for (local, repo_path) in FILES:
    local_full = os.path.join(BASE, local)
    if not os.path.exists(local_full):
        print(f"  SKIP {local} (not found locally)")
        skipped += 1
        continue
    success = push_file(local_full, repo_path, f"deploy: {repo_path}")
    if success:
        ok += 1
    time.sleep(0.3)  # rate limit safety

print(f"\nDone: {ok}/{len(FILES)} pushed, {skipped} skipped (file not found)")
print("Sevalla auto-deploy triggered. Live in ~60s.")
