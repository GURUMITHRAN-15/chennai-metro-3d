import { BoxGeometry, BufferGeometry, Color, CylinderGeometry, ExtrudeGeometry, Matrix4, Shape, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { faceX, paint } from "./trainNose.ts";

/**
 * The driver's position in the cab of the Chennai Metro Alstom Metropolis,
 * after photos of the Phase II trainset: a warm-grey moulded desk wrapping
 * round from the left wall, its sloping top carrying the master controller
 * and button fields on black plates edged in yellow, a raised fascia behind
 * with the screens, the round gauges and the lamp-button grid, and a black
 * leather seat on a pedestal. The driver sits left of the centre line.
 *
 * Car-local space (+x forward, +y up from rail top, +z right); `x0` is the cab
 * bulkhead. Everything stays inside the nose (trainNose.ts faceX).
 */

const FLOOR = 1.13;

const C = {
  desk: "#77746f",
  deskTop: "#6a6762",
  plate: "#16181b",
  trim: "#e8b52c",
  bezel: "#0f1012",
  key: "#3a3e44",
  steel: "#8f9398",
  lever: "#0d0e10",
  seat: "#1b1d20",
  seatSeam: "#2c2f33",
  tread: "#9ea2a7",
  dial: "#e9ecef",
};

/** Glowing parts: lamp buttons, screens and dials. */
const G = {
  red: "#ff3b30",
  green: "#2fd06b",
  yellow: "#ffc93c",
  blue: "#3b8cff",
  white: "#f2f5f8",
  amber: "#ff9f1a",
  screen: "#0e2230",
  ui: "#5cc4ff",
  uiDim: "#2a5f80",
  uiText: "#d8e6f0",
};

/** Desk section in side view, x ahead of the bulkhead: toe, lip, sloping top, raised fascia, back. */
const PROFILE: [number, number][] = [
  [1.5, FLOOR],
  [1.5, FLOOR + 0.1],
  [1.44, FLOOR + 0.14],
  [1.47, 1.95],
  [1.43, 1.98],
  [1.45, 2.02],
  [1.84, 2.12],
  [1.86, 2.16],
  [2.02, 2.43],
  [2.06, 2.47],
  [2.25, 2.47],
  [2.25, FLOOR],
];
/** Sloping desk top (from the lip back) and the fascia (from its foot up). */
const DESK = { from: [1.45, 2.02] as const, to: [1.84, 2.12] as const };
const FASCIA = { from: [1.86, 2.16] as const, to: [2.02, 2.43] as const };
/** The desk runs from the left wall to right of the centre. */
const Z_LEFT = -1.36;
const Z_RIGHT = 0.72;

export interface CabConsoleParts {
  /** Vertex-coloured desk, plates, keys, lever and seat. */
  solid: BufferGeometry;
  /** Vertex-coloured lamps, screens and dial faces (unlit). */
  glow: BufferGeometry;
}

export function buildCabConsole(x0: number, seatZ: number): CabConsoleParts {
  const solid: BufferGeometry[] = [];
  const glow: BufferGeometry[] = [];
  const box = (x: [number, number], y: [number, number], z: [number, number], colour: string, m?: Matrix4) => {
    const g = new BoxGeometry(x[1] - x[0], y[1] - y[0], z[1] - z[0]).translate((x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2);
    if (m) g.applyMatrix4(m);
    return paint(g, colour);
  };
  const disc = (u: number, z: number, r: number, h: number, colour: string, m: Matrix4, y0 = 0) =>
    paint(new CylinderGeometry(r, r, h, 18).translate(u, y0 + h / 2, z).applyMatrix4(m), colour);

  // The moulded desk: the section run along z, held inside the nose where it curves back.
  const shape = new Shape();
  shape.moveTo(PROFILE[0][0], PROFILE[0][1]);
  for (const [x, y] of PROFILE.slice(1)) shape.lineTo(x, y);
  shape.closePath();
  const desk = new ExtrudeGeometry(shape, { depth: Z_RIGHT - Z_LEFT, bevelEnabled: false, steps: 40 });
  desk.translate(0, 0, Z_LEFT);
  const p = desk.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const z = p.getZ(i);
    p.setX(i, Math.min(p.getX(i), faceX(y, z) - 0.09));
  }
  desk.computeVertexNormals();
  // Top surfaces a shade darker than the body, as worn plastic reads.
  const deskPainted = paint(desk, C.desk);
  {
    const n = deskPainted.getAttribute("normal");
    const col = deskPainted.getAttribute("color");
    const top = new Color(C.deskTop);
    for (let i = 0; i < n.count; i++) if (n.getY(i) > 0.6) col.setXYZ(i, top.r, top.g, top.b);
  }
  deskPainted.translate(x0, 0, 0);
  solid.push(deskPainted);

  // Panel frames: local x up the surface, y out of it (towards the driver), z across.
  const panel = (from: readonly [number, number], to: readonly [number, number]) => {
    const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return { m: new Matrix4().makeTranslation(x0 + from[0], from[1], 0).multiply(new Matrix4().makeRotationZ(a)), len };
  };
  const desktop = panel(DESK.from, DESK.to);
  const fascia = panel(FASCIA.from, FASCIA.to);

  /** A black plate edged in yellow, on a panel. */
  const plate = (m: Matrix4, u0: number, u1: number, z0: number, z1: number, trimmed = true) => {
    solid.push(box([u0, u1], [0, 0.008], [z0, z1], C.plate, m));
    if (!trimmed) return;
    const t = 0.011;
    for (const [a, b, c, d] of [
      [u0, u1, z0, z0 + t],
      [u0, u1, z1 - t, z1],
      [u0, u0 + t, z0, z1],
      [u1 - t, u1, z0, z1],
    ])
      solid.push(box([a + 0.01, b - 0.01], [0.008, 0.011], [c + (c === z0 ? 0.01 : 0), d - (d === z1 ? 0.01 : 0)], C.trim, m));
  };
  /** A lamp push-button: dark collar, glowing lens. */
  const lamp = (m: Matrix4, u: number, z: number, colour: string, r = 0.017) => {
    solid.push(disc(u, z, r + 0.006, 0.012, C.key, m, 0.008));
    glow.push(disc(u, z, r, 0.006, colour, m, 0.02));
  };
  /** A screen: bezel with soft keys, a dark display with a few rows of interface. */
  const screen = (m: Matrix4, u0: number, u1: number, z0: number, z1: number, keys: boolean) => {
    solid.push(box([u0, u1], [0, 0.02], [z0, z1], C.bezel, m));
    const ku = keys ? 0.035 : 0.015;
    const kz = keys ? 0.035 : 0.015;
    const [d0, d1, e0, e1] = [u0 + ku, u1 - ku, z0 + kz, z1 - kz];
    glow.push(box([d0, d1], [0.02, 0.022], [e0, e1], G.screen, m));
    // Interface: a header bar, a speed bar and rows of status text.
    const h = d1 - d0;
    glow.push(box([d1 - h * 0.14, d1 - h * 0.05], [0.022, 0.0235], [e0 + 0.01, e1 - 0.01], G.uiDim, m));
    glow.push(box([d0 + h * 0.62, d0 + h * 0.72], [0.022, 0.0235], [e0 + 0.015, e0 + (e1 - e0) * 0.6], G.ui, m));
    for (let k = 0; k < 4; k++) {
      const v = d0 + h * (0.12 + k * 0.11);
      glow.push(box([v, v + h * 0.04], [0.022, 0.0235], [e0 + 0.015, e0 + (e1 - e0) * (0.35 + 0.12 * (k % 3))], G.uiText, m));
    }
    if (keys) {
      const n = Math.max(3, Math.round((z1 - z0) / 0.045));
      for (let k = 0; k < n; k++) {
        const z = z0 + kz + ((e1 - e0) * (k + 0.5)) / n;
        solid.push(box([u0 + 0.008, u0 + 0.024], [0.02, 0.026], [z - 0.011, z + 0.011], C.key, m));
        solid.push(box([u1 - 0.024, u1 - 0.008], [0.02, 0.026], [z - 0.011, z + 0.011], C.key, m));
      }
    }
  };
  /** A round gauge: black case, light face, a needle. */
  const gauge = (m: Matrix4, u: number, z: number, r: number) => {
    solid.push(disc(u, z, r + 0.008, 0.02, C.bezel, m));
    glow.push(disc(u, z, r, 0.004, C.dial, m, 0.02));
    solid.push(box([u - 0.003, u + r * 0.8], [0.025, 0.028], [z - 0.002, z + 0.002], G.red, m));
  };

  // Fascia, left to right: the radio (knobs over a small screen with keys), the main screen,
  // the gauges beside a grid of lamp buttons, and the large screen with soft keys.
  {
    const { m, len } = fascia;
    const top = len - 0.02;
    plate(m, 0.03, top, -1.12, -0.76);
    for (let k = 0; k < 5; k++) lamp(m, top - 0.05, -1.08 + k * 0.06, k === 4 ? G.green : C.steel, 0.014);
    screen(m, 0.06, top - 0.1, -1.08, -0.86, false);
    for (let k = 0; k < 4; k++) lamp(m, 0.09 + k * 0.045, -0.82, k === 3 ? G.red : G.amber, 0.011);
    screen(m, 0.03, top, -0.72, -0.4, false);
    plate(m, 0.03, top, -0.36, -0.02);
    gauge(m, top - 0.07, -0.3, 0.038);
    gauge(m, 0.1, -0.3, 0.032);
    const grid = [G.red, G.green, G.blue, G.red, G.red, G.green, G.red, G.blue, G.red, G.green, G.red, G.red];
    grid.forEach((c, i) => lamp(m, 0.07 + (i % 3) * 0.07, -0.21 + Math.floor(i / 3) * 0.055, c, 0.018));
    screen(m, 0.02, top, 0.02, 0.6, true);
  }

  // Desk top: a field of lamp buttons on the left, the master controller in front of the
  // driver, and the door and emergency buttons along the lip on the right.
  {
    const { m, len } = desktop;
    plate(m, 0.09, len - 0.04, -1.08, -0.72);
    const field = [G.white, G.green, G.yellow, G.white, G.blue, G.red, G.green, G.white, G.yellow, G.green, G.red, G.white];
    field.forEach((c, i) => lamp(m, 0.13 + (i % 3) * 0.075, -1.03 + Math.floor(i / 3) * 0.09, c, 0.016));
    // Master controller: a yellow-edged plate with a slot, the lever and its black grip.
    plate(m, 0.1, len - 0.03, -0.58, -0.12);
    solid.push(box([0.17, 0.3], [0.008, 0.012], [-0.37, -0.35], C.bezel, m));
    solid.push(paint(new CylinderGeometry(0.012, 0.012, 0.14, 10).translate(0, 0.07, 0).applyMatrix4(new Matrix4().makeRotationZ(-0.35)).translate(0.23, 0.01, -0.36).applyMatrix4(m), C.steel));
    solid.push(paint(new CylinderGeometry(0.022, 0.022, 0.13, 14).rotateX(Math.PI / 2).translate(0.27, 0.14, -0.36).applyMatrix4(m), C.lever));
    solid.push(paint(new SphereGeometry(0.026, 12, 8).translate(0.27, 0.14, -0.29).applyMatrix4(m), C.lever));
    // A cup-holder recess and a small plate of buttons by the lip.
    solid.push(box([0.02, 0.09], [0.002, 0.006], [-0.66, -0.6], C.bezel, m));
    plate(m, 0.01, 0.12, -0.08, 0.36);
    lamp(m, 0.065, -0.03, G.green, 0.02);
    lamp(m, 0.065, 0.13, G.white, 0.02);
    lamp(m, 0.065, 0.2, G.green, 0.02);
    lamp(m, 0.065, 0.3, G.red, 0.02);
    // The red emergency mushroom, standing proud.
    solid.push(disc(0.065, 0.055, 0.016, 0.03, C.key, m, 0.008));
    solid.push(paint(new SphereGeometry(0.03, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1).translate(0.065, 0.038, 0.055).applyMatrix4(m), "#d4231c"));
  }

  // Chequer-plate footrest at the foot of the desk.
  solid.push(box([x0 + 1.3, x0 + 1.49], [FLOOR, FLOOR + 0.09], [Z_LEFT + 0.1, Z_RIGHT - 0.2], C.tread));

  // The seat: pedestal, cushion, raked back with a headrest, two armrests.
  {
    const sx = x0 + 0.82;
    solid.push(paint(new CylinderGeometry(0.2, 0.22, 0.03, 20).translate(sx, FLOOR + 0.015, seatZ), C.seat));
    solid.push(paint(new CylinderGeometry(0.08, 0.1, 0.36, 16).translate(sx, FLOOR + 0.2, seatZ), C.seat));
    solid.push(box([sx - 0.25, sx + 0.25], [FLOOR + 0.38, FLOOR + 0.52], [seatZ - 0.26, seatZ + 0.26], C.seat));
    solid.push(box([sx - 0.2, sx + 0.22], [FLOOR + 0.52, FLOOR + 0.535], [seatZ - 0.2, seatZ + 0.2], C.seatSeam));
    const rake = new Matrix4().makeTranslation(sx - 0.24, FLOOR + 0.5, seatZ).multiply(new Matrix4().makeRotationZ(0.16));
    solid.push(box([-0.12, 0], [0, 0.72], [-0.25, 0.25], C.seat, rake));
    solid.push(box([-0.1, 0.005], [0.06, 0.62], [-0.19, 0.19], C.seatSeam, rake));
    solid.push(box([-0.11, 0], [0.78, 0.96], [-0.15, 0.15], C.seat, rake));
    for (const s of [-1, 1]) solid.push(box([sx - 0.2, sx + 0.2], [FLOOR + 0.72, FLOOR + 0.79], [seatZ + s * 0.31 - 0.045, seatZ + s * 0.31 + 0.045], C.seat));
  }

  const join = (parts: BufferGeometry[]) => {
    const clean = parts.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      for (const name of Object.keys(n.attributes)) if (name !== "position" && name !== "normal" && name !== "color") n.deleteAttribute(name);
      return n;
    });
    const out = mergeGeometries(clean, false);
    if (!out) throw new Error("Failed to merge the cab console");
    out.computeBoundingSphere();
    return out;
  };
  return { solid: join(solid), glow: join(glow) };
}
