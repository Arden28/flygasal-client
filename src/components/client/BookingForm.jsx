import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentMethod from './PaymentMethod';
import TravelerInformation from './TravelerInformation';

const BookingForm = ({
  searchParams,
  formData,
  setFormData,
  handleFormChange,
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
  totalPrice
}) => {
  /* ---------------- Share Modal state ---------------- */
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build a clean share URL + message from current context
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    // Prefer current URL (already contains all params). Fallback to reconstruct from searchParams.
    return window.location?.href || (`${window.location.origin}/flight/booking-confirmation?${searchParams?.toString?.() || ''}`);
  }, [searchParams]);

  const shareTitle = useMemo(() => {
    const from = getCityName(outbound?.origin) || outbound?.origin || '';
    const to = getCityName(outbound?.destination) || outbound?.destination || '';
    return `Trip to ${to} from ${from}`;
  }, [outbound, getCityName]);

  const shareSubtitle = useMemo(() => {
    const base = `${getCityName(outbound?.origin)} → ${getCityName(outbound?.destination)} • ${formatDate(outbound?.departureTime)}`;
    if (tripType === 'return' && returnFlight) {
      return `${base} · Return ${formatDate(returnFlight?.departureTime)}`;
    }
    return base;
  }, [outbound, returnFlight, tripType, getCityName, formatDate]);

  const shareText = useMemo(() => {
    return `${shareSubtitle}\n${getPassengerSummary(adults, children, infants)} • ${outbound?.cabin || 'Economy'}`;
  }, [shareSubtitle, getPassengerSummary, adults, children, infants, outbound]);

  // Handle copying link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  };

  // Native share (when available)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // user cancelled or not available
      }
    }
    setShowShare(true);
  };

  // Close on ESC
  useEffect(() => {
    if (!showShare) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowShare(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showShare]);

  return (
    <div className="w-full lg:w-2/3">
      {/* Personal Information */}
      <motion.div
        className="form-box bg-white rounded-3 shadow-md p-3 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-title-wrap p-0 d-flex justify-between mb-2 border-0">
          <h3 className="title fs-3 font-bold text-gray-800 mb-6">Your Trip</h3>

          {/* Share button – keep same look, make it work */}
          <span
            className="btn btn-secondary cursor-pointer d-inline-flex align-items-center gap-2"
            onClick={shareNative}
            role="button"
            aria-haspopup="dialog"
            aria-expanded={showShare ? 'true' : 'false'}
            aria-controls="share-dialog"
            title="Share this trip"
          >
            <i className="bi bi-share-fill"></i> Share
          </span>
        </div>

        <div className="justify-content-between d-flex mb-4">
          <div className="text-start">
            <span>
              {getCityName(outbound.origin)} to {getCityName(outbound.destination)},{' '}
              {tripType === 'oneway'
                ? `${formatDateMonth(outbound.departureTime)}`
                : tripType === 'return'
                ? ` to ${formatDateMonth(returnFlight.arrivalTime)}`
                : ''}
            </span>
            <br />
            <small>
              {tripType === 'oneway' ? 'One-way, ' : tripType === 'return' ? 'Round-trip, ' : ''}{' '}
              {outbound.cabin || 'Economy'}, {getPassengerSummary(adults, children, infants)}{' '}
              <span className="cursor-pointer"><i className="bi bi-pen-fill"></i></span>
            </small>
          </div>
          <img
            src={getAirlineLogo(outbound.airline)}
            alt={getAirlineName(outbound.airline)}
            className="text-end"
            style={{ height: '40px' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/assets/img/airlines/placeholder.png";
            }}
          />
        </div>

        {/* Flights */}
        <div className="flight-summary mb-4">
          <h4 className="fs-5 mb-4">Flights</h4>

          {/* Outbound */}
          <div className="flight-item rounded-3 border mb-3">
            {/* Header */}
            <div className="flight-header d-flex gap-2 p-2 bg-gray-100 border-bottom">
              <i className="bi bi-airplane-engines-fill"></i>
              <div className="">
                <span className="fs-6 font-medium">
                  {' '}
                  {getCityName(outbound.origin)} - {getCityName(outbound.destination)}
                </span>
                <div className="text-xs">
                  {tripType === 'oneway'
                    ? `${formatDate(outbound.departureTime)}`
                    : tripType === 'return'
                    ? ` - ${formatDate(returnFlight.arrivalTime)}`
                    : ''}
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="flight-body p-0">
              <div className="border-bottom mb-3 p-2 justify-content-between d-flex">
                <span className="text-md pl-3 font-medium text-start">
                  Departure • {formatDate(outbound.departureTime)}
                </span>
                <span className="pr-2">{calculateDuration(outbound.departureTime, outbound.arrivalTime)}</span>
              </div>
              <div className="p-3">
                <div className="justify-content-between d-flex">
                  <div className="d-flex gap-2">
                    <img
                      src={getAirlineLogo(outbound.airline)}
                      alt={getAirlineName(outbound.airline)}
                      className="text-start"
                      style={{ height: '25px' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                      }}
                    />
                    <span className="text-xs p-1">{outbound.flightNumber || 'N/A'}</span>
                  </div>
                  <span className="text-end text-sm">{outbound.cabin || 'Economy'}</span>
                </div>
                <div className="pb-3">
                  <div className="flex justify-between gap-4 w-full mx-auto mt-6">
                    {/* Departure */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">{formatTime(outbound.departureTime)}</div>
                      <div className="text-sm text-gray-500">{getAirportName(outbound.origin)}</div>
                    </div>

                    {/* Line and Plane */}
                    <div className="relative flex-1 h-1 bg-gray-300 mx-2">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                        <i className="bi bi-airplane rotate-90"></i>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">{formatTime(outbound.arrivalTime)}</div>
                      <div className="text-sm text-gray-500">{getAirportName(outbound.destination)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Return */}
          {tripType === 'return' && returnFlight && (
            <div className="flight-item rounded-3 border">
              {/* Header */}
              <div className="flight-header d-flex justify-content-between gap-2 p-2 border-bottom">
                <span className="text-md pl-3 font-medium text-start">
                  Return • {formatDate(returnFlight.departureTime)}
                </span>
                <span className="pr-2 text-end">
                  {calculateDuration(returnFlight.departureTime, returnFlight.arrivalTime)}
                </span>
              </div>
              {/* Body */}
              <div className="flight-body p-0">
                <div className="p-3">
                  <div className="justify-content-between d-flex">
                    <div className="d-flex gap-2">
                      <img
                        src={getAirlineLogo(returnFlight.airline)}
                        alt={getAirlineName(returnFlight.airline)}
                        className="text-start"
                        style={{ height: '25px' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                        }}
                      />
                      <span className="text-xs p-1">{returnFlight.flightNumber || 'N/A'}</span>
                    </div>
                    <span className="text-end text-sm">{returnFlight.cabin || 'Economy'}</span>
                  </div>
                  <div className="pb-3">
                    <div className="flex justify-between gap-4 w-full mx-auto mt-6">
                      {/* Departure */}
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-800">{formatTime(returnFlight.departureTime)}</div>
                        <div className="text-sm text-gray-500">{getAirportName(returnFlight.origin)}</div>
                      </div>

                      {/* Line and Plane */}
                      <div className="relative flex-1 h-1 bg-gray-300 mx-2">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                          <i className="bi bi-airplane rotate-90"></i>
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-800">{formatTime(returnFlight.arrivalTime)}</div>
                        <div className="text-sm text-gray-500">{getAirportName(returnFlight.destination)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Travelers */}
        <TravelerInformation
          formData={formData}
          handleFormChange={handleFormChange}
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
        />

        {/* Payment Methods */}
        <PaymentMethod
          formData={formData}
          handleFormChange={handleFormChange}
          isFormValid={isFormValid}
          totalPrice={totalPrice}
        />

        {/* Cancellation Policy */}
        {cancellation_policy && (
          <div className="cancellation-policy mb-2">
            <h4 className="fs-5">Cancellation Policy</h4>
            <div className="p-3 bg-red-100">
              <p className="text-sm text-gray-600">{cancellation_policy}</p>
              <div className={showReadMore ? 'read--more' : 'read--more hidden'}>
                <input
                  className="d-none hidden"
                  type="checkbox"
                  id="show--more"
                  checked={showCancellation}
                  onChange={() => setShowCancellation(!showCancellation)}
                />
                <label
                  className="d-block block w-full font-bold text-red-600 cursor-pointer flex items-center gap-2 text-sm"
                  htmlFor="show--more"
                  id="to--be_1"
                >
                  Read More
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#b02a37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </label>
                <label
                  className="d-none hidden w-full font-bold text-red-600 cursor-pointer flex items-center gap-2 text-sm"
                  htmlFor="show--more"
                  id="to--be_2"
                >
                  Read Less
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#b02a37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Terms Checkbox */}
        <div className="term-checkbox mb-2 mt-3">
          <div className="input-box p-0">
            <div className="d-flex gap-3 alert p-0">
              <input
                type="checkbox"
                id="agreechb"
                name="agree_terms"
                checked={formData.agree_terms}
                onChange={handleFormChange}
                className="form-check-input h-5 w-5 text-blue-700 focus:ring-blue-700 cursor-pointer"
              />
              <label htmlFor="agreechb" className="text-gray-600 p-0">
                I agree to all{' '}
                <a href="/page/terms-of-use" target="_blank" className="text-blue-700 hover:underline" rel="noreferrer">
                  Terms & Conditions
                </a>
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      {/* -------- Share Modal (keeps visual language; animated with framer) -------- */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-labelledby="share-dialog-title"
            aria-modal="true"
            role="dialog"
            id="share-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowShare(false)}
            />
            {/* Modal card */}
            <motion.div
              className="relative z-10 w-[92%] max-w-lg rounded-3 bg-white shadow-2xl"
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                <div>
                  <h5 className="m-0 fw-semibold" id="share-dialog-title">Share this trip</h5>
                  <div className="text-muted small">{shareSubtitle}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-light rounded-circle p-2"
                  onClick={() => setShowShare(false)}
                  aria-label="Close share dialog"
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>

              {/* Body */}
              <div className="p-3">
                <div className="mb-3">
                  <label className="form-label text-muted small d-block">Link</label>
                  <div className="d-flex align-items-stretch gap-2">
                    <input
                      className="form-control"
                      type="text"
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center gap-2"
                      onClick={copyLink}
                      title="Copy link"
                    >
                      <i className="bi bi-clipboard"></i>
                      Copy
                    </button>
                  </div>
                  <AnimatePresence>
                    {copied && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 text-success small d-flex align-items-center gap-2"
                      >
                        <i className="bi bi-check2-circle"></i> Link copied
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <a
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: '#25D366', color: 'white' }}
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className="bi bi-whatsapp"></i> WhatsApp
                    </a>
                  </div>
                  <div className="col-6">
                    <a
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: '#229ED9', color: 'white' }}
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className="bi bi-telegram"></i> Telegram
                    </a>
                  </div>
                  <div className="col-6">
                    <a
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2 btn-outline-secondary"
                      href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                    >
                      <i className="bi bi-envelope"></i> Email
                    </a>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2 btn-outline-primary"
                      onClick={shareNative}
                    >
                      <i className="bi bi-share"></i> System Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-top d-flex justify-content-end">
                <button type="button" className="btn btn-primary" onClick={() => setShowShare(false)}>
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingForm;
