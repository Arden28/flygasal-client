import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FlightDetailsCard from "./FlightDetailsCard";
import FareRulesCard from "./FareRulesCard";
import ContactDetailsCard from "./ContactDetailsCard";
import PassengerDetailsCard from "./PassengerDetailsCard";
import PaymentSelectionCard from "./PaymentSelectionCard";
import PriceBreakdownCard from "./PriceBreakdownCard";

const BookingForm = ({
  flight,
  tripDetails,
  searchParams,
  formData,
  setFormData,
  handleFormChange, // parent-level handler that was firing on every keystroke
  isSubmitting,
  cancellation_policy,
  setCancellationPolicy,
  showReadMore,
  setShowReadMore,
  adults,
  children,
  infants,
  addTraveler,
  removeTraveler,
  countries,
  months,
  days,
  dobYears,
  issuanceYears,
  expiryYears,
  showCancellation,
  setShowCancellation,
  getAirlineLogo,
  getAirlineName,
  outbound,
  returnFlight,
  formatDateMonth,
  formatDate,
  formatTime,
  getCityName,
  getAirportName,
  getPassengerSummary,
  tripType,
  calculateDuration,
  isFormValid,
  totalPrice,
  isAgent,
  agentMarkupPercent,
  handlePayment,
  isProcessing,
  currency,
}) => {
  /* ---------------- Local draft form (prevents parent-driven remounts) ---------------- */
  const [draftForm, setDraftForm] = useState(formData || {});
  const debounceTimer = useRef(null);

  // keep local draft in sync if parent replaces formData wholesale (e.g., load/prefill)
  useEffect(() => {
    setDraftForm(formData || {});
  }, [formData]);

  // debounce helper to push local -> parent
  const flushToParent = useCallback(
    (next) => {
      // Prefer setFormData if provided; fall back to synthetic event handler if that’s what the parent expects
      if (typeof setFormData === "function") {
        setFormData(next);
      } else if (typeof handleFormChange === "function") {
        // Send a single "root form" change if parent is built around a synthetic event
        handleFormChange({ target: { name: "__form__", value: next } });
      }
    },
    [setFormData, handleFormChange]
  );

  // buffered change handler passed to children
  const bufferedFormChange = useCallback(
    (e) => {
      // Normalize (supports both {target:{name,value}} and direct object patches)
      if (e && e.target && typeof e.target.name === "string") {
        const { name, value } = e.target;
        const next = { ...draftForm, [name]: value };
        setDraftForm(next);

        // Debounce parent sync (keystroke-safe)
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => flushToParent(next), 300);
        return;
      }

      // Special case: your PassengerDetailsCard calls with { target: { name: "travelers", value: nextArray } }
      if (e && e.target && e.target.name === "travelers") {
        const next = { ...draftForm, travelers: e.target.value };
        setDraftForm(next);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => flushToParent(next), 300);
        return;
      }

      // If a component passes the whole partial object directly (rare)
      if (e && typeof e === "object" && !e.target) {
        const next = { ...draftForm, ...e };
        setDraftForm(next);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => flushToParent(next), 300);
      }
    },
    [draftForm, flushToParent]
  );

  // Make sure we don’t leave timers around
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  /* ---------------- Share Modal state (unchanged logic) ---------------- */
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState({
    contact: false,
    fare: false,
    outbound: false,
    return: false,
  });

  const money = (n, currency = "USD") =>
    (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency });

  const toggleAccordion = useCallback((key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Build a clean share URL + message from current context
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (
      window.location?.href ||
      `${window.location.origin}/flight/booking/details?${searchParams?.toString?.() || ""}`
    );
  }, [searchParams]);

  const shareTitle = useMemo(() => {
    const from = getCityName(outbound?.origin) || outbound?.origin || "";
    const to = getCityName(outbound?.destination) || outbound?.destination || "";
    return `Trip to ${to} from ${from}`;
  }, [outbound, getCityName]);

  const shareSubtitle = useMemo(() => {
    const base = `${getCityName(outbound?.origin)} → ${getCityName(outbound?.destination)} • ${formatDate(
      outbound?.departureTime
    )}`;
    if (tripType === "return" && returnFlight) {
      return `${base} · Return ${formatDate(returnFlight?.departureTime)}`;
    }
    return base;
  }, [outbound, returnFlight, tripType, getCityName, formatDate]);

  const shareText = useMemo(() => {
    return `${shareSubtitle}\n${getPassengerSummary(adults, children, infants)} • ${
      outbound?.cabin || "Economy"
    }`;
  }, [shareSubtitle, getPassengerSummary, adults, children, infants, outbound]);

  // Handle copying link
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }, [shareUrl]);

  // Native share (when available)
  const shareNative = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // user cancelled or not available
      }
    }
    setShowShare(true);
  }, [shareTitle, shareText, shareUrl]);

  // Close on ESC (share modal only)
  useEffect(() => {
    if (!showShare) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowShare(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showShare]);

  return (
    <div className="px-2 sm:px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8">
        {/* LEFT column */}
        <main className="lg:col-start-1 lg:col-span-7 xl:col-start-1 xl:col-span-8 space-y-4">
          {/* Fare Rules */}
          <FareRulesCard
            flight={flight}
            outbound={outbound}
            returnFlight={returnFlight}
            tripType={tripType}
            openSections={openSections}
            toggleAccordion={toggleAccordion}
            getAirportName={getAirportName}
          />

          {/* Passenger Details — uses LOCAL DRAFT + BUFFERED HANDLER */}
          <PassengerDetailsCard
            formData={draftForm}
            handleFormChange={bufferedFormChange}
            adults={adults}
            children={children}
            infants={infants}
            addTraveler={addTraveler}
            removeTraveler={removeTraveler}
            countries={countries}
            months={months}
            days={days}
            dobYears={dobYears}
            issuanceYears={issuanceYears}
            expiryYears={expiryYears}
            getAirlineLogo={getAirlineLogo}
            getPassengerSummary={getPassengerSummary}
          />

          {/* Contact Details — same buffering */}
          <ContactDetailsCard formData={draftForm} handleFormChange={bufferedFormChange} />

          {/* Payment Selection — same buffering */}
          <PaymentSelectionCard
            formData={draftForm}
            handleFormChange={bufferedFormChange}
            isFormValid={isFormValid}
            totalPrice={totalPrice}
          />

          {/* Price Breakdown (read-only props) */}
          <PriceBreakdownCard
            formData={draftForm}
            totalPrice={totalPrice}
            isAgent={isAgent}
            agentMarkupPercent={agentMarkupPercent}
            currency={currency}
          />

          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            By clicking the <b>“Book now”</b> button above you confirm you have read and accepted the{" "}
            <b>Terms and Conditions</b> and the <b>Fare Rules</b> of your booking.
          </p>
        </main>

        {/* RIGHT column — Flight card (sticky on desktop) */}
        <aside className="lg:col-start-8 lg:col-span-5 xl:col-start-9 xl:col-span-4 lg:sticky lg:top-24 space-y-3">
          <FlightDetailsCard
            flight={flight}
            tripDetails={tripDetails}
            // shareNative={shareNative}
            outbound={outbound}
            returnFlight={returnFlight}
            tripType={tripType}
            openSections={openSections}
            toggleAccordion={toggleAccordion}
            getAirportName={getAirportName}
            formatDate={formatDate}
            formatTime={formatTime}
            getAirlineLogo={getAirlineLogo}
            getAirlineName={getAirlineName}
            getCityName={getCityName}
            calculateDuration={calculateDuration}
          />

          <div className="text-center mb-2">
            <span className="text-xs sm:text-sm text-slate-500">
              All flight times displayed are local
            </span>
          </div>

          {/* Book button */}
          <div className="checkout-btn mb-1">
            <button
              type="button"
              onClick={() => handlePayment(draftForm.payment_method)}
              disabled={!isFormValid || !draftForm.payment_method || isProcessing}
              className="btn w-full bg-[#0ea5e9] text-white font-semibold py-3 px-4 rounded-2xl hover:bg-[#1982FF] transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Book Now"
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookingForm;
