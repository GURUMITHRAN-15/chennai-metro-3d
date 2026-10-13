import { test } from "node:test";
import assert from "node:assert/strict";
import { overallProgress, stageLabel, stripStops } from "./loadingProgress.ts";

const p = (route: number, environment: number, train: number, render: number) => ({ route, environment, train, render });

test("loading progress: weighted, 0 to 1, and the stage is the first one not done", () => {
  assert.equal(overallProgress(p(0, 0, 0, 0)), 0);
  assert.equal(overallProgress(p(1, 1, 1, 1)), 1);
  assert.ok(Math.abs(overallProgress(p(1, 0.5, 0, 0)) - 0.35) < 1e-9, "route done, city half way");
  assert.equal(overallProgress(p(2, 9, -1, Number.NaN)), 0.6, "out-of-range stages are clamped");
  assert.equal(stageLabel(p(1, 0.4, 0, 0)), "Loading the city");
  assert.equal(stageLabel(p(1, 1, 1, 0.5)), "Getting the scene ready");
  assert.equal(stageLabel(p(1, 1, 1, 1)), "Ready");
});

test("strip stops sit by their distance along the journey", () => {
  const s = stripStops([
    { name: "A", nameTa: null, x: 0, interchange: false },
    { name: "B", nameTa: null, x: 1000, interchange: true },
    { name: "C", nameTa: null, x: 4000, interchange: false },
  ]);
  assert.deepEqual(s.map((x) => x.at), [0, 0.25, 1]);
  assert.equal(s[1].interchange, true);
  assert.deepEqual(stripStops([]), []);
});
