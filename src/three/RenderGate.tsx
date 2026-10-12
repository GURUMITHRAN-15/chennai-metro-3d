"use client";

import { useFrame } from "@react-three/fiber";
import type { WebGLRenderer } from "three";

/**
 * Takes over rendering (priority 1) and draws nothing until the shaders are
 * compiled: otherwise every frame while the scene mounts would compile its new
 * materials synchronously and freeze the page (the loading screen covers the
 * canvas meanwhile).
 */
export function RenderGate({ open }: { open: { current: boolean } }) {
  useFrame(({ gl, scene, camera }) => {
    if (open.current) gl.render(scene, camera);
  }, 1);
  return null;
}

/** Main-thread time per frame for warming compiled programs (ms). */
const WARM_BUDGET = 8;

/**
 * After compileAsync, each program still makes blocking driver queries the
 * first time it is drawn (link status, info logs, uniform locations). Left to
 * the first frame they add up to a few hundred milliseconds in one go; this
 * makes them a few programs per frame instead, while the canvas is still hidden.
 */
export function warmPrograms(gl: WebGLRenderer): Promise<void> {
  const programs = [...(gl.info.programs ?? [])];
  let i = 0;
  return new Promise((resolve) => {
    const step = () => {
      const t0 = performance.now();
      while (i < programs.length && performance.now() - t0 < WARM_BUDGET) programs[i++].getUniforms();
      if (i < programs.length) requestAnimationFrame(step);
      else resolve();
    };
    step();
  });
}

/**
 * The shader error check reads every program's info logs on first use, each a
 * blocking round trip to the GPU process. Keep it while developing; production
 * builds skip it (a broken shader is caught in development first).
 */
export function configureShaderChecks(gl: WebGLRenderer) {
  gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
}
