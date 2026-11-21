// The screenshot scenes behind ?shot=title|play|win (with &seed=N). Each one stages a real
// game state through the same rules the player plays: the title backdrop is a level-1 scene,
// the play scene is a level-2 run with the first, third and fifth differences already found
// by clicking them through clickAt (so the rings and the counter are the game's own), and
// the win scene is a finished run on the last level with every difference marked.

import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';
import { LEVELS } from './config.js';

/** Stage `name` on `game` and return the screen to draw. Unknown names stage the title. */
export function stageShot(name, game) {
  const { state } = game;
  if (name === 'play') {
    game.startRun();
    game.startLevel(2);
    state.screen = SCREEN_PLAY;
    const diffs = state.scene.diffs;
    for (const index of [0, 2, 4]) {
      if (index < diffs.length) game.clickAt(diffs[index].x, diffs[index].y);
    }
    state.misses = 1;
    state.timeLeft = 63;
    state.bannerT = 0;
    return SCREEN_PLAY;
  }
  if (name === 'win') {
    game.startRun();
    game.startLevel(LEVELS);
    const diffs = state.scene.diffs;
    for (const d of diffs) game.clickAt(d.x, d.y);
    // clickAt on the final difference already won the run; make the totals read like a
    // full three-level run rather than a single level.
    state.score = 2450;
    state.totalFound = 18;
    state.elapsed = 132;
    state.screen = SCREEN_WIN;
    return SCREEN_WIN;
  }
  game.stageBackdrop();
  state.screen = SCREEN_TITLE;
  return SCREEN_TITLE;
}
