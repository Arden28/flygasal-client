import React, { useMemo, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { motion, AnimatePresence } from "framer-motion";

const hh = (n) => `${String(n).padStart(2, "0")}:00`;
const timeMarks = { 0: "00", 6: "06", 12: "12", 18: "18", 24: "24" };

const Section = ({ title, children }) => (
  <section className="mb-6">
    <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-800">{title}</h3>
    <div className="rounded-xl border border-slate-200 bg-white p-3">{children}</div>
  </section>
);

const AirlineRow = ({
  code,
  checked,
  onChange,
  getAirlineName,
  getAirlineLogo,
  count,          // optional number of matching results
  disabled,       // optional visual/interaction disable
}) => {
  const name = getAirlineName?.(code) || code;
  const logo = getAirlineLogo?.(code);

  return (
    <label
      className={[
        "flex items-center gap-3 rounded-lg px-2 py-1.5",
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
        <div className="text-xs text-slate-500">{code}</div>
      </div>
      {typeof count === "number" && (
        <span
          className={[
            "ml-2 inline-flex items-center justify-center rounded-full border px-2 py-[1px] text-[11px]",
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

/* --------- Cabin cards --------- */
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
      active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200" : "border-slate-200 hover:bg-slate-50",
    ].join(" ")}
    aria-pressed={active}
  >
    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-base">
      {icon}
    </span>
    <div className="min-w-0">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
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

const FilterModal = ({
  isOpen,
  onClose,

  // Stops
  currentStop,
  handleStopChange,

  // Price
  priceRange,          // [min, max]
  priceBounds,         // [absMin, absMax]
  handlePriceChange,

  // Airlines (legacy input)
  uniqueAirlines,

  // Airline selection state/handlers
  checkedOnewayValue,
  handleOnewayChange,
  checkedReturnValue,
  handleReturnChange,

  // Time windows
  depTimeRange,
  onDepTimeChange,
  retTimeRange,
  onRetTimeChange,

  // Duration + baggage
  maxDurationHours,
  onMaxDurationChange,
  baggageOnly,
  onBaggageOnlyChange,

  // Cabin
  selectedCabins,
  onToggleCabin,
  onResetCabins,

  // Context & helpers
  returnFlights,
  getAirlineName,
  getAirlineLogo,

  // Optional: global clear
  onClearAll,

  /* ===== NEW (optional but recommended) =====
     Exact airline code lists and counts built from the SAME logic you use in filtering:
     - outbound: first marketing carrier (or your exact obCode)
     - return:   first marketing carrier for return leg (rtCode)
     Providing these eliminates “listed-but-no-results” airlines.
  */
  airlinesOutboundExact,                // string[] of outbound primary codes
  airlinesReturnExact,                  // string[] of return primary codes
  airlineCountsOutbound,                // Record<code, number>
  airlineCountsReturn,                  // Record<code, number>
}) => {
  const [absMin, absMax] = priceBounds || [100, 4000];
  const [currMin, currMax] = priceRange || [absMin, absMax];
  const clamped = [
    Math.max(absMin, Math.min(absMax, currMin)),
    Math.max(absMin, Math.min(absMax, currMax)),
  ];

  // Airline search boxes
  const [airlineSearchOW, setAirlineSearchOW] = useState("");
  const [airlineSearchRT, setAirlineSearchRT] = useState("");

  // NEW: optional hide-zero toggle (effective only if counts provided)
  const [hideZeroOutbound, setHideZeroOutbound] = useState(false);
  const [hideZeroReturn, setHideZeroReturn] = useState(false);

  // -- Build a meta object for name/logo given a code --
  const toMeta = (code) => ({
    code,
    name: (getAirlineName?.(code) || code).trim(),
    logo: getAirlineLogo?.(code),
  });

  // ===== Determine outbound/return lists to show =====
  // Prefer exact lists if provided; otherwise fall back to legacy uniqueAirlines
  const rawOutboundCodes = useMemo(() => {
    if (Array.isArray(airlinesOutboundExact) && airlinesOutboundExact.length) return airlinesOutboundExact;
    // Fallback: show all known codes; may include carriers that are not primary => can lead to 0 results on click
    return Array.from(new Set(uniqueAirlines || [])).sort();
  }, [airlinesOutboundExact, uniqueAirlines]);

  const rawReturnCodes = useMemo(() => {
    if (Array.isArray(airlinesReturnExact) && airlinesReturnExact.length) return airlinesReturnExact;
    // If no separate list, reuse legacy set; UI will still render cleanly for oneway
    return Array.from(new Set(uniqueAirlines || [])).sort();
  }, [airlinesReturnExact, uniqueAirlines]);

  // Meta lists with stable alpha sort by name
  const airlineMetaOutbound = useMemo(() => {
    return rawOutboundCodes.map(toMeta).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawOutboundCodes, getAirlineName, getAirlineLogo]);

  const airlineMetaReturn = useMemo(() => {
    return rawReturnCodes.map(toMeta).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawReturnCodes, getAirlineName, getAirlineLogo]);

  // Search filtering
  const filteredOnewayAirlines = useMemo(() => {
    const q = airlineSearchOW.trim().toLowerCase();
    let list = airlineMetaOutbound;
    if (q) {
      list = list.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    }
    if (hideZeroOutbound && airlineCountsOutbound) {
      list = list.filter(({ code }) => (airlineCountsOutbound[code] || 0) > 0);
    }
    return list;
  }, [airlineMetaOutbound, airlineSearchOW, hideZeroOutbound, airlineCountsOutbound]);

  const filteredReturnAirlines = useMemo(() => {
    const q = airlineSearchRT.trim().toLowerCase();
    let list = airlineMetaReturn;
    if (q) {
      list = list.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    }
    if (hideZeroReturn && airlineCountsReturn) {
      list = list.filter(({ code }) => (airlineCountsReturn[code] || 0) > 0);
    }
    return list;
  }, [airlineMetaReturn, airlineSearchRT, hideZeroReturn, airlineCountsReturn]);

  // Bulk select/clear on visible rows
  const bulkToggle = (type, list) => (selectAll) => {
    const evt = { target: { checked: selectAll } };
    const codes = list.map((m) => m.code);
    if (type === "oneway") {
      codes.forEach((a) => handleOnewayChange(evt, a));
    } else {
      codes.forEach((a) => handleReturnChange(evt, a));
    }
  };

  const handleClear = () => {
    if (onClearAll) return onClearAll();
    handleStopChange("mix");
    handlePriceChange([absMin, absMax]);
    onDepTimeChange?.([0, 24]);
    onRetTimeChange?.([0, 24]);
    onMaxDurationChange?.(48);
    onBaggageOnlyChange?.(false);
    onResetCabins?.();
    bulkToggle("oneway", airlineMetaOutbound)(false);
    bulkToggle("return", airlineMetaReturn)(false);
  };

  // Helper to compute disabled based on counts (if provided)
  const getCountOW = (code) => (airlineCountsOutbound ? (airlineCountsOutbound[code] || 0) : undefined);
  const getCountRT = (code) => (airlineCountsReturn ? (airlineCountsReturn[code] || 0) : undefined);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-3xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-semibold text-slate-900">Filters</h2>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
                onClick={onClose}
                aria-label="Close filters"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[72vh] overflow-y-auto px-4 py-4 sm:px-5">
              {/* Cabin */}
              <Section title="Cabin class">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
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
              <Section title="Stops">
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
                      className={`rounded-full px-3 py-1.5 text-sm border ${
                        currentStop === value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      aria-pressed={currentStop === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Price */}
              <Section title="Price (USD)">
                <div className="px-1">
                  <Slider
                    range
                    min={absMin}
                    max={absMax}
                    value={clamped}
                    onChange={handlePriceChange}
                    trackStyle={[{ backgroundColor: "#2563eb", height: 6 }]}
                    handleStyle={[
                      { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                      { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                    ]}
                    railStyle={{ backgroundColor: "#e5e7eb", height: 6 }}
                  />
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                    <span>${currMin}</span>
                    <span>${currMax}</span>
                  </div>
                </div>
              </Section>

              {/* Time windows */}
              <Section title="Departure time (outbound)">
                <div className="px-1">
                  <Slider
                    range
                    min={0}
                    max={24}
                    marks={timeMarks}
                    step={1}
                    value={depTimeRange}
                    onChange={onDepTimeChange}
                    trackStyle={[{ backgroundColor: "#2563eb", height: 6 }]}
                    handleStyle={[
                      { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                      { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                    ]}
                    railStyle={{ backgroundColor: "#e5e7eb", height: 6 }}
                  />
                  <div className="mt-2 text-sm text-slate-700">
                    {hh(depTimeRange[0])} – {hh(depTimeRange[1])}
                  </div>
                </div>
              </Section>

              {returnFlights?.length > 0 && (
                <Section title="Departure time (return)">
                  <div className="px-1">
                    <Slider
                      range
                      min={0}
                      max={24}
                      marks={timeMarks}
                      step={1}
                      value={retTimeRange}
                      onChange={onRetTimeChange}
                      trackStyle={[{ backgroundColor: "#2563eb", height: 6 }]}
                      handleStyle={[
                        { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                        { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                      ]}
                      railStyle={{ backgroundColor: "#e5e7eb", height: 6 }}
                    />
                    <div className="mt-2 text-sm text-slate-700">
                      {hh(retTimeRange[0])} – {hh(retTimeRange[1])}
                    </div>
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
                    className="h-10 w-24 rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-sm text-slate-600">hours</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  From first departure to final arrival (round-trip sums both legs).
                </p>
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
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Search airline name or code…"
                    value={airlineSearchOW}
                    onChange={(e) => setAirlineSearchOW(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                      className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                      onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(true)}
                    >
                      Select visible
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                      onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(false)}
                    >
                      Clear visible
                    </button>
                  </div>
                </div>

                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
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
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Search airline name or code…"
                      value={airlineSearchRT}
                      onChange={(e) => setAirlineSearchRT(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                        className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                        onClick={() => bulkToggle("return", filteredReturnAirlines)(true)}
                      >
                        Select visible
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                        onClick={() => bulkToggle("return", filteredReturnAirlines)(false)}
                      >
                        Clear visible
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
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
            </div>

            {/* Sticky footer actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleClear}
              >
                Clear all
              </button>
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                onClick={onClose}
              >
                Apply filters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
