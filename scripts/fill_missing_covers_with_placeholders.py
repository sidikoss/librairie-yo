#!/usr/bin/env python3
from __future__ import annotations

import colorsys
import hashlib
import json
import pathlib
import textwrap
import urllib.request
from typing import Any, Dict

from PIL import Image, ImageDraw, ImageFont

DB = "https://librairie-yo-default-rtdb.firebaseio.com"
ROOT = pathlib.Path(__file__).resolve().parents[1]
COVERS_DIR = ROOT / "public" / "covers"


def fetch_json(path: str, timeout: int = 30) -> Any:
    if "?" in path:
        node, q = path.split("?", 1)
        url = f"{DB}/{node}.json?{q}"
    else:
        url = f"{DB}/{path}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "cover-placeholder/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def patch_root(updates: Dict[str, Any], timeout: int = 60) -> None:
    url = f"{DB}/.json"
    payload = json.dumps(updates, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={"Content-Type": "application/json", "User-Agent": "cover-placeholder/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout):
        return


def pick_palette(seed: str) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    h = int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16)
    hue = (h % 360) / 360.0
    r1, g1, b1 = colorsys.hls_to_rgb(hue, 0.36, 0.55)
    r2, g2, b2 = colorsys.hls_to_rgb((hue + 0.08) % 1.0, 0.24, 0.45)
    return (int(r1 * 255), int(g1 * 255), int(b1 * 255)), (int(r2 * 255), int(g2 * 255), int(b2 * 255))


def gradient_image(width: int, height: int, c1: tuple[int, int, int], c2: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (width, height))
    px = img.load()
    for y in range(height):
        t = y / max(1, height - 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        for x in range(width):
            px[x, y] = (r, g, b)
    return img


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Keep default if no TTF is available.
    try:
        return ImageFont.truetype("arial.ttf", size=size)
    except Exception:
        return ImageFont.load_default()


def draw_placeholder_cover(title: str, author: str, out_path: pathlib.Path) -> None:
    w, h = 320, 480
    c1, c2 = pick_palette(title + "|" + author)
    img = gradient_image(w, h, c1, c2)
    d = ImageDraw.Draw(img)

    # subtle frame
    d.rectangle((10, 10, w - 10, h - 10), outline=(255, 255, 255, 60), width=2)

    title_font = load_font(24)
    author_font = load_font(16)

    wrapped_title = textwrap.fill((title or "Sans titre").strip(), width=20)
    wrapped_author = textwrap.fill((author or "Auteur inconnu").strip(), width=24)

    d.text((24, 80), wrapped_title, fill=(250, 250, 250), font=title_font, spacing=4)
    d.text((24, h - 120), wrapped_author, fill=(230, 230, 230), font=author_font, spacing=3)
    d.text((24, h - 50), "Librairie YO", fill=(245, 225, 180), font=author_font)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, format="JPEG", quality=72, optimize=True, progressive=True)


def main() -> None:
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    catalog = fetch_json("catalog") or {}
    books_keys = fetch_json("books?shallow=true") or {}

    missing = []
    for k, v in catalog.items():
        if not (v or {}).get("coverImage"):
            missing.append((k, str((v or {}).get("title") or ""), str((v or {}).get("author") or "")))

    print(f"missing={len(missing)}", flush=True)
    if not missing:
        return

    updates: Dict[str, Any] = {}
    for k, title, author in missing:
        out = COVERS_DIR / f"{k}.jpg"
        draw_placeholder_cover(title, author, out)
        path = f"/covers/{k}.jpg"
        updates[f"catalog/{k}/coverImage"] = path
        if k in books_keys:
            updates[f"books/{k}/coverImage"] = path
        print(f"placeholder={k}", flush=True)

    patch_root(updates)
    print(f"updated={len(missing)}", flush=True)


if __name__ == "__main__":
    main()

