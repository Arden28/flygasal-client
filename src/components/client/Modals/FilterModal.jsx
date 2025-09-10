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

const AirlineRow = ({ code, checked, onChange, getAirlineName, getAirlineLogo }) => {
  const name = getAirlineName?.(code) || code;
  const logo = getAirlineLogo?.(code);

  return (
    <label className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        checked={checked}
        onChange={onChange}
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
      <div className="min-w-0">
        <div className="truncate text-sm text-slate-800">{name}</div>
        <div className="text-xs text-slate-500">{code}</div>
      </div>
    </label>
  );
};

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

  // Airlines
  uniqueAirlines,      // array of airline codes (e.g., ["AA","BA"])
  checkedOnewayValue,
  handleOnewayChange,
  checkedReturnValue,
  handleReturnChange,

  // New filters
  depTimeRange,
  onDepTimeChange,
  retTimeRange,
  onRetTimeChange,
  maxDurationHours,
  onMaxDurationChange,
  baggageOnly,
  onBaggageOnlyChange,

  // Context & helpers
  returnFlights,
  getAirlineName,      // <-- NEW (threaded from FlightPage)
  getAirlineLogo,      // <-- NEW (threaded from FlightPage)

  // Optional: global clear
  onClearAll,
}) => {
  const [absMin, absMax] = priceBounds || [100, 4000];
  const [currMin, currMax] = priceRange || [absMin, absMax];
  const clamped = [
    Math.max(absMin, Math.min(absMax, currMin)),
    Math.max(absMin, Math.min(absMax, currMax)),
  ];

  const [airlineSearchOW, setAirlineSearchOW] = useState("");
  const [airlineSearchRT, setAirlineSearchRT] = useState("");

  // Build airline meta list once for consistent sorting/search
  const airlineMeta = useMemo(() => {
    const toMeta = (code) => ({
      code,
      name: (getAirlineName?.(code) || code).trim(),
      logo: getAirlineLogo?.(code),
    });
    // dedupe + sort by name
    return [...new Set(uniqueAirlines || [])]
      .map(toMeta)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [uniqueAirlines, getAirlineName, getAirlineLogo]);

  const filteredOnewayAirlines = useMemo(() => {
    const q = airlineSearchOW.trim().toLowerCase();
    if (!q) return airlineMeta;
    return airlineMeta.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
  }, [airlineMeta, airlineSearchOW]);

  const filteredReturnAirlines = useMemo(() => {
    const q = airlineSearchRT.trim().toLowerCase();
    if (!q) return airlineMeta;
    return airlineMeta.filter(({ code, name }) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
  }, [airlineMeta, airlineSearchRT]);

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
    bulkToggle("oneway", airlineMeta)(false);
    bulkToggle("return", airlineMeta)(false);
  };

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
                <p className="mt-2 text-xs text-slate-500">From first departure to final arrival (round-trip sums both legs).</p>
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
                  <div className="whitespace-nowrap text-xs">
                    <button
                      type="button"
                      className="ml-2 rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                      onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(true)}
                    >
                      Select visible
                    </button>
                    <button
                      type="button"
                      className="ml-2 rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                      onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(false)}
                    >
                      Clear visible
                    </button>
                  </div>
                </div>

                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {filteredOnewayAirlines.map(({ code }) => (
                    <AirlineRow
                      key={`ow_${code}`}
                      code={code}
                      checked={checkedOnewayValue.includes(`oneway_${code}`)}
                      onChange={(e) => handleOnewayChange(e, code)}
                      getAirlineName={getAirlineName}
                      getAirlineLogo={getAirlineLogo}
                    />
                  ))}
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
                    <div className="whitespace-nowrap text-xs">
                      <button
                        type="button"
                        className="ml-2 rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                        onClick={() => bulkToggle("return", filteredReturnAirlines)(true)}
                      >
                        Select visible
                      </button>
                      <button
                        type="button"
                        className="ml-2 rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50"
                        onClick={() => bulkToggle("return", filteredReturnAirlines)(false)}
                      >
                        Clear visible
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {filteredReturnAirlines.map(({ code }) => (
                      <AirlineRow
                        key={`rt_${code}`}
                        code={code}
                        checked={checkedReturnValue.includes(`return_${code}`)}
                        onChange={(e) => handleReturnChange(e, code)}
                        getAirlineName={getAirlineName}
                        getAirlineLogo={getAirlineLogo}
                      />
                    ))}
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
