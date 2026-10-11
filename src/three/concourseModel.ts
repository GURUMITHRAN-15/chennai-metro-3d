import { BoxGeometry, BufferAttribute, type BufferGeometry, Color, Matrix4, PlaneGeometry, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CONCOURSE, type ConcoursePlan } from "./walkPlan.ts";
import { humanTemplate, paintHuman, pickColours, pickHair, pickOutfit, type Pose } from "./humanModel.ts";
import { mulberry32 } from "../utils/random.ts";

/**
 * What is inside a station concourse (walkPlan.ts), in station-local space:
 * floor and wall finishes, the ticket office and its clerks, the railed paid
 * area with its fare-gate cabinets, the used-ticket box, wayfinding signs
 * and a few people. Drawn only at the stations a passenger walks through.
 * A generic interior, not a survey of any real station.
 */
export interface ConcourseGeometry {
  /** Furniture, finishes and people, coloured per vertex. */
  solid: BufferGeometry;
  glass: BufferGeometry;
  /** Self-lit parts (ceiling lights, gate indicators), coloured per vertex. */
  glow: BufferGeometry;
  /** Sign faces, mapped into the sign atlas (textures.ts makeConcourseSignAtlas). */
  signs: BufferGeometry;
}

/** Cells of the sign atlas: two columns by four rows of 4:1 boards. */
export const SIGN = { tickets: 0, entry: 1, exit: 2, platform1: 3, platform2: 4, wayOut: 5, usedTickets: 6 } as const;
export const SIGN_COLS = 2;
export const SIGN_ROWS = 4;

const COLOUR = {
  tile: "#8f959c",
  tilePaid: "#a3a9af",
  guide: "#d9a916",
  wall: "#e6e8ea",
  ceiling: "#eceff1",
  office: "#e7eaed",
  stone: "#2c333c",
  steel: "#aeb5bc",
  cabinet: "#c5cbd1",
  dark: "#1e242b",
  reader: "#1565c0",
  board: "#0d1724",
  box: "#1f5fa8",
  go: "#2fd67b",
  stop: "#ff453a",
  lamp: "#fff6e6",
};

const tint = new Color();

function coloured(g: BufferGeometry, colour: string): BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  for (const name of Object.keys(n.attributes)) if (name !== "position" && name !== "normal") n.deleteAttribute(name);
  const count = n.getAttribute("position").count;
  const arr = new Float32Array(count * 3);
  tint.set(colour);
  for (let i = 0; i < count; i++) tint.toArray(arr, i * 3);
  n.setAttribute("color", new BufferAttribute(arr, 3));
  return n;
}

function cbox(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, colour: string): BufferGeometry {
  const g = new BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return coloured(g, colour);
}

function pane(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): BufferGeometry {
  const g = new BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).toNonIndexed();
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  g.deleteAttribute("uv");
  return g;
}

type Facing = "+x" | "-x" | "+z" | "-z";
const FACING_YAW: Record<Facing, number> = { "+z": 0, "+x": Math.PI / 2, "-z": Math.PI, "-x": -Math.PI / 2 };

/** A sign face `w` by `h` centred at (x, y, z), showing one atlas cell. */
function signFace(cell: number, x: number, y: number, z: number, w: number, h: number, facing: Facing): BufferGeometry {
  const g = new PlaneGeometry(w, h).toNonIndexed();
  const uv = g.getAttribute("uv") as BufferAttribute;
  const col = cell % SIGN_COLS;
  const row = Math.floor(cell / SIGN_COLS);
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (col + uv.getX(i)) / SIGN_COLS, 1 - (row + 1 - uv.getY(i)) / SIGN_ROWS);
  }
  g.rotateY(FACING_YAW[facing]);
  g.translate(x, y, z);
  return g;
}

function merge(parts: BufferGeometry[]): BufferGeometry {
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  g.computeBoundingSphere();
  return g;
}

export function buildConcourse(plan: ConcoursePlan, lineColour: string): ConcourseGeometry {
  const solid: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const glow: BufferGeometry[] = [];
  const signs: BufferGeometry[] = [];
  const C = CONCOURSE;
  const F = plan.floorY;
  const H = plan.ceilY;
  const cl = plan.halfLength - C.endWall;
  const cw = plan.halfWidth - C.sideWall;
  const o = plan.roofOpening;

  /** A hanging board with a sign on its front and a plain back. */
  const board = (cell: number, x: number, y: number, z: number, w: number, facing: Facing, hangFrom = H) => {
    const h = w / 4;
    const along = facing === "+x" || facing === "-x";
    const sgn = facing === "+x" || facing === "+z" ? 1 : -1;
    if (along) solid.push(cbox(x - sgn * 0.06, x - sgn * 0.005, y - h / 2 - 0.04, y + h / 2 + 0.04, z - w / 2 - 0.04, z + w / 2 + 0.04, COLOUR.board));
    else solid.push(cbox(x - w / 2 - 0.04, x + w / 2 + 0.04, y - h / 2 - 0.04, y + h / 2 + 0.04, z - sgn * 0.06, z - sgn * 0.005, COLOUR.board));
    signs.push(signFace(cell, x, y, z, w, h, facing));
    // Two rods up to the ceiling.
    for (const e of [-0.35, 0.35]) {
      if (along) solid.push(cbox(x - sgn * 0.045, x - sgn * 0.02, y + h / 2, hangFrom, z + e * w - 0.012, z + e * w + 0.012, COLOUR.steel));
      else solid.push(cbox(x + e * w - 0.012, x + e * w + 0.012, y + h / 2, hangFrom, z - sgn * 0.045, z - sgn * 0.02, COLOUR.steel));
    }
  };
  /** Glass railing with a steel top rail. */
  const railing = (x0: number, x1: number, z0: number, z1: number, y = F) => {
    glass.push(pane(x0, x1, y + 0.08, y + 1.05, z0, z1));
    solid.push(cbox(x0 - 0.02, x1 + 0.02, y + 1.05, y + 1.11, Math.min(z0, z1) - 0.02, Math.max(z0, z1) + 0.02, COLOUR.steel));
    solid.push(cbox(x0, x1, y, y + 0.08, z0, z1, COLOUR.steel));
  };

  // Floor: tiles, a lighter paid area, and a yellow waiting line before each gate array and counter.
  solid.push(cbox(-cl, cl, F, F + 0.012, -cw, cw, COLOUR.tile));
  solid.push(cbox(C.island.x0, C.island.x1, F + 0.012, F + 0.018, -C.island.z, C.island.z, COLOUR.tilePaid));
  const gateHalf = (C.gate.lanes.length * C.gate.pitch) / 2;
  solid.push(cbox(C.island.x0 - 1.7, C.island.x0 - 1.55, F + 0.012, F + 0.02, -gateHalf, gateHalf, COLOUR.guide));
  solid.push(cbox(C.island.x1 - 1.7, C.island.x1 - 1.55, F + 0.018, F + 0.026, -gateHalf, gateHalf, COLOUR.guide));
  solid.push(cbox(C.office.x0 - 1.5, C.office.x0 - 1.35, F + 0.012, F + 0.02, -C.office.halfZ, C.office.halfZ, COLOUR.guide));

  // Wall linings with a band in the line's colour, and the ceiling around the escalator openings.
  for (const s of [-1, 1]) {
    solid.push(cbox(-cl, cl, F, H, s * cw, s * (cw - 0.04), COLOUR.wall));
    solid.push(cbox(-cl, cl, F + 1.0, F + 1.18, s * (cw - 0.04), s * (cw - 0.055), lineColour));
    for (const x of [-cl, cl]) {
      const xi = x - Math.sign(x) * 0.04;
      solid.push(cbox(x, xi, F, H, -C.door.z0, C.door.z0, COLOUR.wall));
      solid.push(cbox(x, xi, F, H, s * C.door.z1, s * cw, COLOUR.wall));
      solid.push(cbox(x, xi, F + C.door.height, H, s * C.door.z0, s * C.door.z1, COLOUR.wall));
      signs.push(signFace(SIGN.wayOut, xi - Math.sign(x) * 0.012, F + C.door.height + 0.4, s * (C.door.z0 + C.door.z1) / 2, 2.2, 0.55, x > 0 ? "-x" : "+x"));
    }
  }
  const ceil = (x0: number, x1: number, z0: number, z1: number) => solid.push(cbox(x0, x1, H - 0.04, H, z0, z1, COLOUR.ceiling));
  ceil(-cl, o.x0, -cw, cw);
  ceil(o.x1, cl, -cw, cw);
  ceil(o.x0, o.x1, -o.z0, o.z0);
  for (const s of [-1, 1]) ceil(o.x0, o.x1, s * o.z1, s * cw);
  // Ceiling light strips in rows clear of the openings.
  // None inside the ticket office, which has its own lamp (two in one place flicker).
  const inOffice = (x0: number, x1: number, z: number) => x1 > C.office.x0 && x0 < C.office.x1 && Math.abs(z) < C.office.halfZ;
  for (const z of [-14.6, -7.2, 0, 7.2, 14.6]) {
    for (let x = -cl + 2; x < cl - 4; x += 6) {
      if (inOffice(x, x + 3.6, z)) continue;
      glow.push(cbox(x, x + 3.6, H - 0.06, H - 0.045, z - 0.14, z + 0.14, COLOUR.lamp));
    }
  }

  // Ticket office: a room with two windows on its west face, a counter shelf and a clerk at each.
  {
    const O = C.office;
    const sill = F + 1.05;
    const head = F + 2.25;
    const half = O.windowHalf;
    solid.push(cbox(O.x1 - 0.12, O.x1, F, H, -O.halfZ, O.halfZ, COLOUR.office));
    for (const s of [-1, 1]) solid.push(cbox(O.x0, O.x1, F, H, s * O.halfZ, s * (O.halfZ - 0.12), COLOUR.office));
    // Stops under the counter shelf, so the shelf alone is at sill height.
    solid.push(cbox(O.x0, O.x0 + 0.12, F, sill - 0.05, -O.halfZ, O.halfZ, COLOUR.office));
    solid.push(cbox(O.x0, O.x0 + 0.12, head, H, -O.halfZ, O.halfZ, COLOUR.office));
    const edges = [-O.halfZ, ...O.windows.flatMap((z) => [z - half, z + half]), O.halfZ];
    for (let i = 0; i < edges.length; i += 2) solid.push(cbox(O.x0, O.x0 + 0.12, sill - 0.05, head, edges[i], edges[i + 1], COLOUR.office));
    // Just above the hall tiles, not level with them.
    solid.push(cbox(O.x0 + 0.12, O.x1 - 0.12, F + 0.012, F + 0.02, -O.halfZ, O.halfZ, COLOUR.stone));
    for (const z of O.windows) {
      // Counter shelf through the window, glass above a pay slot, the sign over it.
      solid.push(cbox(O.x0 - O.shelf, O.x0 + 0.62, sill - 0.05, sill, z - half, z + half, COLOUR.stone));
      solid.push(cbox(O.x0 + 0.1, O.x0 + 0.16, F, sill - 0.05, z - half, z + half, COLOUR.office));
      glass.push(pane(O.x0 + 0.05, O.x0 + 0.07, sill + 0.16, head, z - half, z + half));
      signs.push(signFace(SIGN.tickets, O.x0 - 0.012, head + 0.42, z, 2.2, 0.55, "-x"));
      // The clerk's stool and monitor.
      solid.push(cbox(O.x0 + 0.8, O.x0 + 1.2, F, F + 0.47, z - 0.2, z + 0.2, COLOUR.dark));
      solid.push(cbox(O.x0 + 0.42, O.x0 + 0.46, sill + 0.02, sill + 0.3, z + 0.42, z + 0.82, COLOUR.dark));
      glow.push(cbox(O.x0 + 0.46, O.x0 + 0.47, sill + 0.04, sill + 0.28, z + 0.45, z + 0.79, "#9fc4e8"));
    }
    glow.push(cbox(O.x0 + 1.5, O.x1 - 1.5, H - 0.06, H - 0.045, -0.14, 0.14, COLOUR.lamp));
  }

  // Paid island: railings down both sides and across each end beside the gates.
  for (const s of [-1, 1]) {
    railing(C.island.x0, C.island.x1, s * (C.island.z - 0.02), s * (C.island.z + 0.02));
    for (const gx of [C.island.x0, C.island.x1]) railing(gx - 0.02, gx + 0.02, s * (gateHalf + C.gate.cabinetWidth / 2), s * C.island.z);
    // The escalator well is fenced where its underside is too low to walk under.
    railing(plan.escalator.x0, o.x1 + 0.55, s * (C.escalator.up[0] - 0.32), s * (C.escalator.up[0] - 0.28));
    railing(o.x1 + 0.51, o.x1 + 0.55, s * (C.escalator.up[0] - 0.3), s * (C.island.z - 0.02));
    board(s < 0 ? SIGN.platform1 : SIGN.platform2, plan.escalator.x0 - 0.9, F + 2.5, (s * (C.escalator.up[0] + C.escalator.down[1])) / 2, 2.4, "-x");
    // On the platform landing, the way out points back down.
    // Over the head of the down escalator, facing those who come off the platform.
    board(SIGN.wayOut, plan.landing.x0 + 0.1, plan.platformY + 2.4, (s * (C.escalator.down[0] + C.escalator.down[1])) / 2, 1.9, "+x", plan.platformY + 2.9);
  }

  // Fare gates: a cabinet either side of every lane, a reader on the approach side, a lit arrow or cross.
  const gates: [number, 1 | -1][] = [
    [C.island.x0, 1],
    [C.island.x1, 1],
  ];
  for (const [gx, dir] of gates) {
    const top = F + C.gate.cabinetHeight;
    const half = C.gate.cabinetLength / 2;
    for (let k = 0; k <= C.gate.lanes.length; k++) {
      const z = C.gate.lanes[0] - C.gate.pitch / 2 + k * C.gate.pitch;
      const w = C.gate.cabinetWidth / 2;
      solid.push(cbox(gx - half, gx + half, F, top - 0.04, z - w, z + w, COLOUR.cabinet));
      solid.push(cbox(gx - half, gx + half, top - 0.04, top, z - w, z + w, COLOUR.steel));
      solid.push(cbox(gx - half * dir - 0.02, gx - half * dir + 0.02, F + 0.02, top - 0.06, z - w + 0.03, z + w - 0.03, COLOUR.dark));
      if (k < C.gate.lanes.length) {
        // A reader pad on the approach end of the cabinet; a green light on the way in, red on the way back.
        solid.push(cbox(gx - dir * (half - 0.12), gx - dir * (half - 0.4), top, top + 0.025, z - w + 0.05, z + w - 0.05, COLOUR.reader));
        glow.push(cbox(gx - dir * half - dir * 0.022, gx - dir * half - dir * 0.03, top - 0.36, top - 0.2, z - 0.08, z + 0.08, COLOUR.go));
        glow.push(cbox(gx + dir * half + dir * 0.002, gx + dir * half + dir * 0.01, top - 0.36, top - 0.2, z - 0.08, z + 0.08, COLOUR.stop));
      }
    }
  }
  board(SIGN.entry, C.island.x0 - 0.75, F + 2.55, 0, 3.2, "-x");
  board(SIGN.exit, C.island.x1 - 0.75, F + 2.55, 0, 3.2, "-x");

  // Used-ticket box past the exit gates.
  {
    const B = C.ticketBox;
    solid.push(cbox(B.x - B.half, B.x + B.half, F, F + B.height, B.z - B.half, B.z + B.half, COLOUR.box));
    solid.push(cbox(B.x - B.half - 0.02, B.x + B.half + 0.02, F + B.height, F + B.height + 0.05, B.z - B.half - 0.02, B.z + B.half + 0.02, COLOUR.dark));
    solid.push(cbox(B.x - 0.16, B.x + 0.16, F + B.height + 0.05, F + B.height + 0.056, B.z - 0.03, B.z + 0.03, "#05070a"));
    signs.push(signFace(SIGN.usedTickets, B.x - B.half - 0.006, F + 0.72, B.z, 0.56, 0.14, "-x"));
  }

  // People: a clerk at each window, and a few passengers standing about.
  {
    const rng = mulberry32(4107);
    const up = new Vector3(0, 1, 0);
    const m = new Matrix4();
    const q = new Quaternion();
    const one = new Vector3(1, 1, 1);
    const person = (x: number, y: number, z: number, yaw: number, pose: Pose, scale = 1) => {
      const outfit = pickOutfit(rng);
      const g = paintHuman(humanTemplate({ outfit, pose, hair: pickHair(outfit, rng) }), pickColours(outfit, rng));
      m.compose(new Vector3(x, y, z), q.setFromAxisAngle(up, yaw), one.setScalar(scale));
      solid.push(g.applyMatrix4(m));
    };
    for (const z of C.office.windows) person(C.office.x0 + 1.0, F + 0.47, z, FACING_YAW["-x"], "sit");
    for (const [x, z, yaw] of C.bystanders) person(x, F, z, yaw, rng() < 0.5 ? "phone" : "stand", 0.95 + rng() * 0.1);
  }

  return { solid: merge(solid), glass: merge(glass), glow: merge(glow), signs: merge(signs) };
}

/** One escalator's treads as steps, from a step below the foot to the head: slid along the slope to make them run (WalkMode.tsx). */
export function buildEscalatorSteps(plan: ConcoursePlan): { geometry: BufferGeometry; tread: number; rise: number } {
  const E = CONCOURSE.escalator;
  const rise = E.stepRise;
  const tread = rise / Math.tan(E.angle);
  const n = Math.round(plan.escalator.rise / rise);
  const parts: BufferGeometry[] = [];
  const half = E.stepWidth / 2;
  // Stopping a step short of the head keeps every tread under the landing floor as it arrives.
  for (let k = -1; k < n - 1; k++) {
    // Tops half a riser off the walking line, as on the street stairs.
    const y = (k + 0.5) * rise;
    parts.push(cbox(k * tread, (k + 1) * tread, y - rise - 0.02, y, -half, half, "#2a2f36"));
    // Yellow edge on each nosing.
    parts.push(cbox((k + 1) * tread - 0.03, (k + 1) * tread, y, y + 0.004, -half, half, COLOUR.guide));
  }
  return { geometry: merge(parts), tread, rise };
}
