import type { Metadata } from "next";
import { SiteHeader } from "../../components/navigation/SiteHeader";
import { SiteFooter } from "../../components/navigation/SiteFooter";
import { dataBundle } from "../../simulation/data";
import { getRouteSummary } from "../../lib/getRouteSummary";

export const metadata: Metadata = {
  title: "About & data sources",
  description: "How Chennai Metro 3D is built, what is verified, what is approximated, and where every fact comes from.",
};

const ROWS: { what: string; status: "Verified" | "Reported" | "Assumed" | "Approximate" | "Procedural"; detail: string }[] = [
  { what: "Track path, tunnels and viaducts (all five lines)", status: "Verified", detail: "The real track from OpenStreetMap, accurate to a few metres, with its elevated and underground stretches. Poonamallee Bypass–Vadapalani measures 14.73 km against the official 14.64 km." },
  { what: "Station positions and order", status: "Verified", detail: "OpenStreetMap stations on the real track. Lines 3 and 5 are not fully mapped yet: their missing stations (43 of 48, 18 of 45) follow the Wikipedia station lists and sit at the same-name bus stop or locality, or are spaced evenly between neighbours. Each station page says which." },
  { what: "Which Line 4 stations are served at opening", status: "Verified", detail: "11 served between Poonamallee Bypass and Vadapalani; six Arcot Road stations passed without stopping (CMRS approval and opening coverage)." },
  { what: "Route lengths, opening, headway, fares", status: "Reported", detail: "As published (CMRL, news coverage, Wikipedia). Lines 3, 5 and Line 4 east are under construction and ridden as previews: every station is a stop and timings are illustrative." },
  { what: "City: buildings, streets, water, parks", status: "Approximate", detail: "Real OpenStreetMap footprints and street grid within 700 m of every line. Heights are estimated (OSM has almost none here). Streets with no buildings mapped get plausible plots along the real street." },
  { what: "Flyovers and interchanges", status: "Approximate", detail: "Paths, lanes and which roads are bridges from OpenStreetMap; deck height (7.5 m), 4% ramps, barriers and piers are standard values, not survey data." },
  { what: "Landmarks (temples, malls, cinema, hospital, bus stands)", status: "Approximate", detail: "Placed from published coordinates or traced from satellite views and photos; the same spot on every line. Models are stylised; hoardings and film posters are invented." },
  { what: "Train length, cars, speeds", status: "Verified", detail: "Alstom Metropolis: 3 cars, 67.8 m, 80 km/h operating, 90 km/h design. The same three-car train is used on every line (Lines 1 and 2 really run four-car Phase I trains)." },
  { what: "Porur–Vadapalani speed limit", status: "Reported", detail: "Raised from 25 to 40 km/h in May 2026 per news coverage of the CMRS approval." },
  { what: "Acceleration, braking, dwell", status: "Assumed", detail: "Typical metro values (1.0 m/s², 0.85 m/s², 22 s); CMRL has not published them." },
  { what: "Train livery and interior", status: "Approximate", detail: "Stylised after photos of CMRL Alstom Metropolis trainsets." },
  { what: "Station interiors in Walk mode", status: "Procedural", detail: "One generic floor plan for every elevated station (concourse, ticket office, fare gates, escalators, street stairs, signs), not a survey of any real one. The used-ticket box at the exit is illustrative. Underground concourses are not modelled yet." },
  { what: "Ticket bought in Walk mode", status: "Reported", detail: "A single-journey paper QR ticket from the counter at the full distance-band fare: CMRL sells these at counters, and its 20% discount does not apply to them (DT Next, 1 Sep 2026)." },
  { what: "Facades, shop names, traffic, crowds", status: "Procedural", detail: "Window patterns, invented shop names, road traffic and passengers are generated, seeded so they are the same on every visit." },
];

export default function AboutPage() {
  const s = getRouteSummary();
  const sources = [
    ...Object.values(dataBundle.stations.meta.sources),
    ...Object.values(dataBundle.routes.meta.sources),
    ...Object.values(dataBundle.tracks.meta.sources),
  ];
  const unique = Array.from(new Set(sources));
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="flex max-w-3xl flex-col gap-5">
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] sm:text-[40px]">About Chennai Metro 3D</h1>
          <p className="text-[17px] leading-relaxed text-subtle">
            An interactive, real-time 3D ride on Chennai Metro&apos;s Blue, Green, Purple, Yellow and Red lines, on the real track and through the
            real city (from OpenStreetMap). Pick a line and two stations and watch a three-car train accelerate, cruise, brake into each platform, open its doors and carry on — from five camera angles, by
            day or night, in sun or rain.
          </p>
          <p className="text-[15px] leading-relaxed text-muted">
            The track, stations, tunnels and viaducts of every line, and the buildings, streets, flyovers, water and parks around
            them, are baked from OpenStreetMap. The city streams in around the train in one-kilometre tiles built in a background
            thread. Underground, the train runs through tunnels and curved station halls; above ground, along real roads and past
            real landmarks.
          </p>
          <p className="text-[15px] leading-relaxed text-muted">
            It runs entirely in the browser with no paid services and no API keys: open-source libraries (Next.js, React, three.js,
            React Three Fiber), data stored as JSON in the project, textures drawn procedurally at runtime, and announcements spoken
            by your browser&apos;s built-in voice. It is an independent project and is not affiliated with Chennai Metro Rail Limited.
          </p>
        </div>

        <section className="mt-14" aria-labelledby="provenance">
          <h2 id="provenance" className="mb-5 text-[13px] font-semibold tracking-[0.12em] text-muted">
            WHAT IS REAL, WHAT IS APPROXIMATED
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="border-b border-line text-[12px] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Item</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ROWS.map((r) => (
                  <tr key={r.what}>
                    <th scope="row" className="px-5 py-3.5 align-top font-medium text-ink">{r.what}</th>
                    <td className="px-5 py-3.5 align-top">
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11.5px] font-medium ${
                          r.status === "Verified"
                            ? "border-[#3dd68c]/40 text-[#7ee2ae]"
                            : r.status === "Reported"
                              ? "border-accent/50 text-accent-soft"
                              : r.status === "Assumed"
                                ? "border-route/40 text-route"
                                : "border-line-strong text-subtle"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-top leading-relaxed text-muted">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] text-faint">
            All values live in <code className="font-mono text-subtle">src/data/*.json</code> with their sources, so corrections need
            no code changes. Last verified {s.lastVerified}.
          </p>
        </section>

        <section className="mt-14 grid gap-12 lg:grid-cols-2" aria-label="Sources and credits">
          <div className="flex flex-col gap-4">
            <h2 className="text-[13px] font-semibold tracking-[0.12em] text-muted">SOURCES</h2>
            <ul className="flex flex-col gap-2.5 text-[14px] leading-relaxed text-subtle">
              {unique.map((src) => (
                <li key={src} className="border-l-2 border-line pl-3">{src}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-[13px] font-semibold tracking-[0.12em] text-muted">CREDITS &amp; LICENCES</h2>
            <ul className="flex flex-col gap-2.5 text-[14px] leading-relaxed text-subtle">
              <li className="border-l-2 border-line pl-3">three.js, React Three Fiber, drei — MIT licence</li>
              <li className="border-l-2 border-line pl-3">Next.js, React, Tailwind CSS, Zustand — MIT licence</li>
              <li className="border-l-2 border-line pl-3">Geist and Geist Mono by Vercel — SIL Open Font License 1.1</li>
              <li className="border-l-2 border-line pl-3">Noto Sans Tamil by Google — SIL Open Font License 1.1</li>
              <li className="border-l-2 border-line pl-3">
                Station lists for Lines 3 and 5 where OpenStreetMap is incomplete: Wikipedia (Purple Line, Red Line), CC BY-SA 4.0
              </li>
              <li className="border-l-2 border-line pl-3">
                Metro track, station positions, tunnels/viaducts, building footprints, streets, flyovers, water and parks: map data
                © OpenStreetMap contributors, available
                under the Open Database Licence (ODbL) — openstreetmap.org/copyright
              </li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter lastVerified={s.lastVerified} />
    </div>
  );
}
