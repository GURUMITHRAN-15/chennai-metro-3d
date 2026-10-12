"use client";

import { useSyncExternalStore } from "react";

export type WebGLStatus = "checking" | "supported" | "unsupported";

let cached: WebGLStatus | null = null;

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    // Only a probe: hand its GPU context back rather than wait for garbage collection.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

function clientStatus(): WebGLStatus {
  if (cached) return cached;
  // Allows forcing the fallback for testing: ?webgl=0
  const forcedOff = new URLSearchParams(window.location.search).get("webgl") === "0";
  cached = !forcedOff && detectWebGL() ? "supported" : "unsupported";
  return cached;
}

const noop = () => () => {};
const checking = (): WebGLStatus => "checking";

/**
 * "checking" during SSR/hydration, then the (cached) client result. The probe
 * creates a WebGL context, which can take a few hundred milliseconds; pass
 * `enabled = false` to put it off (it stays "checking" until enabled).
 */
export function useWebGL(enabled = true): WebGLStatus {
  return useSyncExternalStore(noop, enabled ? clientStatus : checking, checking);
}
