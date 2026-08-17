#!/usr/bin/env python3
"""Build 2×5 pattern sheets and a 100-shot overview from manifest.json."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "contact-sheets"
FONT_PATH = Path("/System/Library/Fonts/Hiragino Sans GB.ttc")
TILE_SIZE = 240


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if FONT_PATH.exists():
        return ImageFont.truetype(str(FONT_PATH), size=size)
    return ImageFont.load_default()


def screenshot_square(image: Image.Image, canvas: dict[str, float]) -> Image.Image:
    margin = 12
    left = max(0, round(canvas["x"]) - margin)
    top = max(0, round(canvas["y"]) - margin)
    right = min(image.width, round(canvas["x"] + canvas["width"]) + margin)
    bottom = min(image.height, round(canvas["y"] + canvas["height"]) + margin)
    crop = image.crop((left, top, right, bottom)).convert("RGB")
    side = min(crop.width, crop.height)
    x = (crop.width - side) // 2
    y = (crop.height - side) // 2
    return crop.crop((x, y, x + side, y + side)).resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    screenshots = manifest["screenshots"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    font = load_font(15)

    pattern_paths: list[Path] = []
    for pattern in manifest["patterns"]:
        entries = sorted(
            (entry for entry in screenshots if entry["pattern"] == pattern["id"]),
            key=lambda entry: entry["location"],
        )
        sheet = Image.new("RGB", (TILE_SIZE * 5, TILE_SIZE * 2), "#181820")
        for index, entry in enumerate(entries):
            with Image.open(ROOT / entry["path"]) as source:
                tile = screenshot_square(source, entry["canvas"])
            draw = ImageDraw.Draw(tile, "RGBA")
            draw.rectangle((0, TILE_SIZE - 29, TILE_SIZE, TILE_SIZE), fill=(16, 16, 24, 224))
            draw.text((8, TILE_SIZE - 24), f'{entry["location"]}  {entry["locationName"]}', font=font, fill="#f8f0d8")
            sheet.paste(tile, ((index % 5) * TILE_SIZE, (index // 5) * TILE_SIZE))
        path = OUTPUT / f'pattern-{pattern["id"]}.webp'
        sheet.save(path, "WEBP", quality=88, method=6)
        pattern_paths.append(path)

    overview = Image.new("RGB", (1200, 1200), "#181820")
    for index, path in enumerate(pattern_paths):
        with Image.open(path) as sheet:
            thumb = sheet.convert("RGB").resize((600, 240), Image.Resampling.LANCZOS)
        overview.paste(thumb, ((index % 2) * 600, (index // 2) * 240))
    overview.save(OUTPUT / "all-patterns.webp", "WEBP", quality=88, method=6)


if __name__ == "__main__":
    main()
