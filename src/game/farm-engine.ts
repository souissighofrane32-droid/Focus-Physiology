export const TILE = 16;
export const VIEW_W = 320;
export const VIEW_H = 180;
export const SPEED = 68;

export type CombatPayload = {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
};

type Probe = {
  getYaw: () => number;
  getSpeed: () => number;
  setKeys?: (codes: string[]) => void;
  getPos?: () => { x: number; y: number };
};

declare global {
  interface Window {
    __controlsTest?: Probe;
  }
}

type Crop = {
  x: number;
  y: number;
  ripe: boolean;
  regen: number;
  kind: 0 | 1 | 2;
};

type Critter = {
  x: number;
  y: number;
  dir: number;
  bob: number;
  kind: "chicken" | "slime";
  id: number;
  hp: number;
  maxHp: number;
  name: string;
  alive: boolean;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

type FloatText = { x: number; y: number; life: number; text: string };

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

function buildMap(): string[] {
  const W = 52;
  const H = 24;
  const g: string[][] = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      if (y === 0 || y === H - 1 || x === 0 || x === W - 1) return "#";
      return (x + y) % 7 === 0 ? "," : ".";
    }),
  );

  const set = (x: number, y: number, ch: string) => {
    if (y > 0 && y < H - 1 && x > 0 && x < W - 1) g[y][x] = ch;
  };
  const rect = (x: number, y: number, w: number, h: number, ch: string) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, ch);
  };

  rect(3, 2, 7, 5, "~");
  rect(3, 16, 6, 5, "~");
  rect(20, 3, 7, 4, "H");
  rect(20, 7, 7, 1, "F");
  set(23, 7, "=");
  rect(38, 8, 7, 4, "B");
  rect(38, 12, 7, 1, "F");
  rect(8, 9, 6, 4, "C");
  rect(32, 15, 5, 3, "C");
  rect(14, 18, 4, 2, "C");

  for (let x = 23; x <= 41; x++) set(x, 13, "=");
  for (let y = 7; y <= 13; y++) set(23, y, "=");
  for (let x = 10; x <= 23; x++) set(x, 8, "=");
  for (let y = 8; y <= 12; y++) set(10, y, "=");
  for (let x = 10; x <= 16; x++) set(x, 12, "=");

  const trees: [number, number][] = [
    [5, 8],
    [6, 9],
    [16, 3],
    [17, 4],
    [30, 3],
    [31, 4],
    [44, 4],
    [45, 5],
    [4, 13],
    [15, 15],
    [28, 18],
    [46, 16],
    [47, 17],
    [35, 5],
    [12, 20],
  ];
  for (const [x, y] of trees) set(x, y, "T");

  const flowers: [number, number][] = [
    [14, 5],
    [15, 6],
    [27, 5],
    [28, 6],
    [7, 14],
    [18, 16],
    [34, 7],
    [42, 18],
    [25, 16],
    [36, 20],
  ];
  for (const [x, y] of flowers) set(x, y, "*");

  rect(40, 14, 4, 3, "o");
  set(18, 6, "W");
  set(36, 13, "R");

  return g.map((row) => row.join(""));
}

const LAYOUT = buildMap();
export const MAP_COLS = LAYOUT[0].length;
export const MAP_ROWS = LAYOUT.length;
export const WORLD_W = MAP_COLS * TILE;
export const WORLD_H = MAP_ROWS * TILE;

const SOLID = new Set(["#", "T", "H", "B", "F", "~", "W"]);

function tileAt(tx: number, ty: number): string {
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return "#";
  return LAYOUT[ty][tx];
}

function solidAtPixel(px: number, py: number): boolean {
  return SOLID.has(tileAt(Math.floor(px / TILE), Math.floor(py / TILE)));
}

function blocked(x: number, y: number, r = 4): boolean {
  return (
    solidAtPixel(x - r, y - r) ||
    solidAtPixel(x + r, y - r) ||
    solidAtPixel(x - r, y + r) ||
    solidAtPixel(x + r, y + r)
  );
}

function radialDeadzone(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class FarmEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  buffer: HTMLCanvasElement;
  bctx: CanvasRenderingContext2D;
  keys = new Set<string>();
  player = { x: 23 * TILE + 8, y: 9 * TILE + 8, facing: 1, walk: 0, dir: 2 };
  cam = { x: 0, y: 0 };
  crops: Crop[] = [];
  critters: Critter[] = [];
  particles: Particle[] = [];
  floats: FloatText[] = [];
  time = 0;
  running = false;
  raf = 0;
  last = 0;
  combatLock = false;
  iFrames = 0;
  coins = 0;
  harvested = 0;
  currentSpeed = 0;
  onCombat: (e: CombatPayload) => void;
  joystick = { active: false, dx: 0, dy: 0 };
  joyOrigin = { x: 48, y: VIEW_H - 48 };
  pointerIds = new Map<number, { kind: "joy" }>();
  npc = { x: 21 * TILE + 8, y: 8 * TILE + 4, wave: 0 };

  constructor(canvas: HTMLCanvasElement, onCombat: (e: CombatPayload) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    this.ctx = ctx;
    this.buffer = document.createElement("canvas");
    this.buffer.width = VIEW_W;
    this.buffer.height = VIEW_H;
    const bctx = this.buffer.getContext("2d");
    if (!bctx) throw new Error("No buffer");
    this.bctx = bctx;
    this.onCombat = onCombat;
    this.seed();
  }

  seed() {
    this.crops = [];
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        if (tileAt(tx, ty) === "C") {
          this.crops.push({
            x: tx * TILE + 8,
            y: ty * TILE + 8,
            ripe: true,
            regen: 0,
            kind: ((tx + ty) % 3) as 0 | 1 | 2,
          });
        }
      }
    }
    this.critters = [
      { id: 1, x: 12 * TILE, y: 5 * TILE, dir: 0.4, bob: 0, kind: "slime", hp: 40, maxHp: 40, name: "Leaf Slime", alive: true },
      { id: 2, x: 34 * TILE, y: 4 * TILE, dir: 1.2, bob: 1, kind: "slime", hp: 48, maxHp: 48, name: "Crop Wisp", alive: true },
      { id: 3, x: 44 * TILE, y: 18 * TILE, dir: 2.1, bob: 2, kind: "slime", hp: 56, maxHp: 56, name: "Orchard Slime", alive: true },
      { id: 4, x: 7 * TILE, y: 18 * TILE, dir: 3.4, bob: 0.5, kind: "slime", hp: 44, maxHp: 44, name: "Path Sprite", alive: true },
      { id: 101, x: 41 * TILE, y: 15 * TILE, dir: 0, bob: 0, kind: "chicken", hp: 1, maxHp: 1, name: "Hen", alive: true },
      { id: 102, x: 42 * TILE, y: 16 * TILE, dir: 1, bob: 1, kind: "chicken", hp: 1, maxHp: 1, name: "Hen", alive: true },
      { id: 103, x: 40 * TILE, y: 16 * TILE, dir: 2, bob: 2, kind: "chicken", hp: 1, maxHp: 1, name: "Hen", alive: true },
    ];
  }

  attach() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    window.__controlsTest = {
      getYaw: () => (this.player.dir === 1 ? Math.PI : 0),
      getSpeed: () => this.currentSpeed,
      setKeys: (codes) => {
        this.keys.clear();
        for (const c of codes) this.keys.add(c);
      },
      getPos: () => ({ x: this.player.x, y: this.player.y }),
    };
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onBlur);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    if (window.__controlsTest) delete window.__controlsTest;
    this.stop();
  }

  onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    this.keys.add(e.code);
    if (GAME_KEYS.has(e.code)) e.preventDefault();
  };

  onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  onBlur = () => {
    this.keys.clear();
    this.joystick.active = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
  };

  canvasToLocal(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VIEW_W,
      y: ((e.clientY - r.top) / r.height) * VIEW_H,
    };
  }

  onPointerDown = (e: PointerEvent) => {
    const p = this.canvasToLocal(e);
    if (p.x < VIEW_W * 0.42 && p.y > VIEW_H * 0.45) {
      this.canvas.setPointerCapture(e.pointerId);
      this.joystick = { active: true, dx: 0, dy: 0 };
      this.joyOrigin = { x: p.x, y: p.y };
      this.pointerIds.set(e.pointerId, { kind: "joy" });
    }
  };

  onPointerMove = (e: PointerEvent) => {
    if (!this.pointerIds.has(e.pointerId)) return;
    const p = this.canvasToLocal(e);
    let dx = p.x - this.joyOrigin.x;
    let dy = p.y - this.joyOrigin.y;
    const m = Math.hypot(dx, dy);
    if (m < 6) {
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      return;
    }
    const scale = Math.min(1, (m - 6) / 26);
    this.joystick.dx = (dx / m) * scale;
    this.joystick.dy = (dy / m) * scale;
  };

  onPointerUp = (e: PointerEvent) => {
    if (!this.pointerIds.has(e.pointerId)) return;
    this.pointerIds.delete(e.pointerId);
    this.joystick.active = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  defeatEnemy(id: number) {
    const e = this.critters.find((x) => x.id === id);
    if (e && e.kind === "slime") {
      e.alive = false;
      this.burst(e.x, e.y, "#E53935");
      this.coins += 8;
      this.floats.push({ x: e.x, y: e.y - 8, life: 0.9, text: "+8" });
    }
    this.releaseCombat();
  }

  releaseCombat() {
    this.combatLock = false;
    this.iFrames = 1.4;
    const s = this.critters.find((c) => c.kind === "slime" && c.alive);
    if (s) {
      const dx = this.player.x - s.x;
      const dy = this.player.y - s.y;
      const m = Math.hypot(dx, dy) || 1;
      const nx = this.player.x + (dx / m) * 22;
      const ny = this.player.y + (dy / m) * 22;
      if (!blocked(nx, this.player.y)) this.player.x = nx;
      if (!blocked(this.player.x, ny)) this.player.y = ny;
    }
  }

  burst(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * 28,
        vy: Math.sin(a) * 28,
        life: 0.35,
        color,
      });
    }
  }

  pollGamepad() {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      const stick = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      if (Math.hypot(stick.x, stick.y) > 0.05) {
        return stick;
      }
      let x = 0;
      let y = 0;
      if (pad.buttons[14]?.pressed) x -= 1;
      if (pad.buttons[15]?.pressed) x += 1;
      if (pad.buttons[12]?.pressed) y -= 1;
      if (pad.buttons[13]?.pressed) y += 1;
      if (x || y) return { x, y };
    }
    return { x: 0, y: 0 };
  }

  update(dt: number) {
    this.time += dt;
    if (this.iFrames > 0) this.iFrames -= dt;
    this.npc.wave += dt;

    let mx = 0;
    let my = 0;
    if (!this.combatLock) {
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
      if (this.joystick.active) {
        mx += this.joystick.dx;
        my += this.joystick.dy;
      }
      const pad = this.pollGamepad();
      mx += pad.x;
      my += pad.y;
    }

    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }
    this.currentSpeed = mag > 0.05 ? SPEED * Math.min(1, mag) : 0;
    if (Math.abs(mx) > Math.abs(my)) this.player.dir = mx < 0 ? 1 : 2;
    else if (Math.abs(my) > 0.05) this.player.dir = my < 0 ? 3 : 0;
    if (mx !== 0) this.player.facing = mx < 0 ? -1 : 1;
    if (mag > 0.05) this.player.walk += dt * 9;
    else this.player.walk = 0;

    if (!this.combatLock && mag > 0.05) {
      const nx = this.player.x + mx * SPEED * dt;
      const ny = this.player.y + my * SPEED * dt;
      if (!blocked(nx, this.player.y)) this.player.x = nx;
      if (!blocked(this.player.x, ny)) this.player.y = ny;
      this.player.x = Math.max(TILE + 4, Math.min(WORLD_W - TILE - 4, this.player.x));
      this.player.y = Math.max(TILE + 4, Math.min(WORLD_H - TILE - 4, this.player.y));
    }

    this.cam.x = this.player.x - VIEW_W / 2;
    this.cam.y = this.player.y - VIEW_H / 2;
    this.cam.x = Math.max(0, Math.min(WORLD_W - VIEW_W, this.cam.x));
    this.cam.y = Math.max(0, Math.min(WORLD_H - VIEW_H, this.cam.y));

    for (const c of this.crops) {
      if (!c.ripe) {
        c.regen -= dt;
        if (c.regen <= 0) c.ripe = true;
        continue;
      }
      if (this.combatLock) continue;
      const d = Math.hypot(c.x - this.player.x, c.y - this.player.y);
      if (d < 10) {
        c.ripe = false;
        c.regen = 7 + Math.random() * 4;
        this.harvested += 1;
        this.coins += 2;
        this.burst(c.x, c.y, c.kind === 0 ? "#EC407A" : c.kind === 1 ? "#FFEE58" : "#66BB6A");
        this.floats.push({ x: c.x, y: c.y - 6, life: 0.7, text: "+2" });
      }
    }

    for (const e of this.critters) {
      if (!e.alive) continue;
      e.bob += dt;
      const speed = e.kind === "chicken" ? 22 : 16;
      e.dir += (Math.random() - 0.5) * dt * 3;
      const ex = e.x + Math.cos(e.dir) * speed * dt;
      const ey = e.y + Math.sin(e.dir) * speed * dt;
      if (!blocked(ex, e.y, 3)) e.x = ex;
      else e.dir += Math.PI * 0.6;
      if (!blocked(e.x, ey, 3)) e.y = ey;
      if (e.kind !== "slime" || this.combatLock || this.iFrames > 0) continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < 11) {
        this.combatLock = true;
        this.currentSpeed = 0;
        try {
          this.onCombat({ id: e.id, name: e.name, hp: e.hp, maxHp: e.maxHp });
        } catch {
          this.combatLock = false;
        }
      }
    }

    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floats) {
      f.life -= dt;
      f.y -= 18 * dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  draw() {
    const ctx = this.bctx;
    ctx.imageSmoothingEnabled = false;
    const ox = Math.floor(this.cam.x);
    const oy = Math.floor(this.cam.y);

    const t0 = Math.max(0, Math.floor(ox / TILE) - 1);
    const t1 = Math.min(MAP_COLS, Math.ceil((ox + VIEW_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(oy / TILE) - 1);
    const r1 = Math.min(MAP_ROWS, Math.ceil((oy + VIEW_H) / TILE) + 1);

    for (let ty = r0; ty < r1; ty++) {
      for (let tx = t0; tx < t1; tx++) {
        this.drawTile(ctx, tileAt(tx, ty), tx * TILE - ox, ty * TILE - oy, tx, ty);
      }
    }

    for (const c of this.crops) {
      if (!c.ripe) continue;
      this.drawCrop(ctx, c.x - ox, c.y - oy, c.kind);
    }

    const drawables: { y: number; draw: () => void }[] = [];
    drawables.push({
      y: this.npc.y,
      draw: () => this.drawNpc(ctx, this.npc.x - ox, this.npc.y - oy),
    });
    for (const e of this.critters) {
      if (!e.alive) continue;
      drawables.push({
        y: e.y,
        draw: () => {
          if (e.kind === "slime") this.drawSlime(ctx, e.x - ox, e.y - oy + Math.sin(e.bob * 4) * 1.4);
          else this.drawChicken(ctx, e.x - ox, e.y - oy, e);
        },
      });
    }
    drawables.push({
      y: this.player.y,
      draw: () => this.drawFarmer(ctx, this.player.x - ox, this.player.y - oy),
    });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    for (const p of this.particles) {
      this.px(ctx, p.x - ox, p.y - oy, 2, 2, p.color);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    for (const f of this.floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = "#fff8f4";
      ctx.fillText(f.text, Math.round(f.x - ox), Math.round(f.y - oy));
      ctx.globalAlpha = 1;
    }

    this.drawHud(ctx);

    const out = this.ctx;
    out.imageSmoothingEnabled = false;
    out.clearRect(0, 0, this.canvas.width, this.canvas.height);
    out.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);
  }

  px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  drawTile(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, tx: number, ty: number) {
    const grassA = (tx + ty) % 2 === 0 ? "#7CB342" : "#8BC34A";
    const grassB = (tx + ty) % 2 === 0 ? "#689F38" : "#7CB342";
    if (t === "~") {
      const w = 0.5 + 0.5 * Math.sin(this.time * 2 + tx * 0.4 + ty * 0.3);
      this.px(ctx, x, y, TILE, TILE, w > 0.5 ? "#4FC3F7" : "#29B6F6");
      this.px(ctx, x + 3, y + 6, 5, 1, "#E1F5FE");
      this.px(ctx, x + 8, y + 10, 4, 1, "#81D4FA");
      return;
    }
    if (t === "=") {
      this.px(ctx, x, y, TILE, TILE, "#D7CCC8");
      this.px(ctx, x + 1, y + 1, TILE - 2, TILE - 2, "#C4A574");
      this.px(ctx, x + 5, y + 7, 2, 2, "#A1887F");
      return;
    }
    if (t === "H") {
      this.px(ctx, x, y, TILE, TILE, "#A1887F");
      this.px(ctx, x, y, TILE, 7, "#8D3B2F");
      this.px(ctx, x + 2, y + 7, 12, 9, "#D7CCC8");
      this.px(ctx, x + 6, y + 10, 4, 6, "#5D4037");
      this.px(ctx, x + 3, y + 9, 3, 3, "#81D4FA");
      return;
    }
    if (t === "B") {
      this.px(ctx, x, y, TILE, TILE, "#A1887F");
      this.px(ctx, x, y, TILE, 6, "#6D4C41");
      this.px(ctx, x + 2, y + 6, 12, 10, "#BCAAA4");
      this.px(ctx, x + 6, y + 10, 4, 6, "#4E342E");
      return;
    }
    if (t === "F") {
      this.px(ctx, x, y, TILE, TILE, grassA);
      this.px(ctx, x + 1, y + 6, 14, 2, "#8D6E63");
      this.px(ctx, x + 2, y + 3, 2, 10, "#6D4C41");
      this.px(ctx, x + 12, y + 3, 2, 10, "#6D4C41");
      return;
    }
    if (t === "T") {
      this.px(ctx, x, y, TILE, TILE, grassB);
      this.px(ctx, x + 6, y + 9, 4, 7, "#5D4037");
      this.px(ctx, x + 2, y + 2, 12, 10, "#2E7D32");
      this.px(ctx, x + 4, y + 0, 8, 7, "#388E3C");
      this.px(ctx, x + 5, y + 3, 3, 3, "#1B5E20");
      return;
    }
    if (t === "C") {
      this.px(ctx, x, y, TILE, TILE, "#8D6E63");
      this.px(ctx, x + 1, y + 1, 14, 14, "#6D4C41");
      this.px(ctx, x + 2, y + 2, 12, 12, "#795548");
      return;
    }
    if (t === "*") {
      this.px(ctx, x, y, TILE, TILE, grassA);
      this.px(ctx, x + 6, y + 8, 2, 5, "#558B2F");
      this.px(ctx, x + 5, y + 5, 4, 4, "#EC407A");
      this.px(ctx, x + 6, y + 6, 2, 2, "#FFF59D");
      return;
    }
    if (t === "o") {
      this.px(ctx, x, y, TILE, TILE, "#A1887F");
      this.px(ctx, x + 1, y + 4, 14, 10, "#BCAAA4");
      this.px(ctx, x + 2, y + 2, 12, 3, "#8D6E63");
      return;
    }
    if (t === "W") {
      this.px(ctx, x, y, TILE, TILE, grassA);
      this.px(ctx, x + 3, y + 4, 10, 10, "#90A4AE");
      this.px(ctx, x + 5, y + 6, 6, 6, "#4FC3F7");
      return;
    }
    if (t === "R") {
      this.px(ctx, x, y, TILE, TILE, grassA);
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
      this.px(ctx, x + 4, y + 3, 8, 10, pulse > 0.5 ? "#CE93D8" : "#AB47BC");
      this.px(ctx, x + 6, y + 6, 4, 4, "#F3E5F5");
      return;
    }
    if (t === "#") {
      this.px(ctx, x, y, TILE, TILE, "#5D4037");
      this.px(ctx, x + 1, y + 1, TILE - 2, TILE - 2, "#6D4C41");
      this.px(ctx, x + 4, y + 4, 3, 3, "#8D6E63");
      return;
    }
    this.px(ctx, x, y, TILE, TILE, t === "," ? grassB : grassA);
    if ((tx * 3 + ty * 7) % 6 === 0) this.px(ctx, x + 4, y + 9, 1, 2, "#AED581");
  }

  drawCrop(ctx: CanvasRenderingContext2D, x: number, y: number, kind: number) {
    const px = Math.round(x - 8);
    const py = Math.round(y - 8);
    if (kind === 0) {
      this.px(ctx, px + 6, py + 8, 2, 5, "#558B2F");
      this.px(ctx, px + 4, py + 4, 6, 5, "#EC407A");
      this.px(ctx, px + 6, py + 5, 2, 2, "#FFF59D");
    } else if (kind === 1) {
      this.px(ctx, px + 5, py + 6, 6, 7, "#FDD835");
      this.px(ctx, px + 6, py + 4, 4, 3, "#F9A825");
    } else {
      this.px(ctx, px + 4, py + 5, 3, 8, "#66BB6A");
      this.px(ctx, px + 9, py + 4, 3, 9, "#43A047");
      this.px(ctx, px + 7, py + 3, 2, 2, "#E53935");
    }
  }

  drawFarmer(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const f = this.player.facing;
    const step = Math.floor(this.player.walk) % 2;
    const bob = this.player.walk ? (step ? 1 : 0) : 0;
    const px = Math.round(x - 6);
    const py = Math.round(y - 14 - bob);
    this.px(ctx, px + 4, py + 16, 3, 2, "#4E342E");
    this.px(ctx, px + 8, py + 16, 3, 2, "#4E342E");
    if (step) this.px(ctx, px + 3, py + 16, 3, 2, "#4E342E");
    this.px(ctx, px + 3, py + 10, 7, 6, "#1565C0");
    this.px(ctx, px + 2, py + 11, 2, 4, "#FFCC80");
    this.px(ctx, px + 9, py + 11, 2, 4, "#FFCC80");
    this.px(ctx, px + 4, py + 4, 5, 6, "#FFCC80");
    this.px(ctx, px + 3, py + 1, 7, 4, "#6D4C41");
    this.px(ctx, px + 2, py, 9, 2, "#5D4037");
    this.px(ctx, px + (f < 0 ? 3 : 6), py + 6, 2, 2, "#3E2723");
    this.px(ctx, px + 5, py + 8, 3, 1, "#E07A5F");
  }

  drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const px = Math.round(x - 6);
    const py = Math.round(y - 14);
    this.px(ctx, px + 3, py + 10, 7, 6, "#6A1B9A");
    this.px(ctx, px + 4, py + 4, 5, 6, "#FFCC80");
    this.px(ctx, px + 3, py + 1, 7, 4, "#F4C7B8");
    this.px(ctx, px + 2, py, 9, 2, "#E07A5F");
    this.px(ctx, px + 4, py + 16, 3, 2, "#4E342E");
    this.px(ctx, px + 8, py + 16, 3, 2, "#4E342E");
    if (Math.hypot(this.player.x - this.npc.x, this.player.y - this.npc.y) < 22) {
      this.px(ctx, px - 6, py - 12, 28, 10, "#fffdfb");
      ctx.fillStyle = "#3d2c2e";
      ctx.font = "7px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Harvest crops!", px - 4, py - 5);
    }
  }

  drawSlime(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const px = Math.round(x - 7);
    const py = Math.round(y - 8);
    this.px(ctx, px + 2, py + 4, 12, 8, "#E53935");
    this.px(ctx, px + 4, py + 2, 8, 4, "#EF5350");
    this.px(ctx, px + 4, py + 6, 2, 2, "#fff");
    this.px(ctx, px + 9, py + 6, 2, 2, "#fff");
    this.px(ctx, px + 5, py + 7, 1, 1, "#212121");
    this.px(ctx, px + 10, py + 7, 1, 1, "#212121");
  }

  drawChicken(ctx: CanvasRenderingContext2D, x: number, y: number, e: Critter) {
    const px = Math.round(x - 5);
    const py = Math.round(y - 6 + Math.sin(e.bob * 6) * 0.6);
    this.px(ctx, px + 2, py + 3, 8, 6, "#FFF8E1");
    this.px(ctx, px + 8, py + 2, 4, 4, "#FFF8E1");
    this.px(ctx, px + 11, py + 3, 2, 2, "#F9A825");
    this.px(ctx, px + 5, py + 1, 2, 2, "#E53935");
    this.px(ctx, px + 3, py + 9, 2, 2, "#F9A825");
    this.px(ctx, px + 7, py + 9, 2, 2, "#F9A825");
  }

  drawHud(ctx: CanvasRenderingContext2D) {
    this.px(ctx, 6, 6, 78, 14, "rgba(61,44,46,0.45)");
    ctx.fillStyle = "#fff8f4";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Coins ${this.coins}  Crops ${this.harvested}`, 10, 16);

    if (this.joystick.active) {
      this.px(ctx, this.joyOrigin.x - 16, this.joyOrigin.y - 16, 32, 32, "rgba(255,255,255,0.22)");
      this.px(
        ctx,
        this.joyOrigin.x - 4 + this.joystick.dx * 12,
        this.joyOrigin.y - 4 + this.joystick.dy * 12,
        8,
        8,
        "rgba(61,44,46,0.55)",
      );
    }
  }
}
