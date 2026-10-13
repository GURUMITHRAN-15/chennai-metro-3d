/**
 * The simulator's loading progress as one honest number, and the journey's
 * stops placed along the loading screen's strip. Pure, for the tests.
 */

export interface LoadProgress {
  route: number;
  environment: number;
  train: number;
  render: number;
}

/** Each stage's share of the wait, roughly as long as it takes (the city is most of it). */
const STAGES: { key: keyof LoadProgress; weight: number; label: string }[] = [
  { key: "route", weight: 0.1, label: "Loading the route" },
  { key: "environment", weight: 0.5, label: "Loading the city" },
  { key: "train", weight: 0.15, label: "Preparing the train" },
  { key: "render", weight: 0.25, label: "Getting the scene ready" },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

/** 0..1 over all stages, weighted. */
export function overallProgress(p: LoadProgress): number {
  return clamp01(STAGES.reduce((sum, s) => sum + s.weight * clamp01(p[s.key]), 0));
}

/** What is happening now: the first stage not yet complete ("Ready" once all are). */
export function stageLabel(p: LoadProgress): string {
  return STAGES.find((s) => clamp01(p[s.key]) < 1)?.label ?? "Ready";
}

export interface StripStop {
  name: string;
  nameTa: string | null;
  /** 0 at the origin, 1 at the destination, by real distance along the journey. */
  at: number;
  interchange: boolean;
}

/** Stops placed by their distance along the journey (x in metres from the origin). */
export function stripStops(stops: { name: string; nameTa: string | null; x: number; interchange: boolean }[]): StripStop[] {
  const end = stops.length ? stops[stops.length - 1].x : 0;
  return stops.map((s) => ({ name: s.name, nameTa: s.nameTa, interchange: s.interchange, at: end > 0 ? clamp01(s.x / end) : 0 }));
}
