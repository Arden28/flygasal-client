import React, { useMemo, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const hh = (n) => `${String(n).padStart(2, "0")}:00`;
const timeMarks = { 0: "00", 6: "06", 12: "12", 18: "18", 24: "24" };

/* ---------- Section (collapsible) ---------- */
const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 lg:px-4 lg:py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-slate-800">
          {title}
        </span>
        <span
          className={[
            "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg ring-1 ring-slate-200",
            open ? "bg-slate-50" : "bg-white",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && <div className="px-3.5 pb-3 lg:px-4 lg:pb-4">{children}</div>}
    </section>
  );
};

/* ---------- Airline row (overflow-safe) ---------- */
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
        "transition-colors",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer",
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
        <div className="truncate text-xs text-slate-500">{code}</div>
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

/* ---------- Cabin cards ---------- */
const CABIN_OPTIONS = [
  { key: "ECONOMY", label: "Economy", sub: "Standard seats", icon: "💺" },
  { key: "PREMIUM_ECONOMY", label: "Premium", sub: "Extra legroom", icon: "🧘" },
  { key: "BUSINESS", label: "Business", sub: "Lie-flat options", icon: "🛏️" },
  { key: "FIRST", label: "First", sub: "Top perks", icon: "⭐" },
];

const CabinCard = ({ active, label, sub, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
      "ring-1 ring-slate-200/70",
      active ? "border-blue-600 bg-blue-50 ring-blue-200" : "border-slate-200 hover:bg-slate-50 bg-white",
    ].join(" ")}
    aria-pressed={active}
  >
    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-base">{icon}</span>
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
      <div className="truncate text-xs text-slate-500">{sub}</div>
    </div>
    <div className="ml-auto">
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs",
          active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent",
        ].join(" ")}
      >
        ✓
      </span>
    </div>
  </button>
);

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
}) {
  const [absMin, absMax] = priceBounds || [100, 4000];
  const [currMin, currMax] = priceRange || [absMin, absMax];
  const clamped = [
    Math.max(absMin, Math.min(absMax, currMin)),
    Math.max(absMin, Math.min(absMax, currMax)),
  ];

  const [airlineSearchOW, setAirlineSearchOW] = useState("");
  const [airlineSearchRT, setAirlineSearchRT] = useState("");
  const [hideZeroOutbound, setHideZeroOutbound] = useState(false);
  const [hideZeroReturn, setHideZeroReturn] = useState(false);

  /* Build name/logo meta once per code for stable, alphabetical lists */
  const toMeta = (code) => ({
    code,
    name: (getAirlineName?.(code) || code).trim(),
    logo: getAirlineLogo?.(code),
  });

  const rawOutboundCodes = useMemo(() => {
    if (Array.isArray(airlinesOutboundExact) && airlinesOutboundExact.length) return airlinesOutboundExact;
    return Array.from(new Set(uniqueAirlines || [])).sort();
  }, [airlinesOutboundExact, uniqueAirlines]);

  const rawReturnCodes = useMemo(() => {
    if (Array.isArray(airlinesReturnExact) && airlinesReturnExact.length) return airlinesReturnExact;
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

  /* Search & hide-0 filtering */
  const filteredOnewayAirlines = useMemo(() => {
    const q = airlineSearchOW.trim().toLowerCase();
    let list = airlineMetaOutbound;
    if (q) list = list.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    if (hideZeroOutbound && airlineCountsOutbound) {
      list = list.filter(({ code }) => (airlineCountsOutbound[code] || 0) > 0);
    }
    return list;
  }, [airlineMetaOutbound, airlineSearchOW, hideZeroOutbound, airlineCountsOutbound]);

  const filteredReturnAirlines = useMemo(() => {
    const q = airlineSearchRT.trim().toLowerCase();
    let list = airlineMetaReturn;
    if (q) list = list.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    if (hideZeroReturn && airlineCountsReturn) {
      list = list.filter(({ code }) => (airlineCountsReturn[code] || 0) > 0);
    }
    return list;
  }, [airlineMetaReturn, airlineSearchRT, hideZeroReturn, airlineCountsReturn]);

  /* Bulk toggle helpers */
  const bulkToggle = (type, list) => (selectAll) => {
    const evt = { target: { checked: selectAll } };
    const codes = list.map((m) => m.code);
    if (type === "oneway") codes.forEach((a) => handleOnewayChange(evt, a));
    else codes.forEach((a) => handleReturnChange(evt, a));
  };

  const handleClear = () => onClearAll && onClearAll();

  const getCountOW = (code) => (airlineCountsOutbound ? (airlineCountsOutbound[code] || 0) : undefined);
  const getCountRT = (code) => (airlineCountsReturn ? (airlineCountsReturn[code] || 0) : undefined);

  return (
    <aside
      className={[
        "w-full rounded-3xl bg-slate-50/70 backdrop-blur",
        "p-0 lg:p-4 xl:p-5",
        "space-y-3 lg:space-y-4",
        "ring-1 ring-slate-200/60 shadow-sm",
      ].join(" ")}
    >
      {/* Header (mobile) */}
      <div className="flex items-center justify-between mb-1 lg:mb-0 lg:hidden">
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

      {/* Cabin */}
      <Section title="Cabin class" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CABIN_OPTIONS.map((c) => (
            <CabinCard
              key={c.key}
              active={selectedCabins.includes(c.key)}
              label={c.label}
              sub={c.sub}
              icon={c.icon}
              onClick={() => onToggleCabin?.(c.key)}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            className="rounded-full ring-1 ring-slate-300 px-3 py-1 hover:bg-slate-50"
            onClick={onResetCabins}
          >
            Select all
          </button>
          {selectedCabins.length > 0 && (
            <span className="text-slate-500">Selected: {selectedCabins.length}</span>
          )}
        </div>
      </Section>

      {/* Stops */}
      <Section title="Stops" defaultOpen>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "mix", label: "All" },
            { value: "oneway_0", label: "Direct" },
            { value: "oneway_1", label: "1 stop" },
            { value: "oneway_2", label: "2+ stops" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStopChange(value)}
              className={[
                "rounded-full px-3 py-1.5 text-sm ring-1",
                currentStop === value
                  ? "ring-blue-600 bg-blue-50 text-blue-700"
                  : "ring-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
              aria-pressed={currentStop === value}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Price */}
      <Section title={`Price (${/* currency visual only, logic uses USD */ "USD"})`} defaultOpen>
        <div className="px-0.5">
          <Slider
            range
            min={absMin}
            max={absMax}
            value={clamped}
            onChange={handlePriceChange}
            trackStyle={[{ height: 6 }]}
            railStyle={{ height: 6 }}
            handleStyle={[{ width: 18, height: 18, marginTop: -6 }, { width: 18, height: 18, marginTop: -6 }]}
          />
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-slate-700">
            <span className="truncate">${clamped[0]}</span>
            <span className="truncate">${clamped[1]}</span>
          </div>
        </div>
      </Section>

      {/* Time windows */}
      <Section title="Departure time (outbound)" defaultOpen={false}>
        <div className="px-0.5">
          <Slider
            range
            min={0}
            max={24}
            marks={timeMarks}
            step={1}
            value={depTimeRange}
            onChange={onDepTimeChange}
            trackStyle={[{ height: 6 }]}
            railStyle={{ height: 6 }}
            handleStyle={[{ width: 18, height: 18, marginTop: -6 }, { width: 18, height: 18, marginTop: -6 }]}
          />
          <div className="mt-2 text-sm text-slate-700">
            {hh(depTimeRange[0])} – {hh(depTimeRange[1])}
          </div>
        </div>
      </Section>

      {returnFlights?.length > 0 && (
        <Section title="Departure time (return)" defaultOpen={false}>
          <div className="px-0.5">
            <Slider
              range
              min={0}
              max={24}
              marks={timeMarks}
              step={1}
              value={retTimeRange}
              onChange={onRetTimeChange}
              trackStyle={[{ height: 6 }]}
              railStyle={{ height: 6 }}
              handleStyle={[{ width: 18, height: 18, marginTop: -6 }, { width: 18, height: 18, marginTop: -6 }]}
            />
            <div className="mt-2 text-sm text-slate-700">
              {hh(retTimeRange[0])} – {hh(retTimeRange[1])}
            </div>
          </div>
        </Section>
      )}

      {/* Max duration */}
      <Section title="Max total duration" defaultOpen={false}>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={72}
            value={maxDurationHours}
            onChange={(e) => onMaxDurationChange(Number(e.target.value || 0))}
            className="h-10 w-28 rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <span className="text-sm text-slate-600">hours</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          From first departure to final arrival (round-trip sums both legs).
        </p>
      </Section>

      {/* Baggage */}
      <Section title="Baggage" defaultOpen={false}>
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
      <Section title="Airlines (outbound)" defaultOpen>
        <div className="mb-2 flex items-center justify-between gap-2">
          <input
            type="text"
            placeholder="Search airline name or code…"
            value={airlineSearchOW}
            onChange={(e) => setAirlineSearchOW(e.target.value)}
            className="h-9 w-full rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <div className="whitespace-nowrap text-xs flex items-center gap-2">
            {airlineCountsOutbound && (
              <label className="inline-flex items-center gap-1 text-slate-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={hideZeroOutbound}
                  onChange={(e) => setHideZeroOutbound(e.target.checked)}
                />
                Hide 0
              </label>
            )}
            <button
              type="button"
              className="rounded-full ring-1 ring-slate-300 px-3 py-1 hover:bg-slate-50"
              onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(true)}
            >
              Select visible
            </button>
            <button
              type="button"
              className="rounded-full ring-1 ring-slate-300 px-3 py-1 hover:bg-slate-50"
              onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(false)}
            >
              Clear visible
            </button>
          </div>
        </div>

        {/* Scroll area (responsive height, no overflow outside) */}
        <div
          className={[
            "space-y-1 pr-1",
            "max-h-[28vh] md:max-h-64 xl:max-h-72",
            "overflow-y-auto overscroll-contain",
          ].join(" ")}
        >
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
        <Section title="Airlines (return)" defaultOpen={false}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <input
              type="text"
              placeholder="Search airline name or code…"
              value={airlineSearchRT}
              onChange={(e) => setAirlineSearchRT(e.target.value)}
              className="h-9 w-full rounded-lg ring-1 ring-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            <div className="whitespace-nowrap text-xs flex items-center gap-2">
              {airlineCountsReturn && (
                <label className="inline-flex items-center gap-1 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={hideZeroReturn}
                    onChange={(e) => setHideZeroReturn(e.target.checked)}
                  />
                  Hide 0
                </label>
              )}
              <button
                type="button"
                className="rounded-full ring-1 ring-slate-300 px-3 py-1 hover:bg-slate-50"
                onClick={() => bulkToggle("return", filteredReturnAirlines)(true)}
              >
                Select visible
              </button>
              <button
                type="button"
                className="rounded-full ring-1 ring-slate-300 px-3 py-1 hover:bg-slate-50"
                onClick={() => bulkToggle("return", filteredReturnAirlines)(false)}
              >
                Clear visible
              </button>
            </div>
          </div>

          <div
            className={[
              "space-y-1 pr-1",
              "max-h-[28vh] md:max-h-64 xl:max-h-72",
              "overflow-y-auto overscroll-contain",
            ].join(" ")}
          >
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

      {/* Footer actions (sticky on mobile so actions are always reachable) */}
      <div className="lg:pt-1">
        <div className="lg:static sticky bottom-2 left-0 right-0">
          <div className="flex items-center justify-between gap-3 bg-transparent">
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
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 lg:hidden"
                onClick={onCloseMobile}
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
