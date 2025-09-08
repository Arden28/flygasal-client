import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select, { components as selectComponents } from "react-select";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { airports, flights } from "../../data/fakeData";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday, isValid } from "date-fns";

/**
 * FlightSearchForm (Chunked Airports)
 * - On menu open: show only 30 airports (cheap)
 * - On typing: search across ALL airports, but cap visible results (e.g., 120)
 * - Disable react-select internal filtering; we supply pre-filtered options
 * - Keep everything smooth even with 8k+ airports
 */
const MAX_TRAVELLERS = 9;
const DEFAULT_MENU_COUNT = 30;   // initial items when the menu opens
const SEARCH_LIMIT = 120;        // max items to render while typing

// Simple media query hook for responsive calendar
const useMedia = (query) => {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    try { mql.addEventListener("change", handler); } catch { mql.addListener(handler); }
    return () => { try { mql.removeEventListener("change", handler); } catch { mql.removeListener(handler); } };
  }, [query]);
  return matches;
};

// Date helpers
const today = startOfToday();
const safeParseDate = (value, fallback = today) => {
  const d = value ? new Date(value) : null;
  return d && isValid(d) ? d : fallback;
};
const clampToToday = (d) => (d < today ? today : d);

// Build a lowercase search index once (value/city/country/label)
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

// Rank & slice a search across the full index
function searchAirports(index, rawQuery, limit = SEARCH_LIMIT) {
  const q = (rawQuery || "").trim().toLowerCase();
  if (!q) return index.slice(0, DEFAULT_MENU_COUNT);

  const parts = q.split(/\s+/).filter(Boolean);
  const scored = [];

  for (const a of index) {
    // quick check: all tokens must be present somewhere
    let ok = true;
    for (const p of parts) {
      if (!a._s.includes(p)) { ok = false; break; }
    }
    if (!ok) continue;

    // lightweight ranking
    let score = 0;
    if (a._v.startsWith(q)) score += 120;         // IATA starts with
    if (a._c.startsWith(q)) score += 80;          // city starts with
    if (a._l.startsWith(q)) score += 60;          // label starts with
    if (a._co.startsWith(q)) score += 30;         // country starts with
    if (a._s.includes(q)) score += 10;            // general contains

    scored.push([score, a]);
  }

  scored.sort((x, y) => y[0] - x[0] || x[1].label.localeCompare(y[1].label, "en"));
  return scored.slice(0, limit).map((t) => t[1]);
}

const FlightSearchForm = ({ searchParams, setAvailableFlights, setReturnFlights }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMedia("(min-width: 768px)");

  // ----- Airports chunked menus -----
  const AIRPORT_INDEX = useAirportIndex();

  // Per-field menu state: { [key]: { input: string, options: Airport[] } }
  // key format: `${idx}:origin` or `${idx}:destination`
  const [airportMenus, setAirportMenus] = useState({});
  const menuKey = (idx, field) => `${idx}:${field}`;

  const defaultChunk = useMemo(() => AIRPORT_INDEX.slice(0, DEFAULT_MENU_COUNT), [AIRPORT_INDEX]);

  const ensureMenu = (key) => airportMenus[key] ?? { input: "", options: defaultChunk };
  const setMenu = (key, data) => setAirportMenus((prev) => ({ ...prev, [key]: data }));

  const handleMenuOpen = (idx, field) => {
    const key = menuKey(idx, field);
    // On first open, show only the default chunk (30)
    setMenu(key, { input: "", options: defaultChunk });
  };

  const handleInputChange = (idx, field) => (inputValue, meta) => {
    const key = menuKey(idx, field);
    // react-select calls with action types; ignore menu-close clear spam
    if (meta?.action === "menu-close") return inputValue;
    const results = searchAirports(AIRPORT_INDEX, inputValue, SEARCH_LIMIT);
    setMenu(key, { input: inputValue, options: results });
    return inputValue;
  };

  // ----- State -----
  const [tripType, setTripType] = useState("oneway"); // oneway | return
  const [flightType, setFlightType] = useState("Economy");
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
  const [openDatePickerIdx, setOpenDatePickerIdx] = useState(null); // null | number
  const [errors, setErrors] = useState([]);

  // ----- Effects: hydrate from URL or props, but normalize dates -----
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
        flights:
          flightsFromUrl.length > 0
            ? flightsFromUrl
            : [{ origin: "JFK", destination: "LAX", depart: format(today, "yyyy-MM-dd") }],
        returnDate: queryParams.get("returnDate") || format(addDays(today, 5), "yyyy-MM-dd"),
        adults: parseInt(queryParams.get("adults")) || 1,
        children: parseInt(queryParams.get("children")) || 0,
        infants: parseInt(queryParams.get("infants")) || 0,
      };
    }

    setTripType(params.tripType);
    setFlightType(params.flightType || "Economy");

    // Normalize each segment
    const normSegments = params.flights.map((f, i) => {
      let start = clampToToday(safeParseDate(f.depart));
      let end = params.tripType === "return" ? clampToToday(safeParseDate(params.returnDate, addDays(start, 5))) : start;
      if (end < start) end = start; // ensure logical order

      // Keep selected values as objects (they don't need to be present in the current options list)
      const originObj = airports.find((a) => a.value === f.origin) || null;
      const destObj = airports.find((a) => a.value === f.destination) || null;

      // Seed menus for this row so opening feels instant
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

  // Close calendar when switching trip type; also coerce dates for oneway
  useEffect(() => {
    setOpenDatePickerIdx(null);
    if (tripType === "oneway") {
      setFlightsState((prev) => prev.map((f) => ({ ...f, dateRange: { ...f.dateRange, endDate: f.dateRange.startDate } })));
    }
  }, [tripType]);

  // ----- Derived -----
  const travellerSummary = useMemo(() => {
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
    if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? "s" : ""}`);
    return parts.join(", ") || "1 Adult";
  }, [adults, children, infants]);

  const totalTravellers = adults + children + infants;

  // ----- Utils -----
  const setWithClamp = (setter, val, min, max) => setter(Math.max(min, Math.min(max, val)));
  const closeAllPopovers = () => {
    setIsTravellersOpen(false);
    setOpenDatePickerIdx(null);
  };

  // outside click close for travellers/date popovers
  const popoverRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      // If you want outside-click close, uncomment below:
      // if (popoverRef.current && !popoverRef.current.contains(e.target)) closeAllPopovers();
    };
    const onEsc = (e) => e.key === "Escape" && closeAllPopovers();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // ----- Handlers -----
  const addFlight = () => {
    const idx = flightsState.length;
    const oKey = menuKey(idx, "origin");
    const dKey = menuKey(idx, "destination");
    setMenu(oKey, { input: "", options: defaultChunk });
    setMenu(dKey, { input: "", options: defaultChunk });

    setFlightsState((prev) => [
      ...prev,
      {
        origin: null,
        destination: null,
        dateRange: { startDate: today, endDate: addDays(today, 5), key: "selection" },
      },
    ]);
  };

  const removeFlight = (idx) => setFlightsState((prev) => prev.filter((_, i) => i !== idx));

  const handleFlightChange = (idx, field, value) => {
    setFlightsState((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };

  const handleDateRangeChange = (idx, ranges) => {
    const selection = ranges.selection;
    let start = clampToToday(selection.startDate || today);
    let end = tripType === "oneway" ? start : clampToToday(selection.endDate || start);
    if (end < start) end = start;
    const next = { startDate: start, endDate: end, key: "selection" };
    setFlightsState((prev) => prev.map((f, i) => (i === idx ? { ...f, dateRange: next } : f)));
    if (tripType === "oneway") setOpenDatePickerIdx(null);
  };

  const swapPlaces = (idx) => {
    setFlightsState((prev) => prev.map((f, i) => (i === idx ? { ...f, origin: f.destination, destination: f.origin } : f)));
  };

  const validateForm = () => {
    const errs = [];
    flightsState.forEach((f, i) => {
      if (!f.origin) errs.push(`Flight ${i + 1}: Please select a departure city`);
      if (!f.destination) errs.push(`Flight ${i + 1}: Please select a destination city`);
      if (f.origin && f.destination && f.origin.value === f.destination.value)
        errs.push(`Flight ${i + 1}: Departure and destination cannot be the same`);
      if (!f.dateRange.startDate) errs.push(`Flight ${i + 1}: Please select a departure date`);
      if (tripType === "return" && !f.dateRange.endDate) errs.push(`Flight ${i + 1}: Please select a return date`);
      if (tripType === "return" && f.dateRange.startDate && f.dateRange.endDate && f.dateRange.endDate < f.dateRange.startDate)
        errs.push(`Flight ${i + 1}: Return date must be after departure date`);
    });
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

    // Build URL params
    const queryParams = new URLSearchParams();
    queryParams.set("tripType", tripType);
    queryParams.set("flightType", flightType);
    flightsState.forEach((f, idx) => {
      queryParams.set(`flights[${idx}][origin]`, f.origin?.value || "");
      queryParams.set(`flights[${idx}][destination]`, f.destination?.value || "");
      queryParams.set(`flights[${idx}][depart]`, f.dateRange.startDate ? format(f.dateRange.startDate, "yyyy-MM-dd") : "");
    });
    if (tripType === "return" && flightsState[0]?.dateRange.endDate)
      queryParams.set("returnDate", format(flightsState[0].dateRange.endDate, "yyyy-MM-dd"));
    queryParams.set("adults", String(adults));
    queryParams.set("children", String(children));
    queryParams.set("infants", String(infants));

    // Filter local fake data
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
    }, 500);
  };

  // ----- Select UI bits -----
  // We don’t use filterOption (we pre-filter the options list)
  // const filterOption = ...

  const CustomOption = ({ innerProps, data }) => (
    <div {...innerProps} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors">
      <div className="flex-1">
        <div className="font-medium">
          {data.city ? `${data.city} — ${data.country}` : data.country}
        </div>
        <div className="text-xs text-gray-500">{data.label}</div>
      </div>
    </div>
  );

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: 12,
      minHeight: 54,
      borderColor: state.isFocused ? "#60a5fa" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.2)" : "none",
      paddingLeft: 6,
      ":hover": { borderColor: "#60a5fa" },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 10px 25px rgba(0,0,0,.08)",
      zIndex: 999999,        // <— ensure above local stuff if not using portal
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 999999,        // <— ensure above sticky headers/modals/backdrops
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f3f4f6" : "transparent",
      color: "#111827",
    }),
  };


  // Date picker theme overrides
  const datePickerStyles = `
    .rdrCalendarWrapper{background:#fff;border-radius:.75rem;border:1px solid #e5e7eb;padding:.5rem;max-width:100%;}
    .rdrMonths{max-width:100%;}
    .rdrMonth{padding:4px}
    .rdrMonthAndYearWrapper{padding:.5rem .75rem;border-bottom:1px solid #e5e7eb}
    .rdrDay{font-size:.9rem;color:#111827}
    .rdrSelected,.rdrInRange,.rdrStartEdge,.rdrEndEdge{background:#3b82f6!important;color:#fff!important}
    .rdrInRange{background:#bfdbfe!important}
    .rdrDayToday .rdrDayNumber span:after{background:#3b82f6}
  `;

  // Helper to pull proper options per row/field
  const menuOptions = (idx, field) => ensureMenu(menuKey(idx, field)).options;
  const noOptionsMessage = ({ inputValue }) =>
    inputValue && inputValue.length > 1 ? "No airports match your search" : "Type to search airports";

  return (
    <form id="flights-search" onSubmit={handleSubmit} className="content m-0">
      <style>{datePickerStyles}</style>

      {/* Errors */}
      {!!errors.length && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            className={`px-3 py-2 text-sm rounded-lg ${tripType === "oneway" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setTripType("oneway")}
            aria-pressed={tripType === "oneway"}
          >
            One way
          </button>
          <button
            type="button"
            className={`px-3 py-2 text-sm rounded-lg ${tripType === "return" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setTripType("return")}
            aria-pressed={tripType === "return"}
          >
            Return
          </button>
        </div>

        <div>
          <label htmlFor="flight_type" className="sr-only">Cabin class</label>
          <select
            id="flight_type"
            className="h-[42px] rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={flightType}
            onChange={(e) => setFlightType(e.target.value)}
          >
            <option value="Economy">Economy</option>
            <option value="PREMIUM ECONOMY">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>
      </div>

      {/* Flight rows */}
      <div className="space-y-3" ref={popoverRef}>
        {flightsState.map((flight, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
              {/* Origin */}
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <Select
                  options={menuOptions(idx, "origin")}
                  value={flight.origin}
                  onChange={(v) => handleFlightChange(idx, "origin", v)}
                  onMenuOpen={() => handleMenuOpen(idx, "origin")}
                  onInputChange={handleInputChange(idx, "origin")}
                  components={{ Option: CustomOption }}
                  styles={selectStyles}
                  placeholder="City or airport"
                  isSearchable
                  filterOption={null}                 // <-- we already pre-filter
                  menuPortalTarget={document.body}    // reduce layout reflow
                  maxMenuHeight={384}
                  menuPlacement="auto"
                  getOptionValue={(opt) => opt.value}
                  noOptionsMessage={noOptionsMessage}
                />
              </div>

              {/* Swap button */}
              <div className="md:col-span-1 flex items-end justify-center md:justify-start">
                <button
                  type="button"
                  onClick={() => swapPlaces(idx)}
                  className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                  aria-label="Swap origin and destination"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h13l-4-4"/><path d="M21 17H8l4 4"/></svg>
                </button>
              </div>

              {/* Destination */}
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <Select
                  options={menuOptions(idx, "destination")}
                  value={flight.destination}
                  onChange={(v) => handleFlightChange(idx, "destination", v)}
                  onMenuOpen={() => handleMenuOpen(idx, "destination")}
                  onInputChange={handleInputChange(idx, "destination")}
                  components={{ Option: CustomOption }}
                  styles={selectStyles}
                  placeholder="City or airport"
                  isSearchable
                  filterOption={null}
                  menuPortalTarget={document.body}
                  maxMenuHeight={384}
                  menuPlacement="auto"
                  getOptionValue={(opt) => opt.value}
                  noOptionsMessage={noOptionsMessage}
                />
              </div>

              {/* Date trigger */}
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-500 mb-1">{tripType === "return" ? "Depart — Return" : "Depart"}</label>
                <button
                  type="button"
                  onClick={() => setOpenDatePickerIdx(openDatePickerIdx === idx ? null : idx)}
                  className="flex h-[54px] w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3 text-left text-sm hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  aria-expanded={openDatePickerIdx === idx}
                >
                  <span>
                    {tripType === "return"
                      ? `${format(flight.dateRange.startDate, "EEE d MMM")} – ${format(flight.dateRange.endDate, "EEE d MMM")}`
                      : format(flight.dateRange.startDate, "EEE d MMM")}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            </div>

            {/* Calendar panel */}
            <AnimatePresence>
              {openDatePickerIdx === idx && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="mt-2 w-full"
                >
                  <div className="w-full md:flex md:justify-center">
                    <div
                      className="rounded-xl border border-gray-100 bg-white shadow-xl"
                      style={{ width: "min(92vw, 720px)" }}
                    >
                      <DateRange
                        ranges={[flight.dateRange]}
                        onChange={(ranges) => handleDateRangeChange(idx, ranges)}
                        minDate={today}
                        months={isDesktop ? 2 : 1}
                        direction="horizontal"
                        showDateDisplay
                        moveRangeOnFirstSelection={false}
                        rangeColors={["#3b82f6"]}
                        className="w-full"
                      />
                      {tripType === "return" && (
                        <div className="border-t border-gray-100 p-3">
                          <button
                            type="button"
                            className="w-full rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
                            onClick={() => setOpenDatePickerIdx(null)}
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {flightsState.length > 1 && (
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => removeFlight(idx)} className="text-sm text-red-600 hover:text-red-700">
                  Remove segment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer row: travellers + actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3" ref={popoverRef}>
        {/* Travellers */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTravellersOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200"
            aria-expanded={isTravellersOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {travellerSummary}
          </button>

          <AnimatePresence>
            {isTravellersOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute z-30 mt-2 w-72"
              >
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
                  {[
                    { key: "Adults", sub: "+12 years", value: adults, set: setAdults, min: 1 },
                    { key: "Children", sub: "2–11 years", value: children, set: setChildren, min: 0 },
                    { key: "Infants", sub: "0–2 years", value: infants, set: setInfants, min: 0 },
                  ].map((row) => (
                    <div key={row.key} className="mb-3 last:mb-0 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{row.key}</div>
                        <div className="text-xs text-gray-500">{row.sub}</div>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          className="h-8 w-8 rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            const newVal = row.value - 1;
                            const cap = row.key === "Infants" ? Math.min(infants - 1, adults) : newVal;
                            setWithClamp(row.set, cap, row.min, MAX_TRAVELLERS);
                          }}
                          aria-label={`Decrease ${row.key}`}
                        >
                          –
                        </button>
                        <span className="w-8 text-center text-sm">{row.value}</span>
                        <button
                          type="button"
                          className="h-8 w-8 rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            let max = MAX_TRAVELLERS - (totalTravellers - row.value);
                            if (row.key === "Infants") max = Math.min(max, adults); // infants ≤ adults
                            setWithClamp(row.set, row.value + 1, row.min, row.value + max);
                          }}
                          aria-label={`Increase ${row.key}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
                    onClick={() => setIsTravellersOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={addFlight} className="text-sm text-blue-600 hover:text-blue-800">
            + Add another flight
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"/></svg>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default FlightSearchForm;
