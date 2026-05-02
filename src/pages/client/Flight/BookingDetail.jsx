import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BookingHeader from "../../../components/client/Flight/BookingHeader";
import BookingForm from "../../../components/client/Flight/BookingForm";
import { airports, airlines, countries } from "../../../data/fakeData";
import flygasal from "../../../api/flygasalService";
import { AuthContext } from "../../../context/AuthContext";

/* ----------------------- constants ----------------------- */
const months = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" }, { value: "04", label: "April" },
  { value: "05", label: "May" }, { value: "06", label: "June" },
  { value: "07", label: "July" }, { value: "08", label: "August" },
  { value: "09", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];
const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, "0"), label: String(i + 1).padStart(2, "0") }));
const dobYears = Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => ({ value: String(new Date().getFullYear() - i), label: String(new Date().getFullYear() - i) }));
const issuanceYears = dobYears;
const expiryYears = Array.from({ length: 21 }, (_, i) => ({ value: String(new Date().getFullYear() + i), label: String(new Date().getFullYear() + i) }));

/* ----------------------- utils ----------------------- */
const toYMD = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Navigates safely back to the search page, removing checkout-specific state */
const buildAvailabilitySearch = (search) => {
  const keep = new URLSearchParams(search);
  ["offer", "markupPercent", "markupAmount", "grandTotal"].forEach((k) => keep.delete(k));
  const q = keep.toString();
  return `/flight/availability${q ? `?${q}` : ""}`;
};

/* ======================================================
   AirLoading — centered, modern, brand-colored
   ====================================================== */
const AirLoading = () => {
  const BRAND = "#F68221";

  return (
    <div className="min-h-screen bg-[#F6F6F7]">
      <div className="container mx-auto px-4">
        <div className="flex min-h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm" role="status" aria-live="polite"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ backgroundColor: "#FFF3E8", border: "1px solid #FED7B4", color: BRAND }}>
              <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
                <path d="M12 4v2a6 6 0 016 6h2c0-4.418-3.582-8-8-8z" fill="currentColor" />
                <path d="M12 20v-2a6 6 0 01-6-6H4c0 4.418 3.582 8 8 8z" fill="currentColor" opacity=".55" />
              </motion.svg>
            </div>
            <h2 className="mt-5 text-center text-lg font-semibold text-zinc-900">Confirming itinerary</h2>
            <p className="mt-1 text-center text-sm text-zinc-600">Verifying live prices and seat availability…</p>
            <div className="mx-auto mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-zinc-200" aria-hidden="true">
              <motion.div className="h-full w-1/3 rounded-full" style={{ backgroundColor: BRAND }} animate={{ x: ["-30%", "130%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   Modern Error State
   ====================================================== */
const ErrorState = ({ message, onBack, onReprice }) => {
  const BRAND = "#F68221";

  return (
    <div className="min-h-screen bg-[#F6F6F7]">
      <div className="container mx-auto px-4">
        <div className="flex min-h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm" role="alertdialog"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ backgroundColor: "#FFF3E8", border: "1px solid #FED7B4", color: BRAND }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
              </svg>
            </div>

            <h3 className="mt-5 text-center text-lg font-semibold text-zinc-900">We couldn’t secure this fare</h3>
            <p className="mt-1 text-center text-sm text-zinc-600">{message}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button className="rounded-lg px-4 py-2 text-white shadow-sm hover:bg-[#E96806] transition-colors" style={{ backgroundColor: BRAND }} onClick={onBack}>
                Back to Search
              </button>
              {onReprice && (
                <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50 transition-colors" onClick={onReprice}>
                  Refresh Pricing
                </button>
              )}
            </div>

            <details className="mx-auto mt-4 w-full text-xs text-zinc-600">
              <summary className="cursor-pointer select-none text-zinc-700">Why did this happen?</summary>
              <ul className="mt-2 list-disc pl-5">
                <li>The fare sold out while you were reviewing it.</li>
                <li>The airline changed the price dynamically.</li>
                <li>A temporary network hiccup interrupted the request to the airline.</li>
              </ul>
            </details>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   Booking Detail Component
   ====================================================== */
const BookingDetail = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [tripDetails, setTripDetails] = useState(null);
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [isAgent, setIsAgent] = useState(false);
  const [agentFee, setAgentFee] = useState(0);

  const [showCancellation, setShowCancellation] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Timer State
  const [holdUntil, setHoldUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [repriceTrigger, setRepriceTrigger] = useState(0);
  
  const searchKey = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return `bc_hold:${sp.get("tripType") || "flight"}:${Date.now()}`;
  }, [location.search, repriceTrigger]); // Tie it to repriceTrigger to restart the clock on reprice

  const timeLeftMs = Math.max(0, holdUntil - now);
  const holdExpired = timeLeftMs <= 0;
  const mm = String(Math.floor(timeLeftMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((timeLeftMs % 60000) / 1000)).padStart(2, "0");
  const timeLeftLabel = `${mm}:${ss}`;

  const agentMarkupPercent = user?.agency_markup || 0;

  // Retrieve raw offer from URL
  const initialOffer = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const offerStr = sp.get("offer");
      return offerStr ? JSON.parse(offerStr) : null;
    } catch (e) {
      console.error("Failed to parse initial offer from URL.");
      return null;
    }
  }, [location.search]);

  const draftKey = `bookingFormDraft:${initialOffer?.id || "draft"}`;
  const [formData, setFormData] = useState(() => {
    const cached = localStorage.getItem(draftKey);
    return cached ? JSON.parse(cached) : {
      full_name: "", email: "", phone: "", travelers: [], payment_method: "", agree_terms: true,
    };
  });

  useEffect(() => { setIsAgent(user?.role === "agent"); }, [user]);

// Seed Travelers based on Initial Offer Passengers
  useEffect(() => {
    if (!initialOffer) return;
    const a = initialOffer.passengers?.adults || 1;
    const c = initialOffer.passengers?.children || 0;
    const i = initialOffer.passengers?.infants || 0;

    setAdults(a); setChildren(c); setInfants(i);

    setFormData((prev) => {
      if (prev.travelers?.length) return prev;
      const mk = (type) => ({
        type, gender: "", first_name: "", last_name: "", nationality: "",
        dob_month: "", dob_day: "", dob_year: "", passport: "",
        passport_issuance_month: "", passport_issuance_day: "", passport_issuance_year: "",
        passport_expiry_month: "", passport_expiry_day: "", passport_expiry_year: "",
      });
      return {
        ...prev,
        travelers: [ ...Array(a).fill(0).map(() => mk("adult")), ...Array(c).fill(0).map(() => mk("child")), ...Array(i).fill(0).map(() => mk("infant")) ],
      };
    });
  }, [initialOffer]);

  useEffect(() => { localStorage.setItem(draftKey, JSON.stringify(formData)); }, [formData, draftKey]);

  // Form Validation Logic
  useEffect(() => {
    const requiredTravelers = adults + children + infants;
    
    // Check if a single traveler has all required fields filled
    const travelerComplete = (t) => 
      t.gender && 
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

    // The form is valid ONLY if all sections are completed
    const isValid = 
      formData.full_name && 
      formData.email && 
      formData.phone && 
      formData.agree_terms && 
      formData.payment_method &&
      formData.travelers.length >= requiredTravelers && 
      formData.travelers.every(travelerComplete);
      
    setIsFormValid(Boolean(isValid));
  }, [formData, adults, children, infants]);

  /* ---------- Helpers ---------- */
  const getAirportName = (code) => airports.find((x) => x.value === code)?.label || code || "—";
  const getCityName = (code) => airports.find((x) => x.value === code)?.city || code || "—";
  const getAirlineName = (code) => airlines.find((x) => x.code === code)?.name || code || "—";
  const getAirlineLogo = (code) => airlines.find((x) => x.code === code)?.logo || "/assets/img/airlines/placeholder.png";
  const formatTime = (s) => s ? new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";
  const formatDate = (s) => s ? new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
  const formatDateMonth = (s) => s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const calculateDuration = (mins) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  };
  const getPassengerSummary = (a, c, i) => [a > 0 && `${a} Adult${a > 1 ? "s" : ""}`, c > 0 && `${c} Child${c > 1 ? "ren" : ""}`, i > 0 && `${i} Infant${i > 1 ? "s" : ""}`].filter(Boolean).join(", ");

/* ---------- Fetch Precise Pricing ---------- */
  useEffect(() => {
    const fetchPricing = async () => {
      if (!initialOffer) {
        setError("Invalid flight selection. Please return to the search page.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const sp = new URLSearchParams(location.search);

        const reqAdults = Number(initialOffer.passengers?.adults || sp.get("adults") || 1);
        const reqChildren = Number(initialOffer.passengers?.children || sp.get("children") || 0);
        const reqInfants = Number(initialOffer.passengers?.infants || sp.get("infants") || 0);
        
        setAdults(reqAdults);
        setChildren(reqChildren);
        setInfants(reqInfants);

        // Reconstruct the journeys payload EXACTLY as PKFare expects it
        const journeys = (initialOffer.summary?.legs || []).map((leg) =>
          (leg.segments || []).map((seg) => {
            
            // Helper to get time in HH:mm format
            const getTimeOnly = (isoStr) => {
                if (!isoStr) return "";
                const d = new Date(isoStr);
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            };

            return {
              airline: seg.airline || "",
              // Ensure we use flightNum (PKFare format), falling back to flightNo
              flightNum: seg.flightNum || seg.flightNo || "",
              arrival: seg.arrival || "",
              // PKFare expects string dates like "2024-12-15"
              arrivalDate: seg.strArrivalDate || (seg.arrivalIso ? toYMD(seg.arrivalIso) : ""),
              // PKFare expects string times like "20:10"
              arrivalTime: seg.strArrivalTime || (seg.arrivalIso ? getTimeOnly(seg.arrivalIso) : ""),
              departure: seg.departure || "",
              departureDate: seg.strDepartureDate || (seg.departureIso ? toYMD(seg.departureIso) : ""),
              departureTime: seg.strDepartureTime || (seg.departureIso ? getTimeOnly(seg.departureIso) : ""),
              bookingCode: seg.bookingCode || "",
            };
          })
        );

        const params = {
          journeys,
          solutionId: initialOffer.solutionId || "",
          solutionKey: initialOffer.solutionKey || "",
          adults: reqAdults,
          children: reqChildren,
          infants: reqInfants,
          cabinType: initialOffer.cabin || "Economy",
          tag: "",
        };

        const priceResp = await flygasal.precisePricing(params);
        console.info('Precise pricing response:', priceResp);

        const preciseOffer = priceResp.offer;

        if (!preciseOffer || preciseOffer.error) {
          setError("We couldn’t confirm your selected flight. It may have sold out.");
          return;
        }

        setFlight(preciseOffer);

        setTripDetails({
          tripType: sp.get("tripType") || (preciseOffer.summary?.legs?.length > 1 ? "return" : "oneway"),
          origin: preciseOffer.origin,
          destination: preciseOffer.destination,
          departDate: preciseOffer.departureTime ? toYMD(preciseOffer.departureTime) : null,
          returnDate: preciseOffer.summary?.legs?.[1]?.departureTime ? toYMD(preciseOffer.summary.legs[1].departureTime) : null,

          solutionId: preciseOffer.solutionId,
          currency: preciseOffer.priceBreakdown?.currency || "USD",

          outbound: preciseOffer.summary?.legs?.[0] || null,
          return: preciseOffer.summary?.legs?.[1] || null,
          legs: preciseOffer.summary?.legs || [],

          totalPrice: preciseOffer.priceBreakdown?.totals?.grand || 0,
          cancellation_policy: "Non-refundable after 24 hours. Cancellations within 24 hours of booking are refundable with a $50 fee.",
        });

      } catch (e) {
        console.error("Error loading confirmation:", e);

        // Handle Laravel Validation Errors (HTTP 422)
        if (e?.response?.status === 422) {
          const validationErrors = e.response.data.errors;
          const firstError = Object.values(validationErrors).flat()[0];
          setError(`Data Error: ${firstError}`);
          return;
        }

        const errCode = e?.response?.data?.code;
        const errMsg = e?.response?.data?.message;

        if (errCode === "B021") {
          setError("The selected fare is no longer available. Please choose another flight or tap Refresh Pricing.");
        } else if (errCode === "B017" || errCode === "B005") {
          setError("The airline has updated the price for this itinerary. Tap Refresh Pricing to get the latest fare.");
        } else if (errMsg) {
          setError(errMsg);
        } else {
          setError("Failed to communicate with the airline. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [initialOffer, repriceTrigger, location.search]);

  /* ---------- Timer ---------- */
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

  const handleReprice = () => {
    sessionStorage.removeItem(searchKey);
    setHoldUntil(0);
    setRepriceTrigger((x) => x + 1);
  };

  /* ---------- Submission & Payment ---------- */
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
      travelers: [...prev.travelers, {
        type, gender: "", first_name: "", last_name: "", nationality: "",
        dob_month: "", dob_day: "", dob_year: "", passport: "",
        passport_issuance_month: "", passport_issuance_day: "", passport_issuance_year: "",
        passport_expiry_month: "", passport_expiry_day: "", passport_expiry_year: "",
      }],
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
  };

  const typeMap = { adult: "ADT", child: "CHD", infant: "INF" };

  const handlePayment = async (formOverride) => {
    if (holdExpired) {
      setError("Your fare hold has expired. Tap Refresh Pricing to lock in live availability.");
      return;
    }
    if (!tripDetails || !flight) return;

    const workingForm = formOverride ?? formData;
    setIsProcessing(true);

    try {
      const bookingDetails = {
        solutionId: flight.solutionId,
        selectedFlight: flight,
        passengers: (workingForm.travelers || []).map((t) => ({
          firstName: t.first_name,
          lastName: t.last_name,
          nationality: t.nationality,
          type: typeMap[t.type?.toLowerCase()] || "ADT",
          dob: t.dob_year && t.dob_month && t.dob_day ? `${t.dob_year}-${String(t.dob_month).padStart(2, "0")}-${String(t.dob_day).padStart(2, "0")}` : null,
          
          // FIX: Map "Male" to "M" and "Female" to "F" for Laravel/PKFare
          gender: t.gender || "M", 
          
          passportNumber: t.passport || null,
          passportExpiry: t.passport_expiry_year && t.passport_expiry_month && t.passport_expiry_day
              ? `${t.passport_expiry_year}-${String(t.passport_expiry_month).padStart(2, "0")}-${String(t.passport_expiry_day).padStart(2, "0")}` : null,
        })),
        contactName: workingForm.full_name,
        contactEmail: workingForm.email,
        contactPhone: workingForm.phone,
        totalPrice: Number(tripDetails.totalPrice || 0) + Number(agentFee || 0),
        currency: tripDetails.currency || "USD",
        agent_fee: agentFee || 0,
        payment_method: workingForm.payment_method || "wallet",
      };

      const resp = await flygasal.createBooking(bookingDetails);
      const booking = resp?.booking;

      if (booking?.order_num) {
        navigate(`/flight/booking/invoice/${booking.order_num}`);
      } else {
        throw new Error(resp?.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Flight booking error:", err);
      
      // Because we updated Laravel, we no longer need the complex 422 parsing. 
      // Laravel now sends beautiful strings directly into err.response.data.message!
      const errMsg = err?.response?.data?.message || err?.message;
      
      setError(errMsg || "We couldn’t complete your booking. Please check your form and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------- Render Logic ---------- */
  if (error) {
    const backUrl = buildAvailabilitySearch(location.search);
    return <ErrorState message={error} onBack={() => navigate(backUrl)} onReprice={handleReprice} />;
  }

  if (loading || !tripDetails?.outbound) {
    return <AirLoading />;
  }

  const { tripType, outbound, return: returnFlight, totalPrice, cancellation_policy, currency } = tripDetails;
  
  // Calculate specific markup and final values
  const markupAmount = +((totalPrice) * (agentMarkupPercent / 100)).toFixed(2);
  const finalPrice = totalPrice + markupAmount;

  return (
    <div className="min-h-screen bg-slate-50 bg-[#F6F6F7]">
      <BookingHeader
        searchParams={new URLSearchParams(location.search)}
        adults={adults}
        children={children}
        infants={infants}
        outbound={outbound}
        returnFlight={returnFlight}
        tripType={tripType}
        totalPrice={totalPrice}
        isAgent={isAgent}
        agentMarkupPercent={agentMarkupPercent}
        getAirportName={getAirportName}
        formatDate={formatDate}
      />

      <div className="container px-0 lg:px-0 py-3">
        <form onSubmit={handleSubmit}>
          <BookingForm
            flight={flight}
            tripDetails={tripDetails}
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
        </form>
      </div>

      {/* Fullscreen Overlay During Submit */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-label="Processing payment" aria-live="assertive"
          >
            <div className="relative h-24 w-24" aria-hidden="true">
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              </svg>
              <motion.svg viewBox="0 0 100 100" className="absolute inset-0" initial={false}>
                <motion.circle cx="50" cy="50" r="40" stroke="#F68221" strokeWidth="8" strokeDasharray="251.2" strokeLinecap="round" fill="none" animate={{ strokeDashoffset: [251.2, 0, 125, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              </motion.svg>
              <motion.div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-zinc-800" style={{ transformOrigin: "50px 50px" }} animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 16l20-8-9 9-2 5-3-4-6-2z" strokeWidth="1.2" />
                </svg>
              </motion.div>
            </div>
            <motion.div className="mt-4 text-sm font-medium text-zinc-800" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>Securing your booking…</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingDetail;