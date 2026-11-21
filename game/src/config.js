// Every tuning number and colour in one place. The stage is a fixed 1280x720 logical area;
// the page scales the canvas with CSS, so no rule below depends on the window size.

export const FIELD = { width: 1280, height: 720 };

/** The two pictures: same size, side by side, drawn in scene-local 600x540 coordinates. */
export const PANEL = { y: 84, width: 600, height: 540, leftX: 20, rightX: 660 };

/** Seconds a level lasts before the clock runs out. */
export const LEVEL_TIME = 100;

/** Wrong clicks allowed before the game ends. */
export const MAX_MISSES = 3;

/** Levels in a run: beach, park, room — clearing the third wins the game. */
export const LEVELS = 3;

/** Differences per level: level 1 has 5, each later level one more. */
export function diffCountForLevel(level) {
  return 4 + level;
}

export const SCORE_PER_FIND = 100;

export const PALETTE = {
  backdrop: '#10131c',
  bar: '#1b2133',
  panelEdge: '#f5f7fa',
  text: '#f5f7fa',
  muted: '#a7b0c2',
  accent: '#ffd23e',
  good: '#37d67a',
  bad: '#ff5252',
  ring: '#ff2e88',
  ringInner: '#ffe93e',
  shade: '#141927',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
