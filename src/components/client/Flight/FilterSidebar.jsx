import React, { useMemo, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

/* ---------------- Helpers ---------------- */
const hh = (n) => `${String(n).padStart(2, "0")}:00`;

/** Vintage time buckets (you can tweak ranges) */
const TIME_BUCKETS = [
  { key: "early", label: "Early", sub: "00–06", range: [0, 6] },
  { key: "morning", label: "Morning", sub: "06–12", range: [6, 12] },
  { key: "afternoon", label: "Afternoon", sub: "12–18", range: [12, 18] },
  { key: "evening", label: "Evening", sub: "18–24", range: [18, 24] },
  { key: "custom", label: "Custom", sub: "Pick hours", range: null },
];

/* ---------- Section (collapsible) ---------- */
const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className={[
        "overflow-hidden rounded-[10px]",
        "bg-[#f9f5ec] shadow-sm",
        "border border-[#d6c9a5]",
      ].join(" ")}
      style={{
        boxShadow:
          "0 1px 0 rgba(70,50,35,.05), inset 0 1px 0 rgba(255,255,255,.6)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 lg:px-4 lg:py-3.5 text-left"
        aria-expanded={open}
      >
        <span
          className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[.06em] text-[#3a2f2a]"
          style={{ fontVariant: "small-caps" }}
        >
          {title}
        </span>
        <span
          className={[
            "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md",
            "border border-[#d6c9a5] bg-[#f3e9d6]",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3a2f2a"
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
        "flex items-center gap-3 rounded-md px-2.5 py-2",
        "transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-[#f1e7d4]",
      ].join(" ")}
      title={disabled ? "No results for this airline with current filters" : name}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#c9b990] text-[#7a583d] focus:ring-[#a17653]"
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
        <div className="truncate text-[13px] text-[#2f2621]">{name}</div>
        <div className="truncate text-[11px] text-[#6b5a51]">{code}</div>
      </div>
      {typeof count === "number" && (
        <span
          className={[
            "ml-2 shrink-0 inline-flex items-center justify-center rounded-full border px-2 py-[1px] text-[11px]",
            count > 0
              ? "border-[#c9b990] text-[#3a2f2a] bg-[#f4ead7]"
              : "border-[#d8ccb0] text-[#9b8e7f] bg-[#f6efe2]",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </label>
  );
};

/* ---------- Cabin cards (vintage) ---------- */
const CABIN_OPTIONS = [
  { key: "ECONOMY", label: "Economy", sub: "Standard seats", icon: "✈️" },
  { key: "PREMIUM_ECONOMY", label: "Premium", sub: "Extra legroom", icon: "🧳" },
  { key: "BUSINESS", label: "Business", sub: "Lie-flat options", icon: "🛏" },
  { key: "FIRST", label: "First", sub: "Top perks", icon: "⭐" },
];

const CabinCard = ({ active, label, sub, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "group flex w-full items-center gap-3 rounded-md border p-3 text-left transition",
      "border-[#d6c9a5] bg-[#fffdf7] hover:bg-[#f6efe2]",
      active ? "outline outline-2 outline-[#a17653]" : "",
    ].join(" ")}
    aria-pressed={active}
    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)" }}
  >
    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#efe3cd] text-[15px]">
      {icon}
    </span>
    <div className="min-w-0">
      <div className="truncate text-[13px] font-semibold text-[#2d241f]">{label}</div>
      <div className="truncate text-[11px] text-[#7a6a60]">{sub}</div>
    </div>
    <div className="ml-auto">
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs",
          active ? "border-[#7a583d] bg-[#7a583d] text-white" : "border-[#c9b990] text-transparent",
        ].join(" ")}
      >
        ✓
      </span>
    </div>
  </button>
);

/* ---------- Vintage chips for stops ---------- */
const VintageChip = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "rounded-full px-3 py-1.5 text-[12px] tracking-wide border",
      active
        ? "border-[#7a583d] bg-[#efe3cd] text-[#3a2f2a]"
        : "border-[#d6c9a5] bg-[#fffdf7] text-[#5e4e45] hover:bg-[#f6efe2]",
    ].join(" ")}
    style={{ fontVariant: "small-caps" }}
  >
    {children}
  </button>
);

/* ---------- Time bucket selector (no sliders) ---------- */
function TimeWindow({
  title,
  value, // [startHour, endHour]
  onChange, // (range) => void
}) {
  const [mode, setMode] = useState(() => {
    const match = TIME_BUCKETS.find(
      (b) => b.range && b.range[0] === value[0] && b.range[1] === value[1]
    );
    return match ? match.key : "custom";
  });
  const [custom, setCustom] = useState(() => ({
    start: value[0],
    end: value[1],
  }));

  const hours = Array.from({ length: 25 }, (_, i) => i);

  const applyBucket = (key) => {
    setMode(key);
    const bucket = TIME_BUCKETS.find((b) => b.key === key);
    if (bucket?.range) {
      onChange(bucket.range);
    }
  };

  const applyCustom = (field, v) => {
    const next = { ...custom, [field]: v };
    // keep it sane
    if (next.end < next.start) next.end = next.start;
    if (next.start > next.end) next.start = next.end;
    setCustom(next);
    setMode("custom");
    onChange([next.start, next.end]);
  };

  return (
    <div className="space-y-3">
      <div
        className="text-[12px] font-semibold tracking-[.06em] text-[#3a2f2a]"
        style={{ fontVariant: "small-caps" }}
      >
        {title}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TIME_BUCKETS.map((b) => {
          const active =
            mode === b.key ||
            (b.range &&
              value[0] === b.range[0] &&
              value[1] === b.range[1] &&
              mode !== "custom");
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => applyBucket(b.key)}
              className={[
                "rounded-md border px-3 py-2 text-left",
                "border-[#d6c9a5]",
                active ? "bg-[#efe3cd]" : "bg-[#fffdf7] hover:bg-[#f6efe2]",
              ].join(" ")}
            >
              <div className="text-[12px] font-semibold text-[#2f2621]">{b.label}</div>
              <div className="text-[11px] text-[#7a6a60]">{b.sub}</div>
            </button>
          );
        })}
      </div>

      {mode === "custom" && (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[11px] text-[#6b5a51] mb-1"
              style={{ fontVariant: "small-caps" }}
            >
              From
            </label>
            <select
              value={custom.start}
              onChange={(e) => applyCustom("start", Number(e.target.value))}
              className="h-10 w-full rounded-md border border-[#d6c9a5] bg-[#fffdf7] px-2 text-[13px] text-[#2f2621] focus:outline-none focus:ring-2 focus:ring-[#c9b990]"
            >
              {hours.slice(0, 24).map((h) => (
                <option key={h} value={h}>
                  {hh(h)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-[11px] text-[#6b5a51] mb-1"
              style={{ fontVariant: "small-caps" }}
            >
              To
            </label>
            <select
              value={custom.end}
              onChange={(e) => applyCustom("end", Number(e.target.value))}
              className="h-10 w-full rounded-md border border-[#d6c9a5] bg-[#fffdf7] px-2 text-[13px] text-[#2f2621] focus:outline-none focus:ring-2 focus:ring-[#c9b990]"
            >
              {hours.slice(1).map((h) => (
                <option key={h} value={h}>
                  {hh(h)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="text-[12px] text-[#3a2f2a]">
        Selected: <span className="font-medium">{hh(value[0])} – {hh(value[1])}</span>
      </div>
    </div>
  );
}

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
        "w-full rounded-[14px]",
        "p-3 lg:p-4 xl:p-5",
        "space-y-3 lg:space-y-4",
        "bg-[#fbf7ee]",
        "border border-[#d6c9a5]",
      ].join(" ")}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,.03), rgba(0,0,0,.03) 1px, transparent 1px, transparent 3px)",
      }}
    >
      {/* Header (mobile) */}
      <div className="flex items-center justify-between mb-1 lg:mb-0 lg:hidden">
        <h2
          className="text-[15px] font-semibold text-[#2f2621] tracking-[.06em]"
          style={{ fontVariant: "small-caps" }}
        >
          Filters
        </h2>
        {onCloseMobile && (
          <button
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#c9b990] bg-[#fffdf7] px-3 text-[12px] hover:bg-[#f6efe2]"
            onClick={onCloseMobile}
          >
            Close
          </button>
        )}
      </div>

      {/* Cabin */}
      <Section title="Cabin class">
        <div className="grid grid-cols-1 gap-2.5">
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
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#6b5a51]">
          <button
            type="button"
            className="rounded-full border border-[#c9b990] bg-[#fffdf7] px-3 py-1 hover:bg-[#f6efe2]"
            onClick={onResetCabins}
            style={{ fontVariant: "small-caps" }}
          >
            Select all
          </button>
          {selectedCabins.length > 0 && (
            <span>Selected: {selectedCabins.length}</span>
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
            <VintageChip
              key={value}
              active={currentStop === value}
              onClick={() => handleStopChange(value)}
            >
              {label}
            </VintageChip>
          ))}
        </div>
      </Section>

      {/* Price (kept slider) */}
      <Section title={`Price (${"USD"})`} defaultOpen>
        <div className="px-0.5">
          <Slider
            range
            min={absMin}
            max={absMax}
            value={clamped}
            onChange={handlePriceChange}
            trackStyle={[{ height: 6, backgroundColor: "#a17653" }]}
            railStyle={{ height: 6, backgroundColor: "#e6dcc9" }}
            handleStyle={[
              { width: 18, height: 18, marginTop: -6, borderColor: "#a17653", backgroundColor: "#fffdf7" },
              { width: 18, height: 18, marginTop: -6, borderColor: "#a17653", backgroundColor: "#fffdf7" },
            ]}
          />
          <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[#3a2f2a]">
            <span className="truncate">${clamped[0]}</span>
            <span className="truncate">${clamped[1]}</span>
          </div>
        </div>
      </Section>

      {/* Time windows — OUTBOUND (no slider) */}
      <Section title="Departure time (outbound)" defaultOpen={false}>
        <TimeWindow
          title="Outbound window"
          value={depTimeRange}
          onChange={onDepTimeChange}
        />
      </Section>

      {/* Time windows — RETURN (no slider) */}
      {returnFlights?.length > 0 && (
        <Section title="Departure time (return)" defaultOpen={false}>
          <TimeWindow
            title="Return window"
            value={retTimeRange}
            onChange={onRetTimeChange}
          />
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
            className="h-10 w-28 rounded-md border border-[#d6c9a5] bg-[#fffdf7] px-3 text-[13px] text-[#2f2621] focus:outline-none focus:ring-2 focus:ring-[#c9b990]"
          />
          <span className="text-[12px] text-[#6b5a51]">hours</span>
        </div>
        <p className="mt-2 text-[11px] text-[#7a6a60]">
          From first departure to final arrival (round-trip sums both legs).
        </p>
      </Section>

      {/* Baggage */}
      <Section title="Baggage" defaultOpen={false}>
        <label className="inline-flex items-center gap-2 text-[13px] text-[#3a2f2a]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#c9b990] text-[#7a583d] focus:ring-[#a17653]"
            checked={!!baggageOnly}
            onChange={(e) => onBaggageOnlyChange(e.target.checked)}
          />
          <span>Show only fares with baggage included</span>
        </label>
      </Section>

      {/* Airlines — outbound */}
      <Section title="Airlines (outbound)" defaultOpen>
        <div className="mb-2 flex items-center justify-between gap-2">
          {/* If you want an old-paper input, uncomment: */}
          {/* <input
            type="text"
            placeholder="Find airline…"
            value={airlineSearchOW}
            onChange={(e) => setAirlineSearchOW(e.target.value)}
            className="h-9 w-full rounded-md border border-[#d6c9a5] bg-[#fffdf7] px-3 text-[13px] text-[#2f2621] placeholder-[#9b8e7f] focus:outline-none focus:ring-2 focus:ring-[#c9b990]"
          /> */}
          <div className="whitespace-nowrap text-[11px] flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-[#c9b990] bg-[#fffdf7] px-3 py-1 hover:bg-[#f6efe2]"
              onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(true)}
              style={{ fontVariant: "small-caps" }}
            >
              Select visible
            </button>
            <button
              type="button"
              className="rounded-full border border-[#c9b990] bg-[#fffdf7] px-3 py-1 hover:bg-[#f6efe2]"
              onClick={() => bulkToggle("oneway", filteredOnewayAirlines)(false)}
              style={{ fontVariant: "small-caps" }}
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
              placeholder="Find airline…"
              value={airlineSearchRT}
              onChange={(e) => setAirlineSearchRT(e.target.value)}
              className="h-9 w-full rounded-md border border-[#d6c9a5] bg-[#fffdf7] px-3 text-[13px] text-[#2f2621] placeholder-[#9b8e7f] focus:outline-none focus:ring-2 focus:ring-[#c9b990]"
            />
            <div className="whitespace-nowrap text-[11px] flex items-center gap-2">
              {airlineCountsReturn && (
                <label className="inline-flex items-center gap-1 text-[#6b5a51]">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-[#c9b990] text-[#7a583d] focus:ring-[#a17653]"
                    checked={hideZeroReturn}
                    onChange={(e) => setHideZeroReturn(e.target.checked)}
                  />
                  Hide 0
                </label>
              )}
              <button
                type="button"
                className="rounded-full border border-[#c9b990] bg-[#fffdf7] px-3 py-1 hover:bg-[#f6efe2]"
                onClick={() => bulkToggle("return", filteredReturnAirlines)(true)}
                style={{ fontVariant: "small-caps" }}
              >
                Select visible
              </button>
              <button
                type="button"
                className="rounded-full border border-[#c9b990] bg-[#fffdf7] px-3 py-1 hover:bg-[#f6efe2]"
                onClick={() => bulkToggle("return", filteredReturnAirlines)(false)}
                style={{ fontVariant: "small-caps" }}
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

      {/* Footer actions */}
      <div className="lg:pt-1">
        <div className="lg:static sticky bottom-2 left-0 right-0">
          <div className="flex items-center justify-between gap-3 bg-transparent">
            <button
              type="button"
              className="rounded-md border border-[#c9b990] bg-[#fffdf7] px-4 py-2 text-[12px] font-medium text-[#3a2f2a] hover:bg-[#f6efe2]"
              onClick={handleClear}
              style={{ fontVariant: "small-caps" }}
            >
              Clear all
            </button>
            {onCloseMobile && (
              <button
                type="button"
                className="rounded-md bg-[#7a583d] px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#694b33]"
                onClick={onCloseMobile}
                style={{ fontVariant: "small-caps" }}
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
