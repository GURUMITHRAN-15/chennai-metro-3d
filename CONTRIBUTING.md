# Contributing

Thanks for helping. Corrections to the data are as welcome as code: if you know Chennai and something on the map or in a station name is wrong, that is a contribution.

## Set up

```bash
git clone https://github.com/<you>/chennai-metro-3d
cd chennai-metro-3d
npm ci             # installs exactly what package-lock.json lists
npm run dev        # http://localhost:3000
```

Node 20.9+ is required. No API keys, accounts or environment variables are needed, and none should be added: the project runs for ₹0, client-side, from local JSON.

`package-lock.json` is written by npm 11.6.2 (the version CI uses). If `npm install` with another npm rewrites it, leave that change out of your commit.

## Before you open a pull request

```bash
npm test           # simulation tests (Node test runner)
npm run lint
npm run typecheck
```

All three should pass. For anything visible, also look at it in the browser: at least one route, by day and night, in the Cinematic and Driver cameras, and on a phone-width window if you changed the UI.

## Data

The rule of the project is **data first**: every real-world fact is sourced, and every approximation says it is one.

- **Edit the JSON, not the components.** Stations, routes, tracks and landmarks live in `src/data/*.json`. Components read the route model and never hard-code facts. `validateBundle()` explains bad data in plain language.
- **Say where it came from.** Put the source in the entry's `coordinates.source`, `notes` or the file's `meta`, and give the date you checked it. A satellite view or a photo you took is a fine source; say so.
- **Label approximations.** Use the existing `quality` values (`station`, `bus-stop`, `locality`, `interpolated`) and keep `nameTaVerified: false` until CMRL publishes the official Tamil spelling.
- **`stations.json` and `routes.json` are curated.** `scripts/osm/sync-stations.mjs` only adds missing entries and never changes existing ones, so corrections made there stay.
- **Update the Data table in the README** if you change what is verified, reported or assumed.
- **No real brands.** Shop signboards use invented names; real chains and brands are excluded.

### OpenStreetMap data

Track geometry, station positions and the city tiles come from OpenStreetMap (© OpenStreetMap contributors, ODbL). To rebuild them:

```bash
npm run osm:fetch && npm run osm:bake           # src/data/network.json
node scripts/osm/extract.mjs <southern-zone.osm.pbf> && npm run osm:tiles   # public/world/
```

Downloads are cached in `data-cache/` (not committed). If the real track or a station is wrong, the best fix is usually to correct it in OpenStreetMap itself and re-bake, so every map benefits.

## Code

- `src/simulation/` is framework-agnostic: no React, no three.js. Keep it that way, and add a test for changes to motion, stops or timing.
- The 3D scene reads `engine.sample` inside `useFrame`. Avoid per-frame React state.
- Pages that don't need 3D (`/routes`, `/stations`) must not import three.js.
- `public/world/tileWorker.js` is built from `src/three/world/tileWorker.ts` by `scripts/build-worker.mjs`. Edit the TypeScript; the bundle is not committed.
- Match the surrounding code's naming, comments and style.

## Commits and pull requests

- One topic per pull request. Small ones are reviewed faster.
- Write the commit subject as a short summary of the change (e.g. `Porur: remove the stray half flyover beside the MGR flyover`), and use the body to say why, plus anything a reviewer can't see in the diff, like sources.
- In the pull request, say what you changed, how you checked it, and add a screenshot for visual changes.

## Licence

By contributing, you agree that your code is released under the [MIT License](LICENSE). Data you add from OpenStreetMap stays under the ODbL, and other material keeps the licence noted in the README.
