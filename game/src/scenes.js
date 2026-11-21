// Scenes: three picture worlds (beach, park, room), each a list of parameterized objects
// drawn procedurally on canvas. A scene is built once per level from a seeded RNG: the left
// picture draws the base objects, the right picture draws a mutated copy — an object removed,
// recoloured, resized or moved, or a spare object added. Each mutation is recorded as a
// difference with a centre and radius in scene-local coordinates (600x540).
//
// Everything is drawn through a small canvas-2D subset only: fill/stroke styles and rects,
// paths (move/line/quadratic/bezier/arc/ellipse), fillText, save/restore/translate/scale,
// globalAlpha and vertical linear gradients. No images, no shadows, nothing else.

import { pick, range, shuffled } from './random.js';

export const SCENE_W = 600;
export const SCENE_H = 540;

/** An object: kind selects the drawing, x/y is its centre, s its scale, c/c2 its colours, v a variant. */
function obj(id, kind, x, y, s, c, c2, v) {
  return { id, kind, x, y, s, c, c2: c2 ?? c, v: v ?? 0 };
}

// ---------------------------------------------------------------- beach
function beachObjects() {
  return [
    obj('sun', 'sun', 92, 78, 1, '#ffd93b'),
    obj('cloud1', 'cloud', 300, 66, 1, '#ffffff'),
    obj('cloud2', 'cloud', 472, 118, 0.75, '#ffffff'),
    obj('boat', 'boat', 428, 282, 1, '#8a5a2b', '#ffffff'),
    obj('palm', 'palm', 524, 316, 1, '#2e9e4f', '#7a4a21'),
    obj('umbrella', 'umbrella', 178, 336, 1, '#e5534b', '#ffffff'),
    obj('towel', 'towel', 322, 436, 1, '#3e7bfa', '#ffffff'),
    obj('bucket', 'bucket', 252, 402, 1, '#ff8c42'),
    obj('ball', 'ball', 428, 452, 1, '#9b5de5', '#ffffff'),
    obj('crab', 'crab', 92, 398, 1, '#e5534b'),
    obj('shell1', 'shell', 122, 474, 1, '#ff9fb2'),
    obj('starfish', 'starfish', 356, 500, 1, '#ff8c42'),
    obj('shell2', 'shell', 502, 482, 0.8, '#ffd6e0'),
  ];
}
const BEACH_SPARES = [
  obj('spare-shell', 'shell', 462, 392, 0.9, '#c3a6ff'),
  obj('spare-star', 'starfish', 148, 512, 0.85, '#ffd93b'),
  obj('spare-ball', 'ball', 528, 428, 0.8, '#37d67a', '#ffffff'),
];

// ---------------------------------------------------------------- park
function parkObjects() {
  return [
    obj('bird1', 'bird', 196, 88, 1, '#3e7bfa'),
    obj('bird2', 'bird', 356, 64, 0.85, '#e5534b'),
    obj('kite', 'kite', 452, 112, 1, '#e5534b', '#ffd93b'),
    obj('tree1', 'tree', 108, 246, 1.2, '#2e9e4f', '#7a4a21'),
    obj('tree2', 'tree', 302, 214, 1, '#43b25f', '#7a4a21'),
    obj('tree3', 'tree', 502, 252, 1.1, '#27884a', '#7a4a21'),
    obj('lamp', 'lampPost', 58, 336, 1, '#37415c', '#ffd93b'),
    obj('bush1', 'bush', 424, 362, 1, '#2e9e4f'),
    obj('bush2', 'bush', 148, 336, 0.8, '#43b25f'),
    obj('bench', 'bench', 300, 404, 1, '#8a5a2b'),
    obj('dog', 'dog', 178, 436, 1, '#b07a45', '#8a5a2b'),
    obj('blanket', 'blanket', 462, 452, 1, '#e5534b', '#ffffff'),
    obj('flower1', 'flower', 100, 492, 1, '#ff2e88'),
    obj('flower2', 'flower', 224, 506, 1, '#ffd93b'),
    obj('flower3', 'flower', 382, 496, 1, '#c3a6ff'),
    obj('flower4', 'flower', 506, 508, 1, '#ff8c42'),
  ];
}
const PARK_SPARES = [
  obj('spare-flower', 'flower', 300, 516, 1, '#3e7bfa'),
  obj('spare-bird', 'bird', 522, 92, 0.9, '#37d67a'),
  obj('spare-bush', 'bush', 246, 352, 0.7, '#27884a'),
];

// ---------------------------------------------------------------- room
function roomObjects() {
  return [
    obj('window', 'window', 148, 148, 1, '#aee2ff', '#ffffff'),
    obj('clock', 'clock', 516, 108, 1, '#ffffff', '#37415c', 0.6),
    obj('frame1', 'frame', 302, 118, 1, '#8a5a2b', '#7fd08a', 0),
    obj('frame2', 'frame', 424, 132, 0.9, '#37415c', '#ffd93b', 1),
    obj('frame3', 'frame', 330, 252, 0.8, '#e5534b', '#aee2ff', 2),
    obj('book1', 'book', 452, 202, 1, '#e5534b'),
    obj('book2', 'book', 480, 202, 1, '#3e7bfa'),
    obj('book3', 'book', 508, 202, 1, '#37d67a'),
    obj('lamp', 'floorLamp', 528, 316, 1, '#ffd93b', '#37415c'),
    obj('sofa', 'sofa', 218, 396, 1.25, '#5b6ee1', '#4758b8'),
    obj('cat', 'cat', 168, 342, 1, '#ff8c42', '#e5534b'),
    obj('plant', 'plant', 66, 408, 1, '#2e9e4f', '#c96f2e'),
    obj('mug', 'mug', 512, 392, 1, '#ff2e88', '#37415c'),
    obj('rug', 'rug', 300, 478, 1, '#e5534b', '#ffd93b'),
  ];
}
const ROOM_SPARES = [
  obj('spare-book', 'book', 536, 202, 1, '#c3a6ff'),
  obj('spare-plant', 'plant', 560, 448, 0.7, '#43b25f', '#c96f2e'),
  obj('spare-mug', 'mug', 96, 470, 0.85, '#3e7bfa', '#37415c'),
];

export const SCENES = [
  { name: 'BEACH', make: beachObjects, spares: BEACH_SPARES },
  { name: 'PARK', make: parkObjects, spares: PARK_SPARES },
  { name: 'ROOM', make: roomObjects, spares: ROOM_SPARES },
];

/** Colours a "colour changed" difference can swap to: always clearly different from the original. */
const ALT_COLORS = ['#e5534b', '#3e7bfa', '#37d67a', '#ffd93b', '#9b5de5', '#ff8c42', '#00b8a9', '#ff2e88'];

function clone(o) {
  return { ...o };
}

/**
 * Build the scene for `level` (1-based; scenes cycle beach, park, room) with `diffTotal`
 * differences, all decided by `rng`. Returns the left objects, the right objects and the
 * difference list ({x, y, r, kind, id} in scene-local coordinates).
 */
export function buildScene(rng, level, diffTotal) {
  const def = SCENES[(level - 1) % SCENES.length];
  const left = def.make();
  const right = left.map(clone);
  const byId = new Map(right.map((o) => [o.id, o]));
  const diffs = [];

  const kinds = shuffled(rng, ['remove', 'color', 'size', 'move', 'add', 'color', 'remove', 'size', 'move']);
  const targets = shuffled(rng, left.slice());
  let spareIndex = 0;
  let targetIndex = 0;

  for (let i = 0; i < diffTotal; i += 1) {
    const kind = kinds[i % kinds.length];
    if (kind === 'add' && spareIndex < def.spares.length) {
      const spare = clone(def.spares[spareIndex]);
      spareIndex += 1;
      spare.x += Math.round(range(rng, -8, 8));
      spare.y += Math.round(range(rng, -6, 6));
      right.push(spare);
      diffs.push({ x: spare.x, y: spare.y, r: 36, kind, id: spare.id });
      continue;
    }
    const base = targets[targetIndex % targets.length];
    targetIndex += 1;
    const twin = byId.get(base.id);
    const r = Math.max(32, Math.round(34 * base.s));
    if (kind === 'remove') {
      right.splice(right.indexOf(twin), 1);
      diffs.push({ x: base.x, y: base.y, r, kind, id: base.id });
    } else if (kind === 'color') {
      const options = ALT_COLORS.filter((c) => c !== base.c);
      twin.c = pick(rng, options);
      if (base.kind === 'frame') twin.c2 = pick(rng, options.filter((c) => c !== twin.c));
      diffs.push({ x: base.x, y: base.y, r, kind, id: base.id });
    } else if (kind === 'size') {
      twin.s = base.s * (rng() < 0.5 ? 1.45 : 0.6);
      diffs.push({ x: base.x, y: base.y, r: r + 8, kind, id: base.id });
    } else {
      const dx = (rng() < 0.5 ? -1 : 1) * Math.round(range(rng, 38, 55));
      const dy = (rng() < 0.5 ? -1 : 1) * Math.round(range(rng, 22, 36));
      twin.x = Math.min(SCENE_W - 30, Math.max(30, base.x + dx));
      twin.y = Math.min(SCENE_H - 30, Math.max(30, base.y + dy));
      diffs.push({ x: base.x, y: base.y, r: r + 20, kind, id: base.id });
    }
  }
  return { name: def.name, index: (level - 1) % SCENES.length, left, right, diffs };
}

// ---------------------------------------------------------------- backgrounds
function drawBackground(ctx, sceneIndex) {
  if (sceneIndex === 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#7ec8f7');
    sky.addColorStop(1, '#dff4ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SCENE_W, 300);
    ctx.fillStyle = '#1b9aaa';
    ctx.fillRect(0, 238, SCENE_W, 96);
    ctx.fillStyle = '#7fd1dc';
    ctx.fillRect(0, 238, SCENE_W, 10);
    ctx.fillStyle = '#f2dda0';
    ctx.fillRect(0, 334, SCENE_W, SCENE_H - 334);
    ctx.fillStyle = '#e8cf8d';
    ctx.fillRect(60, 420, 26, 7);
    ctx.fillRect(430, 372, 30, 7);
    ctx.fillRect(210, 500, 24, 7);
  } else if (sceneIndex === 1) {
    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#8ed0ff');
    sky.addColorStop(1, '#e6f7ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SCENE_W, 260);
    ctx.fillStyle = '#69b455';
    ctx.fillRect(0, 210, SCENE_W, SCENE_H - 210);
    ctx.fillStyle = '#7cc464';
    ctx.fillRect(0, 210, SCENE_W, 16);
    ctx.fillStyle = '#d9c08a';
    ctx.beginPath();
    ctx.ellipse(300, 520, 210, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#f3e2c7';
    ctx.fillRect(0, 0, SCENE_W, 404);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 388, SCENE_W, 16);
    ctx.fillStyle = '#b07a45';
    ctx.fillRect(0, 404, SCENE_W, SCENE_H - 404);
    ctx.fillStyle = '#96622f';
    ctx.fillRect(0, 404, SCENE_W, 8);
    ctx.fillRect(120, 452, SCENE_W, 5);
    ctx.fillRect(60, 500, SCENE_W, 5);
    // The shelf the books stand on.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(428, 226, 140, 10);
  }
}

// ---------------------------------------------------------------- object drawing
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

const DRAW = {
  sun(ctx, o) {
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(o.x + Math.cos(a) * 40 * o.s, o.y + Math.sin(a) * 40 * o.s);
      ctx.lineTo(o.x + Math.cos(a) * 56 * o.s, o.y + Math.sin(a) * 56 * o.s);
      ctx.stroke();
    }
    ctx.fillStyle = o.c;
    circle(ctx, o.x, o.y, 34 * o.s);
    ctx.fillStyle = '#e8a812';
    circle(ctx, o.x - 10 * o.s, o.y - 6 * o.s, 4 * o.s);
    circle(ctx, o.x + 11 * o.s, o.y - 6 * o.s, 4 * o.s);
  },
  cloud(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 44 * o.s, 20 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, o.x - 22 * o.s, o.y + 2 * o.s, 16 * o.s);
    circle(ctx, o.x + 4 * o.s, o.y - 10 * o.s, 22 * o.s);
    circle(ctx, o.x + 28 * o.s, o.y + 2 * o.s, 15 * o.s);
  },
  boat(ctx, o) {
    line(ctx, o.x, o.y - 6 * o.s, o.x, o.y - 52 * o.s, 4, '#7a4a21');
    ctx.fillStyle = o.c2;
    poly(ctx, [[o.x + 4 * o.s, o.y - 50 * o.s], [o.x + 4 * o.s, o.y - 10 * o.s], [o.x + 38 * o.s, o.y - 10 * o.s]]);
    ctx.fillStyle = '#ffd93b';
    poly(ctx, [[o.x - 4 * o.s, o.y - 44 * o.s], [o.x - 4 * o.s, o.y - 10 * o.s], [o.x - 30 * o.s, o.y - 10 * o.s]]);
    ctx.fillStyle = o.c;
    poly(ctx, [[o.x - 46 * o.s, o.y - 6 * o.s], [o.x + 46 * o.s, o.y - 6 * o.s], [o.x + 32 * o.s, o.y + 16 * o.s], [o.x - 32 * o.s, o.y + 16 * o.s]]);
  },
  palm(ctx, o) {
    ctx.strokeStyle = o.c2;
    ctx.lineWidth = 11 * o.s;
    ctx.beginPath();
    ctx.moveTo(o.x - 14 * o.s, o.y + 66 * o.s);
    ctx.quadraticCurveTo(o.x - 4 * o.s, o.y, o.x + 8 * o.s, o.y - 52 * o.s);
    ctx.stroke();
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 7 * o.s;
    const tips = [[-52, -34], [-30, -58], [6, -66], [40, -52], [56, -24]];
    for (const [tx, ty] of tips) {
      ctx.beginPath();
      ctx.moveTo(o.x + 8 * o.s, o.y - 52 * o.s);
      ctx.quadraticCurveTo(o.x + (8 + tx / 2) * o.s, o.y + (-64) * o.s, o.x + (8 + tx) * o.s, o.y + (-52 + ty + 40) * o.s);
      ctx.stroke();
    }
    ctx.fillStyle = '#7a4a21';
    circle(ctx, o.x + 2 * o.s, o.y - 44 * o.s, 8 * o.s);
    circle(ctx, o.x + 16 * o.s, o.y - 42 * o.s, 7 * o.s);
  },
  umbrella(ctx, o) {
    line(ctx, o.x, o.y - 26 * o.s, o.x + 4 * o.s, o.y + 52 * o.s, 5, '#7a4a21');
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.arc(o.x, o.y - 24 * o.s, 58 * o.s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = o.c2;
    poly(ctx, [[o.x - 20 * o.s, o.y - 68 * o.s], [o.x, o.y - 24 * o.s], [o.x - 38 * o.s, o.y - 24 * o.s]]);
    poly(ctx, [[o.x + 20 * o.s, o.y - 68 * o.s], [o.x + 38 * o.s, o.y - 24 * o.s], [o.x, o.y - 24 * o.s]]);
    ctx.fillStyle = o.c;
    circle(ctx, o.x, o.y - 82 * o.s, 6 * o.s);
  },
  towel(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 52 * o.s, o.y - 22 * o.s, 104 * o.s, 44 * o.s);
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 52 * o.s, o.y - 8 * o.s, 104 * o.s, 7 * o.s);
    ctx.fillRect(o.x - 52 * o.s, o.y + 8 * o.s, 104 * o.s, 7 * o.s);
  },
  bucket(ctx, o) {
    ctx.strokeStyle = '#37415c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(o.x, o.y - 16 * o.s, 22 * o.s, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = o.c;
    poly(ctx, [[o.x - 26 * o.s, o.y - 16 * o.s], [o.x + 26 * o.s, o.y - 16 * o.s], [o.x + 19 * o.s, o.y + 24 * o.s], [o.x - 19 * o.s, o.y + 24 * o.s]]);
    ctx.fillStyle = '#f2dda0';
    ctx.fillRect(o.x - 26 * o.s, o.y - 22 * o.s, 52 * o.s, 8 * o.s);
  },
  ball(ctx, o) {
    ctx.fillStyle = o.c;
    circle(ctx, o.x, o.y, 25 * o.s);
    ctx.strokeStyle = o.c2;
    ctx.lineWidth = 6 * o.s;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 16 * o.s, -0.6, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(o.x, o.y, 16 * o.s, Math.PI - 0.6, Math.PI + 0.9);
    ctx.stroke();
  },
  crab(ctx, o) {
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 4 * o.s;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(o.x + side * 18 * o.s, o.y + (i - 1) * 7 * o.s);
        ctx.lineTo(o.x + side * 34 * o.s, o.y + (i - 1) * 10 * o.s + 8 * o.s);
        ctx.stroke();
      }
    }
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 24 * o.s, 15 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, o.x - 32 * o.s, o.y - 14 * o.s, 9 * o.s);
    circle(ctx, o.x + 32 * o.s, o.y - 14 * o.s, 9 * o.s);
    ctx.fillStyle = '#ffffff';
    circle(ctx, o.x - 8 * o.s, o.y - 8 * o.s, 4 * o.s);
    circle(ctx, o.x + 8 * o.s, o.y - 8 * o.s, 4 * o.s);
  },
  shell(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.arc(o.x, o.y + 8 * o.s, 20 * o.s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d1788f';
    ctx.lineWidth = 2.5;
    for (const dx of [-12, 0, 12]) {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + 8 * o.s);
      ctx.lineTo(o.x + dx * o.s, o.y - 10 * o.s);
      ctx.stroke();
    }
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 20 * o.s, o.y + 6 * o.s, 40 * o.s, 5 * o.s);
  },
  starfish(ctx, o) {
    ctx.fillStyle = o.c;
    const pts = [];
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? 24 * o.s : 10 * o.s;
      pts.push([o.x + Math.cos(a) * rad, o.y + Math.sin(a) * rad]);
    }
    poly(ctx, pts);
    ctx.fillStyle = '#e56f1f';
    circle(ctx, o.x, o.y, 4 * o.s);
  },
  tree(ctx, o) {
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 8 * o.s, o.y + 6 * o.s, 16 * o.s, 58 * o.s);
    ctx.fillStyle = o.c;
    circle(ctx, o.x, o.y - 26 * o.s, 34 * o.s);
    circle(ctx, o.x - 28 * o.s, o.y - 4 * o.s, 25 * o.s);
    circle(ctx, o.x + 28 * o.s, o.y - 4 * o.s, 25 * o.s);
    ctx.fillStyle = '#e5534b';
    circle(ctx, o.x - 14 * o.s, o.y - 20 * o.s, 5 * o.s);
    circle(ctx, o.x + 18 * o.s, o.y - 34 * o.s, 5 * o.s);
    circle(ctx, o.x + 4 * o.s, o.y + 2 * o.s, 5 * o.s);
  },
  lampPost(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 4 * o.s, o.y - 44 * o.s, 8 * o.s, 92 * o.s);
    ctx.fillRect(o.x - 14 * o.s, o.y + 44 * o.s, 28 * o.s, 6 * o.s);
    ctx.fillStyle = o.c2;
    circle(ctx, o.x, o.y - 56 * o.s, 13 * o.s);
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(o.x, o.y - 56 * o.s, 15 * o.s, 0, Math.PI * 2);
    ctx.stroke();
  },
  bush(ctx, o) {
    ctx.fillStyle = o.c;
    circle(ctx, o.x - 24 * o.s, o.y + 8 * o.s, 20 * o.s);
    circle(ctx, o.x, o.y - 6 * o.s, 26 * o.s);
    circle(ctx, o.x + 24 * o.s, o.y + 8 * o.s, 20 * o.s);
    ctx.fillStyle = '#ff9fb2';
    circle(ctx, o.x - 10 * o.s, o.y - 12 * o.s, 4 * o.s);
    circle(ctx, o.x + 14 * o.s, o.y + 2 * o.s, 4 * o.s);
  },
  bench(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 62 * o.s, o.y - 26 * o.s, 124 * o.s, 10 * o.s);
    ctx.fillRect(o.x - 62 * o.s, o.y - 8 * o.s, 124 * o.s, 10 * o.s);
    ctx.fillRect(o.x - 62 * o.s, o.y + 12 * o.s, 124 * o.s, 10 * o.s);
    ctx.fillStyle = '#5d3a17';
    ctx.fillRect(o.x - 52 * o.s, o.y + 22 * o.s, 9 * o.s, 22 * o.s);
    ctx.fillRect(o.x + 43 * o.s, o.y + 22 * o.s, 9 * o.s, 22 * o.s);
  },
  dog(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 34 * o.s, 19 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, o.x + 38 * o.s, o.y - 14 * o.s, 16 * o.s);
    ctx.fillStyle = o.c2;
    ctx.beginPath();
    ctx.ellipse(o.x + 30 * o.s, o.y - 20 * o.s, 7 * o.s, 13 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 26 * o.s, o.y + 12 * o.s, 8 * o.s, 18 * o.s);
    ctx.fillRect(o.x + 16 * o.s, o.y + 12 * o.s, 8 * o.s, 18 * o.s);
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 6 * o.s;
    ctx.beginPath();
    ctx.moveTo(o.x - 32 * o.s, o.y - 8 * o.s);
    ctx.quadraticCurveTo(o.x - 48 * o.s, o.y - 22 * o.s, o.x - 42 * o.s, o.y - 30 * o.s);
    ctx.stroke();
    ctx.fillStyle = '#20242e';
    circle(ctx, o.x + 50 * o.s, o.y - 12 * o.s, 4 * o.s);
    circle(ctx, o.x + 36 * o.s, o.y - 18 * o.s, 3 * o.s);
  },
  kite(ctx, o) {
    ctx.fillStyle = o.c;
    poly(ctx, [[o.x, o.y - 38 * o.s], [o.x + 28 * o.s, o.y], [o.x, o.y + 38 * o.s], [o.x - 28 * o.s, o.y]]);
    ctx.fillStyle = o.c2;
    poly(ctx, [[o.x, o.y - 38 * o.s], [o.x + 28 * o.s, o.y], [o.x - 28 * o.s, o.y]]);
    ctx.strokeStyle = '#37415c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + 38 * o.s);
    ctx.quadraticCurveTo(o.x - 14 * o.s, o.y + 66 * o.s, o.x + 4 * o.s, o.y + 88 * o.s);
    ctx.stroke();
  },
  bird(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 15 * o.s, 9 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 4 * o.s;
    ctx.beginPath();
    ctx.arc(o.x - 16 * o.s, o.y + 2 * o.s, 12 * o.s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(o.x + 16 * o.s, o.y + 2 * o.s, 12 * o.s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = '#ffd93b';
    poly(ctx, [[o.x + 14 * o.s, o.y - 2 * o.s], [o.x + 24 * o.s, o.y + 1 * o.s], [o.x + 14 * o.s, o.y + 4 * o.s]]);
  },
  blanket(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 52 * o.s, o.y - 24 * o.s, 104 * o.s, 48 * o.s);
    ctx.fillStyle = o.c2;
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        if ((i + j) % 2 === 0) ctx.fillRect(o.x - 52 * o.s + i * 26 * o.s, o.y - 24 * o.s + j * 24 * o.s, 26 * o.s, 24 * o.s);
      }
    }
  },
  flower(ctx, o) {
    line(ctx, o.x, o.y + 22 * o.s, o.x, o.y, 4, '#2e9e4f');
    ctx.fillStyle = o.c;
    for (let i = 0; i < 5; i += 1) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      circle(ctx, o.x + Math.cos(a) * 10 * o.s, o.y - 6 * o.s + Math.sin(a) * 10 * o.s, 7 * o.s);
    }
    ctx.fillStyle = '#ffffff';
    circle(ctx, o.x, o.y - 6 * o.s, 5 * o.s);
  },
  window(ctx, o) {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(o.x - 62 * o.s, o.y - 72 * o.s, 124 * o.s, 144 * o.s);
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 52 * o.s, o.y - 62 * o.s, 104 * o.s, 124 * o.s);
    ctx.fillStyle = '#ffd93b';
    circle(ctx, o.x - 24 * o.s, o.y - 34 * o.s, 13 * o.s);
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 4 * o.s, o.y - 62 * o.s, 8 * o.s, 124 * o.s);
    ctx.fillRect(o.x - 52 * o.s, o.y - 4 * o.s, 104 * o.s, 8 * o.s);
    ctx.fillStyle = '#e5534b';
    ctx.fillRect(o.x - 62 * o.s, o.y - 72 * o.s, 22 * o.s, 110 * o.s);
    ctx.fillRect(o.x + 40 * o.s, o.y - 72 * o.s, 22 * o.s, 110 * o.s);
  },
  clock(ctx, o) {
    ctx.fillStyle = o.c;
    circle(ctx, o.x, o.y, 34 * o.s);
    ctx.strokeStyle = o.c2;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 34 * o.s, 0, Math.PI * 2);
    ctx.stroke();
    const a1 = o.v * Math.PI * 2;
    const a2 = a1 * 3 + 1.2;
    line(ctx, o.x, o.y, o.x + Math.cos(a1) * 18 * o.s, o.y + Math.sin(a1) * 18 * o.s, 5, o.c2);
    line(ctx, o.x, o.y, o.x + Math.cos(a2) * 26 * o.s, o.y + Math.sin(a2) * 26 * o.s, 3, '#e5534b');
  },
  frame(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 42 * o.s, o.y - 34 * o.s, 84 * o.s, 68 * o.s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(o.x - 34 * o.s, o.y - 26 * o.s, 68 * o.s, 52 * o.s);
    if (o.v === 0) {
      ctx.fillStyle = o.c2;
      poly(ctx, [[o.x - 30 * o.s, o.y + 24 * o.s], [o.x - 6 * o.s, o.y - 14 * o.s], [o.x + 10 * o.s, o.y + 24 * o.s]]);
      poly(ctx, [[o.x - 2 * o.s, o.y + 24 * o.s], [o.x + 16 * o.s, o.y - 4 * o.s], [o.x + 30 * o.s, o.y + 24 * o.s]]);
    } else if (o.v === 1) {
      ctx.fillStyle = o.c2;
      circle(ctx, o.x, o.y - 2 * o.s, 15 * o.s);
    } else {
      ctx.fillStyle = o.c2;
      ctx.fillRect(o.x - 30 * o.s, o.y - 22 * o.s, 60 * o.s, 46 * o.s);
      ctx.fillStyle = '#e5534b';
      poly(ctx, [[o.x - 20 * o.s, o.y - 22 * o.s], [o.x, o.y - 36 * o.s], [o.x + 20 * o.s, o.y - 22 * o.s]]);
    }
  },
  book(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 11 * o.s, o.y - 24 * o.s, 22 * o.s, 48 * o.s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(o.x - 11 * o.s, o.y - 14 * o.s, 22 * o.s, 6 * o.s);
    ctx.fillRect(o.x - 11 * o.s, o.y + 10 * o.s, 22 * o.s, 6 * o.s);
  },
  floorLamp(ctx, o) {
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 3 * o.s, o.y - 20 * o.s, 6 * o.s, 74 * o.s);
    ctx.fillRect(o.x - 18 * o.s, o.y + 52 * o.s, 36 * o.s, 6 * o.s);
    ctx.fillStyle = o.c;
    poly(ctx, [[o.x - 24 * o.s, o.y + 2 * o.s], [o.x + 24 * o.s, o.y + 2 * o.s], [o.x + 15 * o.s, o.y - 30 * o.s], [o.x - 15 * o.s, o.y - 30 * o.s]]);
  },
  sofa(ctx, o) {
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 78 * o.s, o.y - 34 * o.s, 156 * o.s, 52 * o.s);
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 78 * o.s, o.y + 8 * o.s, 156 * o.s, 34 * o.s);
    ctx.fillRect(o.x - 92 * o.s, o.y - 12 * o.s, 22 * o.s, 54 * o.s);
    ctx.fillRect(o.x + 70 * o.s, o.y - 12 * o.s, 22 * o.s, 54 * o.s);
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 4 * o.s, o.y - 34 * o.s, 6 * o.s, 42 * o.s);
    ctx.fillStyle = '#37415c';
    ctx.fillRect(o.x - 66 * o.s, o.y + 42 * o.s, 10 * o.s, 12 * o.s);
    ctx.fillRect(o.x + 56 * o.s, o.y + 42 * o.s, 10 * o.s, 12 * o.s);
  },
  cat(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y + 12 * o.s, 26 * o.s, 17 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, o.x + 4 * o.s, o.y - 12 * o.s, 16 * o.s);
    poly(ctx, [[o.x - 8 * o.s, o.y - 22 * o.s], [o.x - 4 * o.s, o.y - 36 * o.s], [o.x + 2 * o.s, o.y - 24 * o.s]]);
    poly(ctx, [[o.x + 8 * o.s, o.y - 24 * o.s], [o.x + 15 * o.s, o.y - 36 * o.s], [o.x + 17 * o.s, o.y - 21 * o.s]]);
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 6 * o.s;
    ctx.beginPath();
    ctx.moveTo(o.x - 24 * o.s, o.y + 16 * o.s);
    ctx.quadraticCurveTo(o.x - 42 * o.s, o.y + 2 * o.s, o.x - 36 * o.s, o.y - 14 * o.s);
    ctx.stroke();
    ctx.fillStyle = '#20242e';
    circle(ctx, o.x - 2 * o.s, o.y - 13 * o.s, 2.6 * o.s);
    circle(ctx, o.x + 11 * o.s, o.y - 13 * o.s, 2.6 * o.s);
    ctx.fillStyle = o.c2;
    circle(ctx, o.x + 5 * o.s, o.y - 7 * o.s, 2.6 * o.s);
  },
  plant(ctx, o) {
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 6 * o.s;
    const leaves = [[-20, -34], [0, -46], [20, -34], [-10, -24], [12, -22]];
    for (const [lx, ly] of leaves) {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + 6 * o.s);
      ctx.quadraticCurveTo(o.x + lx * o.s * 0.5, o.y - 12 * o.s, o.x + lx * o.s, o.y + ly * o.s);
      ctx.stroke();
    }
    ctx.fillStyle = o.c2;
    poly(ctx, [[o.x - 20 * o.s, o.y + 4 * o.s], [o.x + 20 * o.s, o.y + 4 * o.s], [o.x + 14 * o.s, o.y + 34 * o.s], [o.x - 14 * o.s, o.y + 34 * o.s]]);
  },
  mug(ctx, o) {
    ctx.fillStyle = o.c2;
    ctx.fillRect(o.x - 34 * o.s, o.y + 22 * o.s, 68 * o.s, 6 * o.s);
    ctx.fillRect(o.x - 4 * o.s, o.y - 2 * o.s, 8 * o.s, 26 * o.s);
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x - 16 * o.s, o.y - 26 * o.s, 32 * o.s, 30 * o.s);
    ctx.strokeStyle = o.c;
    ctx.lineWidth = 5 * o.s;
    ctx.beginPath();
    ctx.arc(o.x + 22 * o.s, o.y - 11 * o.s, 9 * o.s, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  },
  rug(ctx, o) {
    ctx.fillStyle = o.c;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 110 * o.s, 30 * o.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = o.c2;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 82 * o.s, 20 * o.s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 48 * o.s, 11 * o.s, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
};

/** Draw one whole picture (background + objects) in scene-local coordinates. */
export function drawScene(ctx, scene, side) {
  drawBackground(ctx, scene.index);
  const objects = side === 'right' ? scene.right : scene.left;
  for (const o of objects) DRAW[o.kind](ctx, o);
}
