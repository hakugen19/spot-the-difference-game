# spot-the-difference-game

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/hakugen19/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/hakugen19/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

A spot-the-difference game for desktop Chrome. Two near-identical pictures sit side by side — beach, park and room scenes drawn procedurally on canvas from a seeded RNG — and the right-hand picture hides a few changes: an object removed, recoloured, resized or moved, or a spare one added. Click a change on either picture to ring it on both, beat the 100-second clock and the 3-miss limit, and clear all three levels (5, 6 and 7 differences) to win. Plain static files under game/, no build step and no network requests; main.ts hands the game in with its screenshots and dossier. To play, serve the game/ folder with any static server and open it in desktop Chrome; ?seed=N fixes the scenes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=h4q735y4&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
