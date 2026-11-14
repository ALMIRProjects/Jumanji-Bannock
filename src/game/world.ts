import {
  BAT_BOTTOM_LIFT,
  BAT_H,
  BAT_UNLOCK_SECONDS,
  BAT_W,
  FAST_FALL_SPEED,
  GRAVITY,
  GROUND_Y,
  HIT_INSET,
  IDOL_CHANCE,
  IDOL_LIFT,
  IDOL_POINTS,
  IDOL_SIZE,
  JUMP_BUFFER_SECONDS,
  JUMP_SPEED,
  MAX_SPEED,
  PLAYER_DUCK_H,
  PLAYER_RUN_H,
  PLAYER_W,
  PLAYER_X,
  SCORE_PER_PIXEL,
  SPAWN_LEAD,
  SPEED_GAIN_PER_SECOND,
  START_SPEED,
  WORLD_WIDTH,
} from '@/game/config';

export type ObstacleKind = 'stone' | 'log' | 'bat';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Obstacle extends Box {
  id: number;
  kind: ObstacleKind;
  baseY: number;
  phase: number;
}

export interface Idol extends Box {
  id: number;
  collected: boolean;
  phase: number;
}

export interface Runner {
  lift: number;
  vy: number;
  grounded: boolean;
  ducking: boolean;
  runTime: number;
}

export interface WorldState {
  time: number;
  distance: number;
  speed: number;
  score: number;
  idolCount: number;
  dead: boolean;
  runner: Runner;
  obstacles: Obstacle[];
  idols: Idol[];
  spawnIn: number;
  jumpBuffer: number;
  nextId: number;
}

export interface FrameInput {
  jumpPressed: boolean;
  duck: boolean;
}

export function createWorld(): WorldState {
  return {
    time: 0,
    distance: 0,
    speed: START_SPEED,
    score: 0,
    idolCount: 0,
    dead: false,
    runner: { lift: 0, vy: 0, grounded: true, ducking: false, runTime: 0 },
    obstacles: [],
    idols: [],
    spawnIn: SPAWN_LEAD,
    jumpBuffer: 0,
    nextId: 1,
  };
}

export function playerBox(runner: Runner): Box {
  const h = runner.ducking ? PLAYER_DUCK_H : PLAYER_RUN_H;
  return { x: PLAYER_X, y: GROUND_Y - runner.lift - h, w: PLAYER_W, h };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function nextSpawnGap(speed: number): number {
  return randomBetween(340, 480) + speed * 0.7;
}

function spawnObstacle(world: WorldState) {
  const kinds: ObstacleKind[] =
    world.time >= BAT_UNLOCK_SECONDS ? ['stone', 'log', 'bat'] : ['stone', 'log'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const x = WORLD_WIDTH + 24;
  const phase = Math.random() * Math.PI * 2;
  const id = world.nextId++;

  if (kind === 'bat') {
    const y = GROUND_Y - BAT_BOTTOM_LIFT - BAT_H;
    world.obstacles.push({ id, kind, x, y, baseY: y, w: BAT_W, h: BAT_H, phase });
  } else if (kind === 'log') {
    const h = randomBetween(36, 44);
    const w = randomBetween(84, 112);
    world.obstacles.push({ id, kind, x, y: GROUND_Y - h, baseY: GROUND_Y - h, w, h, phase });
  } else {
    const h = randomBetween(44, 58);
    const w = randomBetween(46, 60);
    world.obstacles.push({ id, kind, x, y: GROUND_Y - h, baseY: GROUND_Y - h, w, h, phase });
  }

  if (Math.random() < IDOL_CHANCE) {
    for (let i = 0; i < 3; i++) {
      world.idols.push({
        id: world.nextId++,
        x: x + 60 + i * 44,
        y: GROUND_Y - IDOL_LIFT - IDOL_SIZE,
        w: IDOL_SIZE,
        h: IDOL_SIZE,
        collected: false,
        phase,
      });
    }
  }
}

function updateRunner(world: WorldState, dt: number, input: FrameInput) {
  const runner = world.runner;

  if (input.jumpPressed) world.jumpBuffer = JUMP_BUFFER_SECONDS;
  world.jumpBuffer = Math.max(0, world.jumpBuffer - dt);

  if (runner.grounded && world.jumpBuffer > 0) {
    runner.vy = JUMP_SPEED;
    runner.grounded = false;
    world.jumpBuffer = 0;
  }

  runner.vy -= GRAVITY * dt;
  if (!runner.grounded && input.duck) {
    runner.vy = Math.min(runner.vy, -FAST_FALL_SPEED);
  }
  runner.lift += runner.vy * dt;

  if (runner.lift <= 0) {
    runner.lift = 0;
    runner.vy = 0;
    runner.grounded = true;
  } else {
    runner.grounded = false;
  }

  runner.ducking = input.duck && runner.grounded;
  if (runner.grounded) runner.runTime += dt;
}

export function stepWorld(world: WorldState, dt: number, input: FrameInput) {
  if (world.dead) return;

  world.time += dt;
  world.speed = Math.min(MAX_SPEED, START_SPEED + world.time * SPEED_GAIN_PER_SECOND);
  const move = world.speed * dt;
  world.distance += move;
  world.score += move * SCORE_PER_PIXEL;

  updateRunner(world, dt, input);

  for (const obstacle of world.obstacles) {
    obstacle.x -= move;
    if (obstacle.kind === 'bat') {
      obstacle.y = obstacle.baseY + Math.sin(world.time * 5 + obstacle.phase) * 3;
    }
  }
  for (const idol of world.idols) idol.x -= move;

  const hitbox = playerBox(world.runner);
  const playerHitbox = {
    x: hitbox.x + HIT_INSET,
    y: hitbox.y + HIT_INSET,
    w: hitbox.w - HIT_INSET * 2,
    h: hitbox.h - HIT_INSET * 2,
  };

  for (const idol of world.idols) {
    if (!idol.collected && overlaps(playerHitbox, idol)) {
      idol.collected = true;
      world.idolCount += 1;
      world.score += IDOL_POINTS;
    }
  }
  world.idols = world.idols.filter((idol) => !idol.collected && idol.x + idol.w > -20);

  if (world.obstacles.some((obstacle) => overlaps(playerHitbox, obstacle))) {
    world.dead = true;
  }
  world.obstacles = world.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -20);

  world.spawnIn -= move;
  if (world.spawnIn <= 0) {
    spawnObstacle(world);
    world.spawnIn = nextSpawnGap(world.speed);
  }
}
