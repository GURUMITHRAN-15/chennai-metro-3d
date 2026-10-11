import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/navigation/SiteHeader";
import { SiteFooter } from "../../components/navigation/SiteFooter";
import { NetworkMap } from "../../components/route/NetworkMap";
import { buttonClass } from "../../components/ui/Button";
import { ArrowRight } from "../../components/ui/Icons";
import { LineRoundel } from "../../components/ui/LineRoundel";
import { PageIntro, SectionTitle } from "../../components/ui/PageIntro";
import { getAllRouteSummaries, getNetworkSummary } from "../../lib/getRouteSummary";
import { simulatorHref, type RouteSummary } from "../../lib/routeSummary";
import { lineInfo, statusChip } from "../../lib/lines";

export const metadata: Metadata = {
  title: "Explore the network",
  description: "Chennai Metro's Blue, Green, Purple, Yellow and Red lines on one map: routes, status, speed limits, the Arcot Road double-decker and the trains.",
};

const GROUND = "#070b12";
const WORDS: Record<number, string> = { 5: "Five", 6: "Six", 7: "Seven", 8: "Eight" };

export default function ExplorePage() {
  const routes = getAllRouteSummaries();
  const network = getNetworkSummary();
  const s = routes[0];
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="px-5 pb-10 pt-14 sm:px-8 lg:px-12 lg:pt-20">
          <PageIntro title="The network">
            <p>
              The Blue and Green lines are open. Line 4&apos;s first stretch, Poonamallee Bypass to Vadapalani, opens next; the rest of Line 4
              and the Purple and Red lines are being built. Every line is drawn on its real track.
            </p>
          </PageIntro>
        </section>

        <figure className="flex flex-col gap-4 px-5 sm:px-8 lg:px-12" aria-label="Network map">
          <NetworkMap network={network} linkStations ground={GROUND} className="mx-auto h-auto max-h-[82vh] w-full max-w-[1100px]" />
          <figcaption className="text-center text-[13px] leading-relaxed text-faint">
            North up, true scale. Dashed lines are under construction, white rings are interchanges. Select a station to open it.
          </figcaption>
        </figure>

        <section aria-labelledby="routes-h" className="px-5 pt-24 sm:px-8 lg:px-12 lg:pt-32">
          <SectionTitle id="routes-h">{WORDS[routes.length] ?? routes.length} routes you can ride</SectionTitle>
          <div className="mt-10">
            {routes.map((r) => (
              <RouteRow key={r.id} r={r} />
            ))}
          </div>
        </section>

        <section aria-labelledby="trains-h" className="grid grid-cols-[minmax(0,1fr)] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20 lg:px-12 lg:py-32">
          <div className="flex flex-col gap-4">
            <SectionTitle id="trains-h">The trains</SectionTitle>
            <p className="text-[15px] leading-relaxed text-muted">
              Every line here runs the three-car Phase II {s.rollingStock.manufacturer} {s.rollingStock.family}. The Blue and Green lines
              really run four-car Phase I trains; their formation is simplified.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
            <Fact k="Formation" v={`${s.rollingStock.cars} cars`} />
            <Fact k="Length" v={`${s.rollingStock.lengthM} m`} />
            <Fact k="Capacity" v={`~${s.rollingStock.capacity}`} note="at crush load" />
            <Fact k="Operating speed" v={`${s.rollingStock.operatingSpeedKmh} km/h`} />
            <Fact k="Design speed" v={`${s.rollingStock.designSpeedKmh} km/h`} />
            <Fact k="Automation" v={s.rollingStock.automation.split(" ")[0]} note={s.rollingStock.automation.split(" ").slice(1).join(" ").replace(/[()]/g, "")} />
          </dl>
        </section>
      </main>
      <SiteFooter lastVerified={s.lastVerified} />
    </div>
  );
}

function RouteRow({ r }: { r: RouteSummary }) {
  const name = (id: string) => r.stations.find((x) => x.id === id)?.name ?? id;
  const served = r.stations.filter((x) => x.service === "stop").length;
  const inter = r.stations.filter((x) => x.interchange.length > 0);
  const facts: [string, string][] = [
    ["Length", `${r.lengthKm.toFixed(1)} km`],
    ["Stations", r.preview || served === r.stations.length ? `${r.stations.length}` : `${served} of ${r.stations.length}`],
    ["Fares", `₹${r.fareMin}–${r.fareMax}`],
  ];
  if (!r.preview) facts.push(["Every", `${r.headwayMinutes} min`]);
  if (r.reportedJourneyMinutes) facts.push(["End to end", `~${r.reportedJourneyMinutes} min`]);
  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-6 border-t border-line py-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <LineRoundel colour={r.lineColour} name={r.lineName} size="lg" />
          <span className="flex flex-col">
            <span className="text-[14px] text-muted">{r.lineColourName}</span>
            <span className={`text-[14px] ${r.preview ? "text-[#f0a46c]" : "text-subtle"}`}>{r.preview ? "Preview, under construction" : statusChip(r.status)}</span>
          </span>
        </div>
        <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">{r.title}</h3>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={simulatorHref(r.id)} className={buttonClass("primary", "md")}>
            Ride <ArrowRight size={16} />
          </Link>
          <Link href={`/routes?route=${r.id}`} className="text-[15px] font-medium text-ink/85 transition-colors hover:text-ink">
            Plan a journey
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <dl className="flex flex-wrap gap-x-10 gap-y-5">
          {facts.map(([k, v]) => (
            <Fact key={k} k={k} v={v} />
          ))}
        </dl>
        <div className="flex max-w-[44rem] flex-col gap-2.5 text-[15px] leading-relaxed text-muted">
          {r.preview && <p>Under construction. Ridden as a preview on the real track: every station is a stop, timings are illustrative.</p>}
          {!r.preview && r.stations.length > served && (
            <p>
              {r.stations.length - served} stations are built but passed without stopping until they open.
            </p>
          )}
          {inter.length > 0 && (
            <p>
              <span className="text-subtle">Change at </span>
              {inter.map((x, i) => (
                <span key={x.id}>
                  {i > 0 && ", "}
                  <Link href={`/stations/${x.id}`} className="text-ink/90 underline decoration-white/20 underline-offset-4 hover:decoration-white/60">
                    {x.name}
                  </Link>{" "}
                  ({x.interchange.map((l) => lineInfo(l).colourName.replace(" Line", "")).join(", ")})
                </span>
              ))}
              .
            </p>
          )}
          {r.speedSections.map((sec, i) => (
            <p key={i}>
              {name(sec.from)} to {name(sec.to)}: up to <span className="text-ink">{sec.maxSpeedKmh} km/h</span>
              {sec.status === "reported" ? ", the limit reported in May 2026." : ", the trains' operating speed."}
            </p>
          ))}
          {r.doubleDecker && (
            <p>
              {r.doubleDecker.lengthKm} km of Arcot Road double-decker between {name(r.doubleDecker.from)} and {name(r.doubleDecker.to)}: Line 4 on the
              lower deck, the Red Line above.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function Fact({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-muted">{k}</dt>
      <dd className="tabular text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink">{v}</dd>
      {note && <dd className="text-[13px] text-faint">{note}</dd>}
    </div>
  );
}
