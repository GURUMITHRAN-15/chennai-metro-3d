"use client";

import { useState, type ReactNode } from "react";
import { LogoMark } from "../ui/Logo";
import { LineRoundel } from "../ui/LineRoundel";
import { overallProgress, stageLabel, type LoadProgress, type StripStop } from "../../lib/loadingProgress";

export type { LoadProgress } from "../../lib/loadingProgress";

export interface LoadRow {
  label: string;
  /** 0..1, or null while the stage is running but can't report a fraction. */
  value: number | null;
  /** Shown instead of a percentage for indeterminate or waiting rows. */
  note?: string;
}

/** The trip the loading screen draws: its line and its stops, placed by distance (lib/loadingProgress stripStops). */
export interface LoadingJourney {
  lineName: string;
  colour: string;
  stops: StripStop[];
}

function Bar({ label, value, note }: LoadRow) {
  const pct = value === null ? null : Math.round(Math.min(1, Math.max(0, value)) * 100);
  const waiting = note === "Waiting";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[13px]">
        <span className={pct !== null && pct >= 100 ? "text-subtle" : waiting ? "text-faint" : "text-ink"}>{label}</span>
        <span className="tabular font-mono text-[12px] text-muted">{pct === null ? note ?? "…" : `${pct}%`}</span>
      </div>
      <div
        className="relative h-[3px] overflow-hidden rounded-full bg-line-strong"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? undefined}
        aria-valuetext={pct === null ? note ?? "In progress" : undefined}
      >
        {pct === null ? (
          !waiting && <div className="loading-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-ink" />
        ) : (
          <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  );
}

/** The train that rides the strip: three white cars, a window band in the line's colour, the nose to the right. */
function StripTrain({ colour }: { colour: string }) {
  return (
    <div className="relative h-[13px] w-[54px] rounded-l-[3px] rounded-r-[9px] bg-ink shadow-[0_0_18px_rgba(245,247,250,0.35)]">
      <span className="absolute left-[4px] right-[9px] top-[3px] h-[3px] rounded-full" style={{ background: colour }} />
      {[1, 2].map((k) => (
        <span key={k} className="absolute bottom-0 top-0 w-px bg-bg/50" style={{ left: `${(k * 100) / 3}%` }} />
      ))}
    </div>
  );
}

/**
 * The journey as a metro strip: the line in its colour, a dot per stop placed
 * by real distance, and a train whose nose is at the loading progress. With no
 * value (the code is still downloading) a soft light runs along the line instead.
 */
function JourneyStrip({ journey, value, colour }: { journey: LoadingJourney | null; value: number | null; colour: string }) {
  const pct = (value ?? 0) * 100;
  const stops = journey?.stops ?? [];
  const small = stops.length > 25;
  const first = stops[0];
  const last = stops[stops.length - 1];
  return (
    // Left padding: the train's length, so at the start it waits behind the origin, on the page.
    <div className="pl-[54px]" aria-hidden="true">
      <div className="relative h-[34px]">
        {/* The line ahead, dim; the part travelled, solid. */}
        <div className="absolute inset-x-0 top-[22px] h-[6px] rounded-full opacity-25" style={{ background: colour }} />
        {value !== null ? (
          <div className="absolute left-0 top-[22px] h-[6px] rounded-full transition-[width] duration-700 ease-out" style={{ background: colour, width: `${pct}%` }} />
        ) : (
          <div className="loading-strip-shimmer absolute inset-x-0 top-[22px] h-[6px] overflow-hidden rounded-full" style={{ ["--strip" as string]: colour }} />
        )}
        {stops.map((s, i) => {
          const end = i === 0 || i === stops.length - 1;
          const passed = s.at * 100 <= pct + 0.01 && value !== null;
          const size = end ? 14 : s.interchange ? (small ? 9 : 11) : small ? 5 : 8;
          return (
            <span
              key={i}
              className="absolute top-[25px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-500"
              style={{
                left: `${s.at * 100}%`,
                width: size,
                height: size,
                background: passed || end ? (s.interchange || end ? "#f5f7fa" : colour) : "#070b12",
                boxShadow: `0 0 0 ${end || s.interchange ? 2.5 : 1.5}px ${end || s.interchange ? (passed || end ? colour : "#f5f7fa") : colour}`,
              }}
            />
          );
        })}
        {/* The train: its nose at the progress point; the wrapper spans the line, so a percentage moves along it. */}
        <div className="absolute inset-x-0 top-[6px] transition-transform duration-700 ease-out" style={{ transform: `translateX(${pct}%)` }}>
          <div className="absolute right-full top-0">
            {/* Before the line is known the band is grey, not white on white. */}
            <StripTrain colour={journey ? colour : "#8b96a7"} />
          </div>
        </div>
      </div>
      {first && last && first !== last && (
        <div className="mt-4 flex items-start justify-between gap-6">
          {[first, last].map((s, k) => (
            <div key={k} className={`flex min-w-0 flex-col ${k ? "items-end text-right" : ""}`}>
              <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{s.name}</span>
              {s.nameTa && (
                <span lang="ta" className="font-tamil truncate text-[13px] text-muted">
                  {s.nameTa}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The simulator's loading screen. With a journey: the trip as a metro strip,
 * a train gliding along it as the real loading progresses (never backwards).
 * Before the code has arrived (journey null): the same strip, waiting.
 * Otherwise (a failure): plain rows.
 */
export function LoadingScreen({
  progress,
  rows,
  journey,
  visible,
  title,
  children,
}: {
  progress?: LoadProgress;
  rows?: LoadRow[];
  /** The trip to draw; null while it isn't known yet (the strip waits). Omit for plain rows. */
  journey?: LoadingJourney | null;
  visible: boolean;
  title: string;
  /** Extra content under the strip (help, actions). */
  children?: ReactNode;
}) {
  const strip = journey !== undefined;
  const value = progress ? overallProgress(progress) : null;
  // The train only ever moves forward, even if a stage reports a lower figure later.
  const [peak, setPeak] = useState(0);
  if (value !== null && value > peak) setPeak(value);
  const shown = value === null ? null : Math.max(peak, value);
  const pct = shown === null ? null : Math.round(shown * 100);
  const stage = progress ? stageLabel(progress) : "Downloading the simulator";
  const colour = journey?.colour ?? "#f5f7fa";

  return (
    <div
      className={`absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-bg px-6 py-10 transition-opacity duration-700 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className={`flex w-full flex-col gap-10 ${strip ? "max-w-[640px]" : "max-w-[380px]"}`}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="text-[13px] font-semibold tracking-[0.16em]">CHENNAI METRO 3D</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.025em]">Preparing your journey</p>
            <p className="flex items-center gap-2.5 text-[15px] text-subtle">
              {journey && <LineRoundel colour={journey.colour} name={journey.lineName} size="sm" />}
              {title}
            </p>
          </div>
        </div>

        {strip ? (
          <div className="flex flex-col gap-5">
            <div
              role="progressbar"
              aria-label="Loading the simulator"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct ?? undefined}
              aria-valuetext={pct === null ? stage : `${stage}, ${pct}%`}
            >
              <JourneyStrip journey={journey ?? null} value={shown} colour={colour} />
            </div>
            <p className="flex items-center justify-between text-[13px] text-muted" role="status" aria-live="polite">
              <span>{stage}</span>
              {pct !== null && <span className="tabular font-mono text-[12px]">{pct}%</span>}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {(rows ?? []).map((r) => (
              <Bar key={r.label} {...r} />
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
