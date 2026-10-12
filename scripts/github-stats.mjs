#!/usr/bin/env node
/**
 * Snapshot of the repository's stars, forks and contributors for the landing
 * page (src/data/github.json). Runs before every build; the page also asks
 * GitHub for fresh numbers in the browser. On any failure the committed
 * snapshot is kept, so a build never fails for want of the network.
 */
import { readFileSync, writeFileSync } from "node:fs";

const OUT = new URL("../src/data/github.json", import.meta.url);
const REPO = "madesh-ops/chennai-metro-3d";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "chennai-metro-3d-build" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const get = async (path) => {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
};

try {
  const [repo, people] = await Promise.all([get(""), get("/contributors?per_page=100")]);
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    contributors: people
      .filter((p) => p.type === "User")
      .map((p) => ({ login: p.login, avatar: p.avatar_url, url: p.html_url, commits: p.contributions })),
  };
  const before = readFileSync(OUT, "utf8");
  const after = JSON.stringify(snapshot, null, 2) + "\n";
  // Keep the file unchanged (no spurious diff) when only the timestamp would move.
  const same = (s) => JSON.stringify({ ...JSON.parse(s), fetchedAt: 0 });
  if (same(before) !== same(after)) writeFileSync(OUT, after);
  console.log(`github stats: ${snapshot.stars} stars, ${snapshot.forks} forks, ${snapshot.contributors.length} contributors`);
} catch (e) {
  console.warn(`github stats: kept the snapshot (${e.message})`);
}
