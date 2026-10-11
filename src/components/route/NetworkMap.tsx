import Link from "next/link";
import type { NetworkSummary } from "../../lib/routeSummary";

export interface NetworkMapProps {
  network: NetworkSummary;
  /** Emphasise one line (others dimmed) and label all its stations. */
  highlightLine?: string | null;
  /** Ring one station. */
  highlightStation?: string | null;
  /** Stations link to their pages. */
  linkStations?: boolean;
  className?: string;
  label?: string;
  /** Colour behind the map: label halos and hollow stations are painted in it. */
  ground?: string;
}

const PAD = 1400;

/**
 * Every modelled line on one map, drawn from the real track (OpenStreetMap)
 * in the shared city projection: north up, true scale. Lines still under
 * construction are dashed; interchanges are white rings.
 */
export function NetworkMap({ network, highlightLine = null, highlightStation = null, linkStations = false, className = "", label, ground = "#0a0f18" }: NetworkMapProps) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const l of network.lines) {
    for (const [x, z] of l.track) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }
  minX -= PAD;
  maxX += PAD;
  minZ -= PAD;
  maxZ += PAD;
  const unit = (maxX - minX + PAD * 3.5) / 560; // ~1 screen px when drawn ~560 px wide
  const colour = new Map(network.lines.map((l) => [l.id, l.colour]));
  const dim = (lineId: string) => highlightLine !== null && lineId !== highlightLine;
  // Labels: most important first, skipping any that would overlap one already placed.
  const wanted = network.stations
    .map((s) => {
      const inter = s.lines.length > 1;
      const isHi = s.id === highlightStation;
      const onHi = highlightLine !== null && s.lines.includes(highlightLine);
      const show = isHi || inter || onHi || (highlightLine === null && s.end);
      const rank = isHi ? 0 : s.end ? 1 : s.lines.length > 2 ? 2 : inter ? 3 : 4;
      return { s, show, rank, size: unit * (inter || isHi ? 13 : 11) };
    })
    .filter((c) => c.show)
    .sort((a, b) => a.rank - b.rank);
  type Box = [number, number, number, number];
  const overlaps = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  // Labels keep clear of each other and of the station dots that matter.
  // (Only the big ones: interchanges and line ends. Small dots may sit under a label's halo.)
  const dots = network.stations.filter((s) => s.lines.length > 1 || s.end).map((s) => {
    const r = unit * 7;
    return { id: s.id, box: [s.x - r, s.z - r, s.x + r, s.z + r] as Box };
  });
  const placed: Box[] = [];
  const labels: { id: string; x: number; y: number; anchor: "start" | "end" }[] = [];
  for (const c of wanted) {
    const width = c.s.name.length * c.size * 0.56;
    const top = c.s.z - c.size * 0.75;
    const bottom = c.s.z + c.size * 0.4;
    // Right of the dot by default, else left of it.
    for (const side of [1, -1] as const) {
      const near = c.s.x + side * unit * 10;
      const box: Box = side > 0 ? [near, top, near + width, bottom] : [near - width, top, near, bottom];
      if (placed.some((b) => overlaps(box, b)) || dots.some((d) => d.id !== c.s.id && overlaps(box, d.box))) continue;
      placed.push(box);
      labels.push({ id: c.s.id, x: near, y: c.s.z + unit * 4, anchor: side > 0 ? "start" : "end" });
      minX = Math.min(minX, box[0] - unit * 6);
      maxX = Math.max(maxX, box[2] + unit * 6);
      break;
    }
  }
  const w = maxX - minX;
  const h = maxZ - minZ;
  const byId = new Map(network.stations.map((s) => [s.id, s]));
  const order = [...network.lines].sort((a, b) => Number(a.id === highlightLine) - Number(b.id === highlightLine));

  return (
    <svg viewBox={`${minX} ${minZ} ${w} ${h}`} className={className} role="group" aria-label={label ?? "Chennai Metro network map"}>
      {order.map((l) => (
        <polyline
          key={l.id}
          points={l.track.map(([x, z]) => `${x},${z}`).join(" ")}
          fill="none"
          stroke={l.colour}
          strokeOpacity={dim(l.id) ? 0.28 : 1}
          strokeWidth={unit * (l.id === highlightLine ? 7 : 5)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={l.open ? undefined : `${unit * 10} ${unit * 6}`}
        >
          <title>{`${l.name} · ${l.colourName}${l.open ? "" : " (under construction)"}`}</title>
        </polyline>
      ))}
      {network.stations.map((s) => {
        const inter = s.lines.length > 1;
        const onHi = highlightLine !== null && s.lines.includes(highlightLine);
        const faded = highlightLine !== null && !onHi;
        const isHi = s.id === highlightStation;
        const r = unit * (inter ? 6.5 : isHi ? 6 : 3.6);
        const dot = (
          <>
            {isHi && <circle cx={s.x} cy={s.z} r={unit * 13} fill="none" stroke="#f5f7fa" strokeWidth={unit * 2} />}
            <circle
              cx={s.x}
              cy={s.z}
              r={r}
              fill={inter ? "#f5f7fa" : s.open ? "#f5f7fa" : ground}
              stroke={inter ? ground : colour.get(s.lines[0]) ?? "#7a8596"}
              strokeWidth={unit * (inter ? 2.4 : 2)}
              opacity={faded ? 0.35 : 1}
            />
            <title>{`${s.name}${s.nameTa ? ` · ${s.nameTa}` : ""} — ${s.lines.map((id) => network.lines.find((l) => l.id === id)?.name ?? id).join(", ")}`}</title>
          </>
        );
        return linkStations ? (
          <Link key={s.id} href={`/stations/${s.id}`} aria-label={s.name} className="outline-none [&:focus-visible>circle]:stroke-accent">
            {dot}
          </Link>
        ) : (
          <g key={s.id}>{dot}</g>
        );
      })}
      {/* Names on top of every line and dot. */}
      <g aria-hidden="true" pointerEvents="none">
        {labels.map((l) => {
          const s = byId.get(l.id)!;
          const inter = s.lines.length > 1;
          const isHi = s.id === highlightStation;
          const faded = highlightLine !== null && !s.lines.includes(highlightLine);
          return (
            <text
              key={l.id}
              x={l.x}
              y={l.y}
              textAnchor={l.anchor}
              fontSize={unit * (inter || isHi ? 13 : 11)}
              fontWeight={inter || isHi ? 600 : 400}
              fill={faded ? "#5d6878" : inter || isHi ? "#f5f7fa" : "#b7c0cc"}
              paintOrder="stroke"
              stroke={ground}
              strokeWidth={unit * 3.5}
              strokeLinejoin="round"
            >
              {s.name}
            </text>
          );
        })}
      </g>
      <g transform={`translate(${maxX - unit * 40} ${maxZ - unit * 60})`} aria-hidden="true">
        <path d={`M0 ${-unit * 16} L${unit * 6} ${unit * 2} L0 ${-unit * 3} L${-unit * 6} ${unit * 2} Z`} fill="none" stroke="#7a8596" strokeWidth={unit * 1.5} />
        <text y={unit * 20} textAnchor="middle" fill="#7a8596" fontSize={unit * 10}>
          N
        </text>
        <line x1={-unit * 120} x2={-unit * 120 + 5000} y1={unit * 30} y2={unit * 30} stroke="#7a8596" strokeWidth={unit * 1.5} />
        <text x={-unit * 120 + 2500} y={unit * 46} textAnchor="middle" fill="#7a8596" fontSize={unit * 10}>
          5 km
        </text>
      </g>
    </svg>
  );
}
