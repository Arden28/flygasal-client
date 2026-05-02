import React, { useCallback, useEffect, useRef, useState } from "react";
import FlightDetailsCard from "./FlightDetailsCard";
import FareRulesCard from "./FareRulesCard";
import ContactDetailsCard from "./ContactDetailsCard";
import PassengerDetailsCard from "./PassengerDetailsCard";
import PaymentSelectionCard from "./PaymentSelectionCard";
import PriceBreakdownCard from "./PriceBreakdownCard";

// define brand color for reuse
const BRAND_ORANGE = "#F68221";
const BRAND_ORANGE_HOVER = "#E96806"; // slightly darker for hover effect

const BookingForm = ({
  flight,
  tripDetails,
  formData,
  setFormData,
  handleFormChange, 
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
  getAirlineLogo,
  getAirlineName,
  outbound,
  returnFlight,
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
      if (typeof setFormData === "function") {
        setFormData(next);
      } else if (typeof handleFormChange === "function") {
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

      // Special case: Travelers array update from PassengerDetailsCard
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

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  /* ---------------- Share Modal state (unchanged logic) ---------------- */
  const [showShare, setShowShare] = useState(false);
  const [openSections, setOpenSections] = useState({
    contact: false, fare: false, outbound: false, return: false,
  });

  const toggleAccordion = useCallback((key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Close share modal on ESC
  useEffect(() => {
    if (!showShare) return;
    const onKey = (e) => { if (e.key === "Escape") setShowShare(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showShare]);

  const buttonEnabled = isFormValid && !isProcessing;

  return (
    <div className="px-2 sm:px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8">
        {/* LEFT column */}
        <main className="lg:col-start-1 lg:col-span-7 xl:col-start-1 xl:col-span-8 space-y-4">
          <FareRulesCard 
            flight={flight} 
            tripDetails={tripDetails}
            outbound={outbound} 
            returnFlight={returnFlight} 
            tripType={tripType} 
            openSections={openSections} 
            toggleAccordion={toggleAccordion} 
            getAirportName={getAirportName} 
          />
          <PassengerDetailsCard formData={draftForm} handleFormChange={bufferedFormChange} adults={adults} children={children} infants={infants} addTraveler={addTraveler} removeTraveler={removeTraveler} countries={countries} months={months} days={days} dobYears={dobYears} issuanceYears={issuanceYears} expiryYears={expiryYears} getAirlineLogo={getAirlineLogo} getPassengerSummary={getPassengerSummary} />
          <ContactDetailsCard formData={draftForm} handleFormChange={bufferedFormChange} />
          <PaymentSelectionCard formData={draftForm} handleFormChange={bufferedFormChange} isFormValid={isFormValid} totalPrice={totalPrice} />
          <PriceBreakdownCard tripDetails={tripDetails} formData={draftForm} totalPrice={totalPrice} isAgent={isAgent} agentMarkupPercent={agentMarkupPercent} currency={currency} />

          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            By clicking the <b>“Book now”</b> button above you confirm you have read and accepted the{" "}
            <b>Terms and Conditions</b> and the <b>Fare Rules</b> of your booking.
          </p>
        </main>

      {/* RIGHT column — Flight card (sticky on desktop) */}
        <aside className="lg:col-start-8 lg:col-span-5 xl:col-start-9 xl:col-span-4 lg:sticky lg:top-24 space-y-3">
          <FlightDetailsCard flight={flight} tripDetails={tripDetails} outbound={outbound} returnFlight={returnFlight} tripType={tripType} openSections={openSections} toggleAccordion={toggleAccordion} getAirportName={getAirportName} formatDate={formatDate} formatTime={formatTime} getAirlineLogo={getAirlineLogo} getAirlineName={getAirlineName} getCityName={getCityName} calculateDuration={calculateDuration} />

          <div className="text-center mb-2">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">All flight times displayed are local</span>
          </div>
          <div className="text-center mb-3">
            
            {/* Disabled hint tooltip */}
            {!buttonEnabled && !isProcessing && (
              <div className="text-xs font-semibold text-amber-600 w-full text-center pointer-events-none transition-opacity duration-300">
                Please complete all required fields
              </div>
            )}
          </div>

          {/* Book button block */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handlePayment(draftForm)}
              disabled={!buttonEnabled}
              className={`w-full font-semibold py-2.5 px-4 rounded-full transition-all duration-200 text-[13px] tracking-wide uppercase flex items-center justify-center
                ${buttonEnabled
                  ? "text-white hover:shadow-orange-500/40 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-80 shadow-none"
                }`}
              style={buttonEnabled ? {
                backgroundColor: BRAND_ORANGE,
              } : {}}
              onMouseEnter={(e) => {
                if(buttonEnabled) e.currentTarget.style.backgroundColor = BRAND_ORANGE_HOVER;
              }}
              onMouseLeave={(e) => {
                if(buttonEnabled) e.currentTarget.style.backgroundColor = BRAND_ORANGE;
              }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className={`animate-spin h-5 w-5 mr-2 ${buttonEnabled ? 'text-white' : 'text-slate-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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