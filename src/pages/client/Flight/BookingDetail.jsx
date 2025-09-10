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

/** Strong, stable identifier to recover flights even when IDs shift between search & pricing */
const keyOf = (f) =>
  [
    f?.airline || "",
    f?.flightNumber || "",
    new Date(f?.departureTime || 0).toISOString(),
    new Date(f?.arrivalTime || 0).toISOString(),
    f?.origin || "",
    f?.destination || "",
  ].join("|");

/* ----------------------- component ----------------------- */
const BookingDetail = () => {
  const { user } = useContext(AuthContext);
  const [agentData, setAgentData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [tripDetails, setTripDetails] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
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

  // --- NEW: 10-minute hold timer state ---
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
  // console.info('Agent markup: ', agentMarkupPercent);

  const [formData, setFormData] = useState(() => {
    // autosave restore
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

  /* ---------- parse counts & seed travelers ---------- */
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
  // const getAirportName = (code) => {
  //   const a = airports.find((x) => x.value === code);
  //   return a ? `${a.city} (${a.value})` : code || "—";
  // };
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

  /* ---------- fetch precise pricing & match flights (bugfix) ---------- */
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams(location.search);

        // Read journeys array from URL
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

        // Derive origin/destination from first journey (bug: these were undefined before)
        const derivedOrigin = journeysFromUrl[0]?.origin || sp.get("origin") || "";
        const derivedDestination = journeysFromUrl[0]?.destination || sp.get("destination") || "";

        const tripType = sp.get("tripType") || "oneway";
        const cabinType = sp.get("flightType") || sp.get("cabin") || "Economy";
        const adultsQ = parseInt(sp.get("adults")) || 1;
        const childrenQ = parseInt(sp.get("children")) || 0;
        const infantsQ = parseInt(sp.get("infants")) || 0;
        const departureDate = sp.get("depart") || journeysFromUrl[0]?.departureDate || null;
        const returnDate = sp.get("returnDate") || null;

        const solutionId = sp.get("solutionId") || null;
        const solutionKey = sp.get("solutionKey") || null;
        const flightId = sp.get("flightId") || null;
        const returnFlightId = sp.get("returnFlightId") || null;
        const currency = sp.get("currency") || "USD";

        const params = {
          journeys: journeysFromUrl,
          tripType,
          cabinType,
          adults: adultsQ,
          children: childrenQ,
          infants: infantsQ,
          departureDate,
          returnDate,
          solutionId,
          solutionKey,
          origin: derivedOrigin,        // <-- fix
          destination: derivedDestination, // <-- fix
          currency,
        };

        // 1) Price outbound
        const priceResp = await flygasal.precisePricing(params);
        const outboundFlights = flygasal.transformPreciseData(priceResp.data) || [];

        // 2) If roundtrip and we need return pricing, do a scoped call (some APIs require mirrored search)
        let returnFlights = [];
        if (tripType === "return" && returnDate) {
          const returnParams = {
            ...params,
            // Some providers expect reversed legs explicitly
            journeys: [
              {
                airline: journeysFromUrl[0]?.airline,
                flightNum: journeysFromUrl[0]?.flightNum,
                origin: params.destination,
                destination: params.origin,
                departureDate: returnDate,
                departureTime: "",
                arrivalDate: "",
                arrivalTime: "",
                bookingCode: journeysFromUrl[0]?.bookingCode,
              },
            ],
            departureDate: returnDate,
          };
          const retResp = await flygasal.precisePricing(returnParams);
          returnFlights = flygasal.transformPreciseData(retResp.data) || [];
        }

        const allFlights = [...outboundFlights, ...returnFlights];
        setAvailableFlights(allFlights);

        // Build fast indices for matching
        const byId = new Map(allFlights.filter((f) => f?.id).map((f) => [String(f.id), f]));
        const byKey = new Map(allFlights.map((f) => [keyOf(f), f]));

        // Find selected flights
        const selectedOutbound =
          (flightId && byId.get(String(flightId))) ||
          byKey.get(
            keyOf({
              airline: journeysFromUrl[0]?.airline,
              flightNumber: journeysFromUrl[0]?.flightNum,
              departureTime: `${journeysFromUrl[0]?.departureDate}T${journeysFromUrl[0]?.departureTime || "00:00"}`,
              arrivalTime: `${journeysFromUrl[0]?.arrivalDate}T${journeysFromUrl[0]?.arrivalTime || "00:00"}`,
              origin: derivedOrigin,
              destination: derivedDestination,
            })
          ) ||
          outboundFlights[0]; // graceful fallback

        let selectedReturn = null;
        if (tripType === "return" && returnDate) {
          selectedReturn =
            (returnFlightId && byId.get(String(returnFlightId))) ||
            // fallback: first return that goes destination -> origin on return date
            returnFlights.find(
              (f) =>
                f.origin === derivedDestination &&
                f.destination === derivedOrigin &&
                toYMD(f.departureTime) === toYMD(returnDate)
            ) ||
            returnFlights[0] ||
            null;
        }

        if (!selectedOutbound) {
          setError(`Outbound flight not found (ID: ${flightId || "n/a"}). Try reselecting your flight.`);
          return;
        }
        if (tripType === "return" && !selectedReturn) {
          setError(`Return flight not found (ID: ${returnFlightId || "n/a"}). Try reselecting your flight.`);
          return;
        }

        const totalPrice =
          Number(selectedOutbound?.price || 0) + Number(selectedReturn?.price || 0);

        setTripDetails({
          tripType,
          origin: params.origin,
          destination: params.destination,
          departDate: params.departureDate,
          returnDate: params.returnDate,
          fareSourceCode: params.flightId, // keep for compat if used elsewhere
          solutionId: params.solutionId,
          adults: adultsQ,
          children: childrenQ,
          infants: infantsQ,
          currency,
          outbound: selectedOutbound,
          return: selectedReturn,
          totalPrice,
          cancellation_policy:
            "Non-refundable after 24 hours. Cancellations within 24 hours of booking are refundable with a $50 fee.",
        });

        // Surface meaningful backend errors (after we try to set a workable state)
        const errorCode = priceResp?.data?.errorCode;
        const errorMsg = priceResp?.data?.errorMsg;
        if (errorCode) {
          if (errorCode === "B021") setError("The selected fare is no longer available. Please choose another flight.");
          else if (errorCode === "B020") setError("Cannot find any price for this flight.");
          else setError(errorMsg || "Failed to load booking details.");
        }
      } catch (e) {
        console.error("Error loading confirmation:", e);
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };
    run();
    // include repriceTrigger so "Reprice" can refresh pricing without changing the URL
  }, [location.search, repriceTrigger]);

  /* ---------- NEW: start & tick the 10-minute hold once trip is ready ---------- */
  useEffect(() => {
    if (!tripDetails) return;
    // restore existing hold for this flight selection (per-tab)
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
    // NEW: block if hold expired
    if (holdExpired) {
      setError("Your fare hold has expired. Click Reprice to refresh availability and pricing.");
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
        selectedFlight: outbound, // keep compatibility with your backend
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
      setError(err?.message || "We couldn’t complete your booking.");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------- loading & error UI ---------- */
  if (error) {
    return (
      <div className="container mx-auto px-4 py-14 mt-5">
        <div className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <div className="text-xl font-semibold">We hit a snag</div>
          <p className="mt-1 text-sm">{error}</p>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
              onClick={() => navigate("/flight/availability")}
            >
              Back to Flight Search
            </button>
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !tripDetails?.outbound) {
    return (
      <div className="container mx-auto px-4 py-10">
        {/* simple skeletons */}
        <div className="mb-4 h-40 w-full animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <div className="h-28 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="h-96 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="space-y-3">
            <div className="h-56 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  const { tripType, outbound, return: returnFlight, totalPrice, cancellation_policy, currency } = tripDetails;
  const finalPrice = Number(totalPrice || 0) + Number(agentFee || 0);

  return (
    <div className="min-h-screen bg-slate-50 bg-[#F6F6F7]">
      {/* Header */}
      <BookingHeader 
        outbound={outbound}
        returnFlight={returnFlight}
        tripType={tripType}
        totalPrice={totalPrice}
        getAirportName={getAirportName}
        formatDate={formatDate}
      />


      {/* Main Content */}
      <div className="container px-0 lg:px-0 py-3" style={{ maxWidth: "785px" }}>
        
          <form onSubmit={handleSubmit} className="">
            {/* Left Column: Booking Form */}
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

            {/* Right Column: Flight Details */}
            {/* <FlightDetails
              getPassengerSummary={getPassengerSummary}
              totalPrice={totalPrice}
              finalPrice={finalPrice}
              agentMarkupPercent={agentMarkupPercent}
              setAgentFee={setAgentFee}
              agentFee={agentFee}
              isAgent={isAgent}
              infants={infants}
              children={children}
              adults={adults}
              tripType={tripType}
              outbound={outbound}
              formatDate={formatDate}
              formatTime={formatTime}
              getAirportName={getAirportName}
              getCityName={getCityName}
              getAirlineName={getAirlineName}
              getAirlineLogo={getAirlineLogo}
              returnFlight={returnFlight}
              tripDetails={tripDetails}
              calculateDuration={calculateDuration}
              isFormValid={isFormValid}
              formData={formData}
              handlePayment={handlePayment}
              isProcessing={isProcessing}
              holdExpired={holdExpired}
              timeLeftLabel={timeLeftLabel}
              currency={currency}
            /> */}

            {/* Hidden Inputs */}
            <input type="hidden" name="booking_data" value={btoa(JSON.stringify({ cancellation_policy, adults, children, infants }))} />
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
                        flight_no: outbound.flightNumber,
                        class: outbound.cabin || 'Economy',
                        img: getAirlineLogo(outbound.airline),
                        currency: 'USD',
                        price: outbound.price,
                      },
                    ],
                    tripType === 'return' && returnFlight
                      ? [
                          {
                            ...returnFlight,
                            departure_code: returnFlight.origin,
                            arrival_code: returnFlight.destination,
                            departure_time: formatTime(returnFlight.departureTime),
                            arrival_time: formatTime(returnFlight.arrivalTime),
                            flight_no: returnFlight.flightNumber,
                            class: returnFlight.cabin || 'Economy',
                            img: getAirlineLogo(returnFlight.airline),
                            currency: 'USD',
                            price: returnFlight.price,
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

      {/* Fullscreen spinner during mock submit */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-12 w-12 rounded-full border-4 border-blue-700 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingDetail;
