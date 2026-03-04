#!/usr/bin/env python3
"""Generate smooth Linkedin Feed Blocker icon PNGs for Chrome Web Store."""

from __future__ import annotations

import os
import struct
import zlib
from pathlib import Path

SIZES = (16, 32, 48, 128)
SUPERSAMPLE = 4

# Palette
BLUE = (10, 102, 194, 255)  # LinkedIn blue
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def _chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def _inside_rounded_rect(
    x: float,
    y: float,
    left: float,
    top: float,
    right: float,
    bottom: float,
    radius: float,
) -> bool:
    cx = (left + right) * 0.5
    cy = (top + bottom) * 0.5
    half_w = (right - left) * 0.5
    half_h = (bottom - top) * 0.5

    if abs(x - cx) > half_w or abs(y - cy) > half_h:
        return False

    inner_w = max(half_w - radius, 0.0)
    inner_h = max(half_h - radius, 0.0)
    dx = abs(x - cx) - inner_w
    dy = abs(y - cy) - inner_h

    if dx <= 0 and dy <= 0:
        return True
    if dx > 0 and dy > 0:
        return dx * dx + dy * dy <= radius * radius
    return max(dx, dy) <= radius


def _sample_color(x: float, y: float) -> tuple[int, int, int, int]:
    # Outer tile (transparent outside for clean rounded icon edges).
    if not _inside_rounded_rect(x, y, 0.08, 0.08, 0.92, 0.92, 0.20):
        return TRANSPARENT

    # White "X" overlay to signal the feed is blocked.
    inner = _inside_rounded_rect(x, y, 0.23, 0.23, 0.77, 0.77, 0.09)
    diagonal_a = abs(y - x) <= 0.09
    diagonal_b = abs(y - (1.0 - x)) <= 0.09
    if inner and (diagonal_a or diagonal_b):
        return WHITE

    return BLUE


def _pixel(x: int, y: int, size: int) -> tuple[int, int, int, int]:
    samples = SUPERSAMPLE * SUPERSAMPLE
    acc_r = 0
    acc_g = 0
    acc_b = 0
    acc_a = 0

    for sy in range(SUPERSAMPLE):
        for sx in range(SUPERSAMPLE):
            px = (x + (sx + 0.5) / SUPERSAMPLE) / size
            py = (y + (sy + 0.5) / SUPERSAMPLE) / size
            r, g, b, a = _sample_color(px, py)
            acc_r += r
            acc_g += g
            acc_b += b
            acc_a += a

    return (
        acc_r // samples,
        acc_g // samples,
        acc_b // samples,
        acc_a // samples,
    )


def _write_png(path: Path, size: int) -> None:
    rows = []
    for y in range(size):
        row = bytearray([0])  # No per-row PNG filter.
        for x in range(size):
            row.extend(_pixel(x, y, size))
        rows.append(bytes(row))

    data = b"".join(rows)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png += _chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += _chunk(b"IDAT", zlib.compress(data, level=9))
    png += _chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    icons_dir = root / "icons"
    os.makedirs(icons_dir, exist_ok=True)
    for size in SIZES:
        _write_png(icons_dir / f"icon{size}.png", size)
    print(f"Generated icons in {icons_dir}")


if __name__ == "__main__":
    main()
