import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/navigation/SiteHeader";
import { SiteFooter } from "../../../components/navigation/SiteFooter";
import { QUALITY_LABEL } from "../../../components/station/StationBadges";
import { LineRoundel } from "../../../components/ui/LineRoundel";
import { StationMap } from "../../../components/station/StationMap";
import { buttonClass } from "../../../components/ui/Button";
import { ArrowRight, ChevronLeft } from "../../../components/ui/Icons";
import { getAllRouteSummaries, routeForStation } from "../../../lib/getRouteSummary";
import { simulatorHref } from "../../../lib/routeSummary";
import { lineInfo } from "../../../lib/lines";
import { dataBundle } from "../../../simulation/data";

export function generateStaticParams() {
  const ids = new Set(getAllRouteSummaries().flatMap((r) => r.stations.map((s) => s.id)));
  return [...ids].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = routeForStation(id);
  const st = r?.stations.find((s) => s.id === id);
  if (!r || !st) return { title: "Station not found" };
  const lines = [r.lineId, ...st.interchange].map((l) => `${lineInfo(l).name} (${lineInfo(l).colourName})`).join(" and ");
  return {
    title: `${st.name} station`,
    description: `${st.name}${st.nameTa ? ` (${st.nameTa})` : ""} on Chennai Metro ${lines}, ${st.km.toFixed(2)} km from ${r.stations[0].name}.`,
  };
}

export default async function StationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = routeForStation(id);
  if (!s) notFound();
  const idx = s.stations.findIndex((x) => x.id === id);
  // Every route through this station, for its ride links.
  const through = getAllRouteSummaries().filter((r) => r.stations.some((x) => x.id === id && x.service === "stop"));
  const st = s.stations[idx];
  const prevServed = [...s.stations.slice(0, idx)].reverse().find((x) => x.service === "stop");
  const nextServed = s.stations.slice(idx + 1).find((x) => x.service === "stop");
  const landmarks = dataBundle.landmarks.landmarks.filter((l) => l.nearStation === st.id);
  const sourceName = dataBundle.stations.stations.find((x) => x.id === st.id)?.coordinates?.source;
  const sourceText = sourceName ? dataBundle.stations.meta.sources[sourceName] : null;

  const lines = [s.lineId, ...st.interchange].map((l) => lineInfo(l));
  const quietLink = "text-ink underline decoration-white/25 underline-offset-4 hover:decoration-white/70";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 px-5 pb-24 pt-8 sm:px-8 lg:px-12 lg:pt-10">
        <Link href="/stations" className="-ml-1 inline-flex items-center gap-1 text-[15px] text-muted transition-colors hover:text-ink">
          <ChevronLeft size={16} /> Stations
        </Link>
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="flex flex-col gap-12">
            <header className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                {lines.map((l) => (
                  <LineRoundel key={l.name} colour={l.colour} name={l.name} label />
                ))}
              </div>
              <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-[1] tracking-[-0.035em]">{st.name}</h1>
              {st.nameTa && (
                <p lang="ta" className="font-tamil text-[22px] leading-snug text-subtle sm:text-[26px]">
                  {st.nameTa}
                </p>
              )}
              <p className="text-[16px] text-muted">
                {lines.map((l) => l.colourName).join(" and ")} · {st.km.toFixed(1)} km from {s.stations[0].name}
                {st.terminus ? " · end of the line" : ""}
              </p>
            </header>

            {st.service === "stop" ? (
              <section aria-labelledby="ride-h" className="flex flex-col">
                <h2 id="ride-h" className="sr-only">
                  Ride from here
                </h2>
                {through.map((r) => {
                  const a = r.stopIds[0];
                  const b = r.stopIds[r.stopIds.length - 1];
                  const nm = (x: string) => r.stations.find((y) => y.id === x)?.name;
                  return (
                    <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line py-5 last:border-b">
                      <LineRoundel colour={r.lineColour} name={r.lineName} />
                      <span className="mr-auto flex flex-col">
                        <span className="text-[15px] font-medium">{r.lineColourName}</span>
                        {r.preview && <span className="text-[13px] text-[#f0a46c]">Preview, under construction</span>}
                      </span>
                      <span className="flex flex-wrap gap-2">
                        {st.id !== b && (
                          <Link href={simulatorHref(r.id, st.id, b)} className={buttonClass(r.id === s.id ? "primary" : "secondary", "sm")}>
                            To {nm(b)} <ArrowRight size={14} />
                          </Link>
                        )}
                        {st.id !== a && (
                          <Link href={simulatorHref(r.id, st.id, a)} className={buttonClass("secondary", "sm")}>
                            To {nm(a)} <ArrowRight size={14} />
                          </Link>
                        )}
                      </span>
                    </div>
                  );
                })}
              </section>
            ) : (
              <p className="text-[16px] leading-relaxed text-subtle">
                Built, but not open yet: trains run through without stopping. The nearest open stations are{" "}
                {prevServed && (
                  <Link className={quietLink} href={`/stations/${prevServed.id}`}>
                    {prevServed.name}
                  </Link>
                )}
                {prevServed && nextServed && " and "}
                {nextServed && (
                  <Link className={quietLink} href={`/stations/${nextServed.id}`}>
                    {nextServed.name}
                  </Link>
                )}
                .
              </p>
            )}

            <dl className="flex flex-col">
              <Fact label="Status">{st.service === "pass" ? "Built, not yet open" : s.statusLabel}</Fact>
              {st.altNames.length > 0 && <Fact label="Also known as">{st.altNames.join(", ")}</Fact>}
              <Fact label="Either side">
                {prevServed ? prevServed.name : "End of the line"} · {nextServed ? nextServed.name : "End of the line"}
              </Fact>
              <Fact label="Position">
                {st.coordinateQuality === "interpolated" ? (
                  <span>No published coordinates: placed between its neighbours, for the map only.</span>
                ) : (
                  <span className="tabular">
                    {st.lat.toFixed(5)}° N, {st.lon.toFixed(5)}° E
                  </span>
                )}
                <span className="mt-1 block text-[13px] text-muted">
                  {QUALITY_LABEL[st.coordinateQuality]}
                  {sourceText ? ` · ${sourceText}` : ""}
                </span>
              </Fact>
              {st.notes && <Fact label="Notes">{st.notes}</Fact>}
            </dl>

            {landmarks.length > 0 && (
              <section aria-labelledby="nearby" className="flex flex-col gap-2">
                <h2 id="nearby" className="text-[clamp(1.4rem,2.4vw,1.75rem)] font-semibold tracking-[-0.025em]">
                  Nearby
                </h2>
                {landmarks.map((l) => (
                  <article key={l.id} className="flex flex-col gap-1.5 border-b border-line py-5 last:border-b-0">
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
                      {l.name}
                      {l.nameTa && (
                        <span lang="ta" className="ml-2.5 font-tamil text-[15px] font-normal text-subtle">
                          {l.nameTa}
                        </span>
                      )}
                    </h3>
                    <p className="max-w-[40rem] text-[15px] leading-relaxed text-muted">{l.description}</p>
                    <p className="text-[13px] leading-relaxed text-faint">
                      {l.source}
                      {l.model &&
                        ` · In 3D, ${l.positionQuality === "verified" ? "at its published position" : "at an approximate position"}${
                          l.nameTa && !l.nameTaVerified ? "; Tamil name not yet verified" : ""
                        }`}
                    </p>
                  </article>
                ))}
              </section>
            )}
          </div>
          <figure className="flex flex-col gap-3 lg:sticky lg:top-8 lg:self-start">
            <div className="relative h-[360px] overflow-hidden rounded-3xl bg-[#0b111b] lg:h-[560px]">
              <StationMap summary={s} highlight={st.id} className="absolute inset-0 h-full w-full p-2" />
            </div>
            <figcaption className="text-[13px] text-faint">
              {s.title}, {s.lineColourName}
            </figcaption>
          </figure>
        </div>
      </main>
      <SiteFooter lastVerified={s.lastVerified} />
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-line py-4 last:border-b sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="text-[14px] text-muted">{label}</dt>
      <dd className="text-[15px] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}
