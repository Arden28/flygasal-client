import React, { useMemo, useState, useEffect } from "react";
import "rc-slider/assets/index.css";

/* ---------- utils ---------- */
const hh = (n) => `${String(n).padStart(2, "0")}:00`;
const TIME_BUCKETS = [
  { key: "any", label: "Any time", range: [0, 24] },
  { key: "early", label: "Early morning", range: [0, 6] },
  { key: "morning", label: "Morning", range: [6, 12] },
  { key: "afternoon", label: "Afternoon", range: [12, 18] },
  { key: "evening", label: "Evening", range: [18, 24] },
];

/* ---------- Section (minimal; no card look) ---------- */
const Section = ({ title, children }) => (
  <section className="pt-3 first:pt-0">
    <header className="pb-2">
      <h3 className="text-[13px] font-semibold tracking-wide text-slate-900 uppercase">
        {title}
      </h3>
    </header>
    {children}
    <div className="my-4 h-px bg-slate-200/70 last:hidden" />
  </section>
);

/* ---------- Airline row ---------- */
const AirlineRow = ({
  code,
  checked,
  onChange,
  getAirlineName,
  getAirlineLogo,
  count,
  disabled,
}) => {
  const name = getAirlineName?.(code) || code;
  const logo = getAirlineLogo?.(code);

  return (
    <label
      className={[
        "flex items-center gap-3 rounded-lg px-2 py-2",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer",
        "transition-colors",
      ].join(" ")}
      title={disabled ? "No results for this airline with current filters" : name}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <img
        src={logo}
        alt={`${name} (${code}) logo`}
        className="h-5 w-5 object-contain rounded"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/assets/img/airlines/placeholder.png";
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-slate-800">{name}</div>
        <div className="truncate text-[11px] text-slate-500">{code}</div>
      </div>
      {typeof count === "number" && (
        <span
          className={[
            "ml-2 shrink-0 inline-flex items-center justify-center rounded-full border px-2 py-[1px] text-[11px]",
            count > 0
              ? "border-slate-300 text-slate-700 bg-slate-50"
              : "border-slate-200 text-slate-400 bg-slate-100",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </label>
  );
};

/* ================================================================== */
/*                              SIDEBAR                               */
/* ================================================================== */
export default function FilterSidebar({
  currentStop,
  handleStopChange,
  priceRange,
  priceBounds,
  handlePriceChange,
  uniqueAirlines,
  checkedOnewayValue,
  handleOnewayChange,
  checkedReturnValue,
  handleReturnChange,
  depTimeRange,
  onDepTimeChange,
  retTimeRange,
  onRetTimeChange,
  maxDurationHours,
  onMaxDurationChange,
  baggageOnly,
  onBaggageOnlyChange,
  selectedCabins,
  onToggleCabin,
  onResetCabins,
  returnFlights,
  getAirlineName,
  getAirlineLogo,
  onClearAll,
  airlinesOutboundExact,
  airlinesReturnExact,
  airlineCountsOutbound,
  airlineCountsReturn,
  onCloseMobile,
  tripType = "oneway",
  legsCount = 1,
}) {
  const [absMin, absMax] = priceBounds || [100, 4000];
  const [currMin, currMax] = priceRange || [absMin, absMax];
  const clamped = [
    Math.max(absMin, Math.min(absMax, currMin)),
    Math.max(absMin, Math.min(absMax, currMax)),
  ];

  const [airlineSearchOW, setAirlineSearchOW] = useState("");
  const [airlineSearchRT, setAirlineSearchRT] = useState("");

  const [minDraft, setMinDraft] = useState(clamped[0]);
  const [maxDraft, setMaxDraft] = useState(clamped[1]);

  useEffect(() => {
    setMinDraft(clamped[0]);
    setMaxDraft(clamped[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped[0], clamped[1]]);

  const commitPrice = () => {
    const isNum = (v) => Number.isFinite(Number(v));
    let lo = isNum(minDraft) ? Number(minDraft) : absMin;
    let hi = isNum(maxDraft) ? Number(maxDraft) : absMax;
    if (lo > hi) [lo, hi] = [hi, lo];
    lo = Math.max(absMin, Math.min(absMax, lo));
    hi = Math.max(absMin, Math.min(absMax, hi));
    if (lo !== currMin || hi !== currMax) handlePriceChange([lo, hi]);
    setMinDraft(lo);
    setMaxDraft(hi);
  };
  const onPriceKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitPrice();
    }
  };

  /* Cabin - render compact checkbox list instead of cards */
  const CABINS = [
    { key: "ECONOMY", label: "Economy" },
    { key: "PREMIUM_ECONOMY", label: "Premium Economy" },
    { key: "BUSINESS", label: "Business" },
    { key: "FIRST", label: "First" },
  ];

  /* Build airline meta */
  const toMeta = (code) => ({
    code,
    name: (getAirlineName?.(code) || code).trim(),
    logo: getAirlineLogo?.(code),
  });

  const rawOutboundCodes = useMemo(() => {
    if (Array.isArray(airlinesOutboundExact) && airlinesOutboundExact.length)
      return airlinesOutboundExact;
    return Array.from(new Set(uniqueAirlines || [])).sort();
  }, [airlinesOutboundExact, uniqueAirlines]);

  const rawReturnCodes = useMemo(() => {
    if (Array.isArray(airlinesReturnExact) && airlinesReturnExact.length)
      return airlinesReturnExact;
    return Array.from(new Set(uniqueAirlines || [])).sort();
  }, [airlinesReturnExact, uniqueAirlines]);

  const airlineMetaOutbound = useMemo(
    () => rawOutboundCodes.map(toMeta).sort((a, b) => a.name.localeCompare(b.name)),
    [rawOutboundCodes, getAirlineName, getAirlineLogo]
  );
  const airlineMetaReturn = useMemo(
    () => rawReturnCodes.map(toMeta).sort((a, b) => a.name.localeCompare(b.name)),
    [rawReturnCodes, getAirlineName, getAirlineLogo]
  );

  const filteredOnewayAirlines = useMemo(() => {
    const q = airlineSearchOW.trim().toLowerCase();
    let list = airlineMetaOutbound;
    if (q) list = list.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    return list;
  }, [airlineMetaOutbound, airlineSearchOW]);

  const filteredReturnAirlines = useMemo(() => {
    const q = airlineSearchRT.trim().toLowerCase();
    let list = airlineMetaReturn;
    if (q) list = list.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    return list;
  }, [airlineMetaReturn, airlineSearchRT]);

  const bulkToggle = (type, list) => (selectAll) => {
    const evt = { target: { checked: selectAll } };
    const codes = list.map((m) => m.code);
    if (type === "oneway") codes.forEach((a) => handleOnewayChange(evt, a));
    else codes.forEach((a) => handleReturnChange(evt, a));
  };

  const handleClear = () => onClearAll && onClearAll();

  const getCountOW = (code) =>
    airlineCountsOutbound ? airlineCountsOutbound[code] || 0 : undefined;
  const getCountRT = (code) =>
    airlineCountsReturn ? airlineCountsReturn[code] || 0 : undefined;

  /* For checkbox-style single-select time & stops */
  const activeDepBucket =
    TIME_BUCKETS.find(
      (b) => b.range[0] === depTimeRange?.[0] && b.range[1] === depTimeRange?.[1]
    )?.key || "custom";

  const activeRetBucket =
    TIME_BUCKETS.find(
      (b) => b.range[0] === retTimeRange?.[0] && b.range[1] === retTimeRange?.[1]
    )?.key || "custom";

  return (
    <aside
      className={[
        "w-full rounded-3xl bg-white/70 backdrop-blur",
        "p-3 sm:p-4 lg:p-5",
      ].join(" ")}
    >
      {/* Header (mobile) */}
      <div className="mb-2 flex items-center justify-between sm:mb-3 lg:mb-4 lg:hidden">
        <h2 className="text-base font-semibold text-slate-900">Filters</h2>
        {onCloseMobile && (
          <button
            className="inline-flex h-9 items-center justify-center rounded-lg ring-1 ring-slate-300 px-3 text-sm hover:bg-white"
            onClick={onCloseMobile}
          >
            Close
          </button>
        )}
      </div>

      {/* Cabin (checkbox list) */}
      <Section title="Cabin class">
        <div className="grid grid-cols-1 gap-1.5">
          {CABINS.map((c) => {
            const checked = selectedCabins.includes(c.key);
            return (
              <label
                key={c.key}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={checked}
                  onChange={() => onToggleCabin?.(c.key)}
                />
                <span className="text-sm text-slate-800">{c.label}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            className="rounded-full ring-1 ring-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
            onClick={onResetCabins}
          >
            Select all
          </button>
          {selectedCabins.length > 0 && (
            <span className="text-[12px] text-slate-500">
              Selected: {selectedCabins.length}
            </span>
          )}
        </div>
      </Section>

      {/* Stops — checkbox look (single-select logic preserved) */}
      <Section title="Stops">
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { value: "mix", label: "All" },
            { value: "oneway_0", label: "Direct" },
            { value: "oneway_1", label: "1 stop" },
            { value: "oneway_2", label: "2+ stops" },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={currentStop === value}
                onChange={() => handleStopChange(value)}
              />
              <span className="text-sm text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Price */}
      <Section title={`Price (USD)`}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2 text-xs text-slate-500">
              Min
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={onPriceKeyDown}
              className="mt-5 h-10 w-full rounded-xl ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2 text-xs text-slate-500">
              Max
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={onPriceKeyDown}
              className="mt-5 h-10 w-full rounded-xl ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Press Enter or leave the field to apply. Range is {absMin}–{absMax}.
        </p>
      </Section>

      {/* Departure time — outbound (checkbox look; single-select under the hood) */}
      <Section title="Departure time (outbound)">
        <div className="grid grid-cols-1 gap-1.5">
          {TIME_BUCKETS.map((b) => {
            const checked = activeDepBucket === b.key;
            return (
              <label
                key={b.key}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 cursor-pointer"
                title={`${b.label}: ${hh(b.range[0])}–${hh(b.range[1])}`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={checked}
                  onChange={() => onDepTimeChange(b.range)}
                />
                <span className="text-sm text-slate-800">
                  {b.label}{" "}
                  <span className="text-[11px] text-slate-500">
                    ({String(b.range[0]).padStart(2, "0")}-{String(b.range[1]).padStart(2, "0")})
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Departure time — return */}
      {returnFlights?.length > 0 && (
        <Section title="Departure time (return)">
          <div className="grid grid-cols-1 gap-1.5">
            {TIME_BUCKETS.map((b) => {
              const checked = activeRetBucket === b.key;
              return (
                <label
                  key={b.key}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 cursor-pointer"
                  title={`${b.label}: ${hh(b.range[0])}–${hh(b.range[1])}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={checked}
                    onChange={() => onRetTimeChange(b.range)}
                  />
                  <span className="text-sm text-slate-800">
                    {b.label}{" "}
                    <span className="text-[11px] text-slate-500">
                      ({String(b.range[0]).padStart(2, "0")}-{String(b.range[1]).padStart(2, "0")})
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* Max duration */}
      <Section title="Max total duration">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={72}
            value={maxDurationHours}
            onChange={(e) => onMaxDurationChange(Number(e.target.value || 0))}
            className="h-10 w-28 rounded-xl ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <span className="text-sm text-slate-600">hours</span>
        </div>
      </Section>

      {/* Baggage */}
      <Section title="Baggage">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={!!baggageOnly}
            onChange={(e) => onBaggageOnlyChange(e.target.checked)}
          />
          <span>Show only fares with baggage included</span>
        </label>
      </Section>

      {/* Airlines — outbound */}
      <Section title="Airlines (outbound)">
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search airline name or code…"
            value={airlineSearchOW}
            onChange={(e) => setAirlineSearchOW(e.target.value)}
            className="h-9 w-full rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className="rounded-full ring-1 ring-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
              onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(true)}
            >
              Select visible
            </button>
            <button
              type="button"
              className="rounded-full ring-1 ring-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
              onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(false)}
            >
              Clear visible
            </button>
          </div>
        </div>

        <div className="space-y-1 pr-1">
          {filteredOnewayAirlines.map(({ code }) => {
            const count = getCountOW(code);
            const disabled = typeof count === "number" && count <= 0;
            return (
              <AirlineRow
                key={`ow_${code}`}
                code={code}
                checked={checkedOnewayValue.includes(`oneway_${code}`)}
                onChange={(e) => handleOnewayChange(e, code)}
                getAirlineName={getAirlineName}
                getAirlineLogo={getAirlineLogo}
                count={count}
                disabled={disabled}
              />
            );
          })}
        </div>
      </Section>

      {/* Airlines — return */}
      {returnFlights?.length > 0 && (
        <Section title="Airlines (return)">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search airline name or code…"
              value={airlineSearchRT}
              onChange={(e) => setAirlineSearchRT(e.target.value)}
              className="h-9 w-full rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className="rounded-full ring-1 ring-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
                onClick={() => bulkToggle("return", filteredReturnAirlines)(true)}
              >
                Select visible
              </button>
              <button
                type="button"
                className="rounded-full ring-1 ring-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
                onClick={() => bulkToggle("return", filteredReturnAirlines)(false)}
              >
                Clear visible
              </button>
            </div>
          </div>

          <div className="space-y-1 pr-1">
            {filteredReturnAirlines.map(({ code }) => {
              const count = getCountRT(code);
              const disabled = typeof count === "number" && count <= 0;
              return (
                <AirlineRow
                  key={`rt_${code}`}
                  code={code}
                  checked={checkedReturnValue.includes(`return_${code}`)}
                  onChange={(e) => handleReturnChange(e, code)}
                  getAirlineName={getAirlineName}
                  getAirlineLogo={getAirlineLogo}
                  count={count}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Footer actions */}
      <div className="pt-1">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-xl ring-1 ring-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            onClick={handleClear}
          >
            Clear all
          </button>
          {onCloseMobile && (
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 lg:hidden"
              onClick={onCloseMobile}
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
