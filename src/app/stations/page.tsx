import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/navigation/SiteHeader";
import { SiteFooter } from "../../components/navigation/SiteFooter";
import { NetworkMap } from "../../components/route/NetworkMap";
import { ChevronRight } from "../../components/ui/Icons";
import { LineRoundel } from "../../components/ui/LineRoundel";
import { PageIntro } from "../../components/ui/PageIntro";
import { getAllRouteSummaries, getNetworkSummary } from "../../lib/getRouteSummary";
import { lineInfo, statusChip } from "../../lib/lines";
import type { RouteSummary } from "../../lib/routeSummary";

export const metadata: Metadata = {
  title: "Stations",
  description: "Every station on Chennai Metro's Blue, Green, Purple, Yellow and Red lines, in English and Tamil, with interchanges.",
};

export default function StationsPage() {
  const routes = getAllRouteSummaries();
  const network = getNetworkSummary();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 px-5 pb-24 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <div className="flex flex-col gap-10">
            <PageIntro title="Stations">
              <p>
                {network.stations.length} stations on {routes.length} routes, named in English and Tamil. Stations shared by two lines are where you change.
              </p>
            </PageIntro>
            <nav aria-label="Jump to a route" className="flex flex-col">
              {routes.map((r) => (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  className="group -mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-[background-color,transform] duration-100 ease-out hover:bg-white/[0.03] active:scale-[0.99]"
                >
                  <LineRoundel colour={r.lineColour} name={r.lineName} />
                  <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{r.title}</span>
                  <span className="tabular shrink-0 text-[14px] text-muted">{r.stations.length}</span>
                </a>
              ))}
            </nav>
          </div>
          <figure className="lg:sticky lg:top-8 lg:self-start">
            <NetworkMap network={network} linkStations ground="#070b12" className="h-auto max-h-[70vh] w-full" />
          </figure>
        </div>
        {routes.map((r) => (
          <RouteStations key={r.id} r={r} />
        ))}
      </main>
      <SiteFooter lastVerified={routes[0].lastVerified} />
    </div>
  );
}

/** One route as a strip map: the line runs down the left, a stop for every station. */
function RouteStations({ r }: { r: RouteSummary }) {
  const last = r.stations.length - 1;
  return (
    <section id={r.id} className="mt-24 scroll-mt-8" aria-labelledby={`${r.id}-h`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-6">
        <LineRoundel colour={r.lineColour} name={r.lineName} size="lg" />
        <div className="flex min-w-0 flex-col">
          <h2 id={`${r.id}-h`} className="text-[clamp(1.4rem,2.4vw,1.75rem)] font-semibold leading-tight tracking-[-0.025em]">
            {r.title}
          </h2>
          <p className="text-[14px] text-muted">
            {r.lineColourName} · {r.preview ? "Preview, under construction" : statusChip(r.status)} · {r.lengthKm.toFixed(1)} km · {r.stations.length} stations
          </p>
        </div>
      </div>
      <ol>
        {r.stations.map((st, i) => {
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
