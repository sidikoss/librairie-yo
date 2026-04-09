#!/usr/bin/env python3
"""
Rebuild catalog metadata from source files and web hints:
- pageCount (prefer exact PDF parsing)
- coverImage (optimized local thumbnails in public/covers)
- num/price using the hybrid pricing rule
"""

from __future__ import annotations

import base64
import io
import json
import math
import pathlib
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any, Dict, Optional

import fitz  # pymupdf
from PIL import Image
from pypdf import PdfReader


DB = "https://librairie-yo-default-rtdb.firebaseio.com"
ROOT = pathlib.Path(__file__).resolve().parents[1]
COVERS_DIR = ROOT / "public" / "covers"

PRICE_BASE_GNF = 5000
PRICE_STEP_GNF = 5000
PRICE_PAGES_PER_STEP = 150
PRICE_MAX_GNF = 25000


@dataclass
class GoogleMeta:
    title: str = ""
    author: str = ""
    page_count: Optional[int] = None
    thumbnail_url: str = ""
    score: float = 0.0


def log(msg: str) -> None:
    print(msg, flush=True)


def fold(value: str) -> str:
    txt = unicodedata.normalize("NFD", str(value or ""))
    txt = "".join(ch for ch in txt if unicodedata.category(ch) != "Mn")
    txt = txt.lower()
    txt = re.sub(r"[^a-z0-9\s]", " ", txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def format_price_label(num: int) -> str:
    return f"{num:,}".replace(",", " ") + " GNF"


def compute_price(page_count: int) -> int:
    pages = max(1, int(page_count or 1))
    steps = max(1, math.ceil(pages / PRICE_PAGES_PER_STEP))
    computed = PRICE_BASE_GNF + (steps - 1) * PRICE_STEP_GNF
    return min(PRICE_MAX_GNF, computed)


def fetch_json(path: str, timeout: int = 45) -> Any:
    if "?" in path:
        node, query = path.split("?", 1)
        url = f"{DB}/{node}.json?{query}"
    else:
        url = f"{DB}/{path}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "catalog-rebuild/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        body = res.read()
    if not body:
        return None
    return json.loads(body.decode("utf-8"))


def patch_root(updates: Dict[str, Any], timeout: int = 120) -> Any:
    url = f"{DB}/.json"
    payload = json.dumps(updates, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={"Content-Type": "application/json", "User-Agent": "catalog-rebuild/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as res:
        body = res.read()
    return json.loads(body.decode("utf-8")) if body else {}


def decode_data_uri(data_uri: str) -> tuple[Optional[str], Optional[bytes]]:
    if not data_uri or "," not in data_uri:
        return None, None
    head, payload = data_uri.split(",", 1)
    m = re.match(r"^data:([^;]+);base64$", head.strip(), re.I)
    if not m:
        return None, None
    mime = m.group(1).lower()
    try:
        return mime, base64.b64decode(payload, validate=False)
    except Exception:
        return mime, None


def pdf_page_count(blob: bytes) -> Optional[int]:
    try:
        reader = PdfReader(io.BytesIO(blob), strict=False)
        count = len(reader.pages)
        return int(count) if count > 0 else None
    except Exception:
        return None


def render_pdf_cover(blob: bytes, out_path: pathlib.Path) -> bool:
    try:
        doc = fitz.open(stream=blob, filetype="pdf")
        if doc.page_count <= 0:
            return False
        page = doc.load_page(0)
        rect = page.rect
        if rect.width <= 0:
            return False
        scale = 320.0 / rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(out_path, format="JPEG", quality=72, optimize=True, progressive=True)
        return True
    except Exception:
        return False


def estimate_txt_pages(blob: bytes) -> Optional[int]:
    try:
        txt = blob.decode("utf-8", errors="ignore")
        words = len(re.findall(r"\w+", txt))
        if words <= 0:
            return None
        # Rough estimate: ~300 words/page.
        return max(1, math.ceil(words / 300))
    except Exception:
        return None


def similarity(a: str, b: str) -> float:
    aa = fold(a)
    bb = fold(b)
    if not aa or not bb:
        return 0.0
    return SequenceMatcher(None, aa, bb).ratio()


def query_google_books(title: str, author: str, timeout: int = 20) -> Optional[GoogleMeta]:
    if not title and not author:
        return None
    q_parts = []
    if title:
        q_parts.append(f'intitle:"{title}"')
    if author:
        q_parts.append(f'inauthor:"{author}"')
    q = " ".join(q_parts).strip()
    url = (
        "https://www.googleapis.com/books/v1/volumes?"
        + urllib.parse.urlencode({"q": q, "maxResults": 5, "printType": "books", "projection": "lite"})
    )
    req = urllib.request.Request(url, headers={"User-Agent": "catalog-rebuild/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
    except Exception:
        return None

    items = data.get("items") or []
    best = None
    best_score = 0.0
    for it in items:
        info = it.get("volumeInfo") or {}
        it_title = str(info.get("title") or "").strip()
        it_authors = info.get("authors") or []
        it_author = str(it_authors[0] if it_authors else "").strip()
        t_score = similarity(title, it_title)
        a_score = similarity(author, it_author)
        score = (0.7 * t_score) + (0.3 * a_score)
        if score > best_score:
            img_links = info.get("imageLinks") or {}
            thumb = img_links.get("thumbnail") or img_links.get("smallThumbnail") or ""
            best = GoogleMeta(
                title=it_title,
                author=it_author,
                page_count=(int(info["pageCount"]) if info.get("pageCount") else None),
                thumbnail_url=thumb,
                score=score,
            )
            best_score = score
    return best if best else None


def download_and_optimize_cover(image_url: str, out_path: pathlib.Path, timeout: int = 25) -> bool:
    if not image_url:
        return False
    # Prefer https to avoid mixed content warnings.
    image_url = image_url.replace("http://", "https://")
    req = urllib.request.Request(image_url, headers={"User-Agent": "catalog-rebuild/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            blob = res.read()
        img = Image.open(io.BytesIO(blob)).convert("RGB")
        target_w = 320
        if img.width > target_w:
            ratio = target_w / float(img.width)
            img = img.resize((target_w, max(1, int(img.height * ratio))), Image.Resampling.LANCZOS)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_path, format="JPEG", quality=72, optimize=True, progressive=True)
        return True
    except Exception:
        return False


def main() -> None:
    t0 = time.time()
    COVERS_DIR.mkdir(parents=True, exist_ok=True)

    log("Loading catalog/books keys...")
    catalog = fetch_json("catalog") or {}
    books_keys = fetch_json("books?shallow=true") or {}
    file_keys = fetch_json("book-files?shallow=true") or {}
    keys = list(catalog.keys())
    total = len(keys)
    log(f"Catalog items: {total}, book-files: {len(file_keys)}")

    google_cache: Dict[str, Optional[GoogleMeta]] = {}
    updates: Dict[str, Any] = {}

    stats = {
        "pages_from_pdf": 0,
        "pages_from_txt": 0,
        "pages_from_google": 0,
        "pages_from_existing": 0,
        "pages_fallback": 0,
        "covers_from_pdf": 0,
        "covers_from_google": 0,
        "covers_kept": 0,
        "updated_items": 0,
    }

    for idx, key in enumerate(keys, start=1):
        item = catalog.get(key) or {}
        title = str(item.get("title") or "").strip()
        author = str(item.get("author") or "").strip()
        existing_pages = int(item.get("pageCount") or 0)
        existing_cover = str(item.get("coverImage") or "").strip()
        pages = existing_pages if existing_pages > 0 else None
        cover_path = existing_cover if existing_cover.startswith("/covers/") else ""

        parsed_pdf = False
        parsed_text = False

        if key in file_keys:
            file_rec = fetch_json(f"book-files/{key}") or {}
            data_uri = str(file_rec.get("fileData") or "")
            file_type = str(file_rec.get("fileType") or "")
            file_name = str(file_rec.get("fileName") or "")
            mime, blob = decode_data_uri(data_uri)
            lower_name = file_name.lower()
            mime = (mime or file_type or "").lower()

            if blob and ("pdf" in mime or lower_name.endswith(".pdf")):
                pc = pdf_page_count(blob)
                if pc:
                    pages = pc
                    parsed_pdf = True
                    stats["pages_from_pdf"] += 1
                out = COVERS_DIR / f"{key}.jpg"
                if render_pdf_cover(blob, out):
                    cover_path = f"/covers/{key}.jpg"
                    stats["covers_from_pdf"] += 1
            elif blob and ("text/plain" in mime or lower_name.endswith(".txt")):
                pc = estimate_txt_pages(blob)
                if pc:
                    pages = pc
                    parsed_text = True
                    stats["pages_from_txt"] += 1

        need_google_pages = pages is None
        need_google_cover = not cover_path
        google_meta = None

        if need_google_pages or need_google_cover:
            cache_key = fold(f"{title}||{author}")
            if cache_key not in google_cache:
                google_cache[cache_key] = query_google_books(title, author)
            google_meta = google_cache.get(cache_key)

        if need_google_pages and google_meta and google_meta.page_count and google_meta.score >= 0.55:
            pages = int(google_meta.page_count)
            stats["pages_from_google"] += 1

        if need_google_cover and google_meta and google_meta.thumbnail_url and google_meta.score >= 0.55:
            out = COVERS_DIR / f"{key}.jpg"
            if download_and_optimize_cover(google_meta.thumbnail_url, out):
                cover_path = f"/covers/{key}.jpg"
                stats["covers_from_google"] += 1

        if pages is None and existing_pages > 0:
            pages = existing_pages
            stats["pages_from_existing"] += 1
        elif pages is None:
            pages = 150
            stats["pages_fallback"] += 1

        if not cover_path and existing_cover:
            cover_path = existing_cover
            stats["covers_kept"] += 1

        pages = int(max(1, pages))
        num = compute_price(pages)
        price = format_price_label(num)

        updates[f"catalog/{key}/pageCount"] = pages
        updates[f"catalog/{key}/num"] = num
        updates[f"catalog/{key}/price"] = price
        if cover_path:
            updates[f"catalog/{key}/coverImage"] = cover_path

        if key in books_keys:
            updates[f"books/{key}/pageCount"] = pages
            updates[f"books/{key}/num"] = num
            updates[f"books/{key}/price"] = price
            if cover_path:
                updates[f"books/{key}/coverImage"] = cover_path

        stats["updated_items"] += 1

        if idx % 10 == 0 or idx == total:
            src = "pdf" if parsed_pdf else ("txt" if parsed_text else "meta")
            log(f"[{idx}/{total}] {key} src={src} pages={pages} price={num}")

    log("Patching Firebase in one request...")
    patch_root(updates)

    elapsed = time.time() - t0
    log("Done.")
    log(json.dumps(stats, ensure_ascii=False, indent=2))
    log(f"covers_dir={COVERS_DIR}")
    log(f"elapsed_sec={elapsed:.1f}")


if __name__ == "__main__":
    main()
