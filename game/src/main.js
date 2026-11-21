// Boot and the one loop: the canvas is a fixed 1280x720 stage (CSS scales it to the
// window), clicks are converted back to logical coordinates and then to scene-local
// coordinates for whichever picture was clicked, the clock ticks while a level runs, and
// the renderer paints what is there.
//
// ?seed=N fixes the scenes. ?shot=title|play|win (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { FIELD, PANEL } from './config.js';
import { createGame, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const game = createGame(seed);
const { state } = game;

function announce(message) {
  status.textContent = message;
}

/** A pointer event's position in logical stage coordinates, or null outside the stage. */
function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
  const y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
  if (x < 0 || y < 0 || x >= FIELD.width || y >= FIELD.height) return null;
  return { x, y };
}

/** Which picture a logical point is in, and its scene-local coordinates; null elsewhere. */
function toScene(point) {
  const y = point.y - PANEL.y;
  if (y < 0 || y >= PANEL.height) return null;
  if (point.x >= PANEL.leftX && point.x < PANEL.leftX + PANEL.width) {
    return { side: 'left', x: point.x - PANEL.leftX, y };
  }
  if (point.x >= PANEL.rightX && point.x < PANEL.rightX + PANEL.width) {
    return { side: 'right', x: point.x - PANEL.rightX, y };
  }
  return null;
}

function handleClick(event) {
  const point = toLogical(event);
  if (!point) return;
  if (state.screen === SCREEN_TITLE || state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) {
    game.startRun();
    announce('Playing level 1. Click the differences.');
    return;
  }
  if (state.screen !== SCREEN_PLAY) return;
  const local = toScene(point);
  if (!local) return;
  const result = game.clickAt(local.x, local.y);
  if (result === 'miss' && state.missMark) state.missMark.side = local.side;
  if (result === 'found') {
    const total = state.scene.diffs.length;
    let found = 0;
    for (const f of state.found) if (f) found += 1;
    announce(state.screen === SCREEN_WIN ? 'You win!' : `Found ${found} of ${total}.`);
  } else if (result === 'miss') {
    announce(state.screen === SCREEN_OVER ? 'Game over.' : 'Miss.');
  }
}

function handleKey(event) {
  const key = event.key.toLowerCase();
  if ((key === 'enter' || key === ' ') && (state.screen === SCREEN_TITLE || state.screen === SCREEN_WIN || state.screen === SCREEN_OVER)) {
    event.preventDefault();
    game.startRun();
    announce('Playing level 1. Click the differences.');
  } else if (key === 'r' && state.screen !== SCREEN_TITLE) {
    game.startRun();
    announce('Restarted. Level 1.');
  } else if (key === 'p') {
    if (state.screen === SCREEN_PLAY) {
      state.screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (state.screen === SCREEN_PAUSED) {
      state.screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }
}

function runShot(name) {
  stageShot(name, game);
  let painted = 0;
  function paint() {
    drawGame(ctx, state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  game.stageBackdrop();
  canvas.addEventListener('pointerdown', handleClick);
  window.addEventListener('keydown', handleKey);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
  });
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    game.tick(dt);
    drawGame(ctx, state);
  }
  announce('Spot the Difference. Click or press Enter to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
