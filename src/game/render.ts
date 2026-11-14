import {
  GROUND_Y,
  IDOL_SIZE,
  PLAYER_W,
  PLAYER_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '@/game/config';
import type { Idol, Obstacle, Runner, WorldState } from '@/game/world';

type TileDraw = (ctx: CanvasRenderingContext2D, x: number, seed: number) => void;

const SKIN = '#9a6444';
const SHIRT = '#d8b67a';
const SHIRT_SHADE = '#b8915a';
const PANTS = '#a98348';
const LEATHER = '#3b2414';
const BOOT = '#4a2c17';
const HAT = '#8a6238';
const EMBER_BRIGHT = '#fbbf24';
const EMBER_DEEP = '#f97316';
const LEAF_COLORS = ['#7fc27a', '#5fae6a', '#a3d98a'];

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function drawTiled(
  ctx: CanvasRenderingContext2D,
  distance: number,
  factor: number,
  tile: number,
  draw: TileDraw,
) {
  const scroll = distance * factor;
  const base = Math.floor(scroll / tile);
  const shift = scroll - base * tile;
  for (let i = -1; i <= Math.ceil(WORLD_WIDTH / tile); i++) {
    draw(ctx, i * tile - shift, base + i);
  }
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  gradient.addColorStop(0, '#0a2a26');
  gradient.addColorStop(0.5, '#1d5f4d');
  gradient.addColorStop(0.82, '#5f9e6f');
  gradient.addColorStop(1, '#e6b766');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
}

function drawSun(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.shadowColor = 'rgba(255, 214, 128, 0.7)';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(760, 96, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHill(ctx: CanvasRenderingContext2D, x: number, seed: number) {
  const h = 110 + hash(seed) * 90;
  ctx.fillStyle = '#24594f';
  ctx.beginPath();
  ctx.moveTo(x, GROUND_Y);
  ctx.lineTo(x + 170, GROUND_Y - h);
  ctx.lineTo(x + 340, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawTemple(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = '#143d37';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + i * 22, GROUND_Y - (i + 1) * 26, 200 - i * 44, 26);
  }
  ctx.fillStyle = '#0f302c';
  ctx.fillRect(x + 92, GROUND_Y - 130, 16, 22);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, seed: number) {
  const r = hash(seed);
  const trunkH = 150 + r * 70;
  const top = GROUND_Y - trunkH;
  const cx = x + 87;
  ctx.fillStyle = '#2b1f14';
  ctx.fillRect(cx - 7, top, 14, trunkH);
  ctx.fillStyle = '#17503a';
  ctx.beginPath();
  ctx.arc(cx, top, 46 + r * 18, 0, Math.PI * 2);
  ctx.arc(cx - 28, top + 18, 30, 0, Math.PI * 2);
  ctx.arc(cx + 30, top + 14, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1f6a4b';
  ctx.beginPath();
  ctx.arc(cx - 6, top - 10, 26 + r * 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, distance: number) {
  ctx.fillStyle = '#3d2b1c';
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);

  drawTiled(ctx, distance, 1, 96, (c, x, seed) => {
    for (let row = 0; row < 2; row++) {
      const y = GROUND_Y + 16 + row * 28;
      const offset = (row + seed) % 2 ? 0 : 48;
      c.fillStyle = '#4b3823';
      c.fillRect(x + offset + 2, y, 92, 24);
      c.fillStyle = '#6d5636';
      c.fillRect(x + offset + 2, y, 92, 3);
    }
  });

  ctx.fillStyle = '#7a6a4a';
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 10);
  ctx.fillStyle = '#3f8f4e';
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 5);
}

function drawLeaves(ctx: CanvasRenderingContext2D, distance: number, time: number) {
  for (let i = 0; i < 14; i++) {
    const drift = distance * 1.1;
    const x = (((hash(i + 1) * WORLD_WIDTH - drift) % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
    const y = 40 + hash(i + 7) * (GROUND_Y - 80) + Math.sin(time * 1.5 + i) * 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 2 + i);
    ctx.fillStyle = LEAF_COLORS[i % LEAF_COLORS.length];
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEmbers(ctx: CanvasRenderingContext2D, runner: Runner, time: number) {
  const cx = PLAYER_X + PLAYER_W / 2;
  const emitterY = GROUND_Y - runner.lift - (runner.ducking ? 26 : 60);
  const emitterX = cx - (runner.ducking ? 18 : 16);
  for (let i = 0; i < 12; i++) {
    const life = (time * 1.4 + i / 12) % 1;
    const x = emitterX - life * 56 + Math.sin(time * 6 + i) * 3;
    const y = emitterY - life * 34 - Math.sin(i) * 4;
    ctx.save();
    ctx.globalAlpha = 1 - life;
    ctx.shadowColor = EMBER_BRIGHT;
    ctx.shadowBlur = 8;
    ctx.fillStyle = life < 0.5 ? EMBER_BRIGHT : EMBER_DEEP;
    ctx.beginPath();
    ctx.arc(x, y, 3 * (1 - life) + 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawLeg(ctx: CanvasRenderingContext2D, hipX: number, hipY: number, length: number, angle: number) {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(angle);
  ctx.fillStyle = PANTS;
  ctx.fillRect(-6, 0, 12, length - 4);
  ctx.fillStyle = BOOT;
  ctx.fillRect(-7, length - 6, 16, 7);
  ctx.restore();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  handX: number,
  handY: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  ctx.fillStyle = LEATHER;
  ctx.beginPath();
  ctx.arc(handX, handY, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = LEATHER;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.6, cy - radius * 0.3);
  ctx.lineTo(cx + radius * 0.5, cy - radius * 0.5);
  ctx.stroke();
  ctx.fillStyle = EMBER_BRIGHT;
  ctx.shadowColor = EMBER_BRIGHT;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx - radius * 0.35, cy + 0.5, 1.6, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.35, cy + 0.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSlidingPlayer(ctx: CanvasRenderingContext2D, feet: number) {
  const cx = PLAYER_X + PLAYER_W / 2;
  ctx.fillStyle = PANTS;
  ctx.fillRect(cx - 40, feet - 15, 18, 11);
  ctx.fillStyle = BOOT;
  ctx.fillRect(cx - 44, feet - 13, 8, 9);

  ctx.fillStyle = SHIRT;
  ctx.beginPath();
  ctx.roundRect(cx - 24, feet - 34, 42, 19, 8);
  ctx.fill();
  ctx.fillStyle = LEATHER;
  ctx.fillRect(cx - 4, feet - 34, 4, 19);

  drawHead(ctx, cx + 22, feet - 27, 10);
  ctx.fillStyle = HAT;
  ctx.beginPath();
  ctx.ellipse(cx + 22, feet - 37, 15, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 22, feet - 40, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStandingPlayer(ctx: CanvasRenderingContext2D, runner: Runner, feet: number) {
  const cx = PLAYER_X + PLAYER_W / 2;
  const airborne = !runner.grounded;
  const swing = airborne ? 0 : Math.sin(runner.runTime * 16);
  const hipY = feet - 30;

  drawLeg(ctx, cx - 7, hipY, 30, airborne ? -0.45 : swing * 0.55);
  drawLeg(ctx, cx + 7, hipY, 30, airborne ? 0.45 : -swing * 0.55);

  const backHandX = airborne ? cx - 22 : cx - 16 - swing * 10;
  const backHandY = airborne ? feet - 64 : feet - 38;
  drawArm(ctx, cx - 16, feet - 52, backHandX, backHandY, SHIRT_SHADE);

  ctx.fillStyle = SHIRT;
  ctx.beginPath();
  ctx.moveTo(cx - 14, feet - 58);
  ctx.lineTo(cx + 14, feet - 58);
  ctx.lineTo(cx + 12, feet - 30);
  ctx.lineTo(cx - 12, feet - 30);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 16, feet - 52, 7, 0, Math.PI * 2);
  ctx.arc(cx + 16, feet - 52, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = SHIRT_SHADE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 3, feet - 48);
  ctx.lineTo(cx - 3, feet - 36);
  ctx.moveTo(cx + 4, feet - 48);
  ctx.lineTo(cx + 4, feet - 36);
  ctx.stroke();

  ctx.fillStyle = LEATHER;
  ctx.fillRect(cx - 13, feet - 33, 26, 4);
  ctx.fillRect(cx - 12, feet - 30, 7, 9);
  ctx.fillRect(cx + 7, feet - 30, 10, 14);
  ctx.fillStyle = EMBER_BRIGHT;
  ctx.fillRect(cx - 2, feet - 34, 4, 5);

  const frontHandX = airborne ? cx + 24 : cx + 18 + swing * 10;
  const frontHandY = airborne ? feet - 70 : feet - 38;
  drawArm(ctx, cx + 16, feet - 52, frontHandX, frontHandY, SHIRT);

  drawHead(ctx, cx, feet - 70, 9);

  ctx.fillStyle = HAT;
  ctx.beginPath();
  ctx.ellipse(cx, feet - 79, 20, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, feet - 81, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = LEATHER;
  ctx.fillRect(cx - 10, feet - 80, 20, 2);
}

function drawPlayer(ctx: CanvasRenderingContext2D, runner: Runner, time: number) {
  const feet = GROUND_Y - runner.lift;
  drawEmbers(ctx, runner, time);
  if (runner.ducking) {
    drawSlidingPlayer(ctx, feet);
  } else {
    drawStandingPlayer(ctx, runner, feet);
  }
}

function drawStone(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  ctx.fillStyle = '#8d8572';
  ctx.beginPath();
  ctx.ellipse(cx, cy, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b5ad98';
  ctx.beginPath();
  ctx.ellipse(cx - o.w * 0.12, cy - o.h * 0.18, o.w * 0.28, o.h * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4f8a3f';
  ctx.beginPath();
  ctx.ellipse(cx + o.w * 0.2, cy + o.h * 0.3, o.w * 0.18, o.h * 0.1, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5c5647';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - o.w * 0.1, cy - o.h * 0.1);
  ctx.lineTo(cx + o.w * 0.05, cy + o.h * 0.15);
  ctx.stroke();
}

function drawLog(ctx: CanvasRenderingContext2D, o: Obstacle) {
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(o.x + 8, o.y, o.w - 16, o.h);
  ctx.fillStyle = '#b07a43';
  ctx.beginPath();
  ctx.ellipse(o.x + 8, o.y + o.h / 2, 8, o.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(o.x + 8, o.y + o.h / 2, 4, o.h / 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#4e301a';
  for (let i = 1; i < 4; i++) {
    const bx = o.x + 8 + (o.w - 16) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(bx, o.y + 4);
    ctx.lineTo(bx + 4, o.y + o.h - 4);
    ctx.stroke();
  }
}

function drawBat(ctx: CanvasRenderingContext2D, o: Obstacle, time: number) {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const flap = Math.sin(time * 18 + o.phase);
  ctx.fillStyle = '#2f3b3f';
  for (const side of [-1, 1]) {
    const wingX = cx + side * (o.w / 2);
    ctx.beginPath();
    ctx.moveTo(cx + side * 6, cy);
    ctx.lineTo(wingX, cy - 6 + flap * 12);
    ctx.lineTo(cx + side * (o.w / 2 - 8), cy + 8);
    ctx.lineTo(cx + side * 10, cy + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(cx - 3.5, cy - 2, 1.6, 0, Math.PI * 2);
  ctx.arc(cx + 3.5, cy - 2, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, time: number) {
  if (o.kind === 'stone') drawStone(ctx, o);
  else if (o.kind === 'log') drawLog(ctx, o);
  else drawBat(ctx, o, time);
}

function drawIdol(ctx: CanvasRenderingContext2D, idol: Idol, time: number) {
  const cx = idol.x + IDOL_SIZE / 2;
  const cy = idol.y + IDOL_SIZE / 2 + Math.sin(time * 3 + idol.phase) * 3;
  const r = IDOL_SIZE / 2;
  ctx.save();
  ctx.shadowColor = '#fcd34d';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#f5b82e';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 4);
  ctx.lineTo(cx + 3, cy);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
}

function drawHud(ctx: CanvasRenderingContext2D, world: WorldState) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fef3c7';
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('DISTANCE SCORE', 28, 34);
  ctx.font = '800 30px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#fffbeb';
  ctx.fillText(String(Math.floor(world.score)).padStart(5, '0'), 28, 66);

  ctx.textAlign = 'right';
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#fef3c7';
  ctx.fillText('IDOLS COLLECTED', WORLD_WIDTH - 28, 34);
  ctx.font = '800 30px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(String(world.idolCount), WORLD_WIDTH - 28, 66);
  ctx.restore();
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: WorldState) {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawSky(ctx);
  drawSun(ctx);
  drawTiled(ctx, world.distance, 0.08, 540, drawHill);
  drawTiled(ctx, world.distance, 0.2, 760, (c, x) => drawTemple(c, x));
  drawTiled(ctx, world.distance, 0.45, 230, drawTree);
  drawGround(ctx, world.distance);

  for (const idol of world.idols) drawIdol(ctx, idol, world.time);
  for (const obstacle of world.obstacles) drawObstacle(ctx, obstacle, world.time);
  drawPlayer(ctx, world.runner, world.time);
  drawLeaves(ctx, world.distance, world.time);
  drawHud(ctx, world);
}
