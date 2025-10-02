import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Select, { components as RS } from "react-select";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { airports, flights } from "../../../data/fakeData";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday, isValid, addWeeks } from "date-fns";

/* --------------------- portal + anchor rect helpers --------------------- */
function Portal({ children }) {
  const [ready, setReady] = useState(false);
  const elRef = useRef(null);
  useEffect(() => {
    elRef.current = document.body;
    setReady(true);
  }, []);
  return ready && elRef.current ? createPortal(children, elRef.current) : null;
}

function useAnchorRect(ref) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [ref]);
  return rect;
}

/**
 * World-class (non-flashy) inline flight bar
 * — Airy spacing, legible typography, big touch targets
 * — Airport option: name, city, country + IATA pill
 * — Refined calendar with quick presets
 * — Full-screen travellers & calendar on mobile
 */

const MAX_TRAVELLERS = 9;
const DEFAULT_MENU_COUNT = 30;
const SEARCH_LIMIT = 120;

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
    try {
      mql.addEventListener("change", handler);
    } catch {
      mql.addListener(handler);
    }
    return () => {
      try {
        mql.removeEventListener("change", handler);
      } catch {
        mql.removeListener(handler);
      }
    };
  }, [query]);
  return matches;
};

const today = startOfToday();
const safeParseDate = (value, fallback = today) => {
  const d = value ? new Date(value) : null;
  return d && isValid(d) ? d : fallback;
};
const clampToToday = (d) => (d < today ? today : d);

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
      if (!a._s.includes(p)) {
        ok = false;
        break;
      }
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

const IATAPill = ({ code }) => (
  <span className="ml-auto inline-flex items-center rounded-full border border-slate-300 px-2 py-[2px] text-[11px] font-medium text-slate-700">
    {code}
  </span>
);

// Only show when NOT typing; otherwise let the input text be the only thing visible.
const AirportSingleValue = (props) => {
  const { selectProps } = props;
  if (selectProps.inputValue) return null; // hide while typing

  const a = props.data;
  const isDestination = selectProps.name === "destination"; // ← check which field
  const hint = isDestination ? "Where to" : "Where from";

  return (
    <RS.SingleValue {...props}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0">
          <div className="mb-0 text-[11px] tracking-wide text-slate-500">
            {hint}
          </div>
          <div className="truncate text-[15px] font-medium text-slate-900">
            {a.label}
          </div>
        </div>
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

const ValueContainer = ({ children, ...props }) => {
  const a = props.getValue?.()[0];
  return (
    <RS.ValueContainer {...props}>
      {a ? (
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-slate-900">{a.label}</div>
            <div className="truncate text-[11px] text-slate-500">
              {a.city ? `${a.city}, ${a.country}` : a.country}
            </div>
          </div>
          <IATAPill code={a.value} />
        </div>
      ) : null}
      {children}
    </RS.ValueContainer>
  );
};

export default function FlightSearchInlineBar({
  searchParams,
  setAvailableFlights,
  setReturnFlights,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMedia("(min-width: 1024px)");
  const isMobile = useMedia("(max-width: 640px)");
  const AIRPORT_INDEX = useAirportIndex();

  // anchor refs for desktop popovers
  const travellersBtnRef = useRef(null);
  const datesBtnRef = useRef(null);
  const travellersRect = useAnchorRect(travellersBtnRef);
  const datesRect = useAnchorRect(datesBtnRef);

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

  const [tripType, setTripType] = useState("oneway");
  const [flightType, setFlightType] = useState("Economy");
  const [flightsState, setFlightsState] = useState([
    {
      origin: null,
      destination: null,
      dateRange: {
        startDate: today,
        endDate: addDays(today, 5),
        key: "selection",
      },
    },
  ]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTravellersOpen, setIsTravellersOpen] = useState(false);
  const [openDatePickerIdx, setOpenDatePickerIdx] = useState(null);
  const [errors, setErrors] = useState([]);

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
      params = {
        tripType: queryParams.get("tripType") || "oneway",
        flightType: queryParams.get("flightType") || "Economy",
        flights: flightsFromUrl.length
          ? flightsFromUrl
          : [
              {
                origin: "JFK",
                destination: "LAX",
                depart: format(today, "yyyy-MM-dd"),
              },
            ],
        returnDate: queryParams.get("returnDate") || format(addDays(today, 5), "yyyy-MM-dd"),
        adults: parseInt(queryParams.get("adults")) || 1,
        children: parseInt(queryParams.get("children")) || 0,
        infants: parseInt(queryParams.get("infants")) || 0,
      };
    }
    setTripType(params.tripType);
    setFlightType(params.flightType || "Economy");
    const normSegments = params.flights.map((f, i) => {
      let start = clampToToday(safeParseDate(f.depart));
      let end = params.tripType === "return"
        ? clampToToday(safeParseDate(params.returnDate, addDays(start, 5)))
        : start;
      if (end < start) end = start;
      const originObj = airports.find((a) => a.value === f.origin) || null;
      const destObj = airports.find((a) => a.value === f.destination) || null;
      const oKey = menuKey(i, "origin");
      const dKey = menuKey(i, "destination");
      setMenu(oKey, ensureMenu(oKey));
      setMenu(dKey, ensureMenu(dKey));
      return {
        origin: originObj,
        destination: destObj,
        dateRange: { startDate: start, endDate: end, key: "selection" },
      };
    });
    setFlightsState(normSegments);
    setAdults(params.adults || 1);
    setChildren(params.children || 0);
    setInfants(params.infants || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.search]);

  useEffect(() => {
    setOpenDatePickerIdx(null);
    if (tripType === "oneway") {
      setFlightsState((prev) =>
        prev.map((f) => ({
          ...f,
          dateRange: { ...f.dateRange, endDate: f.dateRange.startDate },
        }))
      );
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
  const handleDateRangeChange = (idx, ranges) => {
    const selection = ranges.selection;
    let start = clampToToday(selection.startDate || today);
    let end = tripType === "oneway" ? start : clampToToday(selection.endDate || start);
    if (end < start) end = start;
    const next = { startDate: start, endDate: end, key: "selection" };
    setFlightsState((prev) => prev.map((f, i) => (i === idx ? { ...f, dateRange: next } : f)));
    if (tripType === "oneway") setOpenDatePickerIdx(null);
  };
  const swapPlaces = (idx) =>
    setFlightsState((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, origin: f.destination, destination: f.origin } : f))
    );

  const validateForm = () => {
    const errs = [];
    flightsState.forEach((f, i) => {
      if (!f.origin) errs.push(`Flight ${i + 1}: Please select a departure city`);
      if (!f.destination) errs.push(`Flight ${i + 1}: Please select a destination city`);
      if (f.origin && f.destination && f.origin.value === f.destination.value)
        errs.push(`Flight ${i + 1}: Departure and destination cannot be the same`);
      if (!f.dateRange.startDate) errs.push(`Flight ${i + 1}: Please select a departure date`);
      if (tripType === "return" && !f.dateRange.endDate)
        errs.push(`Flight ${i + 1}: Please select a return date`);
      if (
        tripType === "return" &&
        f.dateRange.startDate &&
        f.dateRange.endDate &&
        f.dateRange.endDate < f.dateRange.startDate
      )
        errs.push(`Flight ${i + 1}: Return date must be after departure date`);
    });
    if (totalTravellers === 0) errs.push("At least one traveller is required");
    if (infants > adults) errs.push("Number of infants cannot exceed number of adults");
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validateForm();
    if (v.length) {
      setErrors(v);
      return;
    }
    setErrors([]);
    setIsLoading(true);

    const queryParams = new URLSearchParams();
    queryParams.set("tripType", tripType);
    queryParams.set("flightType", flightType);
    flightsState.forEach((f, idx) => {
      queryParams.set(`flights[${idx}][origin]`, f.origin?.value || "");
      queryParams.set(`flights[${idx}][destination]`, f.destination?.value || "");
      queryParams.set(
        `flights[${idx}][depart]`,
        f.dateRange.startDate ? format(f.dateRange.startDate, "yyyy-MM-dd") : ""
      );
    });
    if (tripType === "return" && flightsState[0]?.dateRange.endDate)
      queryParams.set("returnDate", format(flightsState[0].dateRange.endDate, "yyyy-MM-dd"));
    queryParams.set("adults", String(adults));
    queryParams.set("children", String(children));
    queryParams.set("infants", String(infants));

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
          new Date(flightsState[0].dateRange.endDate).toDateString() ===
            new Date(fl.departureTime).toDateString()
      );
    }

    setAvailableFlights(outbound);
    setReturnFlights(rtn);

    setTimeout(() => {
      setIsLoading(false);
      navigate(`/flight/availability?${queryParams.toString()}`);
    }, 350);
  };

  // —— STYLE TWEAKS ONLY (keeps inline layout) ——
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
      ":hover": { borderColor: "#94a3b8" },
    }),
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
    input: (b) => ({ ...b, margin: 0, padding: 0 }),
    placeholder: (b) => ({ ...b, color: "#64748b" }),
  };

  const menuOptions = (idx, field) => ensureMenu(menuKey(idx, field)).options;
  const noOptionsMessage = ({ inputValue }) =>
    inputValue && inputValue.length > 1 ? "No airports match your search" : "Type to search airports";

  const presetRanges = [
    {
      id: "weekend",
      label: "This Weekend",
      compute: () => ({
        start: addDays(today, ((6 - today.getDay() + 7) % 7) || 5),
        end: addDays(today, ((7 - today.getDay() + 7) % 7) || 7),
      }),
    },
    {
      id: "nextweek",
      label: "Next Week",
      compute: () => ({ start: addWeeks(today, 1), end: addWeeks(today, 1) }),
    },
    {
      id: "+3",
      label: "+3 days",
      compute: (current) => ({
        start: current.startDate,
        end: addDays(current.startDate, 3),
      }),
    },
  ];

  const datePickerStyles = `
    .rdrCalendarWrapper{background:#fff;border-radius:14px;border:1px solid #e5e7eb;padding:.5rem;}
    .rdrMonth{padding:4px}
    .rdrMonthAndYearWrapper{padding:.5rem .75rem;border-bottom:1px solid #e5e7eb}
    .rdrDay{font-size:.95rem;color:#0f172a}
    .rdrSelected,.rdrInRange,.rdrStartEdge,.rdrEndEdge{background:#0284c7!important;color:#fff!important}
    .rdrInRange{background:#bae6fd!important}
    .rdrDayToday .rdrDayNumber span:after{background:#0284c7}
  `;

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full">
      <style>{datePickerStyles}</style>

      {!!errors.length && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative">
        {/* Top controls */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${tripType === "oneway" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setTripType("oneway")}
              aria-pressed={tripType === "oneway"}
            >
              One way
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${tripType === "return" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setTripType("return")}
              aria-pressed={tripType === "return"}
            >
              Return
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {travellerSummary}
            </button>

            {/* Travellers: full-screen on mobile, portaled on desktop */}
            <AnimatePresence>
              {isTravellersOpen &&
                (isMobile ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100000] flex flex-col bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 p-3">
                      <div className="text-sm font-medium">Travellers & cabin</div>
                      <span className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm cursor-pointer" onClick={() => setIsTravellersOpen(false)}>
                        Close
                      </span>
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
                            <button
                              type="button"
                              className="h-10 w-10 rounded-full border border-slate-300"
                              onClick={() => setWithClamp(row.set, row.value - 1, row.min, MAX_TRAVELLERS)}
                            >
                              –
                            </button>
                            <span className="w-8 text-center text-sm">{row.value}</span>
                            <button
                              type="button"
                              className="h-10 w-10 rounded-full border border-slate-300"
                              onClick={() => setWithClamp(row.set, row.value + 1, row.min, MAX_TRAVELLERS)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="mt-2">
                        <label htmlFor="flight_type" className="mb-1 block text-sm text-slate-700">
                          Cabin class
                        </label>
                        <select
                          id="flight_type"
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                          value={flightType}
                          onChange={(e) => setFlightType(e.target.value)}
                        >
                          <option value="Economy">Economy</option>
                          <option value="PREMIUM_ECONOMY">Premium Economy</option>
                          <option value="BUSINESS">Business</option>
                          <option value="FIRST">First</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 p-3">
                      <span className="w-full cursor-pointer rounded-lg bg-slate-900 py-2 text-sm text-white" onClick={() => setIsTravellersOpen(false)}>
                        Done
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  travellersRect && (
                    <Portal>
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          position: "fixed",
                          top: travellersRect.bottom + 8,
                          left: Math.min(
                            travellersRect.left,
                            Math.max(16, window.innerWidth - 352 - 16)
                          ),
                          width: "min(96vw, 22rem)",
                          zIndex: 100000,
                        }}
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
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded-full border border-slate-300 hover:bg-slate-50"
                                  onClick={() => setWithClamp(row.set, row.value - 1, row.min, MAX_TRAVELLERS)}
                                >
                                  –
                                </button>
                                <span className="w-8 text-center text-sm">{row.value}</span>
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded-full border border-slate-300 hover:bg-slate-50"
                                  onClick={() => setWithClamp(row.set, row.value + 1, row.min, MAX_TRAVELLERS)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="mt-2 mb-2">
                            <label htmlFor="flight_type" className="sr-only">
                              Cabin class
                            </label>
                            <select
                              id="flight_type"
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                              value={flightType}
                              onChange={(e) => setFlightType(e.target.value)}
                            >
                              <option value="Economy">Economy</option>
                              <option value="PREMIUM ECONOMY">Premium Economy</option>
                              <option value="business">Business</option>
                              <option value="first">First</option>
                            </select>
                          </div>
                          <div className="">
                            <span
                              className="mt-3 w-full inline-block cursor-pointer text-center rounded-lg bg-slate-900 px-6 py-2 text-sm text-white hover:bg-black"
                              onClick={() => setIsTravellersOpen(false)}
                            >
                              Done
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Portal>
                  )
                ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[1.2fr_auto1.2fr_1fr_auto_auto] lg:items-center md:grid-cols-[1.2fr_auto_1.2fr_1fr_auto_auto]">
          {/* From */}
          <div className="z-[200] bg-white">
            <div className="w-full">
              <Select
                name="origin"
                classNamePrefix="react-select"
                options={menuOptions(0, "origin")}
                value={flightsState[0].origin}
                onChange={(v) => handleFlightChange(0, "origin", v)}
                onMenuOpen={() => handleMenuOpen(0, "origin")}
                onInputChange={handleInputChange(0, "origin")}
                components={{
                  Option: AirportOption,
                  ValueContainer: RS.ValueContainer,
                  SingleValue: AirportSingleValue,
                }}
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
          </div>

          {/* Swap */}
          <div className="flex items-center justify-center md:-mx-5" style={{ zIndex: 100000 }}>
            <button
              type="button"
              onClick={() => swapPlaces(0)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-black hover:bg-slate-50"
              aria-label="Swap origin and destination"
              title="Swap"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transform rotate-90 xs:rotate-0 transition-transform"
              >
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
              value={flightsState[0].destination}
              onChange={(v) => handleFlightChange(0, "destination", v)}
              onMenuOpen={() => handleMenuOpen(0, "destination")}
              onInputChange={handleInputChange(0, "destination")}
              components={{
                Option: AirportOption,
                ValueContainer: RS.ValueContainer,
                SingleValue: AirportSingleValue,
              }}
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

          {/* Dates trigger */}
          <div className="relative text-black">
            <button
              ref={datesBtnRef}
              type="button"
              onClick={() => setOpenDatePickerIdx(openDatePickerIdx === 0 ? null : 0)}
              className="flex h-[58px] w-full items-center justify-between rounded-3 border border-slate-200 bg-white px-4 text-left text-sm hover:border-slate-400 focus:border-slate-400 focus:outline-none"
              aria-expanded={openDatePickerIdx === 0}
            >
              <div className="min-w-0 truncate">
                <div className="text-[11px] tracking-wide text-slate-500">
                  {/* {tripType === "return" ? "Depart – Return" : "Depart"} */}
                  Date
                </div>
                <div className="truncate">
                  {tripType === "return"
                    ? `${format(flightsState[0].dateRange.startDate, "EEE d MMM")} – ${format(
                        flightsState[0].dateRange.endDate,
                        "EEE d MMM"
                      )}`
                    : format(flightsState[0].dateRange.startDate, "EEE d MMM")}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Calendar: full-screen on mobile, portaled on desktop */}
            <AnimatePresence>
              {openDatePickerIdx === 0 &&
                (isMobile ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100000] flex flex-col bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 p-3">
                      <div className="text-sm font-medium">Select dates</div>
                      <span
                        className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        onClick={() => setOpenDatePickerIdx(null)}
                      >
                        Close
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      <DateRange
                        ranges={[flightsState[0].dateRange]}
                        onChange={(r) => handleDateRangeChange(0, r)}
                        minDate={today}
                        months={1}
                        direction="horizontal"
                        showDateDisplay
                        moveRangeOnFirstSelection={false}
                        rangeColors={["#0284c7"]}
                        className="w-full"
                      />
                    </div>
                    {tripType === "return" && (
                      <div className="border-t border-slate-200 p-3">
                        <button className="w-full rounded-lg bg-slate-900 py-2 text-sm text-white" onClick={() => setOpenDatePickerIdx(null)}>
                          Done
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  datesRect && (
                    <Portal>
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          position: "fixed",
                          top: datesRect.bottom + 8,
                          left: Math.max(
                            16,
                            Math.min(
                              // try to right-align panel with trigger
                              datesRect.right - Math.min(window.innerWidth * 0.96, 740),
                              window.innerWidth - 16 - Math.min(window.innerWidth * 0.96, 740)
                            )
                          ),
                          width: "min(96vw, 740px)",
                          zIndex: 100000,
                        }}
                      >
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-2">
                            {presetRanges.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  const current = flightsState[0].dateRange;
                                  const { start, end } = p.compute(current);
                                  handleDateRangeChange(0, {
                                    selection: {
                                      startDate: clampToToday(start),
                                      endDate: clampToToday(end),
                                      key: "selection",
                                    },
                                  });
                                }}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                          <div className="p-2">
                            <DateRange
                              ranges={[flightsState[0].dateRange]}
                              onChange={(r) => handleDateRangeChange(0, r)}
                              minDate={today}
                              months={isDesktop ? 2 : 1}
                              direction="horizontal"
                              showDateDisplay
                              moveRangeOnFirstSelection={false}
                              rangeColors={["#0284c7"]}
                              className="w-full"
                            />
                          </div>
                          {tripType === "return" && (
                            <div className="border-t border-slate-100 p-3">
                              <button
                                type="button"
                                className="w-full rounded-lg bg-slate-900 py-2 text-sm text-white hover:bg-black"
                                onClick={() => setOpenDatePickerIdx(null)}
                              >
                                Done
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Portal>
                  )
                ))}
            </AnimatePresence>
          </div>

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
      </div>

      {/* Make sure react-select menus are above everything */}
      <style>{`.react-select__menu-portal{z-index:100000}`}</style>
    </form>
  );
}
