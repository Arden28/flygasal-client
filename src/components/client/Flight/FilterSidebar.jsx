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

/* ---------- Collapsible Section (no shadows) ---------- */
const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = `sec-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="py-2 first:pt-0">
      {/* Header */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-slate-50"
      >
        <h3 className="text-[13px] font-semibold tracking-wide text-slate-900 uppercase">
          {title}
        </h3>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div id={id} className="px-1 pt-2 pb-3">
          {children}
        </div>
      )}

      {/* Divider between sections */}
      <div className="my-3 h-px bg-slate-200/80 last:hidden" />
    </section>
  );
};

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
        "flex items-center gap-3 rounded-lg px-2.5 py-2",
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
  count,
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
  totalCount,
  currentPage,
  pageSize,
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

  const CABINS = [
    { key: "ECONOMY", label: "Economy" },
    { key: "PREMIUM_ECONOMY", label: "Premium Economy" },
    { key: "BUSINESS", label: "Business" },
    { key: "FIRST", label: "First" },
  ];

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

  const activeDepBucket =
    TIME_BUCKETS.find(
      (b) => b.range[0] === depTimeRange?.[0] && b.range[1] === depTimeRange?.[1]
    )?.key || "custom";

  const activeRetBucket =
    TIME_BUCKETS.find(
      (b) => b.range[0] === retTimeRange?.[0] && b.range[1] === retTimeRange?.[1]
    )?.key || "custom";


  const pageSummary = useMemo(() => {
    if (!totalCount || !currentPage || !pageSize) return null;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return { start, end, total: totalCount };
  }, [totalCount, currentPage, pageSize]);

  return (
    <aside
      className={[
        "w-full rounded-3xl bg-white",
        "ring-1 ring-slate-200",
        "p-4 sm:p-5 lg:p-6",
      ].join(" ")}
    >
      {/* Top meta */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        {pageSummary && (
          <div className="text-[12px] font-medium text-slate-700" aria-live="polite">
            Showing <span className="font-medium text-slate-800">{pageSummary.start}–{pageSummary.end}</span> of{" "}
            <span className="font-medium text-slate-800">{pageSummary.total}</span> results
          </div>
        )}
        {onCloseMobile && (
          <button
            className="inline-flex h-9 items-center justify-center rounded-lg ring-1 ring-slate-300 px-3 text-sm hover:bg-white lg:hidden"
            onClick={onCloseMobile}
          >
            Close
          </button>
        )}
      </div>

      {/* Cabin */}
      <CollapsibleSection title="Cabin class" defaultOpen>
        <div className="grid grid-cols-1 gap-2">
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
        <div className="mt-3 flex items-center justify-between">
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
      </CollapsibleSection>

      {/* Stops (single-select via checkboxes) */}
      <CollapsibleSection title="Stops" defaultOpen>
        <div className="grid grid-cols-1 gap-2">
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
      </CollapsibleSection>

      {/* Price */}
      <CollapsibleSection title="Price (USD)" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
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
              className="mt-5 h-11 w-full rounded-xl ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
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
              className="mt-5 h-11 w-full rounded-xl ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Press Enter or leave the field to apply. Range is {absMin}–{absMax}.
        </p>
      </CollapsibleSection>

      {/* Departure time — outbound */}
      <CollapsibleSection title="Departure time (outbound)" defaultOpen>
        <div className="grid grid-cols-1 gap-2">
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
      </CollapsibleSection>

      {/* Departure time — return */}
      {returnFlights?.length > 0 && (
        <CollapsibleSection title="Departure time (return)" defaultOpen>
          <div className="grid grid-cols-1 gap-2">
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
        </CollapsibleSection>
      )}

      {/* Max duration */}
      <CollapsibleSection title="Max total duration" defaultOpen>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={72}
            value={maxDurationHours}
            onChange={(e) => onMaxDurationChange(Number(e.target.value || 0))}
            className="h-11 w-28 rounded-xl ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <span className="text-sm text-slate-600">hours</span>
        </div>
      </CollapsibleSection>

      {/* Baggage */}
      <CollapsibleSection title="Baggage" defaultOpen>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={!!baggageOnly}
            onChange={(e) => onBaggageOnlyChange(e.target.checked)}
          />
        <span>Show only fares with baggage included</span>
        </label>
      </CollapsibleSection>

      {/* Airlines — outbound */}
      <CollapsibleSection title="Airlines (outbound)" defaultOpen>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search airline name or code…"
            value={airlineSearchOW}
            onChange={(e) => setAirlineSearchOW(e.target.value)}
            className="h-10 w-full rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
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
      </CollapsibleSection>

      {/* Airlines — return */}
      {returnFlights?.length > 0 && (
        <CollapsibleSection title="Airlines (return)" defaultOpen>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search airline name or code…"
              value={airlineSearchRT}
              onChange={(e) => setAirlineSearchRT(e.target.value)}
              className="h-10 w-full rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
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
        </CollapsibleSection>

      )}

      {/* Footer actions */}
      <div className="pt-2">
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
