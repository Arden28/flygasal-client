import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FlightSegment from "./FlightSegment";
import { formatDuration } from "../../../lib/helper";
import { getCityName } from "../../../utils/utils";
import { FaPersonWalking } from "react-icons/fa6";
import { MdLuggage } from "react-icons/md";
import { FaPlaneDeparture, FaPlaneArrival, FaInfo } from "react-icons/fa";
import { createPortal } from "react-dom";

/* -------------------- tiny utils -------------------- */
const money = (n, currency = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });

/* -------------------- icons -------------------- */
const Icon = ({ name, className = "h-4 w-4" }) => {
  switch (name) {
    case "info":
      return <FaInfo className="h-3 w-3" />;
    case "takeoff":
      return <FaPlaneDeparture className={className} />;
    case "landing":
      return <FaPlaneArrival className={className} />;
    default:
      return null;
  }
};

/* ===================== Large Price Tooltip ===================== */
function Row({ label, value, sub }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-slate-700">{label}</div>
        {sub ? <div className="text-[12px] text-slate-500">{sub}</div> : null}
      </div>
      <div className="text-right tabular-nums font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function PricingTooltip({
  open,
  onClose,
  anchorId,
  currency = "USD",
  basePrice = 0,
  markupPercent = 0,
  markupAmount = 0,
  total = 0,
  paxSummary,
}) {
  const [coords, setCoords] = useState(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Measure the anchor and position the card
  useEffect(() => {
    if (!open) return;

    const update = () => {
      const el = anchorId ? document.getElementById(anchorId) : null;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gutter = 10;

      const cardW = Math.min(vw * 0.92, 520);
      const cardMaxH = Math.min(vh * 0.8, 560);

      let left = r.right - cardW;       
      let top = r.bottom + 8;           

      if (left + cardW > vw - gutter) left = vw - gutter - cardW;
      if (left < gutter) left = gutter;

      if (top + cardMaxH > vh - gutter) {
        top = Math.max(gutter, r.top - 8 - cardMaxH);
      }

      setCoords({ left, top, cardW, cardMaxH });
    };

    update();
    const opts = { passive: true, capture: true };
    window.addEventListener("resize", update, opts);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update, opts);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorId]);

  const fmt = (n) => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency });
  const pct = Math.max(0, Math.min(100, Number(markupPercent) || 0));

  if (!open) return null;

  return createPortal(
    <>
      <motion.div
        key="price-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99998]"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        key="price-card"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        role="dialog"
        aria-label="Pricing breakdown"
        className="z-[9999] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={{
          position: "fixed",
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          width: "min(92vw, 520px)",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Price breakdown</div>
            {paxSummary ? <div className="text-[12px] text-slate-500">{paxSummary}</div> : null}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Close pricing details"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pt-2 pb-4 overflow-auto" style={{ maxHeight: "calc(80vh - 52px)" }}>
          <Row label="Base price" value={fmt(basePrice)} />

          <div className="my-2 rounded-xl bg-amber-50/60 p-3 ring-1 ring-amber-100">
            <Row label="Agent markup" sub={`${pct}% applied`} value={fmt(markupAmount)} />
            <div className="mt-2">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="absolute left-0 top-0 h-2 rounded-full bg-[#F68221]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-2 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-slate-800">Total</div>
              <div className="tabular-nums text-lg font-bold text-slate-900">{fmt(total)}</div>
            </div>
          </div>

          <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Prices shown are estimated and may vary at checkout depending on availability and airline rules.
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* -------------------- middle band -------------------- */
const RailBand = ({
  progress = 0.62,
  durationText = "",
  stopsText = "",
  depCode = "",
  arrCode = "",
  onClick,
  open,
}) => {
  const width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="col-span-12 sm:col-span-6 md:col-span-6 grid w-full text-left"
      style={{ gridTemplateRows: "auto auto auto" }}
    >
      <div className="flex items-center justify-between text-[11px] leading-none text-slate-600 mb-1">
        <Icon name="takeoff" className="h-3.5 w-3.5 opacity-70" />
        <div className="text-xs font-medium text-slate-700">{durationText}</div>
        <Icon name="landing" className="h-3.5 w-3.5 opacity-70" />
      </div>

      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div className="absolute left-0 top-0 h-1.5 rounded-full bg-[#F68221]" style={{ width }} />
        <span className="absolute left-0 -top-[3px] h-2.5 w-2.5 rounded-full bg-[#F68221]" />
        <span className="absolute right-0 -top-[3px] h-2.5 w-2.5 rounded-full bg-slate-300" />
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] leading-none text-slate-600">
        <span className="font-semibold tracking-wide">{depCode || "—"}</span>
        <span className="text-slate-500">{stopsText}</span>
        <span className="font-semibold tracking-wide">{arrCode || "—"}</span>
      </div>
    </button>
  );
};

/* -------------------- segment block -------------------- */
const SegmentBlock = ({
  leg, // Fix: Explicitly receive leg here so multi-logo display works
  id,
  openId,
  setOpenId,
  titleLeft,
  titleRight,
  logoSrc,
  depDateText,
  depTime,
  depCity,
  depAirport,
  durationText,
  stopsText,
  arrDateText,
  arrTime,
  arrCity,
  arrAirport,
  body,
}) => {
  const open = openId === id;
  const toggle = () => setOpenId(open ? null : id);
  const progress = 0.62;

  return (
    <div className="overflow-hidden bg-white">
      {/* Route bar */}
      <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5 md:px-5 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-medium">{titleLeft}</span>
          <span className="ml-2 h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        {titleRight && <div className="text-slate-600">{titleRight}</div>}
      </div>

      {/* Summary row */}
      <div className="px-4 md:px-5">
        <div className="grid grid-cols-12 items-center gap-3 py-3">
          {/* Left Column (Departure) - Takes 3 columns */}
          <div className="col-span-12 sm:col-span-3 md:col-span-3 flex items-center gap-3">
            
            {/* MULTI-LOGO DISPLAY */}
            <div className="flex items-center gap-2">
              {Array.isArray(leg?.marketingCarriers) && leg.marketingCarriers.length > 0 ? (
                leg.marketingCarriers.map((code, i) => (
                  <img
                    key={i}
                    src={`/assets/img/airlines/${code}.png`}
                    alt={code}
                    className="h-9 w-9 rounded-full object-contain ring-1 ring-slate-200 bg-white"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                    }}
                  />
                ))
              ) : (
                <img
                  src={logoSrc || "/assets/img/airlines/placeholder.png"}
                  alt="Airline Logo"
                  className="h-9 w-9 rounded-full object-contain ring-1 ring-slate-200 bg-white"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                  }}
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 truncate">{depDateText}</div>
              <div className="text-slate-900 font-semibold leading-5 tabular-nums">{depTime}</div>
              <div className="text-[11px] text-slate-600 truncate">{depCity || "—"}</div>
              <div className="text-[11px] text-slate-500 truncate max-w-[120px]" title={depAirport}>
                {depAirport || "—"}
              </div>
            </div>
          </div>

          {/* middle band */}
          <RailBand
            progress={progress}
            durationText={durationText}
            stopsText={stopsText}
            depCode={(depAirport || "").slice(0, 3).toUpperCase()}
            arrCode={(arrAirport || "").slice(0, 3).toUpperCase()}
            onClick={toggle}
            open={open}
          />

          {/* right column */}
          <div className="col-span-12 sm:col-span-3 md:col-span-3 ml-auto flex items-center justify-end gap-3">
            <div className="min-w-0 text-right">
              <div className="text-[11px] text-rose-600">{arrDateText}</div>
              <div className="text-slate-900 font-semibold leading-5 tabular-nums">{arrTime}</div>
              <div className="text-[11px] text-slate-600 truncate">{arrCity || "—"}</div>
              <div className="text-[11px] text-slate-500 truncate max-w-[120px]" title={arrAirport}>
                {arrAirport || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Details Button Row - Guaranteed to be on its own line! */}
        <div className="flex justify-end pb-3">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Details
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              initial={false}
              animate={{ rotate: open ? 180 : 0 }}
              className="shrink-0"
            >
              <path d="M6 9l6 6 6-6" />
            </motion.svg>
          </button>
        </div>
        
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="seg-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="p-3 bg-[#F6F6F7]"
          >
            <div>{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ===================================================== */
/* Itinerary List                     */
/* ===================================================== */
const ItineraryList = ({
  paginatedItineraries,
  openDetailsId,
  setOpenDetailsId,
  searchParams,
  getAirlineLogo,
  getAirlineName,
  getAirportName,
  formatDate,
  formatTime,
  agentMarkupPercent = 0,
  currency = "USD"
}) => {
  const navigate = useNavigate();
  const [openPriceKey, setOpenPriceKey] = useState(null);
  const togglePrice = (k) => setOpenPriceKey((p) => (p === k ? null : k));
  const closePrice = () => setOpenPriceKey(null);

  const paxSummary = useMemo(() => {
    const a = Number(searchParams?.adults || 1);
    const c = Number(searchParams?.children || 0);
    const i = Number(searchParams?.infants || 0);
    const parts = [];
    if (a) parts.push(`${a} adult${a > 1 ? "s" : ""}`);
    if (c) parts.push(`${c} child${c > 1 ? "ren" : ""}`);
    if (i) parts.push(`${i} infant${i > 1 ? "s" : ""}`);
    return parts.join(", ") || "1 adult";
  }, [searchParams]);

  const selectItinerary = (itinerary) => {
    const params = new URLSearchParams();
    
    // Pass the rawOffer JSON straight into the URL so the checkout page can read it natively
    params.set("offer", JSON.stringify(itinerary.rawOffer));
    
    const backendGrand = itinerary.totalPrice || 0;
    const markupAmount = +((backendGrand) * (agentMarkupPercent / 100)).toFixed(2);
    
    params.set("markupPercent", String(agentMarkupPercent));
    params.set("markupAmount", String(markupAmount));
    params.set("grandTotal", String(backendGrand + markupAmount));
    
    navigate(`/flight/booking/details?${params.toString()}`);
  };

  if (!paginatedItineraries || paginatedItineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl ring-1 ring-slate-200 bg-white py-10">
        <img src="/assets/img/flights_search.gif" alt="No flights" style={{ width: 220 }} />
        <div className="text-slate-700">No results match your search or filters.</div>
      </div>
    );
  }

  return (
    <div className="mt-5" aria-live="polite">
      <motion.ul layout className="space-y-3">
        <AnimatePresence mode="sync" initial={false}>
          {paginatedItineraries.map((itinerary) => {
            const key = itinerary.id;

            const backendGrand = Number(itinerary.totalPrice || 0);
            const markupAmount = +((backendGrand || 0) * ((agentMarkupPercent || 0) / 100)).toFixed(2);
            const grandWithMarkup = +((backendGrand || 0) + markupAmount).toFixed(2);
            
            const pbCurrency = itinerary.priceBreakdown?.currency || currency;
            const anchorId = `price-btn-${key}`;

            return (
              <motion.li
                key={key}
                layout="position"
                presenceAffectsLayout={false}
                className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Price header */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                  <div className="relative inline-flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-900">
                    {money(grandWithMarkup, pbCurrency)}

                    {/* Trigger */}
                    <button
                      type="button"
                      id={anchorId}  
                      onClick={() => togglePrice(key)}
                      aria-expanded={openPriceKey === key}
                      aria-controls={`price-tip-${key}`}
                      className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#F68221]/40 ring-offset-2"
                      title="View price breakdown"
                    >
                      <Icon name="info" className="h-3 w-3" />
                    </button>

                    {/* Large Tooltip */}
                    <PricingTooltip
                      open={openPriceKey === key}
                      onClose={closePrice}
                      anchorId={anchorId}  
                      currency={pbCurrency}
                      basePrice={backendGrand}
                      markupPercent={agentMarkupPercent || 0}
                      markupAmount={markupAmount}
                      total={grandWithMarkup}
                      paxSummary={paxSummary}
                    />
                  </div>
                </div>

                {/* SEGMENTS */}
                <div className="px-0 pb-2 md:pb-3 space-y-2">
                  
                  {/* Loop directly over pre-processed legs */}
                  {(itinerary.legs || []).map((leg, li) => {
                      const firstSeg = leg.segments?.[0] || {};
                      const lastSeg = leg.segments?.[leg.segments.length - 1] || {};
                      
                      // Title left: NBO -> DXB
                      const depCode = leg.origin || firstSeg.departure || "—";
                      const arrCode = leg.destination || lastSeg.arrival || "—";
                      const titleLeft = `${depCode} → ${arrCode}`;

                      const airlineCode = firstSeg.airline || itinerary.airlines?.[0];
                      const logoSrc = airlineCode ? (typeof getAirlineLogo === "function" ? getAirlineLogo(airlineCode) : `/assets/img/airlines/${airlineCode}.png`) : "/assets/img/airlines/placeholder.png";

                      return (
                        <SegmentBlock
                          key={`${key}-leg-${li}`}
                          id={`${key}-leg-${li}`}
                          leg={leg} // Ensure leg is passed
                          openId={openDetailsId}
                          setOpenId={setOpenDetailsId}
                          titleLeft={titleLeft}
                          titleRight={firstSeg.departureIso ? formatDate(firstSeg.departureIso) : ""}

                          logoSrc={logoSrc}
                          
                          // Formatted dates/times using backend ISO string
                          depDateText={firstSeg.departureIso ? formatDate(firstSeg.departureIso) : ""}
                          depTime={firstSeg.departureIso ? formatTime(firstSeg.departureIso) : ""}
                          
                          // FIX: Left side = City name, Right side = City name
                          depCity={getCityName(depCode)}
                          depAirport={getAirportName(depCode)}

                          durationText={formatDuration(leg.journeyTime || 0)}
                          stopsText={Number(leg.stops || 0) === 0 ? "Non-stop" : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`}

                          arrDateText={lastSeg.arrivalIso ? formatDate(lastSeg.arrivalIso) : ""}
                          arrTime={lastSeg.arrivalIso ? formatTime(lastSeg.arrivalIso) : ""}
                          arrCity={getCityName(arrCode)}
                          arrAirport={getAirportName(arrCode)}

                          body={
                            <FlightSegment
                              leg={leg}
                              idx={li}
                              totalLegs={itinerary.legs.length}
                              baggage={itinerary.rawOffer.baggage} 
                              openId={openDetailsId}
                              setOpenId={setOpenDetailsId}
                              getAirportName={getAirportName}
                              getAirlineName={getAirlineName}
                              getAirlineLogo={getAirlineLogo}
                              formatDate={formatDate}
                              formatTime={formatTime}
                            />
                          }
                        />
                      );
                  })}
                </div>

                {/* Bottom badges + CTA */}
                <div className="flex items-center justify-between px-4 pb-4 md:px-5 md:pb-5">
                  <div className="flex items-center gap-3 text-[#F68221]">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE9FF]">
                      <MdLuggage />
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE9FF]">
                      <FaPersonWalking />
                    </span>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F68221] px-6 py-3 text-sm font-semibold text-white hover:bg-[#F5740A] transition"
                    onClick={() => selectItinerary(itinerary)}
                  >
                    Next step
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
};

export default ItineraryList;