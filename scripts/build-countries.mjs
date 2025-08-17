// Node 18+ required (built-in fetch). Run: `node scripts/generate-countries.mjs`
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../src/data/countries.ts");

// Shape of each entry in output
const header = `// AUTO-GENERATED. Do not edit by hand.
// Run: node scripts/generate-countries.mjs
export type Country = {
  code: string;            // ISO 3166-1 alpha-2
  iso3: string;            // ISO 3166-1 alpha-3
  name: string;
  flag: string;            // /assets/img/flags/{iso2}.png
  capital: string;
  cities: string[];        // seed with capital; you can enrich later
  callingCode: string;     // primary E.164 like +1, +44
  callingCodes: string[];  // all country calling codes if multiple
  currency: { code: string; name: string; symbol: string };
  region: string;
  subregion?: string;
  languages: string[];     // ISO 639-1 if available
  timezones: string[];     // IANA TZ names
  tlds: string[];
};

export const countries: Country[] = [
`;

const footer = `] as const;
`;

function pickPrimaryCurrency(currenciesObj) {
  // currenciesObj example: { USD: {name:"US Dollar", symbol:"$"} }
  if (!currenciesObj || typeof currenciesObj !== "object") {
    return { code: "", name: "", symbol: "" };
  }
  const [code, meta] = Object.entries(currenciesObj)[0] || [];
  return {
    code: code || "",
    name: meta?.name || "",
    symbol: meta?.symbol || "",
  };
}

function iddToCodes(idd) {
  // idd: { root: "+", suffixes: ["1","590", ...] }
  if (!idd?.root || !Array.isArray(idd.suffixes)) return [];
  return idd.suffixes.map(s => `${idd.root}${s}`);
}

function primaryCallingCode(idd) {
  const arr = iddToCodes(idd);
  return arr[0] || "";
}

function mapLanguages(langs) {
  // map object { eng: "English", fra: "French" } to ["en","fr"] if keys are ISO-639-3
  // REST Countries also provides 2-letter codes in some datasets; we’ll keep the values as names if ambiguous
  if (!langs || typeof langs !== "object") return [];
  // Prefer the language names (values), fallback to keys:
  const vals = Object.values(langs).filter(Boolean);
  return vals.length ? vals : Object.keys(langs);
}

function safeStr(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

(async () => {
  // Fields: keep payload lean but useful
  const fields = [
    "cca2","cca3","name","capital","idd","currencies",
    "region","subregion","timezones","tld"
  ].join(",");

  const url = `https://restcountries.com/v3.1/all?fields=${fields}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`REST Countries fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.json();

  // Normalize + sort by common name
  const items = raw
    .map(c => {
      const iso2 = (c.cca2 || "").toUpperCase();
      const iso3 = (c.cca3 || "").toUpperCase();
      const name = c?.name?.common || iso2 || "";
      const capital = Array.isArray(c.capital) ? c.capital[0] || "" : (c.capital || "");
      const currency = pickPrimaryCurrency(c.currencies);
      const callingCodes = iddToCodes(c.idd);
      const callingCode = primaryCallingCode(c.idd);
      const languages = mapLanguages(c.languages);
      const timezones = Array.isArray(c.timezones) ? c.timezones : [];
      const tlds = Array.isArray(c.tld) ? c.tld : [];
      const region = c.region || "";
      const subregion = c.subregion || "";

      return {
        code: iso2,
        iso3,
        name,
        flag: `/assets/img/flags/${iso2.toLowerCase()}.png`,
        capital,
        cities: capital ? [capital] : [],
        callingCode,
        callingCodes,
        currency,
        region,
        subregion,
        languages,
        timezones,
        tlds,
      };
    })
    .filter(x => x.code && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  const body = items.map(x => {
    const cur = x.currency;
    return `  { code: "${x.code}", iso3: "${x.iso3}", name: "${safeStr(x.name)}", flag: "${x.flag}",
    capital: "${safeStr(x.capital)}",
    cities: [${x.cities.map(s => `"${safeStr(s)}"`).join(", ")}],
    callingCode: "${x.callingCode}",
    callingCodes: [${x.callingCodes.map(cc => `"${cc}"`).join(", ")}],
    currency: { code: "${cur.code}", name: "${safeStr(cur.name)}", symbol: "${safeStr(cur.symbol)}" },
    region: "${safeStr(x.region)}",${x.subregion ? ` subregion: "${safeStr(x.subregion)}",` : ""}
    languages: [${x.languages.map(l => `"${safeStr(l)}"`).join(", ")}],
    timezones: [${x.timezones.map(tz => `"${safeStr(tz)}"`).join(", ")}],
    tlds: [${x.tlds.map(t => `"${safeStr(t)}"`).join(", ")}],
  },`;
  }).join("\n");

  const output = header + body + "\n" + footer;

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, output, "utf8");
  console.log(`✓ Wrote ${items.length} countries to ${path.relative(process.cwd(), OUT)}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
