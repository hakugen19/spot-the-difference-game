// Game state and rules, with no drawing and no DOM: build a level's scene, take clicks in
// scene-local coordinates, count finds and misses, run the clock, advance levels and decide
// the win and game-over screens. The browser loop and the screenshot staging both drive
// this same state.

import { LEVELS, LEVEL_TIME, MAX_MISSES, SCORE_PER_FIND, diffCountForLevel } from './config.js';
import { createRandom } from './random.js';
import { buildScene } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export function createGame(seed) {
  const state = {
    screen: SCREEN_TITLE,
    seed,
    level: 1,
    score: 0,
    totalFound: 0,
    misses: 0,
    timeLeft: LEVEL_TIME,
    elapsed: 0,
    scene: null,
    found: [],
    banner: '',
    bannerT: 0,
    missMark: null,
    overReason: '',
  };

  function foundCount() {
    let n = 0;
    for (const f of state.found) if (f) n += 1;
    return n;
  }

  function startLevel(level) {
    state.level = level;
    const rng = createRandom(seed + level * 7919);
    state.scene = buildScene(rng, level, diffCountForLevel(level));
    state.found = state.scene.diffs.map(() => false);
    state.timeLeft = LEVEL_TIME;
    state.banner = `LEVEL ${level} - ${state.scene.name}`;
    state.bannerT = 2;
    state.missMark = null;
  }

  function startRun() {
    state.score = 0;
    state.totalFound = 0;
    state.misses = 0;
    state.elapsed = 0;
    state.overReason = '';
    startLevel(1);
    state.screen = SCREEN_PLAY;
  }

  /** Show a scene behind the title screen (level 1 of this seed), without starting a run. */
  function stageBackdrop() {
    const rng = createRandom(seed + 7919);
    state.scene = buildScene(rng, 1, diffCountForLevel(1));
    state.found = state.scene.diffs.map(() => false);
  }

  function endRun(reason) {
    state.screen = SCREEN_OVER;
    state.overReason = reason;
  }

  /**
   * A click at scene-local (x, y) on either picture. Returns 'found', 'miss' or 'ignored'.
   * Finding the last difference clears the level: the next level starts at once, or the run
   * is won when the last level is cleared.
   */
  function clickAt(x, y) {
    if (state.screen !== SCREEN_PLAY || !state.scene) return 'ignored';
    const diffs = state.scene.diffs;
    for (let i = 0; i < diffs.length; i += 1) {
      if (state.found[i]) continue;
      const d = diffs[i];
      const dx = x - d.x;
      const dy = y - d.y;
      if (dx * dx + dy * dy <= d.r * d.r) {
        state.found[i] = true;
        state.score += SCORE_PER_FIND;
        state.totalFound += 1;
        state.missMark = null;
        if (foundCount() === diffs.length) {
          state.score += Math.ceil(state.timeLeft) * 2;
          if (state.level >= LEVELS) state.screen = SCREEN_WIN;
          else startLevel(state.level + 1);
        }
        return 'found';
      }
    }
    state.misses += 1;
    state.missMark = { x, y, t: 0.9 };
    if (state.misses >= MAX_MISSES) endRun('TOO MANY MISSES');
    return 'miss';
  }

  /** Advance the clock (seconds). Only a running, unpaused level counts down. */
  function tick(dt) {
    if (state.bannerT > 0) state.bannerT = Math.max(0, state.bannerT - dt);
    if (state.missMark) {
      state.missMark.t -= dt;
      if (state.missMark.t <= 0) state.missMark = null;
    }
    if (state.screen !== SCREEN_PLAY) return;
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endRun('TIME UP');
    }
  }

  return { state, startRun, startLevel, stageBackdrop, clickAt, tick, foundCount };
}
