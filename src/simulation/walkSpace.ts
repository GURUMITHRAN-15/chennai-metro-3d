/**
 * Walkable space for the passenger on foot (Walk mode).
 *
 * A space is a set of rectangular floor pads in one local frame (a station,
 * or a train car): flat floors, ramps (stairs) and moving ramps (escalators).
 * The walker is a point with a radius. It may stand wherever a pad lies
 * within a step of its current height, clear of furniture and of closed
 * barriers (fare gates). No physics engine: movement is collide-and-slide
 * against that description, which keeps it exact, cheap and testable.
 *
 * Frame: x along the track, z to its right, y up (metres).
 */

/** What a floor belongs to; the trip logic reads it to know where the passenger is. */
export type WalkZone = "street" | "stairs" | "unpaid" | "gate" | "paid" | "escalator" | "landing" | "platform" | "train";

export interface Pad {
  id: string;
  zone: WalkZone;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Floor height at x0 and at x1 (equal on a flat floor; a ramp runs along x). */
  y0: number;
  y1: number;
  /** Moving floor: metres per second along +x (negative = towards -x). */
  conveyor?: number;
}

/** Solid furniture: blocks anyone whose body overlaps its height range. */
export interface Obstacle {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
}

/** A barrier that can be opened (a fare-gate lane). Closed unless its id is in the open set. */
export interface Barrier extends Obstacle {
  id: string;
}

export interface WalkSpace {
  pads: Pad[];
  obstacles: Obstacle[];
  barriers: Barrier[];
}

export interface WalkPosition {
  x: number;
  z: number;
  y: number;
}

/** Highest step the walker takes without a ramp (a stair riser, a door sill). */
export const STEP_HEIGHT = 0.45;
/** Body radius and height used against furniture. */
export const WALKER_RADIUS = 0.3;
export const WALKER_HEIGHT = 1.7;
/** Longest move tested in one go; longer moves are split so nothing is tunnelled through. */
const MAX_SUBSTEP = 0.15;

const NO_BARRIERS_OPEN: ReadonlySet<string> = new Set();

/** Floor height of a pad at x. */
export function padHeight(p: Pad, x: number): number {
  if (p.y0 === p.y1) return p.y0;
  const t = Math.min(1, Math.max(0, (x - p.x0) / (p.x1 - p.x0)));
  return p.y0 + (p.y1 - p.y0) * t;
}

const inPad = (p: Pad, x: number, z: number) => x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1;

/**
 * The floor under (x, z) for someone currently at height y: the pad whose
 * surface is nearest in height, if one lies within a step. Null = no floor.
 */
export function floorAt(space: WalkSpace, x: number, z: number, y: number): { pad: Pad; y: number } | null {
  let best: { pad: Pad; y: number } | null = null;
  let bestGap = STEP_HEIGHT;
  for (const pad of space.pads) {
    if (!inPad(pad, x, z)) continue;
    const h = padHeight(pad, x);
    const gap = Math.abs(h - y);
    if (gap <= bestGap) {
      bestGap = gap;
      best = { pad, y: h };
    }
  }
  return best;
}

function hits(o: Obstacle, x: number, z: number, y: number, radius: number): boolean {
  if (y + WALKER_HEIGHT <= o.y0 || y >= o.y1) return false;
  // Circle against rectangle.
  const cx = Math.min(o.x1, Math.max(o.x0, x));
  const cz = Math.min(o.z1, Math.max(o.z0, z));
  return (x - cx) ** 2 + (z - cz) ** 2 < radius * radius;
}

/** Can the walker stand at (x, z), arriving from height y? Returns the floor there, or null. */
export function standAt(
  space: WalkSpace,
  x: number,
  z: number,
  y: number,
  open: ReadonlySet<string> = NO_BARRIERS_OPEN,
  radius = WALKER_RADIUS,
): { pad: Pad; y: number } | null {
  const floor = floorAt(space, x, z, y);
  if (!floor) return null;
  for (const o of space.obstacles) if (hits(o, x, z, floor.y, radius)) return null;
  for (const b of space.barriers) if (!open.has(b.id) && hits(b, x, z, floor.y, radius)) return null;
  return floor;
}

export interface WalkResult extends WalkPosition {
  pad: Pad;
  /** The move was cut short by a wall, furniture or a closed barrier. */
  blocked: boolean;
}

/**
 * Move the walker by (dx, dz), sliding along whatever stops it, then carry
 * it along a moving floor for `dt` seconds. Returns null only when there is
 * no floor under `from`. A walker who is somehow inside furniture or a
 * closed barrier (a gate shut on them, a crowd re-placed round them) may
 * walk out of it: only the floor holds them until they are clear.
 */
export function walk(
  space: WalkSpace,
  from: WalkPosition,
  dx: number,
  dz: number,
  dt: number,
  open: ReadonlySet<string> = NO_BARRIERS_OPEN,
  radius = WALKER_RADIUS,
): WalkResult | null {
  const start = floorAt(space, from.x, from.z, from.y);
  if (!start) return null;
  let { x, z } = from;
  let y = start.y;
  let pad = start.pad;
  let blocked = false;
  let trapped = !standAt(space, x, z, y, open, radius);

  const tryStep = (sx: number, sz: number): boolean => {
    let f = standAt(space, x + sx, z + sz, y, open, radius);
    if (f) trapped = false;
    else if (trapped) f = floorAt(space, x + sx, z + sz, y);
    if (!f) return false;
    x += sx;
    z += sz;
    y = f.y;
    pad = f.pad;
    return true;
  };
  const move = (mx: number, mz: number) => {
    const n = Math.max(1, Math.ceil(Math.hypot(mx, mz) / MAX_SUBSTEP));
    const sx = mx / n;
    const sz = mz / n;
    for (let i = 0; i < n; i++) {
      if (tryStep(sx, sz)) continue;
      blocked = true;
      // Slide along the obstacle on whichever axis is still free.
      if (sx !== 0 && tryStep(sx, 0)) continue;
      if (sz !== 0 && tryStep(0, sz)) continue;
      break;
    }
  };

  if (dx !== 0 || dz !== 0) move(dx, dz);
  if (pad.conveyor && dt > 0) {
    const before = blocked;
    move(pad.conveyor * dt, 0);
    // Being set down at the end of an escalator is not a collision.
    blocked = before;
  }
  return { x, z, y, pad, blocked };
}

/**
 * Every pad reachable on foot from a starting point, by flood fill with the
 * real movement rules (used by the tests to prove a station can be walked
 * through, and only through its gates). Conveyors are ignored: an escalator
 * is still a ramp that can be climbed.
 */
export function reachablePads(
  space: WalkSpace,
  start: WalkPosition,
  open: ReadonlySet<string> = NO_BARRIERS_OPEN,
  cell = 0.2,
): Set<string> {
  const reached = new Set<string>();
  const first = standAt(space, start.x, start.z, start.y, open);
  if (!first) return reached;
  const seen = new Set<string>();
  const key = (x: number, z: number, y: number) => `${Math.round(x / cell)}:${Math.round(z / cell)}:${Math.round(y / STEP_HEIGHT)}`;
  const queue: WalkPosition[] = [{ x: start.x, z: start.z, y: first.y }];
  seen.add(key(start.x, start.z, first.y));
  reached.add(first.pad.id);
  const steps: [number, number][] = [
    [cell, 0],
    [-cell, 0],
    [0, cell],
    [0, -cell],
  ];
  while (queue.length) {
    const p = queue.pop()!;
    for (const [sx, sz] of steps) {
      const f = standAt(space, p.x + sx, p.z + sz, p.y, open);
      if (!f) continue;
      const k = key(p.x + sx, p.z + sz, f.y);
      if (seen.has(k)) continue;
      seen.add(k);
      reached.add(f.pad.id);
      queue.push({ x: p.x + sx, z: p.z + sz, y: f.y });
    }
  }
  return reached;
}
