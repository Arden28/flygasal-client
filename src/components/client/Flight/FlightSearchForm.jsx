import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Select, { components as RS } from "react-select";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { airports, flights } from "../../../data/fakeData";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday, isValid } from "date-fns";

/* --------------------- portal + anchor rect helpers --------------------- */
function Portal({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? createPortal(children, document.body) : null;
}

/** Stable anchor rect: measures when enabled (no missing-deps warning) */
function useAnchorRect(ref, enabled) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;

    const update = () => {
      if (ref.current) setRect(ref.current.getBoundingClientRect());
    };

    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro && ref.current) ro.observe(ref.current);

    const onScroll = () => update();
    const onResize = () => update();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, ref]);

  return rect;
}

/* --------------------- utils --------------------- */
const MAX_TRAVELLERS = 9;
const DEFAULT_MENU_COUNT = 30;
const SEARCH_LIMIT = 120;

const today = startOfToday();
const safeParseDate = (value, fallback = today) => {
  const d = value ? new Date(value) : null;
  return d && isValid(d) ? d : fallback;
};
const clampToToday = (d) => (d < today ? today : d);

/** Canonicalize any cabin string to the API’s expected codes */
const toCabinCode = (raw) => {
  const s = String(raw || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (s.includes("PREMIUM") && s.includes("ECONOMY")) return "PREMIUM_ECONOMY";
  if (s.startsWith("BUSI")) return "BUSINESS";
  if (s.startsWith("FIR")) return "FIRST";
  return "Economy";
};

const CABIN_OPTIONS = [
  { value: "Economy", label: "ECONOMY" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];

const useMedia = (query) => {
  const get = () =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    try { mql.addEventListener("change", handler); } catch { mql.addListener(handler); }
    return () => {
      try { mql.removeEventListener("change", handler); } catch { mql.removeListener(handler); }
    };
  }, [query]);
  return matches;
};

const useAirportIndex = () =>
  useMemo(
    () =>
      airports.map((a) => ({
        ...a,
        _v: (a.value || "").toLowerCase(),
        _c: (a.city || "").toLowerCase(),
        _co: (a.country || "").toLowerCase(),
        _l: (a.label || "").toLowerCase(),
        _s: `${(a.value || "").toLowerCase()} ${(a.city || "").toLowerCase()} ${(a.country || "").toLowerCase()} ${(a.label || "").toLowerCase()}`,
      })),
    []
  );

function searchAirports(index, rawQuery, limit = SEARCH_LIMIT) {
  const q = (rawQuery || "").trim().toLowerCase();
  if (!q) return index.slice(0, DEFAULT_MENU_COUNT);
  const parts = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const a of index) {
    let ok = true;
    for (const p of parts) {
      if (!a._s.includes(p)) { ok = false; break; }
    }
    if (!ok) continue;
    let score = 0;
    if (a._v.startsWith(q)) score += 120;
    if (a._c.startsWith(q)) score += 80;
    if (a._l.startsWith(q)) score += 60;
    if (a._co.startsWith(q)) score += 30;
    if (a._s.includes(q)) score += 10;
    scored.push([score, a]);
  }
  scored.sort((x, y) => y[0] - x[0] || x[1].label.localeCompare(y[1].label, "en"));
  return scored.slice(0, limit).map((t) => t[1]);
}

/* --------------------- small UI bits --------------------- */
const IATAPill = ({ code }) => (
  <span className="ml-auto inline-flex items-center rounded-full border border-slate-300 px-2 py-[2px] text-[11px] font-medium text-slate-700">
    {code}
  </span>
);

/** One-line SingleValue so input text sits on the same level as the value */
const AirportSingleValue = (props) => {
  const a = props.data;
  return (
    <RS.SingleValue {...props}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="truncate text-[14px] font-medium text-slate-900">{a.label}</div>
        <IATAPill code={a.value} />
      </div>
    </RS.SingleValue>
  );
};

const AirportOption = (props) => {
  const a = props.data;
  return (
    <RS.Option {...props} className="!p-0">
      <div className={`flex items-center gap-3 px-3 py-2.5 ${props.isFocused ? "bg-slate-50" : "bg-white"}`}>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-slate-900">{a.label}</div>
          <div className="truncate text-xs text-slate-500">
            {a.city ? `${a.city}, ${a.country}` : a.country}
          </div>
        </div>
        <IATAPill code={a.value} />
      </div>
    </RS.Option>
  );
};

/* ===================== Component ===================== */
export default function FlightSearchInlineBar({
  searchParams,
  setAvailableFlights,
  setReturnFlights,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMedia("(max-width: 640px)");
  const AIRPORT_INDEX = useAirportIndex();

  // anchors for popovers (one-way / return keep the original anchored UX)
  const travellersBtnRef = useRef(null);
  const departBtnRef = useRef(null);
  const returnBtnRef = useRef(null);

  // which calendar is open (type + index for multi)
  const [openCal, setOpenCal] = useState(null); // { type: 'depart'|'return', idx: number } | null

  // measure only when that popover is open (so ref.current exists)
  const travellersRect = useAnchorRect(travellersBtnRef, true);
  const departRect = useAnchorRect(departBtnRef, openCal?.type === "depart" && (openCal?.idx ?? 0) === 0);
  const returnRect = useAnchorRect(returnBtnRef, openCal?.type === "return" && (openCal?.idx ?? 0) === 0);

  const [airportMenus, setAirportMenus] = useState({});
  const menuKey = (idx, field) => `${idx}:${field}`;
  const defaultChunk = useMemo(() => AIRPORT_INDEX.slice(0, DEFAULT_MENU_COUNT), [AIRPORT_INDEX]);
  const ensureMenu = (key) => airportMenus[key] ?? { input: "", options: defaultChunk };
  const setMenu = (key, data) => setAirportMenus((prev) => ({ ...prev, [key]: data }));
  const handleMenuOpen = (idx, field) => setMenu(menuKey(idx, field), { input: "", options: defaultChunk });
  const handleInputChange =
    (idx, field) =>
    (inputValue, meta) => {
      if (meta?.action === "menu-close") return inputValue;
      const key = menuKey(idx, field);
      const results = searchAirports(AIRPORT_INDEX, inputValue, SEARCH_LIMIT);
      setMenu(key, { input: inputValue, options: results });
      return inputValue;
    };

  const [tripType, setTripType] = useState("oneway"); // 'oneway' | 'return' | 'multi'
  const [flightType, setFlightType] = useState("ECONOMY");
  const [flightsState, setFlightsState] = useState([
    {
      origin: null,
      destination: null,
      dateRange: { startDate: today, endDate: addDays(today, 5), key: "selection" },
    },
  ]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTravellersOpen, setIsTravellersOpen] = useState(false);

  const [errors, setErrors] = useState([]);

  /* -------- hydrate from URL or props -------- */
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    let params = searchParams;
    if (!params) {
      const flightsFromUrl = [];
      let i = 0;
      while (queryParams.has(`flights[${i}][origin]`)) {
        flightsFromUrl.push({
          origin: queryParams.get(`flights[${i}][origin]`),
          destination: queryParams.get(`flights[${i}][destination]`),
          depart: queryParams.get(`flights[${i}][depart]`),
        });
        i++;
      }
      const raw = (queryParams.get("tripType") || "oneway").toLowerCase();
      const normTrip = raw === "return" ? "return" : raw === "multi" ? "multi" : "oneway";
      params = {
        tripType: normTrip,
        flightType: toCabinCode(queryParams.get("flightType") || "Economy"),
        flights: flightsFromUrl.length
          ? flightsFromUrl
          : [{ origin: "JFK", destination: "LAX", depart: format(today, "yyyy-MM-dd") }],
        returnDate: queryParams.get("returnDate") || format(addDays(today, 5), "yyyy-MM-dd"),
        adults: parseInt(queryParams.get("adults")) || 1,
        children: parseInt(queryParams.get("children")) || 0,
        infants: parseInt(queryParams.get("infants")) || 0,
      };
    }
    setTripType(params.tripType);
    setFlightType(toCabinCode(params.flightType || "ECONOMY"));

    const normSegments = params.flights.map((f, i) => {
      let start = clampToToday(safeParseDate(f.depart));
      let end =
        params.tripType === "return" && i === 0
          ? clampToToday(safeParseDate(params.returnDate, addDays(start, 5)))
          : start;
      if (end < start) end = start;
      const originObj = airports.find((a) => a.value === f.origin) || null;
      const destObj = airports.find((a) => a.value === f.destination) || null;
      const oKey = menuKey(i, "origin");
      const dKey = menuKey(i, "destination");
      setMenu(oKey, ensureMenu(oKey));
      setMenu(dKey, ensureMenu(dKey));
      return { origin: originObj, destination: destObj, dateRange: { startDate: start, endDate: end, key: "selection" } };
    });
    setFlightsState(normSegments.length ? normSegments : [{
      origin: null, destination: null, dateRange: { startDate: today, endDate: today, key: "selection" }
    }]);
    setAdults(params.adults || 1);
    setChildren(params.children || 0);
    setInfants(params.infants || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.search]);

  useEffect(() => {
    setOpenCal(null);
    if (tripType === "oneway") {
      // force single leg; endDate mirrors startDate
      setFlightsState((prev) => {
        const first = { ...(prev[0] || {
          origin: null, destination: null, dateRange: { startDate: today, endDate: today, key: "selection" }
        }) };
        first.dateRange = { ...first.dateRange, endDate: first.dateRange.startDate };
        return [first];
      });
    } else if (tripType === "return") {
      // force single leg; keep endDate separate
      setFlightsState((prev) => {
        const first = { ...(prev[0] || {
          origin: null, destination: null, dateRange: { startDate: today, endDate: addDays(today, 5), key: "selection" }
        }) };
        if ((first.dateRange.endDate || first.dateRange.startDate) < first.dateRange.startDate) {
          first.dateRange.endDate = first.dateRange.startDate;
        }
        return [first];
      });
    } else if (tripType === "multi") {
      // ensure at least 2 legs; each leg one-way (end = start)
      setFlightsState((prev) => {
        const norm = (prev.length ? prev : [
          { origin: null, destination: null, dateRange: { startDate: today, endDate: today, key: "selection" } },
          { origin: null, destination: null, dateRange: { startDate: addDays(today, 1), endDate: addDays(today, 1), key: "selection" } },
        ]).map((f) => ({
          ...f,
          dateRange: { ...f.dateRange, endDate: f.dateRange.startDate || today },
        }));
        return norm;
      });
    }
  }, [tripType]);

  const travellerSummary = useMemo(() => {
    const p = [];
    if (adults > 0) p.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
    if (children > 0) p.push(`${children} Child${children > 1 ? "ren" : ""}`);
    if (infants > 0) p.push(`${infants} Infant${infants > 1 ? "s" : ""}`);
    return p.join(", ") || "1 Adult";
  }, [adults, children, infants]);

  const totalTravellers = adults + children + infants;
  const setWithClamp = (setter, val, min, max) => setter(Math.max(min, Math.min(max, val)));

  const handleFlightChange = (idx, field, value) =>
    setFlightsState((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));

  const handleDepartPick = (idx, date) => {
    const start = clampToToday(Array.isArray(date) ? date[0] : date);
    setFlightsState((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const end = tripType === "return" && idx === 0 ? (f.dateRange.endDate < start ? start : f.dateRange.endDate) : start;
        return { ...f, dateRange: { ...f.dateRange, startDate: start, endDate: end } };
      })
    );
    if (isMobile) setOpenCal(null);
  };

  const handleReturnPick = (idx, date) => {
    const d = clampToToday(Array.isArray(date) ? date[0] : date);
    setFlightsState((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const start = f.dateRange.startDate || today;
        const end = d < start ? start : d;
        return { ...f, dateRange: { ...f.dateRange, endDate: end } };
      })
    );
    if (isMobile) setOpenCal(null);
  };

  const swapPlaces = (idx) =>
    setFlightsState((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, origin: f.destination, destination: f.origin } : f))
    );

  // Multi helpers
  const addLeg = () => {
    setFlightsState((prev) => {
      const last = prev[prev.length - 1];
      const nextStart = addDays(last?.dateRange?.startDate || today, 1);
      return [
        ...prev,
        {
          origin: last?.destination || null,
          destination: null,
          dateRange: { startDate: nextStart, endDate: nextStart, key: "selection" },
        },
      ];
    });
  };
  const removeLeg = (idx) => {
    setFlightsState((prev) => {
      if (prev.length <= 1) return prev;
      const copy = prev.slice();
      copy.splice(idx, 1);
      return copy;
    });
    setOpenCal((oc) => (oc && oc.idx === idx ? null : oc));
  };

  const validateForm = () => {
    const errs = [];
    flightsState.forEach((f, i) => {
      if (!f.origin) errs.push(`Flight ${i + 1}: Please select a departure city`);
      if (!f.destination) errs.push(`Flight ${i + 1}: Please select a destination city`);
      if (f.origin && f.destination && f.origin.value === f.destination.value)
        errs.push(`Flight ${i + 1}: Departure and destination cannot be the same`);
      if (!f.dateRange.startDate) errs.push(`Flight ${i + 1}: Please select a departure date`);
      if (tripType === "return" && i === 0) {
        if (!f.dateRange.endDate) errs.push(`Flight 1: Please select a return date`);
        if (f.dateRange.endDate < f.dateRange.startDate) errs.push(`Flight 1: Return date must be after departure date`);
      }
    });
    if (tripType === "multi" && flightsState.length < 2) errs.push("Please add at least 2 flights for Multi-city");
    if (totalTravellers === 0) errs.push("At least one traveller is required");
    if (infants > adults) errs.push("Number of infants cannot exceed number of adults");
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validateForm();
    if (v.length) { setErrors(v); return; }
    setErrors([]);
    setIsLoading(true);

    const cabinCode = toCabinCode(flightType);
    const queryParams = new URLSearchParams();
    queryParams.set("tripType", tripType);
    queryParams.set("flightType", cabinCode);

    flightsState.forEach((f, idx) => {
      queryParams.set(`flights[${idx}][origin]`, f.origin?.value || "");
      queryParams.set(`flights[${idx}][destination]`, f.destination?.value || "");
      queryParams.set(`flights[${idx}][depart]`, f.dateRange.startDate ? format(f.dateRange.startDate, "yyyy-MM-dd") : "");
    });

    if (tripType === "return" && flightsState[0]?.dateRange.endDate) {
      queryParams.set("returnDate", format(flightsState[0].dateRange.endDate, "yyyy-MM-dd"));
    }

    queryParams.set("adults", String(adults));
    queryParams.set("children", String(children));
    queryParams.set("infants", String(infants));

    // Optional local fake data prefill (kept as-is)
    const outbound = flights.filter((fl) =>
      flightsState.some(
        (f) =>
          f.origin?.value === fl.origin &&
          f.destination?.value === fl.destination &&
          new Date(f.dateRange.startDate).toDateString() === new Date(fl.departureTime).toDateString()
      )
    );

    let rtn = [];
    if (tripType === "return" && flightsState[0]) {
      rtn = flights.filter(
        (fl) =>
          fl.origin === flightsState[0].destination?.value &&
          fl.destination === flightsState[0].origin?.value &&
          new Date(flightsState[0].dateRange.endDate).toDateString() === new Date(fl.departureTime).toDateString()
      );
    }

    setAvailableFlights(outbound);
    setReturnFlights(rtn);

    setTimeout(() => {
      setIsLoading(false);
      navigate(`/flight/availability?${queryParams.toString()}`);
    }, 350);
  };

  /* —— STYLE TWEAKS —— */
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      position: "relative",
      zIndex: 100000,
      borderRadius: 12,
      minHeight: 54,
      borderColor: state.isFocused ? "#94a3b8" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(148,163,184,.25)" : "none",
      paddingLeft: 12,
      paddingRight: 10,
      backgroundColor: "#fff",
      color: "#0f172a",
      ":hover": { borderColor: "#94a3b8" },
    }),
    singleValue: (b) => ({ ...b, color: "#0f172a" }),
    input: (b) => ({ ...b, color: "#0f172a", margin: 0, padding: 0 }),
    placeholder: (b) => ({ ...b, color: "#64748b" }),
    valueContainer: (b) => ({ ...b, padding: 0 }),
    indicatorsContainer: (b) => ({ ...b, gap: 6, paddingRight: 6 }),
    dropdownIndicator: (b) => ({ ...b, padding: 8 }),
    clearIndicator: (b) => ({ ...b, padding: 8 }),
    menu: (b) => ({
      ...b,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 18px 40px rgba(2,6,23,.18)",
      zIndex: 10000,
      maxWidth: "min(96vw, 560px)",
    }),
    menuPortal: (b) => ({ ...b, zIndex: 10000 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f8fafc" : "#ffffff",
      color: "#0f172a",
      padding: 0,
    }),
  };

  const menuOptions = (idx, field) => ensureMenu(menuKey(idx, field)).options;
  const noOptionsMessage = ({ inputValue }) =>
    inputValue && inputValue.length > 1 ? "No airports match your search" : "Type to search airports";

  // compact calendar visuals
  const datePickerStyles = `
    .rdrCalendarWrapper{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:.2rem}
    .rdrMonth{padding:0}
    .rdrMonths{gap:.25rem}
    .rdrMonthAndYearWrapper{padding:.35rem .5rem;border-bottom:1px solid #e5e7eb}
    .rdrWeekDays{margin:0 .25rem}
    .rdrDays{margin:.15rem .25rem}
    .rdrDay{font-size:.9rem;color:#0f172a}
    .rdrDayNumber{margin:0}
    .rdrSelected,.rdrStartEdge,.rdrEndEdge{background:#0284c7!important;color:#fff!important}
    .rdrInRange{background:#bae6fd!important}
    .rdrDayToday .rdrDayNumber span:after{background:#0284c7}
  `;

  // labels for first leg (one-way / return view)
  const departLabel0 = flightsState[0]?.dateRange?.startDate
    ? format(flightsState[0].dateRange.startDate, "EEE d MMM")
    : "Select date";
  const returnLabel0 = flightsState[0]?.dateRange?.endDate
    ? format(flightsState[0].dateRange.endDate, "EEE d MMM")
    : "Select date";

  // ---- UI renderers ----
  const LegRow = ({ idx }) => {
    const leg = flightsState[idx];

    // own ref + rect so the calendar anchors NEXT TO the clicked input
    const legDepartBtnRef = useRef(null);
    const legDepartRect = useAnchorRect(legDepartBtnRef, openCal?.type === "depart" && openCal.idx === idx);

    const dateLabel = leg?.dateRange?.startDate ? format(leg.dateRange.startDate, "EEE d MMM") : "Select date";
    return (
      <div className="grid gap-2 md:grid-cols-[1.2fr_auto_1.2fr_auto_auto] lg:grid-cols-[1.2fr_auto_1.2fr_auto_auto_auto] lg:items-center mb-2">
        {/* From */}
        <div className="z-[200] bg-white">
          <Select
            name="origin"
            classNamePrefix="react-select"
            options={menuOptions(idx, "origin")}
            value={leg.origin}
            onChange={(v) => handleFlightChange(idx, "origin", v)}
            onMenuOpen={() => handleMenuOpen(idx, "origin")}
            onInputChange={handleInputChange(idx, "origin")}
            components={{ Option: AirportOption, SingleValue: AirportSingleValue }}
            styles={selectStyles}
            placeholder="City or airport"
            isSearchable
            filterOption={null}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            maxMenuHeight={384}
            menuPlacement="auto"
            getOptionValue={(opt) => opt.value}
            noOptionsMessage={noOptionsMessage}
          />
        </div>

        {/* Swap */}
        <div className="flex items-center justify-center md:-mx-5" style={{ zIndex: 100000 }}>
          <button
            type="button"
            onClick={() => swapPlaces(idx)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            aria-label="Swap origin and destination"
            title="Swap"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transform rotate-90 xs:rotate-0 transition-transform">
              <path d="M3 7h13l-4-4" />
              <path d="M21 17H8l4 4" />
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="relative z-[200] bg-white">
          <Select
            name="destination"
            classNamePrefix="react-select"
            options={menuOptions(idx, "destination")}
            value={leg.destination}
            onChange={(v) => handleFlightChange(idx, "destination", v)}
            onMenuOpen={() => handleMenuOpen(idx, "destination")}
            onInputChange={handleInputChange(idx, "destination")}
            components={{ Option: AirportOption, SingleValue: AirportSingleValue }}
            styles={selectStyles}
            placeholder="City or airport"
            isSearchable
            filterOption={null}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            maxMenuHeight={384}
            menuPlacement="auto"
            getOptionValue={(opt) => opt.value}
            noOptionsMessage={noOptionsMessage}
          />
        </div>

        {/* Date (one per leg) */}
        <div className="relative">
          <button
            ref={legDepartBtnRef}
            type="button"
            onClick={() =>
              setOpenCal((oc) =>
                oc && oc.type === "depart" && oc.idx === idx ? null : { type: "depart", idx }
              )
            }
            className="flex h-[58px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm hover:border-slate-400 focus:border-slate-400 focus:outline-none text-slate-800"
            aria-expanded={openCal?.type === "depart" && openCal.idx === idx}
          >
            <div className="min-w-0 truncate">
              <div className="text-[11px] tracking-wide text-slate-500">Departure</div>
              <div className="truncate text-slate-800">{dateLabel}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Anchored calendar via Portal so it opens next to THIS input */}
          <AnimatePresence>
            {openCal?.type === "depart" && openCal.idx === idx && legDepartRect && (
              <Portal>
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "fixed",
                    top: legDepartRect.bottom + 8,
                    left: Math.max(16, Math.min(legDepartRect.left, window.innerWidth - 16 - 320)),
                    width: 320,
                    zIndex: 100000,
                  }}
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="px-2 pt-1 pb-2 text-xs font-medium text-slate-600">
                      Departure (Leg {idx + 1})
                    </div>
                    <Calendar
                      date={leg.dateRange.startDate}
                      onChange={(d) => handleDepartPick(idx, d)}
                      minDate={today}
                      months={1}
                      showMonthAndYearPickers
                    />
                    <div className="p-2 pt-0 flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-black"
                        onClick={() => setOpenCal(null)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Portal>
            )}
          </AnimatePresence>
        </div>

        {/* Remove leg (only for multi & more than 1) */}
        {tripType === "multi" && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => removeLeg(idx)}
              disabled={flightsState.length <= 1}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              title="Remove leg"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full">
      <style>{datePickerStyles}</style>

      {!!errors.length && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((e, i) => (<li key={i}>{e}</li>))}
          </ul>
        </div>
      )}

      <div className="relative">
        {/* Top controls */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${tripType === "oneway" ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-50"}`}
              onClick={() => setTripType("oneway")}
              aria-pressed={tripType === "oneway"}
            >
              One way
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${tripType === "return" ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-50"}`}
              onClick={() => setTripType("return")}
              aria-pressed={tripType === "return"}
            >
              Return
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${tripType === "multi" ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-50"}`}
              onClick={() => setTripType("multi")}
              aria-pressed={tripType === "multi"}
            >
              Multi-city
            </button>
          </div>

          {/* Travellers trigger */}
          <div className="relative text-black">
            <button
              ref={travellersBtnRef}
              type="button"
              onClick={() => setIsTravellersOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200"
              aria-expanded={isTravellersOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-slate-800">{travellerSummary}</span>
            </button>

            {/* Travellers popover */}
            <AnimatePresence>
              {isTravellersOpen &&
                (isMobile ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] flex flex-col bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 p-3">
                      <div className="text-sm font-medium text-slate-800">Travellers & cabin</div>
                      <span className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 cursor-pointer" onClick={() => setIsTravellersOpen(false)}>Close</span>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      {[
                        { key: "Adults", sub: "+12 years", value: adults, set: setAdults, min: 1 },
                        { key: "Children", sub: "2–11 years", value: children, set: setChildren, min: 0 },
                        { key: "Infants", sub: "0–2 years", value: infants, set: setInfants, min: 0 },
                      ].map((row) => (
                        <div key={row.key} className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-800">{row.key}</div>
                            <div className="text-xs text-slate-500">{row.sub}</div>
                          </div>
                          <div className="inline-flex items-center gap-3">
                            <button type="button" className="h-10 w-10 rounded-full border border-slate-300 text-slate-800" onClick={() => setWithClamp(row.set, row.value - 1, row.min, MAX_TRAVELLERS)}>–</button>
                            <span className="w-8 text-center text-sm text-slate-800">{row.value}</span>
                            <button type="button" className="h-10 w-10 rounded-full border border-slate-300 text-slate-800" onClick={() => setWithClamp(row.set, row.value + 1, row.min, MAX_TRAVELLERS)}>+</button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2">
                        <label htmlFor="flight_type" className="mb-1 block text-sm text-slate-700">Cabin class</label>
                        <select
                          id="flight_type"
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                          value={flightType}
                          onChange={(e) => setFlightType(toCabinCode(e.target.value))}
                        >
                          {CABIN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 p-3">
                      <span className="w-full cursor-pointer rounded-lg bg-slate-900 py-2 text-sm text-white" onClick={() => setIsTravellersOpen(false)}>Done</span>
                    </div>
                  </motion.div>
                ) : (
                  travellersRect && (
                    <Portal>
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                        style={{ position: "fixed", top: travellersRect.bottom + 8, left: Math.min(travellersRect.left, Math.max(16, window.innerWidth - 352 - 16)), width: "min(96vw, 22rem)", zIndex: 100000 }}
                      >
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                          {[
                            { key: "Adults", sub: "+12 years", value: adults, set: setAdults, min: 1 },
                            { key: "Children", sub: "2–11 years", value: children, set: setChildren, min: 0 },
                            { key: "Infants", sub: "0–2 years", value: infants, set: setInfants, min: 0 },
                          ].map((row) => (
                            <div key={row.key} className="mb-3 flex items-center justify-between last:mb-0">
                              <div>
                                <div className="font-medium text-slate-800">{row.key}</div>
                                <div className="text-xs text-slate-500">{row.sub}</div>
                              </div>
                              <div className="inline-flex items-center gap-2">
                                <button type="button" className="h-8 w-8 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800" onClick={() => setWithClamp(row.set, row.value - 1, row.min, MAX_TRAVELLERS)}>–</button>
                                <span className="w-8 text-center text-sm text-slate-800">{row.value}</span>
                                <button type="button" className="h-8 w-8 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800" onClick={() => setWithClamp(row.set, row.value + 1, row.min, MAX_TRAVELLERS)}>+</button>
                              </div>
                            </div>
                          ))}
                          <div className="mt-2 mb-2">
                            <label htmlFor="flight_type" className="sr-only">Cabin class</label>
                            <select id="flight_type" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200" value={flightType} onChange={(e) => setFlightType(toCabinCode(e.target.value))}>
                              {CABIN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                            </select>
                          </div>
                          <span className="mt-3 w-full inline-block cursor-pointer text-center rounded-lg bg-slate-900 px-6 py-2 text-sm text-white hover:bg-black" onClick={() => setIsTravellersOpen(false)}>Done</span>
                        </div>
                      </motion.div>
                    </Portal>
                  )
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* === Main rows === */}
        {tripType !== "multi" ? (
          <>
            <div className="grid gap-2 lg:grid-cols-[1.2fr_auto1.2fr_auto_auto_auto] lg:items-center md:grid-cols-[1.2fr_auto_1.2fr_auto_auto_auto]">
              {/* From */}
              <div className="z-[200] bg-white">
                <Select
                  name="origin"
                  classNamePrefix="react-select"
                  options={menuOptions(0, "origin")}
                  value={flightsState[0]?.origin || null}
                  onChange={(v) => handleFlightChange(0, "origin", v)}
                  onMenuOpen={() => handleMenuOpen(0, "origin")}
                  onInputChange={handleInputChange(0, "origin")}
                  components={{ Option: AirportOption, SingleValue: AirportSingleValue }}
                  styles={selectStyles}
                  placeholder="City or airport"
                  isSearchable
                  filterOption={null}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  maxMenuHeight={384}
                  menuPlacement="auto"
                  getOptionValue={(opt) => opt.value}
                  noOptionsMessage={noOptionsMessage}
                />
              </div>

              {/* Swap */}
              <div className="flex items-center justify-center md:-mx-5" style={{ zIndex: 100000 }}>
                <button
                  type="button"
                  onClick={() => swapPlaces(0)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  aria-label="Swap origin and destination"
                  title="Swap"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transform rotate-90 xs:rotate-0 transition-transform">
                    <path d="M3 7h13l-4-4" />
                    <path d="M21 17H8l4 4" />
                  </svg>
                </button>
              </div>

              {/* To */}
              <div className="relative z-[200] bg-white">
                <Select
                  name="destination"
                  classNamePrefix="react-select"
                  options={menuOptions(0, "destination")}
                  value={flightsState[0]?.destination || null}
                  onChange={(v) => handleFlightChange(0, "destination", v)}
                  onMenuOpen={() => handleMenuOpen(0, "destination")}
                  onInputChange={handleInputChange(0, "destination")}
                  components={{ Option: AirportOption, SingleValue: AirportSingleValue }}
                  styles={selectStyles}
                  placeholder="City or airport"
                  isSearchable
                  filterOption={null}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  maxMenuHeight={384}
                  menuPlacement="auto"
                  getOptionValue={(opt) => opt.value}
                  noOptionsMessage={noOptionsMessage}
                />
              </div>

              {/* Departure input */}
              <div className="relative">
                <button
                  ref={departBtnRef}
                  type="button"
                  onClick={() => setOpenCal(openCal && openCal.type === "depart" ? null : { type: "depart", idx: 0 })}
                  className="flex h-[58px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm hover:border-slate-400 focus:border-slate-400 focus:outline-none text-slate-800"
                  aria-expanded={openCal?.type === "depart"}
                >
                  <div className="min-w-0 truncate">
                    <div className="text-[11px] tracking-wide text-slate-500">Departure</div>
                    <div className="truncate text-slate-800">{departLabel0}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Departure calendar */}
                <AnimatePresence>
                  {openCal?.type === "depart" &&
                    (isMobile ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] flex flex-col bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 p-3">
                          <div className="text-sm font-medium text-slate-800">Select departure</div>
                          <span className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800" onClick={() => setOpenCal(null)}>Close</span>
                        </div>
                        <div className="flex-1 overflow-auto p-3">
                          <Calendar
                            date={flightsState[0]?.dateRange?.startDate}
                            onChange={(d) => handleDepartPick(0, d)}
                            minDate={today}
                            months={1}
                            showMonthAndYearPickers
                          />
                        </div>
                      </motion.div>
                    ) : (
                      departRect && (
                        <Portal>
                          <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                            style={{
                              position: "fixed",
                              top: departRect.bottom + 8,
                              left: Math.max(16, Math.min(departRect.left, window.innerWidth - 16 - 320)),
                              width: 320,
                              zIndex: 100000,
                            }}
                          >
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
                              <div className="px-2 pt-1 pb-1 text-xs font-medium text-slate-600">Departure</div>
                              <Calendar
                                date={flightsState[0]?.dateRange?.startDate}
                                onChange={(d) => handleDepartPick(0, d)}
                                minDate={today}
                                months={1}
                                showMonthAndYearPickers
                              />
                              <div className="p-2 pt-1 flex justify-end">
                                <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-black" onClick={() => setOpenCal(null)}>
                                  Done
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </Portal>
                      )
                    ))}
                </AnimatePresence>
              </div>

              {/* Return input (only if return trip) */}
              {tripType === "return" && (
                <div className="relative">
                  <button
                    ref={returnBtnRef}
                    type="button"
                    onClick={() => setOpenCal(openCal && openCal.type === "return" ? null : { type: "return", idx: 0 })}
                    className="flex h-[58px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm hover:border-slate-400 focus:border-slate-400 focus:outline-none text-slate-800"
                    aria-expanded={openCal?.type === "return"}
                  >
                    <div className="min-w-0 truncate">
                      <div className="text-[11px] tracking-wide text-slate-500">Return</div>
                      <div className="truncate text-slate-800">{returnLabel0}</div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Return calendar */}
                  <AnimatePresence>
                    {openCal?.type === "return" &&
                      (isMobile ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] flex flex-col bg-white">
                          <div className="flex items-center justify-between border-b border-slate-200 p-3">
                            <div className="text-sm font-medium text-slate-800">Select return</div>
                            <span className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800" onClick={() => setOpenCal(null)}>Close</span>
                          </div>
                          <div className="flex-1 overflow-auto p-3">
                            <Calendar
                              date={flightsState[0]?.dateRange?.endDate}
                              onChange={(d) => handleReturnPick(0, d)}
                              minDate={flightsState[0]?.dateRange?.startDate || today}
                              months={1}
                              showMonthAndYearPickers
                            />
                          </div>
                        </motion.div>
                      ) : (
                        returnRect && (
                          <Portal>
                            <motion.div
                              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                              style={{
                                position: "fixed",
                                top: returnRect.bottom + 8,
                                left: Math.max(16, Math.min(returnRect.left, window.innerWidth - 16 - 320)),
                                width: 320,
                                zIndex: 100000,
                              }}
                            >
                              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
                                <div className="px-2 pt-1 pb-1 text-xs font-medium text-slate-600">Return</div>
                                <Calendar
                                  date={flightsState[0]?.dateRange?.endDate}
                                  onChange={(d) => handleReturnPick(0, d)}
                                  minDate={flightsState[0]?.dateRange?.startDate || today}
                                  months={1}
                                  showMonthAndYearPickers
                                />
                                <div className="p-2 pt-1 flex justify-end">
                                  <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-black" onClick={() => setOpenCal(null)}>
                                    Done
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </Portal>
                        )
                      ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Search */}
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 font-medium text-white shadow-sm hover:bg-black disabled:opacity-60"
                >
                  {isLoading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* === MULTI-CITY === */
          <div>
            {flightsState.map((_, idx) => (
              <LegRow key={idx} idx={idx} />
            ))}

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={addLeg}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              >
                + Add another flight
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 font-medium text-white shadow-sm hover:bg-black disabled:opacity-60"
              >
                {isLoading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Make sure react-select menus are above everything */}
      <style>{`.react-select__menu-portal{z-index:100000}`}</style>
    </form>
  );
}
