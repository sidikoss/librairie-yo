#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import pathlib
import re
import unicodedata
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from typing import Any, Dict, Optional

from PIL import Image

DB = "https://librairie-yo-default-rtdb.firebaseio.com"
ROOT = pathlib.Path(__file__).resolve().parents[1]
COVERS_DIR = ROOT / "public" / "covers"


def log(msg: str) -> None:
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        print(msg.encode("ascii", "ignore").decode("ascii"), flush=True)


def fetch_json(path: str, timeout: int = 30) -> Any:
    if "?" in path:
        node, q = path.split("?", 1)
        url = f"{DB}/{node}.json?{q}"
    else:
        url = f"{DB}/{path}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "cover-fill/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def patch_root(updates: Dict[str, Any], timeout: int = 60) -> None:
    url = f"{DB}/.json"
    payload = json.dumps(updates, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={"Content-Type": "application/json", "User-Agent": "cover-fill/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout):
        return


def fold(value: str) -> str:
    txt = unicodedata.normalize("NFD", str(value or ""))
    txt = "".join(ch for ch in txt if unicodedata.category(ch) != "Mn")
    txt = txt.lower()
    txt = re.sub(r"[^a-z0-9\s]", " ", txt)
    return re.sub(r"\s+", " ", txt).strip()


def sim(a: str, b: str) -> float:
    aa = fold(a)
    bb = fold(b)
    if not aa or not bb:
        return 0.0
    return SequenceMatcher(None, aa, bb).ratio()


def download_optimize(image_url: str, out_path: pathlib.Path) -> bool:
    try:
        image_url = image_url.replace("http://", "https://")
        req = urllib.request.Request(image_url, headers={"User-Agent": "cover-fill/1.0"})
        with urllib.request.urlopen(req, timeout=25) as res:
            blob = res.read()
        img = Image.open(io.BytesIO(blob)).convert("RGB")
        if img.width > 320:
            ratio = 320 / float(img.width)
            img = img.resize((320, max(1, int(img.height * ratio))), Image.Resampling.LANCZOS)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_path, format="JPEG", quality=72, optimize=True, progressive=True)
        return True
    except Exception:
        return False


def google_thumb(title: str, author: str) -> Optional[str]:
    q = " ".join(x for x in [f'intitle:"{title}"' if title else "", f'inauthor:"{author}"' if author else ""] if x)
    if not q:
        return None
    url = (
        "https://www.googleapis.com/books/v1/volumes?"
        + urllib.parse.urlencode({"q": q, "maxResults": 5, "printType": "books", "projection": "lite"})
    )
    req = urllib.request.Request(url, headers={"User-Agent": "cover-fill/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
    except Exception:
        return None

    best = None
    best_score = 0.0
    for it in data.get("items", []):
        info = it.get("volumeInfo", {})
        it_title = str(info.get("title", ""))
        it_author = str((info.get("authors") or [""])[0])
        score = 0.7 * sim(title, it_title) + 0.3 * sim(author, it_author)
        if score > best_score:
            links = info.get("imageLinks", {})
            thumb = links.get("thumbnail") or links.get("smallThumbnail")
            if thumb:
                best = thumb
                best_score = score
    return best if best_score >= 0.4 else None


def openlibrary_thumb(title: str, author: str) -> Optional[str]:
    q = {"title": title, "limit": 8}
    if author:
        q["author"] = author
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"User-Agent": "cover-fill/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
    except Exception:
        return None

    best_cover = None
    best_score = 0.0
    for doc in data.get("docs", []):
        cover_i = doc.get("cover_i")
        if not cover_i:
            continue
        it_title = str(doc.get("title", ""))
        it_author = str((doc.get("author_name") or [""])[0])
        score = 0.7 * sim(title, it_title) + 0.3 * sim(author, it_author)
        if score > best_score:
            best_score = score
            best_cover = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"
    return best_cover if best_score >= 0.35 else None


def main() -> None:
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    catalog = fetch_json("catalog") or {}
    books_keys = fetch_json("books?shallow=true") or {}
    missing = []
    for k, v in catalog.items():
        if not (v or {}).get("coverImage"):
            missing.append((k, str((v or {}).get("title", "")), str((v or {}).get("author", ""))))

    log(f"Missing covers: {len(missing)}")
    updates: Dict[str, Any] = {}
    ok = 0

    for idx, (k, title, author) in enumerate(missing, start=1):
        thumb = google_thumb(title, author) or openlibrary_thumb(title, author)
        if not thumb:
            log(f"[{idx}/{len(missing)}] no-web-cover key={k} title={title}")
            continue
        out = COVERS_DIR / f"{k}.jpg"
        if download_optimize(thumb, out):
            path = f"/covers/{k}.jpg"
            updates[f"catalog/{k}/coverImage"] = path
            if k in books_keys:
                updates[f"books/{k}/coverImage"] = path
            ok += 1
            log(f"[{idx}/{len(missing)}] cover=ok key={k}")
        else:
            log(f"[{idx}/{len(missing)}] cover=download-fail key={k}")

    if updates:
        patch_root(updates)
    log(f"updated={ok}")


if __name__ == "__main__":
    main()
