import { test } from "node:test";
import assert from "node:assert/strict";
import { getAllRouteSummaries } from "./getRouteSummary.ts";
import { normaliseForSearch, searchStations, type Searchable } from "./stationSearch.ts";

const st = (name: string, nameTa: string | null = null, altNames: string[] = []): Searchable => ({ name, nameTa, altNames });

const SAMPLE = [
  st("Poonamallee Bypass", "பூந்தமல்லி புறவழிச்சாலை"),
  st("Porur Junction", "போரூர் சந்திப்பு"),
  st("St. Thomas Mount", "பரங்கிமலை"),
  st("Pachaiyappa's College"),
  st("AG-DMS"),
  st("Alandur", "ஆலந்தூர்", ["Guindy Road"]),
  st("Vadapalani", "வடபழனி"),
];
const names = (r: Searchable[]) => r.map((s) => s.name);

test("an empty or blank query returns every station in route order", () => {
  assert.deepEqual(names(searchStations(SAMPLE, "")), names(SAMPLE));
  assert.deepEqual(names(searchStations(SAMPLE, "   ")), names(SAMPLE));
  assert.notEqual(searchStations(SAMPLE, ""), SAMPLE, "returns a copy, never the input array");
});

test("case, punctuation and Latin accents are ignored", () => {
  assert.deepEqual(names(searchStations(SAMPLE, "ST THOMAS")), ["St. Thomas Mount"]);
  assert.deepEqual(names(searchStations(SAMPLE, "st. thomas mount")), ["St. Thomas Mount"]);
  assert.deepEqual(names(searchStations(SAMPLE, "pachaiyappas")), ["Pachaiyappa's College"]);
  assert.deepEqual(names(searchStations(SAMPLE, "Pachaiyappa’s col")), ["Pachaiyappa's College"], "curly apostrophe too");
  assert.deepEqual(names(searchStations(SAMPLE, "ag dms")), ["AG-DMS"]);
  assert.equal(normaliseForSearch("  Café   Ñandu-Road "), "cafe nandu road");
});

test("names that start with the query come before names that merely contain it", () => {
  // "po" starts Poonamallee and Porur; it is only inside the others' later words or not at all.
  const r = names(searchStations(SAMPLE, "po"));
  assert.deepEqual(r.slice(0, 2), ["Poonamallee Bypass", "Porur Junction"]);
  // A later word beats a match inside a word: "mount" is a word start, "ount" is not.
  assert.deepEqual(names(searchStations([st("Mountain View"), st("St. Thomas Mount")], "mount")), ["Mountain View", "St. Thomas Mount"]);
  assert.deepEqual(names(searchStations([st("Surmount Road"), st("Thomas Mount")], "mount")), ["Thomas Mount", "Surmount Road"]);
});

test("every word must match, in any order", () => {
  assert.deepEqual(names(searchStations(SAMPLE, "mount thomas")), ["St. Thomas Mount"]);
  assert.deepEqual(names(searchStations(SAMPLE, "thomas porur")), []);
});

test("Tamil names and alternative names are searched", () => {
  assert.deepEqual(names(searchStations(SAMPLE, "வடபழனி")), ["Vadapalani"]);
  assert.deepEqual(names(searchStations(SAMPLE, "பரங்கி")), ["St. Thomas Mount"]);
  assert.deepEqual(names(searchStations(SAMPLE, "guindy")), ["Alandur"]);
});

test("Tamil vowel signs survive normalisation, and either Unicode form of a letter matches", () => {
  const ta = "ஆலந்தூர்";
  assert.equal(normaliseForSearch(ta), ta);
  // கொ typed as one code point (U+0BCA) or as the two it decomposes into (U+0BC6 U+0BBE).
  const composed = "கொ";
  const decomposed = "கொ";
  assert.deepEqual(names(searchStations([st("Koyambedu", `${composed}யம்பேடு`)], `${decomposed}யம்`)), ["Koyambedu"]);
});

test("no match gives an empty list, and equally good matches keep route order", () => {
  assert.deepEqual(searchStations(SAMPLE, "zzzz"), []);
  assert.deepEqual(names(searchStations([st("Anna Nagar East"), st("Anna Nagar Tower"), st("Anna Salai")], "anna")), [
    "Anna Nagar East",
    "Anna Nagar Tower",
    "Anna Salai",
  ]);
});

test("real data: every station is found by its own name, and by its Tamil name where it has one", () => {
  for (const route of getAllRouteSummaries()) {
    for (const s of route.stations) {
      assert.ok(searchStations(route.stations, s.name).includes(s), `${route.id}: "${s.name}" not found by its own name`);
      if (s.nameTa) assert.ok(searchStations(route.stations, s.nameTa).includes(s), `${route.id}: "${s.nameTa}" not found by its Tamil name`);
    }
  }
});

test("real data: a typed prefix finds the station at the top of the list", () => {
  const l4 = getAllRouteSummaries()[0];
  assert.equal(searchStations(l4.stations, "vadap")[0].id, "vadapalani");
  assert.equal(searchStations(l4.stations, "poonamallee")[0].id, "poonamallee-bypass");
});
