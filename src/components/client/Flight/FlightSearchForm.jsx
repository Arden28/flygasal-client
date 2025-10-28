import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Select, { components } from "react-select";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { airports, flights } from "../../../data/fakeData";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday, isValid } from "date-fns";

/* --------------------- portal + anchor rect helpers --------------------- */
function Portal({ children }) {
  const [mountNode, setMountNode] = useState(null);
  useEffect(() => {
    Promise.resolve().then(() => setMountNode(document?.body || null));
  }, []);
  return mountNode ? createPortal(children, mountNode) : null;
}

function useAnchorRect(ref, enabled) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    };
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(ref.current);
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
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
    for (const p of parts) if (!a._s.includes(p)) { ok = false; break; }
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

const AirportSingleValue = (props) => {
  const a = props.data;
  return (
    <components.SingleValue {...props}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="truncate text-[14px] font-medium text-slate-900">{a.label}</div>
        <IATAPill code={a.value} />
      </div>
    </components.SingleValue>
  );
};

const AirportOption = (props) => {
  const a = props.data;
  return (
    <components.Option {...props} className="!p-0">
      <div className={`flex items-center gap-3 px-3 py-2.5 ${props.isFocused ? "bg-slate-50" : "bg-white"}`}>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-slate-900">{a.label}</div>
          <div className="truncate text-xs text-slate-500">
            {a.city ? `${a.city}, ${a.country}` : a.country}
          </div>
        </div>
        <IATAPill code={a.value} />
      </div>
    </components.Option>
  );
};

/* ===================== Component ===================== */
export default function FlightSearchForm({
  searchParams,
  setAvailableFlights,
  setReturnFlights,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMedia("(max-width: 640px)");
  // lock which UI to render for travellers while open to avoid breakpoint flicker
  const [isTravellersOpen, setIsTravellersOpen] = useState(false);
  const [travellersMode, setTravellersMode] = useState(null); // 'mobile' | 'desktop' | null
  const AIRPORT_INDEX = useAirportIndex();

  // anchors for top-level calendars & travellers (legal hook usage)
  const travellersBtnRef = useRef(null);
  const departBtnRef = useRef(null);
  const returnBtnRef = useRef(null);

  const [openCal, setOpenCal] = useState(null); // {type:'depart'|'return', idx:number, rect?:DOMRectLike} | null

  const travellersRect = useAnchorRect(travellersBtnRef, isTravellersOpen);
  const departRect = useAnchorRect(departBtnRef, openCal?.type === "depart" && (openCal?.idx ?? 0) === 0);
  const returnRect = useAnchorRect(returnBtnRef, openCal?.type === "return" && (openCal?.idx ?? 0) === 0);

  // ---- simple Select handling: we only manage options per field
  const [airportMenus, setAirportMenus] = useState({});
  const menuKey = (idx, field) => `${idx}:${field}`;
  const defaultChunk = useMemo(() => AIRPORT_INDEX.slice(0, DEFAULT_MENU_COUNT), [AIRPORT_INDEX]);
  const ensureMenu = (key) => airportMenus[key] ?? { input: "", options: defaultChunk };
  const setMenu = (key, data) => setAirportMenus((prev) => ({ ...prev, [key]: data }));

  const handleMenuOpen = (idx, field) =>
    setMenu(menuKey(idx, field), { input: "", options: defaultChunk });

  const handleInputChange =
    (idx, field) =>
    (inputValue, meta) => {
      if (meta?.action === "menu-close") return inputValue;
      const key = menuKey(idx, field);
      const results = searchAirports(AIRPORT_INDEX, inputValue, SEARCH_LIMIT);
      setMenu(key, { input: inputValue, options: results });
      return inputValue;
    };

  /* ---- state ---- */
  const [tripType, setTripType] = useState("oneway"); // 'oneway' | 'return' | 'multi'
  const [flightType, setFlightType] = useState("ECONOMY");
  const [flightsState, setFlightsState] = useState([
    { origin: null, destination: null, dateRange: { startDate: today, endDate: addDays(today, 5), key: "selection" } },
  ]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // seed menus for existing legs
  useEffect(() => {
    setAirportMenus((prev) => {
      const next = { ...prev };
      const count = flightsState.length || 1;
      for (let i = 0; i < count; i++) {
        const ok = menuKey(i, "origin");
        const dk = menuKey(i, "destination");
        if (!next[ok]) next[ok] = { input: "", options: defaultChunk };
        if (!next[dk]) next[dk] = { input: "", options: defaultChunk };
      }
      return next;
    });
  }, [flightsState.length, defaultChunk]);

  // ESC to close Travellers
  useEffect(() => {
    if (!isTravellersOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsTravellersOpen(false);
        setTravellersMode(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTravellersOpen]);

/* -------- hydrate from URL or props (trust tripType, then verify legs) -------- */
useEffect(() => {
  const qp = new URLSearchParams(location.search);

  // 1) Always parse legs from URL (accept a leg if any of the 3 fields exists)
  const legsFromUrl = [];
  for (let i = 0; ; i++) {
    const hasAny =
      qp.has(`flights[${i}][origin]`) ||
      qp.has(`flights[${i}][destination]`) ||
      qp.has(`flights[${i}][depart]`);
    if (!hasAny) break;
    legsFromUrl.push({
      origin: qp.get(`flights[${i}][origin]`) || null,
      destination: qp.get(`flights[${i}][destination]`) || null,
      depart: qp.get(`flights[${i}][depart]`) || null,
    });
  }

  // 2) Trip type: prefer prop, fall back to URL
  const rawTripProp = (searchParams?.tripType || "").toLowerCase();
  const rawTripUrl = (qp.get("tripType") || "").toLowerCase();
  const tripFromProp =
    rawTripProp === "multi" ? "multi" : rawTripProp === "return" ? "return" : rawTripProp ? "oneway" : null;
  const tripFromUrl =
    rawTripUrl === "multi" ? "multi" : rawTripUrl === "return" ? "return" : "oneway";

  const tripTypeEff = tripFromProp || tripFromUrl;

  // 3) Legs: start from props if present, but if MULTI + URL has ≥2 legs, prefer URL
  const legsFromProp = Array.isArray(searchParams?.flights) ? searchParams.flights : [];
  let legsEff =
    tripTypeEff === "multi" && legsFromUrl.length >= 2
      ? legsFromUrl
      : legsFromProp.length
      ? legsFromProp
      : legsFromUrl;

  // Fallbacks if still empty
  if (!legsEff.length) {
    legsEff = [{ origin: "JFK", destination: "LAX", depart: format(today, "yyyy-MM-dd") }];
  }
  if (tripTypeEff === "multi" && legsEff.length < 2) {
    // ensure at least two legs visible in the form
    const firstDate = clampToToday(safeParseDate(legsEff[0].depart));
    legsEff = [
      legsEff[0],
      { origin: null, destination: null, depart: format(addDays(firstDate, 1), "yyyy-MM-dd") },
    ];
  } else if (tripTypeEff !== "multi" && legsEff.length > 1) {
    // oneway/return: keep only first leg
    legsEff = [legsEff[0]];
  }

  // 4) Other params (prefer props, then URL)
  const flightTypeRaw = searchParams?.flightType || qp.get("flightType") || "Economy";
  const retDateRaw =
    tripTypeEff === "return"
      ? searchParams?.returnDate || qp.get("returnDate") || format(addDays(today, 5), "yyyy-MM-dd")
      : null;

  const adults = Number.parseInt(searchParams?.adults ?? qp.get("adults") ?? "1", 10) || 1;
  const children = Number.parseInt(searchParams?.children ?? qp.get("children") ?? "0", 10) || 0;
  const infants = Number.parseInt(searchParams?.infants ?? qp.get("infants") ?? "0", 10) || 0;

  // 5) Apply top-level state
  setTripType(tripTypeEff);
  setFlightType(toCabinCode(flightTypeRaw));

  // 6) Normalize legs for component state
  const normSegments = legsEff.map((f, i) => {
    const start = clampToToday(safeParseDate(f?.depart));
    let end = start;
    if (tripTypeEff === "return" && i === 0) {
      const fallback = addDays(start, 5);
      const rtn = clampToToday(safeParseDate(retDateRaw, fallback));
      end = rtn < start ? start : rtn;
    }
    const originObj = f?.origin ? airports.find((a) => a.value === f.origin) || null : null;
    const destObj = f?.destination ? airports.find((a) => a.value === f.destination) || null : null;
    return { origin: originObj, destination: destObj, dateRange: { startDate: start, endDate: end, key: "selection" } };
  });

  setFlightsState(
    normSegments.length
      ? normSegments
      : [{ origin: null, destination: null, dateRange: { startDate: today, endDate: today, key: "selection" } }]
  );

  setAdults(adults);
  setChildren(children);
  setInfants(infants);
}, [searchParams, location.search]);


  useEffect(() => {
    setOpenCal(null);
    if (tripType === "oneway") {
      setFlightsState((prev) => {
        const first = { ...(prev[0] || {
          origin: null, destination: null, dateRange: { startDate: today, endDate: today, key: "selection" }
        }) };
        first.dateRange = { ...first.dateRange, endDate: first.dateRange.startDate };
        return [first];
      });
    } else if (tripType === "return") {
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
      setFlightsState((prev) => {
        const base = prev.length ? prev : [
          { origin: null, destination: null, dateRange: { startDate: today, endDate: today, key: "selection" } },
          { origin: null, destination: null, dateRange: { startDate: addDays(today, 1), endDate: addDays(today, 1), key: "selection" } },
        ];
        return base.map((f) => ({
          ...f,
          dateRange: { ...f.dateRange, endDate: f.dateRange.startDate || today },
        }));
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
    // close calendar after selecting a date
    setOpenCal(null);
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
    // close calendar after selecting a date
    setOpenCal(null);
  };

  const swapPlaces = (idx) =>
    setFlightsState((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, origin: f.destination, destination: f.origin } : f))
    );

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

    /* Plane icons */
    const PlaneTakeoff = (props) => (
    <svg aria-hidden {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 16l20-5-2-3-8 2-5-6-2 1 3 7-6 2z" />
        <path d="M2 19h20" />
    </svg>
    );

    const PlaneLanding = (props) => (
    <svg aria-hidden {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 19h20" />
        <path d="M22 16l-20-5 2-3 8 2 5-6 2 1-3 7 6 2z" />
    </svg>
    );

    /* Control with a left icon (takeoff/landing) */
    const ControlWithIcon = (props) => {
    const { children, innerProps, selectProps } = props;
    const { iconType } = selectProps; // "from" | "to" | undefined

    return (
        <components.Control {...props}>
        {/* left icon (absolute so it doesn't change layout) */}
        {iconType && (
            <span
            style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                color: "#64748b", // slate-500
                pointerEvents: "none",
            }}
            >
            {iconType === "from" ? (
                <PlaneTakeoff width={18} height={18} />
            ) : (
                <PlaneLanding width={18} height={18} />
            )}
            </span>
        )}
        {children}
        </components.Control>
    );
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

  const departLabel0 = flightsState[0]?.dateRange?.startDate
    ? format(flightsState[0].dateRange.startDate, "EEE d MMM")
    : "Select date";
  const returnLabel0 = flightsState[0]?.dateRange?.endDate
    ? format(flightsState[0].dateRange.endDate, "EEE d MMM")
    : "Select date";

  const calcCalendarPosition = (rect) => {
    if (!rect) return { top: 0, left: 0, width: 320 };
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    const pad = 12;
    const width = Math.min(360, vw - pad * 2);
    const estH = 332;
    let left = Math.max(pad, Math.min(rect.left, vw - pad - width));
    let top = rect.bottom + 8;
    if (top + estH > vh - pad) top = Math.max(pad, rect.top - estH - 8);
    return { top, left, width };
  };

  /* ------- Top controls ------- */
  const TopControls = () => (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">

      {/* Trip type buttons */}
      <div className="inline-flex rounded-full bg-white/90 p-1">
        {[
          { label: "One way", value: "oneway" },
          { label: "Return", value: "return" },
          { label: "Multi-city", value: "multi" },
        ].map((type) => (
          <button
            key={type.value}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tripType === type.value
                ? "bg-[#F58220] text-white"
                : "text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => setTripType(type.value)}
            aria-pressed={tripType === type.value}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Travellers */}
      <div className="relative text-black">
        <button
          ref={travellersBtnRef}
          type="button"
             onClick={() => {
                setIsTravellersOpen((v) => {
                  const next = !v;
                  if (next) setTravellersMode(isMobile ? "mobile" : "desktop");
                  else setTravellersMode(null);
                  return next;
                });
              }}
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

        <AnimatePresence>
          {isTravellersOpen &&
            (travellersMode === "mobile" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] flex flex-col bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 p-3">
                  <div className="text-sm font-medium text-slate-800">Travellers & cabin</div>
                  <span className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 cursor-pointer" onClick={() => { setIsTravellersOpen(false); setTravellersMode(null); }}>Close</span>
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
                  <span className="w-full cursor-pointer rounded-lg bg-slate-900 py-2 text-sm text-white" onClick={() => { setIsTravellersOpen(false); setTravellersMode(null); }}>Done</span>
                </div>
              </motion.div>
            ) : (
              travellersRect && (
                <Portal>
                  <div
                    className="fixed inset-0 z-[99990]"
                    onMouseDown={() => { setIsTravellersOpen(false); setTravellersMode(null); }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    onMouseDown={(e) => e.stopPropagation()}
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
                      <span className="mt-3 w-full inline-block cursor-pointer text-center rounded-lg bg-slate-900 px-6 py-2 text-sm text-white hover:bg-black" onClick={() => { setIsTravellersOpen(false); setTravellersMode(null); }}>Done</span>
                    </div>
                  </motion.div>
                </Portal>
              )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  /* --------- Render --------- */
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
        <TopControls />

        {/* Main rows */}
        {tripType !== "multi" ? (
          <div className="grid gap-2 lg:grid-cols-[1.2fr_auto_1.2fr_auto_auto_auto] lg:items-center md:grid-cols-[1.2fr_auto_1.2fr_auto_auto_auto]">
            {/* From */}
            <div className="z-[200] bg-white">
              <Select
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
                menuPortalTarget={document?.body || undefined}
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
                menuPortalTarget={document?.body || undefined}
                menuPosition="fixed"
                maxMenuHeight={384}
                menuPlacement="auto"
                getOptionValue={(opt) => opt.value}
                noOptionsMessage={noOptionsMessage}
              />
            </div>

            {/* Departure */}
            <div className="relative">
              <button
                ref={departBtnRef}
                type="button"
                onClick={() => {
                  departBtnRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
                  setOpenCal((oc) => (oc && oc.type === "depart" ? null : { type: "depart", idx: 0 }));
                }}
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
                {openCal?.type === "depart" && departRect && (
                  <Portal>
                    
                    <div
                      className="fixed inset-0 z-[99990]"
                      onMouseDown={() => setOpenCal(null)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: "fixed",
                        top: calcCalendarPosition(departRect).top,
                        left: calcCalendarPosition(departRect).left,
                        width: calcCalendarPosition(departRect).width,
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
                      </div>
                    </motion.div>
                  </Portal>
                )}
              </AnimatePresence>
            </div>

            {/* Return (only for Return trip) */}
            {tripType === "return" ? (
              <div className="relative">
                <button
                  ref={returnBtnRef}
                  type="button"
                  onClick={() => {
                    returnBtnRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
                    setOpenCal((oc) => (oc && oc.type === "return" ? null : { type: "return", idx: 0 }));
                  }}
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
                  {openCal?.type === "return" && returnRect && (
                    <Portal>
                      
                      <div
                        className="fixed inset-0 z-[99990]"
                        onMouseDown={() => setOpenCal(null)}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          position: "fixed",
                          top: calcCalendarPosition(returnRect).top,
                          left: calcCalendarPosition(returnRect).left,
                          width: calcCalendarPosition(returnRect).width,
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
                        </div>
                      </motion.div>
                    </Portal>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div />
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
        ) : (
          <div>
            {/* MULTI-CITY: no hooks in the loop; measure rect on click */}
            {flightsState.map((leg, idx) => {
              const legDateLabel = leg?.dateRange?.startDate ? format(leg.dateRange.startDate, "EEE d MMM") : "Select date";
              const rectForThisLeg = openCal?.type === "depart" && openCal?.idx === idx ? openCal.rect : null;
              const pos = rectForThisLeg && calcCalendarPosition(rectForThisLeg);

              return (
                <div key={`leg-${idx}`} className="grid gap-2 md:grid-cols-[1.2fr_auto_1.2fr_auto_auto] lg:grid-cols-[1.2fr_auto_1.2fr_auto_auto_auto] lg:items-center mb-2">
                  {/* From */}
                  <div className="z-[200] bg-white">
                    <Select
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
                      menuPortalTarget={document?.body || undefined}
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
                      menuPortalTarget={document?.body || undefined}
                      menuPosition="fixed"
                      maxMenuHeight={384}
                      menuPlacement="auto"
                      getOptionValue={(opt) => opt.value}
                      noOptionsMessage={noOptionsMessage}
                    />
                  </div>

                  {/* Date */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" });
                        setOpenCal((oc) =>
                          oc && oc.type === "depart" && oc.idx === idx
                            ? null
                            : { type: "depart", idx, rect }
                        );
                      }}
                      className="flex h-[58px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm hover:border-slate-400 focus:border-slate-400 focus:outline-none text-slate-800"
                      aria-expanded={openCal?.type === "depart" && openCal?.idx === idx}
                    >
                      <div className="min-w-0 truncate">
                        <div className="text-[11px] tracking-wide text-slate-500">Departure</div>
                        <div className="truncate text-slate-800">{legDateLabel}</div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Calendar */}
                    <AnimatePresence>
                      {openCal?.type === "depart" && openCal?.idx === idx && rectForThisLeg && (
                        <Portal>
                          
                          <div
                            className="fixed inset-0 z-[99990]"
                            onMouseDown={() => setOpenCal(null)}
                          />

                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                              position: "fixed",
                              top: pos.top,
                              left: pos.left,
                              width: pos.width,
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
                            </div>
                          </motion.div>
                        </Portal>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Remove leg */}
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
                </div>
              );
            })}

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

      {/* Keep react-select menus above everything */}
      <style>{`.react-select__menu-portal{z-index:100000}`}</style>
    </form>
  );
}
