// Drawing only: the game state in, pixels out, on a 1280x720 logical stage. The HUD keeps
// the found/remaining counter big and centred ("FOUND 3/7 - 4 TO GO"), found differences get
// a bright ring on BOTH pictures, and the title, win and game-over screens are panels laid
// over the scene. Uses only the small canvas-2D subset listed in scenes.js.

import { FIELD, FONT, MAX_MISSES, PANEL, PALETTE } from './config.js';
import { SCENE_H, SCENE_W, drawScene } from './scenes.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

function text(ctx, value, x, y, size, color, align, baseline) {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(value, x, y);
}

function ring(ctx, x, y, r) {
  ctx.strokeStyle = PALETTE.ring;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ringInner;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r - 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPictures(ctx, state) {
  const panels = [
    { ox: PANEL.leftX, side: 'left', label: 'ORIGINAL' },
    { ox: PANEL.rightX, side: 'right', label: 'FIND THE CHANGES' },
  ];
  for (const p of panels) {
    ctx.save();
    ctx.translate(p.ox, PANEL.y);
    drawScene(ctx, state.scene, p.side);
    ctx.restore();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 4;
    ctx.strokeRect(p.ox, PANEL.y, PANEL.width, PANEL.height);
    // Found rings, drawn in panel coordinates so they land on both pictures.
    if (state.scene) {
      for (let i = 0; i < state.scene.diffs.length; i += 1) {
        if (!state.found[i]) continue;
        const d = state.scene.diffs[i];
        ring(ctx, p.ox + d.x, PANEL.y + d.y, d.r + 6);
      }
    }
    text(ctx, p.label, p.ox + PANEL.width / 2, PANEL.y + PANEL.height + 26, 22, PALETTE.muted, 'center', 'top');
  }
  // A fresh miss flashes a red X on the panel that was clicked (the browser entry point
  // records the side on the mark; the mark defaults to the left panel).
  if (state.missMark && state.scene) {
    const ox = state.missMark.side === 'right' ? PANEL.rightX : PANEL.leftX;
    const x = ox + state.missMark.x;
    const y = PANEL.y + state.missMark.y;
    ctx.strokeStyle = PALETTE.bad;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 16);
    ctx.lineTo(x + 16, y + 16);
    ctx.moveTo(x + 16, y - 16);
    ctx.lineTo(x - 16, y + 16);
    ctx.stroke();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.bar;
  ctx.fillRect(0, 0, FIELD.width, 64);
  const total = state.scene ? state.scene.diffs.length : 0;
  let found = 0;
  for (const f of state.found) if (f) found += 1;
  text(ctx, `LEVEL ${state.level} - ${state.scene ? state.scene.name : ''}`, 24, 32, 26, PALETTE.text, 'left', 'middle');
  text(ctx, `FOUND ${found}/${total} - ${total - found} TO GO`, FIELD.width / 2, 32, 26, PALETTE.accent, 'center', 'middle');
  const time = Math.max(0, Math.ceil(state.timeLeft));
  text(ctx, `TIME ${time}`, 1010, 32, 22, time <= 10 ? PALETTE.bad : PALETTE.text, 'right', 'middle');
  text(ctx, 'MISS', 1036, 32, 22, PALETTE.muted, 'left', 'middle');
  for (let i = 0; i < MAX_MISSES; i += 1) {
    ctx.fillStyle = i < state.misses ? PALETTE.bad : '#39415a';
    ctx.beginPath();
    ctx.arc(1136 + i * 34, 32, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  // Score and a controls hint live in the strip under the pictures, clear of the bar.
  text(ctx, `SCORE ${state.score}`, FIELD.width - 24, 692, 24, PALETTE.text, 'right', 'middle');
  text(ctx, 'CLICK A DIFFERENCE - R RESTARTS - P PAUSES', 24, 692, 20, PALETTE.muted, 'left', 'middle');
}

function drawPanel(ctx, title, titleColor, lines, prompt) {
  const width = 780;
  const height = 150 + lines.length * 40 + 70;
  const x = (FIELD.width - width) / 2;
  const y = (FIELD.height - height) / 2;
  ctx.fillStyle = PALETTE.shade;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = PALETTE.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, width, height);
  text(ctx, title, FIELD.width / 2, y + 66, 44, titleColor, 'center', 'middle');
  for (let i = 0; i < lines.length; i += 1) {
    text(ctx, lines[i], FIELD.width / 2, y + 128 + i * 40, 23, PALETTE.text, 'center', 'middle');
  }
  text(ctx, prompt, FIELD.width / 2, y + height - 38, 25, PALETTE.accent, 'center', 'middle');
}

/** Paint one frame for the game's current screen. */
export function drawGame(ctx, state) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (!state.scene) return;

  if (state.screen === SCREEN_TITLE) {
    ctx.globalAlpha = 0.55;
    drawPictures(ctx, state);
    ctx.globalAlpha = 1;
    drawPanel(ctx, 'SPOT THE DIFFERENCE', PALETTE.accent, [
      'TWO PICTURES. A FEW TINY CHANGES.',
      'CLICK A CHANGE TO MARK IT.',
      '3 LEVELS: BEACH, PARK, ROOM.',
      '3 MISSES OR NO TIME ENDS THE RUN.',
    ], 'CLICK OR PRESS ENTER TO START');
    return;
  }

  drawPictures(ctx, state);
  drawHud(ctx, state);

  if (state.bannerT > 0 && state.screen === SCREEN_PLAY) {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(FIELD.width / 2 - 230, PANEL.y + 12, 460, 46);
    ctx.globalAlpha = 1;
    text(ctx, state.banner, FIELD.width / 2, PANEL.y + 36, 28, PALETTE.shade, 'center', 'middle');
  }
  if (state.screen === SCREEN_PAUSED) {
    drawPanel(ctx, 'PAUSED', PALETTE.text, ['THE PICTURES WILL WAIT FOR YOU.'], 'PRESS P TO RESUME');
  } else if (state.screen === SCREEN_WIN) {
    drawPanel(ctx, 'YOU WIN!', PALETTE.good, [
      'ALL 3 LEVELS CLEARED.',
      `DIFFERENCES FOUND: ${state.totalFound}`,
      `SCORE ${state.score}`,
    ], 'CLICK OR PRESS R TO PLAY AGAIN');
  } else if (state.screen === SCREEN_OVER) {
    drawPanel(ctx, 'GAME OVER', PALETTE.bad, [
      state.overReason,
      `LEVEL ${state.level} - SCORE ${state.score}`,
      `DIFFERENCES FOUND: ${state.totalFound}`,
    ], 'CLICK OR PRESS R TO TRY AGAIN');
  }
}

export { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN };
export { SCENE_H, SCENE_W };
