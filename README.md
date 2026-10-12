# Chennai Metro 3D

**Explore the journey.** An interactive, real-time 3D ride on all five of Chennai Metro's lines (Blue, Green, Purple, Yellow and Red), on the real track and through the real city.

[![Chennai Metro 3D: riding Line 4 past the Poonamallee Bypass cloverleaf, the driver and passenger views, night, and Line 2's underground stations](docs/media/showcase.gif)](docs/media/showcase.mp4)

▶ [Full screen recording (1 min, MP4)](docs/media/showcase.mp4) · **Live:** https://madesh-ops.github.io/chennai-metro-3d/

Pick a line and any two stations, then watch a three-car train depart, accelerate, cruise, brake into each platform, open its doors and carry on. Watch from five cameras, by day or night, in sun or rain. Or make the journey yourself, on foot: buy a ticket, go through the gates, ride the escalator up and step aboard ([Walk mode](#walk-mode)).

[![Walk mode: from the street to the ticket counter, through the gate, up the escalator, onto the train, and out again at the other end](docs/media/walk-mode.gif)](docs/media/walk-mode.mp4)

- **Real track, real city.** Every line runs on its real path from OpenStreetMap: up on viaducts, down ramps into tunnels and underground stations, past the real streets, buildings, flyovers, lakes and parks around it.
- **Six routes on five lines:**
  - Open: Wimco Nagar Depot → Airport (Blue); Central → St. Thomas Mount (Green).
  - Opening: Poonamallee Bypass → Vadapalani (Yellow).
  - Under-construction previews: Madhavaram → SIPCOT (Purple); Vadapalani → Lighthouse (Yellow); Madhavaram → Sholinganallur (Red).
- **₹0 to run.** No API keys and no paid services. Everything runs client-side from local data, with procedural textures and the browser's own speech synthesis.
- **Data first.** Every real-world fact is sourced in `src/data/*.json`, and every approximation is labelled as one (see [Data](#data)).

## Run it

```bash
cd chennai-metro-3d
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build && npm start` | Production build and server |
| `npm run build:pages` / `npm run preview:pages` | Static export for GitHub Pages (served under `/chennai-metro-3d/`) and a local preview of it. Pushing to `main` deploys automatically via `.github/workflows/pages.yml` |
| `npm test` | Tests: route model and stop accuracy, the OSM network and world tiles, flyovers, station halls, landmarks, route summaries, walking (collision, the trip, the station floor plan) (Node test runner) |
| `npm run lint` / `npm run typecheck` | ESLint (Next.js core-web-vitals + TypeScript) / `tsc --noEmit` |
| `npm run osm:fetch`, `npm run osm:bake`, `npm run osm:tiles` | Rebuild the map data from OpenStreetMap (see [Licences](#licences)) |

Requires Node 20.9+. No environment variables are needed. `npm run dev` and the builds first bundle the world-tile worker (`scripts/build-worker.mjs`).

### Troubleshooting

**Stuck on "Preparing your journey…" when opening the dev server from another device or address.**
In development, Next.js 16 only serves its internal files (`/_next/*` and the live-reload socket) to localhost and to hosts listed in `allowedDevOrigins`. From anywhere else, the simulator's code never arrives.

- **Private network addresses are already allowed.** That covers your phone on the same Wi-Fi (`192.168.*.*`, `10.*.*.*`, `172.16–31.*.*`, `*.local`).
- **Other hosts (tunnels, custom domains) need opting in.** Restart with them listed:

  ```bash
  ALLOWED_DEV_ORIGINS=my-tunnel.example.com,*.trycloudflare.com npm run dev
  ```

- **Production has no such restriction.** `npm run build && npm start` works from any address.

If loading takes longer than 12 seconds, the page says so, explains the likely cause (including this one) and offers a Retry. If the 3D scene itself stalls, you can continue on the 2D route map.

## What's in it

| Route | Purpose |
| --- | --- |
| `/` | Landing page with a live 3D dusk scene, every route, and a map of the whole network |
| `/routes?route=…` | Journey planner: line picker, From/To selects, a clickable route map, distance and simulated journey time |
| `/simulator?route=…&from=…&to=…` | The 3D simulator (no `route`: Poonamallee Bypass → Vadapalani). Add `&walk=1` to open it on foot, in Walk mode |
| `/explore` | Network map and every route: status, fares, interchanges, speed limits, the Arcot Road double-decker, trains |
| `/stations`, `/stations/[id]` | Every station on every line in English and Tamil, with interchanges, ride links, position, sources and context |
| `/about` | What is verified, reported, assumed or approximated, plus sources and licences |

### Simulator

- **Cameras:**
  - **Cinematic:** an automatic shot director with chase, front-quarter, street-level fly-by, side, aerial and arrival platform shots. It follows the train through tunnels and lifts over buildings.
  - **Driver** and **Passenger** (inside the car, with seats, poles and windows).
  - **Map:** every line from above.
  - **Free:** drag to rotate, right-drag or Shift-drag to pan, scroll or pinch to zoom, or use the on-screen pad (pan, zoom, rotate, tilt, recentre, follow train).
  - **Walk:** first person, on foot (see [Walk mode](#walk-mode)).
  - Switching between cameras glides rather than snaps.
- **Above and below ground:**
  - **Underground:** cut-and-cover tunnels and underground stations with platform screen doors. Station halls follow the real, sometimes curved, track.
  - **Elevated:** viaducts and elevated stations, with ramps between levels.
  - **Bridges:** the Poonamallee Bypass footbridge, and steel and concrete portals where the metro crosses a flyover.
- **The city:**
  - **Buildings:** real building footprints with lit windows at night, shops with invented Chennai-style names, and rooftop water tanks.
  - **Roads:** real streets and flyovers with Chennai's black-and-white chevron crash barriers.
  - **Nature and traffic:** lakes, parks, trees, and traffic on the road under the viaduct.
- **Landmarks:** temples with gopurams, malls, a cinema, the government hospital and bus stands, as stylised models with English and Tamil name boards.
- **Sounds:**
  - **Street (Cinematic and Free cameras):** a synthesised road hum, Doppler pass-bys and horns.
  - **Train (Driver and Passenger cameras):** recorded departure, running and braking sounds, in sync at every playback speed.
  - **Announcements:** spoken in English then Tamil, when the browser has a Tamil voice.
- **Passenger experience:**
  - Look around; switch between a window seat, the doors and the car end.
  - LED next-station displays and a lit route map.
  - Crowds that follow peak hours, the women's coach, swinging grab straps.
- **Ticket and fare:** a mobile QR ticket card at the start (CMRL distance-band fare with the 20% digital discount) and a journey summary at the end.
- **Controls:**
  - Play/pause, 0.5×/1×/2×/4× and a scrubbable timeline.
  - Day/night, and clear, cloudy or rain.
  - Settings: graphics quality, reduced motion, audio, shadows, traffic and camera shake.
  - **Keyboard:** Space (play/pause), 1–6 (cameras), `[` `]` (speed), ← → (skip 10 s), N (night), W (weather), S (route panel), F (fullscreen), `,` (settings), `?` (all shortcuts).
- **Resilience:** without WebGL, or if the scene crashes, the same journey continues on a live 2D route map. Force this with `?webgl=0`.

### Walk mode

Press **6** in the simulator (or open a journey with `&walk=1`, or choose "Walk it as a passenger" in the planner) to travel as a passenger, in first person:

1. Start on the footpath outside the origin station and climb the stairs to the concourse.
2. Buy a single-journey ticket at the counter (the fare is the CMRL distance-band fare for your journey).
3. Scan it at an entry gate; the flaps open for you.
4. Ride the escalator up to your platform.
5. Step aboard through an open door. The train waits for you, then closes its doors and leaves.
6. Ride. Walk up and down the car, look out of the windows, speed time up with `]`.
7. Get off at your destination, take the escalator down and scan out at an exit gate.
8. Drop the used ticket in the box, and take the stairs down to the street.

- **Controls:** W A S D or the arrow keys to walk, Shift to run, the mouse to look (click the view to capture it, Esc to free it), E to use what is in front of you. On a touch screen: a thumb stick, drag to look, and a button for each action.
- **Finding your way:** a line at the top says what to do next and how far it is, and a yellow marker stands at the spot. Signs are in English and Tamil.
- **Solid world:** walls, railings, gate cabinets, the ticket office and the people on the platform all stand in your way; a gate stays shut without a ticket.
- **Joining late:** switch to Walk mode after the train has left and you are on board, ticket in hand. The W, S and arrow-key shortcuts stand down while you walk.
- **Where it works:** every elevated station (including the double-decker ones) can be walked through. Underground stations do not have a modelled concourse yet: a trip that starts at one begins on board, and a trip that ends at one ends on board.

## Architecture

```
src/
  app/           Next.js App Router pages
  components/    DOM UI: navigation, line picker, route + network maps, simulator HUD, station pages
  three/         React Three Fiber scene: Train, Track (viaducts, tunnels, portals), Stations (elevated
                 and underground), Footbridges, Landmarks, Traffic, Lighting, Weather, Cameras, MapOverlay,
                 WalkMode (the passenger on foot; walkPlan is the station floor plan it shares with the models)
    world/       Streamed OpenStreetMap city: tile format, keep-out zones, tile worker, geometry
                 (buildings, roads, flyovers, water, parks, trees)
  simulation/    Framework-agnostic engine (no React):
                   RouteController  JSON + OSM network → validated route model on the real track
                   VerticalProfile  rail height along the route (elevated / ramps / underground)
                   Journey          any two stations, either direction
                   TrainController  jerk-limited motion profile, precomputed trajectory
                   SimulationEngine owns clock + trajectory; single source of truth
                   walkSpace        floors, ramps, furniture and gates the passenger on foot moves through
                   PassengerTrip    the passenger's own journey: ticket → gate → train → gate → street
  data/          network.json (OSM track and stations), stations, routes, tracks, landmarks
  lib/           Serializable route and network summaries for pages that don't need three.js
scripts/osm/     Fetch and bake OpenStreetMap: network (bake-network), city tiles (bake-tiles)
public/world/    1 km city tiles (gzip binary, ~8 MB in total) and the bundled tile worker
```

Key decisions:

- **The trajectory is computed once, then played back.**
  - The whole journey is integrated up front at 50 Hz, with braking curves for each stop and speed restriction.
  - Playback is then a lookup, so pause, 4× and scrubbing are exact.
  - The tests check that the train stops within 1 mm of each mark, never exceeds a limit, and never jerks.
- **One shared projection for the whole city** (origin at Chennai Central). Every line, station, building and road lives in the same coordinates, so lines meet correctly at interchanges.
- **The city streams, off the main thread.**
  - The city is split into 1 km tiles of OpenStreetMap footprints, roads, water and trees, which load around the camera and the train.
  - A Web Worker fetches, decompresses and builds each tile; the main thread only wraps the arrays in meshes.
  - Only buildings near the train draw into the shadow map, and the scene renders nothing until its shaders are compiled.
- **Flyovers are worked out from the map.** A bridge that crosses a road gets a deck at 7.5 m. Its approach ramps follow the road that carries straight on (slip roads stay slip roads), and interchange loops descend along their own length. Barriers are left out wherever two decks merge.
- **One source of truth, no per-frame React renders.** The 3D scene reads `engine.sample` inside `useFrame`, and the DOM HUD subscribes to snapshots throttled to 10 Hz.
- **Walking needs no physics engine.**
  - A station's inside is one floor plan (`three/walkPlan.ts`): the same numbers build the model and the walkable pads, so what you see is what you can stand on.
  - The passenger is a point with a radius that slides along walls; stairs and escalators are ramps, gates are barriers that open. The tests flood-fill the plan to prove the platform can be reached only through an entry gate, and the street only through an exit gate.
  - The passenger is always in one frame: a station, or a train car. Stepping through an open door hands them from one to the other, which is why they ride along with the train without any extra work.
- **Light pages stay light.** `/routes`, `/stations` and `/explore` get JSON summaries from the server and never download three.js.

### Performance

Production build, measured locally:
- **Landing scene:** about 1.5 s.
- **Simulator:** loads in about 2–2.5 s.
- **Riding:** steady 60 fps (95th-percentile frame 16.8 ms).

## Data

Track and stations from OpenStreetMap (snapshot 5 Oct 2026). Line 4 facts verified on 3 Oct 2026. Full provenance is on `/about`.

| Item | Status |
| --- | --- |
| Track path, station positions, elevated and underground stretches (all lines) | From OpenStreetMap (`src/data/network.json`), accurate to a few metres. Poonamallee Bypass → Vadapalani measures **14.73 km** against the official **14.64 km** (0.6 %) |
| Line 3 stations OpenStreetMap does not map yet (43 of 48) | Names and order from Wikipedia (Purple Line station list). Placed at the same-name bus stop or locality on the real track, or spaced evenly between neighbours. The mapped track ends short of SIPCOT 2 (44.4 of 45.8 km), so SIPCOT 2 is placed at its end |
| Line 5 stations OpenStreetMap does not map yet (18 of 45) | As for Line 3 (Wikipedia Red Line station list). Each station says how it was placed |
| Line 4: which 11 stations are served and which 6 are passed at opening | Verified (CMRS approval, fare and opening coverage) |
| Route lengths, openings, headways, fares (₹10–50 distance bands, 20% QR / NCMC discount) | Reported / approximate; fare bands from passenger guides (CMRL's fare page was unavailable) |
| Previews of Lines 3, 5 and Line 4 east | Under construction: every station is a stop; timings illustrative |
| Train: Alstom Metropolis, 3 cars, 67.8 m, 80 km/h operating | Verified. The same three-car train is used on every line (Lines 1 and 2 really run four-car trains) |
| Porur–Vadapalani limit 40 km/h | Reported (May 2026) |
| Acceleration, braking, dwell | Assumed (typical metro values) |
| City: buildings, streets, water, parks along every line | From OpenStreetMap (`public/world/`, 1 km tiles within 700 m of each line). Heights are estimated from building type, footprint and main-road frontage (OSM has almost none here). Streets with no buildings mapped get plausible plots, flagged procedural in the data |
| Flyovers and interchanges (e.g. the ORR cloverleaf at Poonamallee Bypass) | Paths, lanes and which roads are bridges from OpenStreetMap. Deck height (7.5 m per layer), 4% ramps, barriers and piers are standard values |
| MGR Flyover at Porur Junction (505 m, 4 lanes, opened 2017) | Length, lanes and opening verified; path along Mount–Poonamallee Road; width and height assumed |
| Line 5 leaving the Arcot Road double-decker (towards Mugalivakkam, and towards Virugambakkam) | From the OpenStreetMap Line 5 track; descent to rail level assumed. Drawn without trains |
| Poonamallee Bypass footbridge over NH48 | Position, span and support traced from satellite and street photos supplied by the project owner; dimensions estimated |
| Landmarks: Vadapalani Murugan and Sri Varadaraja Perumal temples, Porur Lake | Verified coordinates (Wikipedia); models stylised (the lake's real outline is from OSM) |
| Nexus Vijaya Mall, Kamala Cinemas, Chandra Metro Mall, bus stands, Government Hospital Poonamallee | Approximate: traced from satellite views and photos supplied by the project owner, or from a street address. Each stands at one fixed spot, the same on every line |
| Crowds, in-car displays, film posters, hoardings, shop names | Illustrative / invented (real chains and brands excluded) |
| Station interiors in Walk mode: concourse, ticket office, fare gates, escalators, street stairs, wayfinding signs | Generic: one floor plan for every elevated station, not a survey of any real one. Sign wording is ordinary English and Tamil, not CMRL's own |
| Ticket in Walk mode: a single-journey paper QR ticket bought at the counter at the full fare | Reported: CMRL sells single-journey paper QR tickets at counters, and the 20% discount does not apply to them (DT Next, 1 Sep 2026). Scanning at the gates is modelled simply (press E) |
| Used-ticket box past the exit gates | Illustrative (not a documented CMRL fitting) |
| Train look, interior, facades, traffic | Stylised after photos of CMRL trains / procedural (traffic runs on the road under the viaduct) |

To correct anything, edit the JSON. Components read the route model, never hard-coded values, and `validateBundle()` reports problems in plain language.

## Contributing

Corrections and code are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Licences

The code in this repository is under the [MIT License](LICENSE). That covers the code only: the data and recordings below keep their own licences.

- **Code dependencies** are MIT-licensed: Next.js, React, three.js, React Three Fiber, drei, Zustand, Tailwind CSS and esbuild (build only).
- **Fonts:** Geist and Noto Sans Tamil (bundled subset in `src/fonts`) are under the SIL Open Font License 1.1.
- **Train recordings** in `public/audio/` were supplied by the project owner and are not covered by the code licences. Check their source licence before redistributing.

**Map data © OpenStreetMap contributors**, available under the [Open Database Licence (ODbL)](https://www.openstreetmap.org/copyright). This covers:
- the metro network in `src/data/network.json`, baked by `npm run osm:fetch` then `npm run osm:bake`;
- the city tiles in `public/world/`, made by `node scripts/osm/extract.mjs <southern-zone.osm.pbf>` (a Geofabrik extract) then `npm run osm:tiles`.

Raw downloads are cached in `data-cache/` (not committed). Station names and order for Lines 3 and 5, where OSM is incomplete, are from Wikipedia.

**Visits** are counted anonymously with [GoatCounter](https://www.goatcounter.com): no cookies and nothing that identifies a visitor. It is switched on by the site code in `src/lib/site.ts`. The landing page also shows the repository's stars and contributors, from a snapshot taken at build time (`scripts/github-stats.mjs`) refreshed live from the GitHub API.

This is an independent visualisation, not affiliated with or endorsed by Chennai Metro Rail Limited.
