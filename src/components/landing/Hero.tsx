"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "../ui/Icons";
import { SiteHeader } from "../navigation/SiteHeader";
import { useWebGL } from "../../hooks/useWebGL";
import { usePrefersReducedMotion } from "../../hooks/useReducedMotion";
import { SceneErrorBoundary } from "../simulator/SceneErrorBoundary";

const HeroScene = dynamic(() => import("../../three/HeroScene"), { ssr: false });

export interface HeroProps {
  stations: number;
  /** The journey the main button starts. */
  ride: { href: string; label: string };
  /** The lines' colours, Line 1 first: they fill "Chennai Metro." in the headline. */
  lineColours: string[];
}

export function Hero({ stations, ride, lineColours }: HeroProps) {
  // Lifted a little towards white so the darker ones (the Purple Line) still read on the dusk scene.
  const fill = `linear-gradient(90deg, ${lineColours.map((c) => `color-mix(in oklab, ${c} 78%, white)`).join(", ")})`;
  // The 3D backdrop waits until the page has loaded and the browser is idle, so the WebGL probe and
  // the scene build don't hold up hydration or the headline's entrance. The poster covers the wait.
  const [start, setStart] = useState(false);
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (typeof requestIdleCallback === "function") idle = requestIdleCallback(() => setStart(true), { timeout: 1500 });
      else timer = window.setTimeout(() => setStart(true), 200);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle) cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);
  const webgl = useWebGL(start);
  const reduced = usePrefersReducedMotion();
  const [sceneReady, setSceneReady] = useState(false);
  const section = useRef<HTMLElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  // Stop drawing the 3D scene once the hero has scrolled out of view; pick up where it left off on the way back.
  useEffect(() => {
    const el = section.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={section} className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden" aria-labelledby="hero-title">
      {/* Poster shown until the 3D scene is ready (and as the WebGL fallback). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 78% 62%, rgba(217,154,98,0.32) 0%, rgba(217,154,98,0) 55%), linear-gradient(180deg, #060a11 0%, #142238 55%, #3a4356 100%)",
        }}
      />
      {webgl === "supported" && (
        <div className={`absolute inset-0 -z-10 transition-opacity duration-1000 ${sceneReady ? "opacity-100" : "opacity-0"}`}>
          <SceneErrorBoundary fallback={null}>
            {/* paused: stops rendering while the hero is off screen (see the observer above). */}
            <HeroScene reducedMotion={reduced} paused={!onScreen} onReady={() => setSceneReady(true)} />
          </SceneErrorBoundary>
        </div>
      )}
      {/* Just enough shade for the words: from the lower left, where they sit, and under the header. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 0% 100%, rgba(7,11,18,0.88) 0%, rgba(7,11,18,0.55) 45%, rgba(7,11,18,0) 75%), linear-gradient(180deg, rgba(7,11,18,0.6) 0%, rgba(7,11,18,0) 18%)",
        }}
      />

      <SiteHeader overlay />

      <div id="main" className="absolute inset-x-5 bottom-14 flex max-w-[640px] flex-col gap-7 sm:inset-x-8 sm:bottom-16 lg:left-12 lg:bottom-20">
        <div className="flex flex-col gap-5 animate-rise-in">
          <h1 id="hero-title" className="text-[clamp(2.75rem,7vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Ride the
            <br />
            <span className="headline-lines" style={{ ["--line-fill" as string]: fill }}>
              Chennai Metro.
            </span>
          </h1>
          <p className="max-w-[30rem] text-[17px] leading-[1.5] text-[#c3cbd6] sm:text-[19px]">
            All five lines on their real track: over the viaducts, through the tunnels and into {stations} stations. Drawn live, in your
            browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-4 animate-rise-in [animation-delay:90ms]">
          <Link
            href={ride.href}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[16px] font-semibold text-bg transition-[transform,background-color] duration-100 ease-out hover:bg-white active:scale-[0.97]"
          >
            {ride.label}
            <ArrowRight size={17} />
          </Link>
          <Link href="/routes" className="group inline-flex items-center gap-1.5 text-[16px] font-medium text-ink/85 transition-colors hover:text-ink">
            Plan a journey
            <ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="absolute bottom-5 right-5 hidden items-center gap-2 text-[12px] text-white/55 sm:right-8 sm:flex lg:right-12">
        {webgl === "unsupported" ? (
          "3D preview unavailable on this device"
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-[#f2b705]" aria-hidden="true" />
            Live: Line 4, Thelliyaragaram to Porur
          </>
        )}
      </p>
    </section>
  );
}
