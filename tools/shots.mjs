// Renders screenshots/1-title.png, 2-play.png and 3-win.png by executing the game's OWN
// modules headlessly: stageShot (game/src/shots.js) stages each state through the real
// rules, drawGame (game/src/render.js) draws it, and this file supplies the canvas — a
// small software rasterizer implementing exactly the canvas-2D subset the game uses
// (styles, rects, paths with quadratic/bezier/arc/ellipse, transforms, vertical linear
// gradients, and fillText via a built-in 5x7 bitmap font) — plus a PNG encoder built on
// node:zlib. No browser, no dependencies: `node tools/shots.mjs`.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { createGame } from '../game/src/world.js';
import { stageShot } from '../game/src/shots.js';
import { drawGame } from '../game/src/render.js';

const W = 1280;
const H = 720;

// ---------------------------------------------------------------- 5x7 bitmap font
// Rows top to bottom, 5 pixels per row. Covers the characters the game's text uses.
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '01010', '00100', '00100', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'],
  ',': ['00000', '00000', '00000', '00000', '00110', '00100', '01000'],
  ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'],
  ';': ['00000', '00110', '00110', '00000', '00110', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '*': ['00000', '00100', '10101', '01110', '10101', '00100', '00000'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
};

// ---------------------------------------------------------------- colours
function parseColor(style) {
  if (typeof style !== 'string') return null;
  if (style.startsWith('#')) {
    const hex = style.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  const named = { white: [255, 255, 255], black: [0, 0, 0] };
  return named[style] ?? [0, 0, 0];
}

function gradientColor(gradient, y) {
  const stops = gradient.stops;
  if (stops.length === 0) return [0, 0, 0];
  const span = gradient.y1 - gradient.y0;
  let t = span === 0 ? 0 : (y - gradient.y0) / span;
  t = Math.min(1, Math.max(0, t));
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const local = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
  const ca = parseColor(a[1]);
  const cb = parseColor(b[1]);
  return [
    Math.round(ca[0] + (cb[0] - ca[0]) * local),
    Math.round(ca[1] + (cb[1] - ca[1]) * local),
    Math.round(ca[2] + (cb[2] - ca[2]) * local),
  ];
}

// ---------------------------------------------------------------- raster canvas
class RasterCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buf = new Uint8ClampedArray(width * height * 4);
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.font = '16px sans-serif';
    this.textAlign = 'left';
    this.textBaseline = 'alphabetic';
    this.m = [1, 0, 0, 1, 0, 0]; // a, b, c, d, e, f
    this.stack = [];
    this.path = [];
    this.current = null;
  }

  save() {
    this.stack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      globalAlpha: this.globalAlpha,
      font: this.font,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
      m: this.m.slice(),
    });
  }

  restore() {
    const s = this.stack.pop();
    if (!s) return;
    this.fillStyle = s.fillStyle;
    this.strokeStyle = s.strokeStyle;
    this.lineWidth = s.lineWidth;
    this.globalAlpha = s.globalAlpha;
    this.font = s.font;
    this.textAlign = s.textAlign;
    this.textBaseline = s.textBaseline;
    this.m = s.m;
  }

  translate(tx, ty) {
    const [a, b, c, d, e, f] = this.m;
    this.m = [a, b, c, d, e + a * tx + c * ty, f + b * tx + d * ty];
  }

  scale(sx, sy) {
    const [a, b, c, d, e, f] = this.m;
    this.m = [a * sx, b * sx, c * sy, d * sy, e, f];
  }

  apply(x, y) {
    const [a, b, c, d, e, f] = this.m;
    return [a * x + c * y + e, b * x + d * y + f];
  }

  createLinearGradient(x0, y0, x1, y1) {
    const gradient = {
      isGradient: true,
      x0,
      y0,
      x1,
      y1,
      stops: [],
      addColorStop(offset, color) {
        this.stops.push([offset, color]);
        this.stops.sort((p, q) => p[0] - q[0]);
      },
    };
    return gradient;
  }

  paint(x, y, rgb) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    const alpha = this.globalAlpha;
    if (alpha >= 1) {
      this.buf[i] = rgb[0];
      this.buf[i + 1] = rgb[1];
      this.buf[i + 2] = rgb[2];
      this.buf[i + 3] = 255;
    } else {
      const inv = 1 - alpha;
      this.buf[i] = Math.round(rgb[0] * alpha + this.buf[i] * inv);
      this.buf[i + 1] = Math.round(rgb[1] * alpha + this.buf[i + 1] * inv);
      this.buf[i + 2] = Math.round(rgb[2] * alpha + this.buf[i + 2] * inv);
      this.buf[i + 3] = 255;
    }
  }

  styleColor(style, y) {
    if (style && style.isGradient) {
      // Gradients are vertical in the game; endpoints go through the current transform.
      const [, gy0] = this.apply(style.x0, style.y0);
      const [, gy1] = this.apply(style.x1, style.y1);
      return gradientColor({ stops: style.stops, y0: gy0, y1: gy1 }, y);
    }
    return parseColor(style);
  }

  // ---- paths
  beginPath() {
    this.path = [];
    this.current = null;
  }

  moveTo(x, y) {
    this.current = { pts: [this.apply(x, y)], closed: false };
    this.path.push(this.current);
  }

  lineTo(x, y) {
    if (!this.current) {
      this.moveTo(x, y);
      return;
    }
    this.current.pts.push(this.apply(x, y));
  }

  closePath() {
    if (this.current) this.current.closed = true;
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    if (!this.current) this.moveTo(cpx, cpy);
    const p0 = this.current.pts[this.current.pts.length - 1];
    const [ox, oy] = [p0[0], p0[1]];
    // Control/end in device space (transform is affine, so sampling in device space is exact).
    const [cx, cy] = this.apply(cpx, cpy);
    const [ex, ey] = this.apply(x, y);
    const steps = 20;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const u = 1 - t;
      this.current.pts.push([
        u * u * ox + 2 * u * t * cx + t * t * ex,
        u * u * oy + 2 * u * t * cy + t * t * ey,
      ]);
    }
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    if (!this.current) this.moveTo(cp1x, cp1y);
    const p0 = this.current.pts[this.current.pts.length - 1];
    const [ox, oy] = [p0[0], p0[1]];
    const [ax, ay] = this.apply(cp1x, cp1y);
    const [bx, by] = this.apply(cp2x, cp2y);
    const [ex, ey] = this.apply(x, y);
    const steps = 24;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const u = 1 - t;
      this.current.pts.push([
        u * u * u * ox + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * ex,
        u * u * u * oy + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * ey,
      ]);
    }
  }

  arc(x, y, r, startAngle, endAngle, counterclockwise = false) {
    this.ellipse(x, y, r, r, 0, startAngle, endAngle, counterclockwise);
  }

  ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise = false) {
    let start = startAngle;
    let end = endAngle;
    if (!counterclockwise) {
      while (end < start) end += Math.PI * 2;
    } else {
      while (end > start) end -= Math.PI * 2;
    }
    const sweep = end - start;
    const steps = Math.max(8, Math.ceil(Math.abs(sweep) / (Math.PI / 24)));
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    for (let i = 0; i <= steps; i += 1) {
      const a = start + (sweep * i) / steps;
      const px = Math.cos(a) * rx;
      const py = Math.sin(a) * ry;
      const dx = x + px * cosR - py * sinR;
      const dy = y + px * sinR + py * cosR;
      if (i === 0 && !this.current) this.moveTo(dx, dy);
      else this.lineTo(dx, dy);
    }
  }

  // ---- painting
  fillPolygons(polygons, style) {
    let minY = Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;
    const edges = [];
    for (const poly of polygons) {
      for (let i = 0; i < poly.length; i += 1) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % poly.length];
        if (y1 === y2) continue;
        edges.push([x1, y1, x2, y2]);
        minY = Math.min(minY, y1, y2);
        maxY = Math.max(maxY, y1, y2);
        minX = Math.min(minX, x1, x2);
        maxX = Math.max(maxX, x1, x2);
      }
    }
    if (edges.length === 0) return;
    const yStart = Math.max(0, Math.floor(minY));
    const yEnd = Math.min(this.height - 1, Math.ceil(maxY));
    const xStart = Math.max(0, Math.floor(minX));
    const xEnd = Math.min(this.width - 1, Math.ceil(maxX));
    for (let y = yStart; y <= yEnd; y += 1) {
      const cy = y + 0.5;
      const xs = [];
      for (const [x1, y1, x2, y2] of edges) {
        if ((cy >= y1 && cy < y2) || (cy >= y2 && cy < y1)) {
          xs.push(x1 + ((cy - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      if (xs.length < 2) continue;
      xs.sort((p, q) => p - q);
      const rgb = this.styleColor(style, cy);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const from = Math.max(xStart, Math.ceil(xs[k] - 0.5));
        const to = Math.min(xEnd, Math.floor(xs[k + 1] - 0.5));
        for (let x = from; x <= to; x += 1) this.paint(x, y, rgb);
      }
    }
  }

  fill() {
    this.fillPolygons(
      this.path.map((s) => s.pts),
      this.fillStyle,
    );
  }

  strokeSegment(x1, y1, x2, y2, half, rgb) {
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - half - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(Math.max(x1, x2) + half + 1));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - half - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(y1, y2) + half + 1));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.min(1, Math.max(0, t));
        const qx = x1 + t * dx - px;
        const qy = y1 + t * dy - py;
        if (qx * qx + qy * qy <= half * half) this.paint(x, y, rgb);
      }
    }
  }

  stroke() {
    const rgb = this.styleColor(this.strokeStyle, 0);
    const half = this.lineWidth / 2;
    for (const sub of this.path) {
      const pts = sub.pts;
      const count = sub.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < count; i += 1) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        this.strokeSegment(x1, y1, x2, y2, half, rgb);
      }
    }
  }

  fillRect(x, y, w, h) {
    const corners = [
      this.apply(x, y),
      this.apply(x + w, y),
      this.apply(x + w, y + h),
      this.apply(x, y + h),
    ];
    this.fillPolygons([corners], this.fillStyle);
  }

  strokeRect(x, y, w, h) {
    const rgb = this.styleColor(this.strokeStyle, 0);
    const half = this.lineWidth / 2;
    const pts = [
      this.apply(x, y),
      this.apply(x + w, y),
      this.apply(x + w, y + h),
      this.apply(x, y + h),
    ];
    for (let i = 0; i < 4; i += 1) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % 4];
      this.strokeSegment(x1, y1, x2, y2, half, rgb);
    }
  }

  fillText(value, x, y) {
    const match = /(\d+(?:\.\d+)?)px/.exec(this.font);
    const size = match ? parseFloat(match[1]) : 16;
    const scale = size / 7;
    const [dx, dy] = this.apply(x, y);
    const str = String(value).toUpperCase();
    const advance = 6 * scale;
    const total = str.length * advance - scale;
    let startX = dx;
    if (this.textAlign === 'center') startX = dx - total / 2;
    else if (this.textAlign === 'right' || this.textAlign === 'end') startX = dx - total;
    let topY = dy - 7 * scale;
    if (this.textBaseline === 'top' || this.textBaseline === 'hanging') topY = dy;
    else if (this.textBaseline === 'middle') topY = dy - 3.5 * scale;
    const rgb = this.styleColor(this.fillStyle, dy);
    for (let ci = 0; ci < str.length; ci += 1) {
      const glyph = GLYPHS[str[ci]] ?? GLYPHS['?'];
      const gx = startX + ci * advance;
      for (let row = 0; row < 7; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          if (glyph[row][col] !== '1') continue;
          const px0 = Math.round(gx + col * scale);
          const px1 = Math.round(gx + (col + 1) * scale);
          const py0 = Math.round(topY + row * scale);
          const py1 = Math.round(topY + (row + 1) * scale);
          for (let py = py0; py < py1; py += 1) {
            for (let px = px0; px < px1; px += 1) this.paint(px, py, rgb);
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(canvas) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * (canvas.width * 4 + 1);
    raw[rowStart] = 0; // filter: none
    Buffer.from(canvas.buf.buffer, canvas.buf.byteOffset + y * canvas.width * 4, canvas.width * 4).copy(raw, rowStart + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- render the three shots
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'screenshots');
mkdirSync(outDir, { recursive: true });

const SHOTS = [
  ['title', '1-title.png'],
  ['play', '2-play.png'],
  ['win', '3-win.png'],
];
const SEED = 7;

for (const [name, file] of SHOTS) {
  const game = createGame(SEED);
  stageShot(name, game);
  const canvas = new RasterCanvas(W, H);
  drawGame(canvas, game.state);
  const png = encodePng(canvas);
  writeFileSync(join(outDir, file), png);
  console.log(`${file}: ${png.length} bytes (shot=${name}, seed=${SEED}, screen=${game.state.screen})`);
}
