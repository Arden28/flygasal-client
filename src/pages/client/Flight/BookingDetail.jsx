import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BookingHeader from "../../../components/client/Flight/BookingHeader";
import BookingForm from "../../../components/client/Flight/BookingForm";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { flights, airlines, airports } from "../../../data/fakeData";
import flygasal from "../../../api/flygasalService";
import { AuthContext } from "../../../context/AuthContext";

/* ----------------------- constants ----------------------- */
const countries = [
  { code: "US", name: "United States", flag: "/assets/img/flags/us.png" },
  { code: "GB", name: "United Kingdom", flag: "/assets/img/flags/gb.png" },
  { code: "AE", name: "United Arab Emirates", flag: "/assets/img/flags/ae.png" },
  { code: "AU", name: "Australia", flag: "/assets/img/flags/au.png" },
  { code: "FR", name: "France", flag: "/assets/img/flags/fr.png" },
  { code: "ET", name: "Ethiopia", flag: "/assets/img/flags/et.png" },
  { code: "KE", name: "Kenya", flag: "/assets/img/flags/ke.png" },
  { code: "ZA", name: "South Africa", flag: "/assets/img/flags/za.png" },
  { code: "EG", name: "Egypt", flag: "/assets/img/flags/eg.png" },
  { code: "MA", name: "Morocco", flag: "/assets/img/flags/ma.png" },
];
const months = [
  { value: "01", label: "01 January" },
  { value: "02", label: "02 February" },
  { value: "03", label: "03 March" },
  { value: "04", label: "04 April" },
  { value: "05", label: "05 May" },
  { value: "06", label: "06 June" },
  { value: "07", label: "07 July" },
  { value: "08", label: "08 August" },
  { value: "09", label: "09 September" },
  { value: "10", label: "10 October" },
  { value: "11", label: "11 November" },
  { value: "12", label: "12 December" },
];
const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1).padStart(2, "0"),
}));
const dobYears = Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => ({
  value: String(new Date().getFullYear() - i),
  label: String(new Date().getFullYear() - i),
}));
const issuanceYears = dobYears;
const expiryYears = Array.from({ length: 21 }, (_, i) => ({
  value: String(new Date().getFullYear() + i),
  label: String(new Date().getFullYear() + i),
}));

/* ----------------------- utils ----------------------- */
const toTimeOnly = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const toYMD = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const money = (n = 0, currency = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency });

/** Build a "back to search" URL that keeps user inputs but strips selection-only params */
const buildAvailabilitySearch = (search) => {
  const keep = new URLSearchParams(search);
  ["solutionId", "solutionKey", "flightId", "returnFlightId"].forEach((k) => keep.delete(k));
  const q = keep.toString();
  return `/flight/availability${q ? `?${q}` : ""}`;
};

/* ======================================================
   Fancy Aviation Loading (accessible)
   ====================================================== */
const AirLoading = ({ location }) => {
  const sp = new URLSearchParams(location.search);
  const origin = sp.get("origin") || sp.get("flights[0][departure]") || "—";
  const destination = sp.get("destination") || sp.get("flights[0][arrival]") || "—";
  const depart = sp.get("depart") || sp.get("flights[0][departureDate]") || null;

  const formatNice = (s) =>
    s ? new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-[#F6F6F7]">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Sky scene */}
          <div className="relative h-56 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-white to-white" />

            {/* moving clouds */}
            <motion.div
              className="absolute -left-40 top-8 h-16 w-64 rounded-full bg-white/80 blur-md"
              animate={{ x: ["0%", "140%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute left-10 top-24 h-12 w-40 rounded-full bg-white/70 blur-md"
              animate={{ x: ["0%", "120%"] }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 1.2 }}
            />

            {/* dashed route line */}
            <div className="absolute inset-x-8 bottom-10">
              <div className="relative h-6">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-300" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-slate-700" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-slate-700" />
                <motion.div
                  className="absolute -left-4 top-1/2 -translate-y-1/2"
                  animate={{ left: ["-16px", "calc(100% - 16px)"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: [0.4, 0.0, 0.2, 1] }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-800">
                    <path d="M2 16l20-8-9 9-2 5-3-4-6-2z" strokeWidth="1.2" />
                  </svg>
                </motion.div>
              </div>
            </div>

            {/* route labels */}
            <div className="absolute inset-x-6 bottom-4 flex items-center justify-between text-[11px] text-slate-600">
              <span className="rounded-full border border-slate-300 bg-white/70 px-2 py-0.5">
                {origin}
              </span>
              <span className="rounded-full border border-slate-300 bg-white/70 px-2 py-0.5">
                {destination}
              </span>
            </div>
          </div>

          {/* Title / subtitle */}
          <div className="px-6 pb-6 pt-4 text-center" role="status" aria-live="polite">
            <motion.h2
              className="mx-auto inline-block bg-clip-text text-base font-semibold text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #0ea5e9, #111827, #0ea5e9)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPositionX: ["0%", "100%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            >
              Checking availability…
            </motion.h2>
            <p className="mt-1 text-xs text-slate-600">
              {origin} → {destination} {depart ? `• ${formatNice(depart)}` : ""}
            </p>

            <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <motion.div
                className="h-full w-1/3 rounded-full bg-sky-600"
                animate={{ x: ["-30%", "130%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   Modern Error State
   ====================================================== */
const ErrorState = ({ message, onBack, onRetry, onReprice, location }) => {
  const sp = new URLSearchParams(location.search);
  const origin = sp.get("origin") || sp.get("flights[0][departure]") || "—";
  const destination = sp.get("destination") || sp.get("flights[0][arrival]") || "—";
  const tripType = sp.get("tripType") || "oneway";

  return (
    <div className="min-h-screen bg-[#F6F6F7]">
      <div className="container mx-auto px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-300 bg-rose-50 text-rose-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900">We couldn’t get this fare</h3>
              <p className="mt-1 text-sm text-slate-700">{message}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5">
                  Route: {origin} → {destination}
                </span>
                <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5">
                  Trip: {tripType}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
                  onClick={onBack}
                >
                  Back to Flight Search
                </button>
                <button
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={onRetry}
                >
                  Try again
                </button>
                {onReprice && (
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={onReprice}
                  >
                    Reprice
                  </button>
                )}
              </div>

              <details className="mt-3 text-xs text-slate-600">
                <summary className="cursor-pointer select-none text-slate-700">Why this happens</summary>
                <ul className="mt-2 list-disc pl-5">
                  <li>The fare changed or sold out while you were reviewing it.</li>
                  <li>The return leg no longer matches the outbound constraints.</li>
                  <li>A temporary network hiccup interrupted the request.</li>
                </ul>
              </details>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ======================================================
   Helpers: build legs by flightId groups (ordered by offer.flightIds)
   ====================================================== */
function buildLegFromSegments(offer, segs) {
  if (!segs?.length) return null;
  const first = segs[0];
  const last = segs[segs.length - 1];
  return {
    id: first?.segmentId || offer?.id || null,
    airline: first?.airline || null,
    flightNumber: `${first?.airline ?? ""}${first?.flightNum ?? ""}`,
    origin: first?.departure ?? offer?.origin ?? null,
    destination: last?.arrival ?? offer?.destination ?? null,
    departureTime: first?.departureDate ? new Date(first.departureDate) : offer?.departureTime,
    arrivalTime: last?.arrivalDate ? new Date(last.arrivalDate) : offer?.arrivalTime,
    cabin: first?.cabinClass ?? offer?.cabin ?? null,
    bookingCode: first?.bookingCode ?? offer?.bookingCode ?? null,
    availabilityCount: first?.availabilityCount ?? 0,
    equipment: first?.equipment ?? null,
    terminals: {
      from: first?.departureTerminal ?? null,
      to: last?.arrivalTerminal ?? null,
    },
    segments: segs,
    priceBreakdown: offer?.priceBreakdown ?? null, // single total still lives on the offer
    marketingCarriers: offer?.marketingCarriers ?? [],
    operatingCarriers: offer?.operatingCarriers ?? [],
    lastTktTime: offer?.lastTktTime ? new Date(offer.lastTktTime) : null,
  };
}

function groupOfferByFlights(offer) {
  const segs = offer?.segments || [];
  if (!segs.length) return [];

  // If we have flightIds, preserve their order. Otherwise, single leg of all segs.
  const fids = Array.isArray(offer?.flightIds) && offer.flightIds.length ? offer.flightIds : [null];

  // Build mapping flightId -> segments (preserve sequence in offer.segments)
  const buckets = new Map(fids.map((fid) => [fid, []]));
  segs.forEach((s) => {
    const fid = s?.flightId ?? null;
    if (!buckets.has(fid)) buckets.set(fid, []);
    buckets.get(fid).push(s);
  });

  // Produce legs in flightIds order (fallback: any remaining buckets in insertion order)
  const legs = [];
  const seen = new Set();
  fids.forEach((fid) => {
    const segList = buckets.get(fid) || [];
    if (segList.length) {
      legs.push(buildLegFromSegments(offer, segList));
      seen.add(fid);
    }
  });
  // Include any buckets not in fids (robustness)
  buckets.forEach((segList, fid) => {
    if (!seen.has(fid) && segList.length) {
      legs.push(buildLegFromSegments(offer, segList));
    }
  });

  return legs.filter(Boolean);
}

/* ======================================================
   Booking Detail
   ====================================================== */
const BookingDetail = () => {
  const { user } = useContext(AuthContext);
  const [agentData, setAgentData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [tripDetails, setTripDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [isAgent, setIsAgent] = useState(false);
  const [agentFee, setAgentFee] = useState(0);

  const [showCancellation, setShowCancellation] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // --- 10-minute hold timer state ---
  const [holdUntil, setHoldUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [repriceTrigger, setRepriceTrigger] = useState(0);
  const searchKey = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return `bc_hold:${sp.get("solutionId") || ""}:${sp.get("flightId") || ""}:${sp.get("returnFlightId") || ""}`;
  }, [location.search]);
  const timeLeftMs = Math.max(0, holdUntil - now);
  const holdExpired = timeLeftMs <= 0;
  const mm = String(Math.floor(timeLeftMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((timeLeftMs % 60000) / 1000)).padStart(2, "0");
  const timeLeftLabel = `${mm}:${ss}`;

  /* ---------- Agency Markup ---------- */
  const agentMarkupPercent = user?.agency_markup || 0;

  const [formData, setFormData] = useState(() => {
    const cached = localStorage.getItem("bookingFormDraft");
    return (
      (cached && JSON.parse(cached)) || {
        full_name: "",
        email: "",
        phone: "",
        travelers: [],
        payment_method: "",
        agree_terms: true,
      }
    );
  });

  /* ---------- role ---------- */
  useEffect(() => {
    setIsAgent(user?.role === "agent");
  }, [user]);

  /* ---------- parse counts & seed travelers (initial only from URL) ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const adultsCount = parseInt(sp.get("adults")) || 2;
    const childrenCount = parseInt(sp.get("children")) || 0;
    const infantsCount = parseInt(sp.get("infants")) || 0;

    setAdults(adultsCount);
    setChildren(childrenCount);
    setInfants(infantsCount);

    // seed travelers only when empty to preserve edits
    setFormData((prev) => {
      if (prev.travelers?.length) return prev;
      const dev = import.meta.env.ENV_MODE === "development";
      const mk = (type, defaults = {}) => ({
        type,
        title: dev ? (type === "adult" ? "Mr" : "Miss") : "",
        first_name: dev ? `Test${Math.random().toString(36).slice(2, 5)}` : "",
        last_name: dev ? `User${Math.random().toString(36).slice(2, 5)}` : "",
        nationality: dev ? "PK" : "",
        dob_month: dev ? "01" : "",
        dob_day: dev ? "01" : "",
        dob_year: dev ? (type === "infant" ? "2023" : type === "child" ? "2015" : "1988") : "",
        passport: dev ? "X1234567" : "",
        passport_issuance_month: dev ? "01" : "",
        passport_issuance_day: dev ? "01" : "",
        passport_issuance_year: dev ? "2020" : "",
        passport_expiry_month: dev ? "01" : "",
        passport_expiry_day: dev ? "01" : "",
        passport_expiry_year: dev ? String(new Date().getFullYear() + 2) : "",
        ...defaults,
      });
      return {
        ...prev,
        travelers: [
          ...Array(adultsCount).fill(0).map(() => mk("adult")),
          ...Array(childrenCount).fill(0).map(() => mk("child")),
          ...Array(infantsCount).fill(0).map(() => mk("infant")),
        ],
      };
    });
  }, [location.search]);

  /* ---------- form autosave ---------- */
  useEffect(() => {
    localStorage.setItem("bookingFormDraft", JSON.stringify(formData));
  }, [formData]);

  /* ---------- validation ---------- */
  useEffect(() => {
    const requiredTravelers = adults + children + infants;
    const travelerComplete = (t) =>
      t.title &&
      t.first_name &&
      t.last_name &&
      t.nationality &&
      t.dob_month &&
      t.dob_day &&
      t.dob_year &&
      t.passport &&
      t.passport_issuance_month &&
      t.passport_issuance_day &&
      t.passport_issuance_year &&
      t.passport_expiry_month &&
      t.passport_expiry_day &&
      t.passport_expiry_year;

    const isValid =
      formData.full_name &&
      formData.email &&
      formData.phone &&
      formData.agree_terms &&
      formData.payment_method &&
      formData.travelers.length >= requiredTravelers &&
      formData.travelers.every(travelerComplete) &&
      (formData.payment_method !== "credit_card" ||
        (formData.card_full_name && formData.card_number && formData.card_expiration && formData.card_cvv));

    setIsFormValid(Boolean(isValid));
  }, [formData, adults, children, infants]);

  /* ---------- helpers ---------- */
  const getAirportName = (code) => {
    const a = airports.find((x) => x.value === code);
    return a ? `${a.label}` : code || "—";
  };
  const getCityName = (code) => {
    const a = airports.find((x) => x.value === code);
    return a ? a.city : code || "—";
  };
  const getAirlineName = (code) => {
    const a = airlines.find((x) => x.code === code);
    return a ? a.name : code || "—";
  };
  const getAirlineLogo = (code) => {
    const a = airlines.find((x) => x.code === code);
    return a ? a.logo : "/assets/img/airlines/placeholder.png";
  };
  const calculateDuration = (departure, arrival) => {
    const depart = new Date(departure);
    const arrive = new Date(arrival);
    const diff = Math.max(0, (arrive - depart) / (1000 * 60)); // in mins
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return `${h}h ${m}m`;
  };
  const formatTime = (s) =>
    s ? new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";
  const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
  const formatDateMonth = (s) =>
    s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  const getPassengerSummary = (a, c, i) => {
    const parts = [];
    if (a > 0) parts.push(`${a} Adult${a > 1 ? "s" : ""}`);
    if (c > 0) parts.push(`${c} Child${c > 1 ? "ren" : ""}`);
    if (i > 0) parts.push(`${i} Infant${i > 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  /* ---------- fetch precise pricing (single offer) ---------- */
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams(location.search);

        // Build request criteria from URL for the API call (source of truth becomes the offer)
        const journeysFromUrl = [];
        let idx = 0;
        while (sp.has(`flights[${idx}][origin]`)) {
          journeysFromUrl.push({
            airline: sp.get(`flights[${idx}][airline]`),
            flightNum: sp.get(`flights[${idx}][flightNum]`),
            arrival: sp.get(`flights[${idx}][arrival]`),
            arrivalDate: sp.get(`flights[${idx}][arrivalDate]`),
            arrivalTime: sp.get(`flights[${idx}][arrivalTime]`),
            departure: sp.get(`flights[${idx}][departure]`),
            departureDate: sp.get(`flights[${idx}][departureDate]`),
            departureTime: sp.get(`flights[${idx}][departureTime]`),
            bookingCode: sp.get(`flights[${idx}][bookingCode]`),
            destination: sp.get(`flights[${idx}][arrival]`),
            origin: sp.get(`flights[${idx}][departure]`),
          });
          idx++;
        }

        const tripType = sp.get("tripType") || "oneway";
        const cabinType = sp.get("flightType") || sp.get("cabin") || "Economy";
        const adultsQ = parseInt(sp.get("adults")) || 1;
        const childrenQ = parseInt(sp.get("children")) || 0;
        const infantsQ = parseInt(sp.get("infants")) || 0;
        const departureDateQ = sp.get("depart") || journeysFromUrl[0]?.departureDate || null;
        const returnDateQ = sp.get("returnDate") || null;

        const params = {
          journeys: journeysFromUrl,
          tripType,
          cabinType,
          adults: adultsQ,
          children: childrenQ,
          infants: infantsQ,
          departureDate: departureDateQ,
          returnDate: returnDateQ,
          solutionId: sp.get("solutionId") || null,
          solutionKey: sp.get("solutionKey") || null,
          origin: sp.get("origin") || journeysFromUrl[0]?.origin || "",
          destination: sp.get("destination") || journeysFromUrl[0]?.destination || "",
          currency: sp.get("currency") || "USD",
        };

        console.info("Pricing with params", params);
        const priceResp = await flygasal.precisePricing(params);
        console.info("Pricing Resp: ", priceResp);

        // transformPreciseData returns [offer] when response contains `offer`
        const resp = flygasal.transformPreciseData(priceResp.data) || [];
        const offer = resp.offer;

        if (resp.errorCode !== "0" || resp.errorMsg !== "ok") {
          const msg = resp.errorMsg || "We couldn’t confirm pricing for this itinerary.";
          setError(msg);
          return;
        }

        // Prefer passenger counts from the offer
        if (offer.passengers) {
          setAdults(Number(offer.passengers.adults ?? adultsQ));
          setChildren(Number(offer.passengers.children ?? childrenQ));
          setInfants(Number(offer.passengers.infants ?? infantsQ));
        }

        // Group into legs by flightId (ordered by offer.flightIds)
        const legs = groupOfferByFlights(offer);
        if (!legs.length) {
          setError("We couldn’t confirm your selected flight. Please try again.");
          return;
        }

        // Derive outbound/return by leg index (future-safe for multi-city)
        const outbound = legs[0] || null;
        const returnFlight = tripType === "return" ? (legs[1] || null) : null;

        // Compute totals from single-offer price breakdown
        const currencyFromOffer = offer?.priceBreakdown?.currency || params.currency || "USD";
        const totalPrice = Number(offer?.priceBreakdown?.grandTotal || 0);

        // Build tripDetails from the offer (stop relying on URL past this point)
        setTripDetails({
          tripType,
          origin: offer.origin,
          destination: offer.destination,
          departDate: outbound?.departureTime ? toYMD(outbound.departureTime) : null,
          returnDate: returnFlight?.departureTime ? toYMD(returnFlight.departureTime) : null,
          fareSourceCode: offer?.solutionId || null,
          solutionId: offer?.solutionId || null,

          adults: offer?.passengers?.adults ?? adultsQ,
          children: offer?.passengers?.children ?? childrenQ,
          infants: offer?.passengers?.infants ?? infantsQ,

          currency: currencyFromOffer,
          outbound,
          return: returnFlight,
          totalPrice,
          legs, // keep all legs for future multi-city UI
          cancellation_policy:
            "Non-refundable after 24 hours. Cancellations within 24 hours of booking are refundable with a $50 fee.",
        });

        // Backend surfaced errors (mapped to friendly copy)
        const errorCode = priceResp?.data?.errorCode;
        const errorMsg = priceResp?.data?.errorMsg;
        if (errorCode) {
          if (errorCode === "B021") {
            setError("The selected fare is no longer available. Please choose another flight or tap Reprice.");
          } else if (errorCode === "B020") {
            setError("We couldn’t find pricing for this itinerary. Try different dates or refresh with Reprice.");
          } else {
            setError(errorMsg || "Failed to load booking details. Please try again.");
          }
        }
      } catch (e) {
        console.error("Error loading confirmation:", e);
        setError("Failed to load booking details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [location.search, repriceTrigger]);

  /* ---------- start & tick the 10-minute hold ---------- */
  useEffect(() => {
    if (!tripDetails) return;
    let stored = Number(sessionStorage.getItem(searchKey) || 0);
    const tooOld = !stored || stored - Date.now() <= 0 || stored - Date.now() > 15 * 60 * 1000;
    if (tooOld) {
      stored = Date.now() + 10 * 60 * 1000; // 10 minutes
      sessionStorage.setItem(searchKey, String(stored));
    }
    setHoldUntil(stored);
  }, [tripDetails, searchKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const reprice = () => {
    sessionStorage.removeItem(searchKey);
    setHoldUntil(0);
    setRepriceTrigger((x) => x + 1);
  };

  /* ---------- cancellation policy clamp ---------- */
  useEffect(() => {
    const p = document.querySelector(".to--be > p");
    if (p && p.scrollHeight > p.offsetHeight) setShowReadMore(true);
  }, [tripDetails]);

  /* ---------- event handlers ---------- */
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("traveler_")) {
      const [, field, idx] = name.split("_");
      setFormData((prev) => ({
        ...prev,
        travelers: prev.travelers.map((t, i) => (i === parseInt(idx, 10) ? { ...t, [field]: value } : t)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const addTraveler = (type) => {
    if (formData.travelers.length >= 9) return;
    setFormData((prev) => ({
      ...prev,
      travelers: [
        ...prev.travelers,
        {
          type,
          title: "",
          first_name: "",
          last_name: "",
          nationality: "",
          dob_month: "",
          dob_day: "",
          dob_year: "",
          passport: "",
          passport_issuance_month: "",
          passport_issuance_day: "",
          passport_issuance_year: "",
          passport_expiry_month: "",
          passport_expiry_day: "",
          passport_expiry_year: "",
        },
      ],
    }));
  };

  const removeTraveler = (index) => {
    const minTravelers = adults + children + infants;
    if (formData.travelers.length <= minTravelers) return;
    setFormData((prev) => ({
      ...prev,
      travelers: prev.travelers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agree_terms) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/flight/confirmation-success");
    }, 1200);
  };

  const typeMap = { adult: "ADT", child: "CHD", infant: "INF" };

  const handlePayment = async () => {
    if (holdExpired) {
      setError("Your fare hold has expired. Tap Reprice to refresh availability and pricing.");
      return;
    }
    if (!isFormValid || !tripDetails) return;

    setIsProcessing(true);
    try {
      const { outbound, return: rtn, totalPrice, currency } = tripDetails;

      const priceBreakdown = (totalPrice) => {
        const base = Number(totalPrice) || 0;
        const markup = +(base * (agentMarkupPercent / 100)).toFixed(2);
        const total = +(base + markup).toFixed(2);
        return { base, markup, total };
      };

      const { base, markup, total } = priceBreakdown(totalPrice);

      const bookingDetails = {
        selectedFlight: outbound,
        selectedReturnFlight: rtn || undefined,
        solutionId: tripDetails.solutionId || null,
        passengers: formData.travelers.map((t) => ({
          firstName: t.first_name,
          lastName: t.last_name,
          type: typeMap[t.type?.toLowerCase()] || "ADT",
          dob:
            t.dob_year && t.dob_month && t.dob_day
              ? `${t.dob_year}-${String(t.dob_month).padStart(2, "0")}-${String(t.dob_day).padStart(2, "0")}`
              : null,
          gender: t.gender || "Male",
          passportNumber: t.passport || null,
          passportExpiry:
            t.passport_expiry_year && t.passport_expiry_month && t.passport_expiry_day
              ? `${t.passport_expiry_year}-${String(t.passport_expiry_month).padStart(2, "0")}-${String(
                  t.passport_expiry_day
                ).padStart(2, "0")}`
              : null,
        })),
        contactName: formData.full_name,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        totalPrice: Number(totalPrice || 0) + Number(agentFee || 0),
        currency: currency || "USD",
        agent_fee: markup || 0,
        payment_method: formData.payment_method || "wallet",
      };

      const resp = await flygasal.createBooking(bookingDetails);
      const booking = resp?.data?.booking;

      if (booking?.order_num) {
        navigate(`/flight/booking/invoice/${booking.order_num}`);
      } else {
        const readable =
          resp?.data?.errorMsg || "Booking failed. Please try again or select a different flight.";
        throw new Error(readable);
      }
    } catch (err) {
      console.error("Flight booking error:", err);
      setError(err?.message || "We couldn’t complete your booking. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------- loading & error UI ---------- */
  if (error) {
    const backUrl = buildAvailabilitySearch(location.search);
    return (
      <ErrorState
        message={error}
        onBack={() => navigate(backUrl)}
        onRetry={() => window.location.reload()}
        onReprice={reprice}
        location={location}
      />
    );
  }

  if (loading || !tripDetails?.outbound) {
    return <AirLoading location={location} />;
  }

  /* ---------- render ---------- */
  const { tripType, outbound, return: returnFlight, totalPrice, cancellation_policy, currency } = tripDetails;
  const finalPrice = Number(totalPrice || 0) + Number(agentFee || 0);

  return (
    <div className="min-h-screen bg-slate-50 bg-[#F6F6F7]">
      {/* Header */}
      <BookingHeader
        searchParams={new URLSearchParams(location.search)}
        adults={adults}
        children={children}
        infants={infants}
        outbound={outbound}
        returnFlight={returnFlight}
        tripType={tripType}
        totalPrice={totalPrice}
        getAirportName={getAirportName}
        formatDate={formatDate}
      />

      {/* Main Content */}
      <div className="container px-0 lg:px-0 py-3" style={{ maxWidth: "785px" }}>
        <form onSubmit={handleSubmit}>
          <BookingForm
            searchParams={new URLSearchParams(location.search)}
            formData={formData}
            setFormData={setFormData}
            handleFormChange={handleFormChange}
            isSubmitting={isSubmitting}
            cancellation_policy={cancellation_policy}
            setCancellationPolicy={() => {}}
            showReadMore={showReadMore}
            setShowReadMore={setShowReadMore}
            adults={adults}
            children={children}
            infants={infants}
            setAdults={setAdults}
            setChildren={setChildren}
            setInfants={setInfants}
            addTraveler={addTraveler}
            removeTraveler={removeTraveler}
            countries={countries}
            months={months}
            days={days}
            dobYears={dobYears}
            issuanceYears={issuanceYears}
            expiryYears={expiryYears}
            showCancellation={showCancellation}
            setShowCancellation={setShowCancellation}
            getPassengerSummary={getPassengerSummary}
            tripType={tripType}
            outbound={outbound}
            formatDate={formatDate}
            formatDateMonth={formatDateMonth}
            formatTime={formatTime}
            getAirportName={getAirportName}
            getCityName={getCityName}
            getAirlineName={getAirlineName}
            getAirlineLogo={getAirlineLogo}
            returnFlight={returnFlight}
            calculateDuration={calculateDuration}
            isFormValid={isFormValid}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            totalPrice={totalPrice}
            finalPrice={finalPrice}
            setAgentFee={setAgentFee}
            agentFee={agentFee}
            isAgent={isAgent}
            agentMarkupPercent={agentMarkupPercent}
            currency={currency}
            handlePayment={handlePayment}
            holdExpired={holdExpired}
            timeLeftLabel={timeLeftLabel}
          />

          {/* Hidden Inputs */}
          <input
            type="hidden"
            name="booking_data"
            value={btoa(JSON.stringify({ cancellation_policy, adults, children, infants }))}
          />
          <input
            type="hidden"
            name="routes"
            value={btoa(
              JSON.stringify({
                segments: [
                  [
                    {
                      ...outbound,
                      departure_code: outbound.origin,
                      arrival_code: outbound.destination,
                      departure_time: formatTime(outbound.departureTime),
                      arrival_time: formatTime(outbound.arrivalTime),
                      flight_no: `${outbound?.segments?.[0]?.airline ?? outbound?.airline ?? ""}${
                        outbound?.segments?.[0]?.flightNum ?? outbound?.flightNumber ?? ""
                      }`,
                      class: outbound.cabin || "Economy",
                      img: getAirlineLogo(outbound.airline),
                      currency: outbound?.priceBreakdown?.currency || currency || "USD",
                      // Only one grandTotal overall; put it on outbound and 0 on return for display
                      price: outbound?.priceBreakdown?.grandTotal,
                    },
                  ],
                  tripType === "return" && returnFlight
                    ? [
                        {
                          ...returnFlight,
                          departure_code: returnFlight.origin,
                          arrival_code: returnFlight.destination,
                          departure_time: formatTime(returnFlight.departureTime),
                          arrival_time: formatTime(returnFlight.arrivalTime),
                          flight_no: `${returnFlight?.segments?.[0]?.airline ?? returnFlight?.airline ?? ""}${
                            returnFlight?.segments?.[0]?.flightNum ?? returnFlight?.flightNumber ?? ""
                          }`,
                          class: returnFlight.cabin || "Economy",
                          img: getAirlineLogo(returnFlight.airline),
                          currency: returnFlight?.priceBreakdown?.currency || currency || "USD",
                          price: 0, // single grandTotal already captured on outbound
                        },
                      ]
                    : [],
                ],
              })
            )}
          />
          <input type="hidden" name="travellers" value={btoa(JSON.stringify(formData.travelers))} />
        </form>
      </div>

      {/* Fullscreen overlay during submit */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-label="Processing payment"
            aria-live="assertive"
          >
            {/* circular flight path */}
            <div className="relative h-24 w-24" aria-hidden="true">
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              </svg>
              <motion.svg viewBox="0 0 100 100" className="absolute inset-0" initial={false}>
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#0ea5e9"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ strokeDashoffset: [251.2, 0, 125, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.svg>
              {/* plane rotating */}
              <motion.div
                className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-slate-800"
                style={{ transformOrigin: "50px 50px" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 16l20-8-9 9-2 5-3-4-6-2z" strokeWidth="1.2" />
                </svg>
              </motion.div>
            </div>

            <motion.div
              className="mt-4 text-sm font-medium text-slate-800"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Processing payment…
            </motion.div>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <motion.div
                className="h-full w-1/3 rounded-full bg-slate-800"
                animate={{ x: ["-30%", "130%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingDetail;
