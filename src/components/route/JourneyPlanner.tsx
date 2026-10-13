"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { RouteMap } from "./RouteMap";
import { StationCombobox } from "./StationCombobox";
import { ArrowRight, Swap } from "../ui/Icons";
import { buttonClass } from "../ui/Button";
import { LineRoundel } from "../ui/LineRoundel";
import { journeyDistanceKm, journeyDuration, simulatorHref, stationsBetween, type RouteSummary } from "../../lib/routeSummary";
import { statusChip } from "../../lib/lines";

type Field = "from" | "to";

export function JourneyPlanner({ summaries }: { summaries: RouteSummary[] }) {
  const params = useSearchParams();
  const initial = summaries.find((r) => r.id === params.get("route")) ?? summaries[0];
  const [routeId, setRouteId] = useState(initial.id);
  const summary = summaries.find((r) => r.id === routeId) ?? summaries[0];
  return (
    <div className="flex flex-1 flex-col gap-8">
      <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.035em]">Plan a journey</h1>
      <LinePicker summaries={summaries} value={summary.id} onChange={setRouteId} />
      {/* Keyed by route so the stations reset when the line changes. */}
      <Planner key={summary.id} summary={summary} initialFrom={summary === initial ? params.get("from") : null} initialTo={summary === initial ? params.get("to") : null} />
    </div>
  );
}

function LinePicker({ summaries, value, onChange }: { summaries: RouteSummary[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Line" className="-mx-1 flex flex-wrap gap-2">
      {summaries.map((r) => {
        const on = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(r.id)}
            className={`flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-left transition-[background-color,box-shadow,transform] duration-100 ease-out active:scale-[0.97] ${
              on ? "bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]" : "hover:bg-white/[0.04]"
            }`}
          >
            <LineRoundel colour={r.lineColour} name={r.lineName} />
            <span className="flex flex-col leading-tight">
              <span className={`text-[14px] font-medium ${on ? "text-ink" : "text-subtle"}`}>{r.title}</span>
              {r.preview && <span className="text-[12px] text-[#f0a46c]">{statusChip(r.status)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Planner({ summary, initialFrom, initialTo }: { summary: RouteSummary; initialFrom: string | null; initialTo: string | null }) {
  const router = useRouter();
  const stops = summary.stations.filter((s) => s.service === "stop");
  const valid = (id: string | null) => (id && stops.some((s) => s.id === id) ? id : null);
  const [from, setFrom] = useState<string>(valid(initialFrom) ?? stops[0].id);
  const [to, setTo] = useState<string>(valid(initialTo) ?? stops[stops.length - 1].id);
  const [active, setActive] = useState<Field>("from");
  const [announce, setAnnounce] = useState("");
  const fromId = useId();
  const toId = useId();

  const same = from === to;
  const stats = useMemo(() => {
    if (same) return null;
    const between = stationsBetween(summary, from, to);
    return {
      km: journeyDistanceKm(summary, from, to),
      seconds: journeyDuration(summary, from, to),
      stops: between.filter((s) => s.service === "stop").length,
      passes: between.filter((s) => s.service === "pass").length,
    };
  }, [summary, from, to, same]);

  const nameOf = (id: string) => summary.stations.find((s) => s.id === id)?.name ?? id;

  const pick = (id: string) => {
    if (active === "from") {
      setFrom(id);
      setActive("to");
      setAnnounce(`Origin set to ${nameOf(id)}. Now choose a destination.`);
    } else {
      setTo(id);
      setActive("from");
      setAnnounce(`Destination set to ${nameOf(id)}.`);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setAnnounce(`Swapped. From ${nameOf(to)} to ${nameOf(from)}.`);
  };

  const href = simulatorHref(summary.id, from, to);

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      <section
        aria-labelledby="choose-heading"
        className="flex w-full flex-col gap-7 lg:max-w-[400px]"
      >
        <h2 id="choose-heading" className="flex items-center gap-3 text-[15px] font-medium text-subtle">
          <LineRoundel colour={summary.lineColour} name={summary.lineName} size="sm" />
          {summary.lineColourName}: choose two stations
        </h2>

        <div className="flex flex-col gap-2.5">
          <StationCombobox
            id={fromId}
            label="From"
            value={from}
            stops={stops}
            active={active === "from"}
            onFocus={() => setActive("from")}
            onChange={setFrom}
            marker={<span className="h-3 w-3 rounded-full border-[2.5px] border-ink" />}
          />
          <div className="-my-1 flex justify-end">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap origin and destination"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-subtle transition-[background-color,color,transform] duration-100 ease-out hover:bg-white/[0.1] hover:text-ink active:scale-[0.94]"
            >
              <Swap size={16} />
            </button>
          </div>
          <StationCombobox
            id={toId}
            label="To"
            value={to}
            stops={stops}
            active={active === "to"}
            onFocus={() => setActive("to")}
            onChange={setTo}
            marker={<span className="h-3 w-3 rounded-full bg-ink" />}
          />
        </div>

        <dl className="grid grid-cols-3 gap-3 border-t border-line pt-7">
          <Stat label="Distance" value={stats ? stats.km.toFixed(1) : "—"} unit="km" />
          <Stat label="Journey" value={stats ? String(Math.round(stats.seconds / 60)) : "—"} unit="min" />
          <Stat label="Stations" value={stats ? String(stats.stops) : "—"} />
        </dl>

        <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
          {same && <p className="text-[#ffb4a8]" role="alert">Choose two different stations.</p>}
          {stats && stats.passes > 0 && (
            <p>
              {stats.passes} double-decker {stats.passes === 1 ? "station is" : "stations are"} passed without stopping until
              they open.
            </p>
          )}
          {summary.preview && (
            <p className="text-[#f0a46c]">
              {summary.statusLabel}. This is a preview ride on the real track: every station is a stop, timings are illustrative.
            </p>
          )}
          <p>
            Journey time is simulated from the published train specification
            {summary.reportedJourneyMinutes ? `. CMRL quotes about ${summary.reportedJourneyMinutes} minutes end to end.` : "."}
          </p>
        </div>

        <Link
          href={same ? "#" : href}
          aria-disabled={same}
          onClick={(e) => {
            if (same) e.preventDefault();
            else {
              e.preventDefault();
              router.push(href);
            }
          }}
          className={buttonClass("primary", "lg", `mt-auto w-full ${same ? "pointer-events-none opacity-40" : ""}`)}
        >
          Ride this journey <ArrowRight size={18} />
        </Link>
        <Link
          href={same ? "#" : `${href}&walk=1`}
          aria-disabled={same}
          onClick={(e) => {
            if (same) e.preventDefault();
          }}
          className={buttonClass("secondary", "md", `w-full ${same ? "pointer-events-none opacity-40" : ""}`)}
        >
          Start on foot, at the ticket hall
        </Link>
      </section>

      <section aria-label="Route map" className="relative min-h-[460px] flex-1 overflow-hidden rounded-3xl bg-[#0a0f18]">
        <div className="absolute inset-x-6 top-5 z-10 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
          <p>
            Select a station to set it as{" "}
            <span className="font-semibold text-ink">{active === "from" ? "From" : "To"}</span>
          </p>
          <div className="flex flex-wrap gap-5" aria-hidden="true">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-ink ring-2" style={{ ["--tw-ring-color" as string]: summary.lineColour }} />
              Served
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full border-[1.5px] border-faint" />
              Passed without stopping
            </span>
          </div>
        </div>
        <RouteMap summary={summary} from={from} to={to} onSelect={pick} className="absolute inset-x-2 bottom-10 top-14 h-[calc(100%-6rem)] w-[calc(100%-1rem)]" />
        <p className="absolute bottom-5 left-6 right-6 text-[12px] text-faint">
          Drawn from station positions (OpenStreetMap). North–south is stretched so names fit.
        </p>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="tabular text-[28px] font-semibold leading-none tracking-[-0.02em]">
        {value}
        {unit && <span className="text-[14px] font-medium tracking-normal text-muted"> {unit}</span>}
      </dd>
    </div>
  );
}
