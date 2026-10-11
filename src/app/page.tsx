import Link from "next/link";
import { Hero } from "../components/landing/Hero";
import { SiteFooter } from "../components/navigation/SiteFooter";
import { NetworkMap } from "../components/route/NetworkMap";
import { ArrowRight } from "../components/ui/Icons";
import { LineRoundel } from "../components/ui/LineRoundel";
import { getAllRouteSummaries, getNetworkSummary } from "../lib/getRouteSummary";
import { simulatorHref } from "../lib/routeSummary";
import { statusChip } from "../lib/lines";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const WORDS: Record<number, string> = { 4: "Four", 5: "Five", 6: "Six" };
const lineNumber = (name: string) => Number(name.replace(/\D/g, "")) || 0;

/** Real views from the simulator (public/landing, captured from the running app). */
const VIEWS = [
  { src: "cab", title: "From the cab", body: "The driver's view down the real track, braking for every platform." },
  { src: "passenger", title: "From a seat", body: "Ride among other passengers, with each station announced in English and Tamil." },
  { src: "on-foot", title: "On foot", body: "Buy a ticket at the counter, scan in at the gates and take the escalator up to your train." },
  { src: "aerial", title: "From above", body: "Follow the train over the city, with the traffic and flyovers below." },
];

export default function HomePage() {
  const routes = getAllRouteSummaries();
  const network = getNetworkSummary();
  const lengthKm = Math.round(network.lines.reduce((a, l) => a + l.lengthKm, 0));
  const first = routes[0];

  return (
    <>
      <Hero
        stations={network.stations.length}
        ride={{ href: simulatorHref(first.id), label: `Ride ${first.lineName}` }}
        lineColours={[...network.lines].sort((a, b) => lineNumber(a.name) - lineNumber(b.name)).map((l) => l.colour)}
      />

      <section aria-labelledby="lines-heading" className="px-5 pb-24 pt-24 sm:px-8 lg:px-12 lg:pb-32 lg:pt-32">
        <h2 id="lines-heading" className="max-w-[52rem] text-[clamp(2rem,4.2vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.03em]">
          {WORDS[network.lines.length] ?? network.lines.length} lines.{" "}
          <span className="text-muted">
            {lengthKm} kilometres of real track and {network.stations.length} stations, mapped from OpenStreetMap.
          </span>
        </h2>

        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <div className="flex flex-col">
            <ul>
              {routes.map((r) => {
                return (
                  <li key={r.id} className="border-t border-line last:border-b">
                    <Link
                      href={simulatorHref(r.id)}
                      className="group -mx-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 rounded-xl px-3 py-5 transition-[background-color,transform] duration-100 ease-out hover:bg-white/[0.03] active:scale-[0.99] sm:gap-x-5"
                    >
                      <LineRoundel colour={r.lineColour} name={r.lineName} size="lg" />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">{r.title}</span>
                        <span className="text-[14px] text-muted">
                          {r.lineColourName} · {r.lengthKm.toFixed(1)} km · {r.stopIds.length} stations ·{" "}
                          <span className={r.preview ? "text-[#f0a46c]" : "text-subtle"}>{r.preview ? "Preview, under construction" : statusChip(r.status)}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[15px] font-medium text-subtle transition-colors group-hover:text-ink">
                        <span className="sr-only">{r.lineName}, </span>Ride
                        <ArrowRight size={15} className="transition-transform duration-150 group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-8 max-w-[34rem] text-[15px] leading-relaxed text-muted">
              Lines still under construction ride as previews: every station is a stop and timings are illustrative.{" "}
              <Link href="/routes" className="text-ink underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-white/70">
                Plan a journey between any two stations
              </Link>
              .
            </p>
          </div>

          <figure className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
            <NetworkMap network={network} linkStations ground="#070b12" className="h-auto max-h-[78vh] w-full" />
            <figcaption className="text-[13px] leading-relaxed text-faint">
              The real track, north up. Dashed lines are under construction, white rings are interchanges. Select a station to open it.
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="views-heading" className="border-t border-line px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <h2 id="views-heading" className="max-w-[46rem] text-[clamp(2rem,4.2vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.03em]">
          Ride in the cab, in a seat, <span className="text-muted">or walk it from the street.</span>
        </h2>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-20">
          {VIEWS.map((v) => (
            <figure key={v.src} className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP */}
                <img
                  src={`${BASE}/landing/${v.src}.webp`}
                  alt=""
                  width={1200}
                  height={750}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/10] h-auto w-full"
                />
              </div>
              <figcaption className="flex flex-col gap-1">
                <span className="text-[17px] font-semibold tracking-[-0.01em]">{v.title}</span>
                <span className="max-w-[30rem] text-[15px] leading-relaxed text-muted">{v.body}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="data-heading" className="border-t border-line px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <h2 id="data-heading" className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            Built on open data.
          </h2>
          <div className="flex flex-col gap-6">
            <p className="max-w-[36rem] text-[16px] leading-relaxed text-muted">
              Track, streets and buildings come from OpenStreetMap; fares, timings and opening dates from CMRL and published reports. No
              paid services, no tracking. Where something is estimated, the sources page says so.
            </p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[15px] font-medium">
              <Link href="/about" className="group inline-flex items-center gap-1.5 text-ink/85 transition-colors hover:text-ink">
                Data and sources <ArrowRight size={15} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/stations" className="group inline-flex items-center gap-1.5 text-ink/85 transition-colors hover:text-ink">
                All {network.stations.length} stations <ArrowRight size={15} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter lastVerified={first.lastVerified} />
    </>
  );
}
