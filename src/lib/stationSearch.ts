/**
 * Station search for the journey planner. Pure functions, no React or three.js,
 * so it can be tested with the Node test runner and used by any page.
 *
 * Matching is forgiving: case, punctuation ("St. Thomas Mount", "Pachaiyappa's")
 * and Latin accents are ignored, and every word the rider types must match.
 * Tamil names and alternative names are searched too.
 */
export interface Searchable {
  name: string;
  nameTa: string | null;
  altNames: string[];
}

/**
 * Lower-cases, drops Latin accents and punctuation, and collapses spaces.
 * Only the Latin combining accents (U+0300–U+036F) are removed: Tamil vowel
 * signs are combining marks too, and must survive. Both sides are put in NFC
 * so a Tamil query typed on any keyboard matches the stored spelling.
 */
export function normaliseForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLocaleLowerCase("en")
    // Apostrophes vanish ("Pachaiyappa's" = "pachaiyappas"); other punctuation separates words.
    .replace(/['‘’`]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 0 = the field starts with the word, 1 = a later word does, 2 = it appears inside a word, null = no match. */
function fieldScore(field: string, word: string): 0 | 1 | 2 | null {
  if (field.startsWith(word)) return 0;
  if (field.includes(` ${word}`)) return 1;
  if (field.includes(word)) return 2;
  return null;
}

/**
 * Stations matching `query`, best match first. An empty query returns every
 * station in its original (route) order, and equally good matches keep that
 * order, so results never jump around while typing.
 */
export function searchStations<T extends Searchable>(stations: readonly T[], query: string): T[] {
  const words = normaliseForSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return [...stations];

  const ranked: { station: T; score: number; index: number }[] = [];
  stations.forEach((station, index) => {
    const fields = [station.name, station.nameTa ?? "", ...station.altNames].map(normaliseForSearch).filter(Boolean);
    let score = 0;
    for (const word of words) {
      let best: number | null = null;
      for (const field of fields) {
        const s = fieldScore(field, word);
        if (s !== null && (best === null || s < best)) best = s;
      }
      if (best === null) return; // every word has to match something
      score += best;
    }
    ranked.push({ station, score, index });
  });

  ranked.sort((a, b) => a.score - b.score || a.index - b.index);
  return ranked.map((r) => r.station);
}

/**
 * Stations matching `query`, kept in their original order. For lists where the
 * order means something, like the stops along a line; `searchStations` is for
 * lists ranked by how well each station matches. An empty query keeps them all.
 */
export function filterInOrder<T extends Searchable>(stations: readonly T[], query: string): T[] {
  if (normaliseForSearch(query) === "") return [...stations];
  const hits = new Set(searchStations(stations, query));
  return stations.filter((s) => hits.has(s));
}
