// Headless logic test: builds scenes from seeds through the game's own modules and checks
// the difference lists, click rules and shot staging. Run: node tools/test.mjs
import assert from 'node:assert';
import { createGame, SCREEN_PLAY, SCREEN_WIN } from '../game/src/world.js';
import { stageShot } from '../game/src/shots.js';
import { diffCountForLevel } from '../game/src/config.js';

// Difference counts per level: 5, 6, 7 across beach, park, room.
for (let level = 1; level <= 3; level += 1) {
  const game = createGame(7);
  game.startLevel(level);
  assert.equal(game.state.scene.diffs.length, diffCountForLevel(level), `level ${level} diff count`);
  assert.equal(game.state.found.length, diffCountForLevel(level));
  console.log(`level ${level} (${game.state.scene.name}): ${game.state.scene.diffs.length} differences OK`);
}

// Determinism: the same seed builds the identical difference list.
{
  const a = createGame(42);
  a.startLevel(2);
  const b = createGame(42);
  b.startLevel(2);
  assert.deepEqual(a.state.scene.diffs, b.state.scene.diffs);
  const c = createGame(43);
  c.startLevel(2);
  assert.notDeepEqual(c.state.scene.diffs, a.state.scene.diffs);
  console.log('seed determinism OK');
}

// Click rules: clicking a difference finds it; clicking empty space is a miss.
{
  const game = createGame(7);
  game.startRun();
  const d = game.state.scene.diffs[0];
  assert.equal(game.clickAt(d.x, d.y), 'found');
  assert.equal(game.foundCount(), 1);
  // A point at least 60px from every difference centre must miss.
  let missPoint = null;
  outer: for (let y = 20; y < 540; y += 10) {
    for (let x = 20; x < 600; x += 10) {
      if (game.state.scene.diffs.every((dd) => (x - dd.x) ** 2 + (y - dd.y) ** 2 > 60 * 60)) {
        missPoint = { x, y };
        break outer;
      }
    }
  }
  assert.ok(missPoint, 'found an empty point');
  assert.equal(game.clickAt(missPoint.x, missPoint.y), 'miss');
  assert.equal(game.state.misses, 1);
  console.log('click rules OK');
}

// Play-shot staging: level 2, exactly 3 of 6 differences marked, counter state consistent.
{
  const game = createGame(7);
  const screen = stageShot('play', game);
  assert.equal(screen, SCREEN_PLAY);
  assert.equal(game.state.scene.name, 'PARK');
  assert.equal(game.state.scene.diffs.length, 6);
  assert.equal(game.foundCount(), 3, 'play shot marks exactly 3 differences');
  assert.equal(game.state.scene.diffs.length - game.foundCount(), 3, '3 still to go');
  console.log('play shot staging OK: FOUND 3/6 - 3 TO GO');
}

// Win-shot staging: run won, every difference of the last level marked.
{
  const game = createGame(7);
  const screen = stageShot('win', game);
  assert.equal(screen, SCREEN_WIN);
  assert.equal(game.state.screen, SCREEN_WIN);
  assert.equal(game.foundCount(), game.state.scene.diffs.length);
  console.log('win shot staging OK');
}

// Title-shot staging leaves a backdrop scene and the title screen.
{
  const game = createGame(7);
  const screen = stageShot('title', game);
  assert.equal(screen, 'title');
  assert.ok(game.state.scene, 'backdrop scene exists');
  console.log('title shot staging OK');
}

console.log('ALL TESTS PASSED');
