"use client";

import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Search } from "../ui/Icons";
import { LineRoundel } from "../ui/LineRoundel";
import { lineInfo, statusChip } from "../../lib/lines";
import { filterInOrder, normaliseForSearch, type Searchable } from "../../lib/stationSearch";

/** The few fields the list needs. The page sends these, not whole route summaries. */
export interface DirectoryStation extends Searchable {
  id: string;
  service: "stop" | "pass";
  /** Other lines (ids) at this station. */
  interchange: string[];
  doubleDecker: boolean;
  km: number;
}

export interface DirectoryRoute {
  id: string;
  title: string;
  status: string;
  preview: boolean;
  lineColour: string;
  lineName: string;
  lineColourName: string;
  lengthKm: number;
  stations: DirectoryStation[];
}

/**
 * The stations page: a search box, a jump list and every route as a strip map.
 * Typing narrows every route to the stations that match (English, Tamil or
 * alternative names), in line order. The title and the network map arrive as
 * slots so the server page keeps rendering them.
 */
export function StationDirectory({ routes, intro, map }: { routes: DirectoryRoute[]; intro: ReactNode; map: ReactNode }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const searching = normaliseForSearch(query) !== "";

  const { shown, found } = useMemo(() => {
    const all = routes.map((route) => ({ route, stations: filterInOrder(route.stations, query) }));
    const shown = searching ? all.filter((f) => f.stations.length > 0) : all;
    // A station on two lines is listed under both, but counted once.
    const ids = new Set(shown.flatMap((f) => f.stations.map((s) => s.id)));
    return { shown, found: ids.size };
  }, [routes, query, searching]);

  const status = !searching
    ? ""
    : found === 0
      ? `No stations match “${query.trim()}”. Try part of the name, or the Tamil spelling.`
      : `${found} ${found === 1 ? "station" : "stations"} found`;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-10">
          {intro}
          <div role="search" className="flex flex-col gap-2">
            <label htmlFor={inputId} className="sr-only">
              Search stations
            </label>
            <div className="relative flex h-[54px] items-center rounded-2xl bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-shadow duration-150 focus-within:shadow-[inset_0_0_0_1.5px_rgba(245,247,250,0.6)]">
              <Search size={18} className="pointer-events-none absolute left-4 text-muted" />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && query !== "") {
                    e.preventDefault();
                    setQuery("");
                  }
                }}
                placeholder="Search by name, in English or Tamil"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                className="h-full w-full rounded-2xl bg-transparent pl-11 pr-4 text-[17px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-faint"
              />
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-[13px] leading-snug text-muted">
              {status}
            </p>
          </div>
          <nav aria-label="Jump to a route" className="flex flex-col">
            {shown.map(({ route, stations }) => (
              <a
                key={route.id}
                href={`#${route.id}`}
                className="group -mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-[background-color,transform] duration-100 ease-out hover:bg-white/[0.03] active:scale-[0.99]"
              >
                <LineRoundel colour={route.lineColour} name={route.lineName} />
                <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{route.title}</span>
                <span className="tabular shrink-0 text-[14px] text-muted">{stations.length}</span>
              </a>
            ))}
          </nav>
        </div>
        <figure className="lg:sticky lg:top-8 lg:self-start">{map}</figure>
      </div>
      {shown.map(({ route, stations }) => (
        <RouteStations key={route.id} route={route} stations={stations} searching={searching} />
      ))}
    </>
  );
}

/** One route as a strip map: the line runs down the left, a stop for every station shown. */
function RouteStations({ route: r, stations, searching }: { route: DirectoryRoute; stations: DirectoryStation[]; searching: boolean }) {
  const last = stations.length - 1;
  return (
    <section id={r.id} className="mt-24 scroll-mt-8" aria-labelledby={`${r.id}-h`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-6">
        <LineRoundel colour={r.lineColour} name={r.lineName} size="lg" />
        <div className="flex min-w-0 flex-col">
          <h2 id={`${r.id}-h`} className="text-[clamp(1.4rem,2.4vw,1.75rem)] font-semibold leading-tight tracking-[-0.025em]">
            {r.title}
          </h2>
          <p className="text-[14px] text-muted">
            {r.lineColourName} · {r.preview ? "Preview, under construction" : statusChip(r.status)} · {r.lengthKm.toFixed(1)} km ·{" "}
            {searching ? `${stations.length} of ${r.stations.length}` : r.stations.length} stations
          </p>
        </div>
      </div>
      <ol>
        {stations.map((st, i) => {
          const pass = st.service === "pass";
          const inter = st.interchange.length > 0;
          return (
            <li key={st.id}>
              <Link
                href={`/stations/${st.id}`}
                className="group -mx-3 grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-stretch rounded-xl px-3 transition-[background-color] duration-100 hover:bg-white/[0.03] active:bg-white/[0.05]"
              >
                {/* The line, and this station's stop on it. */}
                <span className="relative flex items-center justify-center" aria-hidden="true">
                  <span
                    className="absolute left-1/2 w-[5px] -translate-x-1/2"
                    style={{ background: r.lineColour, top: i === 0 ? "50%" : 0, bottom: i === last ? "50%" : 0, opacity: r.preview ? 0.55 : 1 }}
                  />
                  <span
                    className={`relative rounded-full ${inter ? "h-[18px] w-[18px] border-[3px] border-bg bg-ink" : pass ? "h-3 w-3 border-2 bg-bg" : "h-3 w-3 border-[3px] bg-ink"}`}
                    style={inter ? { boxShadow: `0 0 0 2px ${r.lineColour}` } : { borderColor: r.lineColour }}
                  />
                </span>
                <span className="flex min-w-0 flex-col justify-center py-3.5 pl-3">
                  <span className={`text-[16px] font-medium leading-snug ${pass ? "text-subtle" : "text-ink"}`}>{st.name}</span>
                  {st.nameTa && (
                    <span lang="ta" className="font-tamil text-[14px] leading-snug text-muted">
                      {st.nameTa}
                    </span>
                  )}
                  {(pass || st.doubleDecker) && (
                    <span className="mt-0.5 text-[13px] text-faint">
                      {[pass && "Not open yet, trains pass through", st.doubleDecker && "Double-decker"].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3 pl-3">
                  {st.interchange.map((id) => {
                    const l = lineInfo(id);
                    return (
                      <span key={id} className="flex items-center" title={`Change for ${l.name} (${l.colourName})`}>
                        <LineRoundel colour={l.colour} name={l.name} size="sm" />
                        <span className="sr-only">Change for {l.name}</span>
                      </span>
                    );
                  })}
                  <span className="tabular hidden w-16 text-right text-[13px] text-faint sm:inline">{st.km.toFixed(1)} km</span>
                  <ChevronRight size={16} className="text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
