import type { Metadata } from "next";
import { SiteHeader } from "../../components/navigation/SiteHeader";
import { SiteFooter } from "../../components/navigation/SiteFooter";
import { NetworkMap } from "../../components/route/NetworkMap";
import { StationDirectory, type DirectoryRoute } from "../../components/station/StationDirectory";
import { PageIntro } from "../../components/ui/PageIntro";
import { getAllRouteSummaries, getNetworkSummary } from "../../lib/getRouteSummary";
import type { RouteSummary } from "../../lib/routeSummary";

export const metadata: Metadata = {
  title: "Stations",
  description: "Every station on Chennai Metro's Blue, Green, Purple, Yellow and Red lines, in English and Tamil, with interchanges.",
};

/** Only what the searchable list shows, so the page doesn't ship whole route summaries to the browser. */
function toDirectoryRoute(r: RouteSummary): DirectoryRoute {
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    preview: r.preview,
    lineColour: r.lineColour,
    lineName: r.lineName,
    lineColourName: r.lineColourName,
    lengthKm: r.lengthKm,
    stations: r.stations.map((s) => ({
      id: s.id,
      name: s.name,
      nameTa: s.nameTa,
      altNames: s.altNames,
      service: s.service,
      interchange: s.interchange,
      doubleDecker: s.doubleDecker,
      km: s.km,
    })),
  };
}

export default function StationsPage() {
  const routes = getAllRouteSummaries();
  const network = getNetworkSummary();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 px-5 pb-24 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <StationDirectory
          routes={routes.map(toDirectoryRoute)}
          intro={
            <PageIntro title="Stations">
              <p>
                {network.stations.length} stations on {routes.length} routes, named in English and Tamil. Stations shared by two lines are where you change.
              </p>
            </PageIntro>
          }
          map={<NetworkMap network={network} linkStations ground="#070b12" className="h-auto max-h-[70vh] w-full" />}
        />
      </main>
      <SiteFooter lastVerified={routes[0].lastVerified} />
    </div>
  );
}
