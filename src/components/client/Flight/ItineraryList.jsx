import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FlightSegment from "./FlightSegment";
import { formatDuration } from "../../../lib/helper";

const money = (n, currency = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency });

const Pill = ({ children, tone = "slate" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
};

const computeItinKey = (it) => {
  if (Array.isArray(it.legs) && it.legs.length) {
    const legKeys = it.legs.map((leg) => {
      const id = leg.id || leg.solutionId || "";
      const mc = leg.marketingCarriers?.[0] || leg.segments?.[0]?.airline || "";
      const fn = leg.flightNumber || "";
      const dep = leg.departureTime || leg.segments?.[0]?.departureDate || "";
      const arr = leg.arrivalTime || leg.segments?.slice(-1)?.[0]?.arrivalDate || "";
      return `${id}-${mc}-${fn}-${dep}-${arr}`;
    });
    return `${legKeys.join("|")}|${it.totalPrice}`;
  }

  const out = it.outbound || {};
  const ret = it.return || {};
  const outKey =
    out.id ||
    out.solutionId ||
    `${(out.marketingCarriers?.[0] || out.segments?.[0]?.airline || "")}-${out.flightNumber || ""}-${out.departureTime || ""}-${out.arrivalTime || ""}`;
  const retKey = it.return
    ? ret.id ||
      ret.solutionId ||
      `${(ret.marketingCarriers?.[0] || ret.segments?.[0]?.airline || "")}-${ret.flightNumber || ""}-${ret.departureTime || ""}-${ret.arrivalTime || ""}`
    : "OW";
  return `${outKey}|${retKey}|${it.totalPrice}`;
};

const Chevron = ({ open }) => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    initial={false}
    animate={{ rotate: open ? 180 : 0 }}
    transition={{ duration: 0.15 }}
    className="shrink-0"
  >
    <path d="M6 9l6 6 6-6" />
  </motion.svg>
);

const Row = ({ label, value, bold = false, subtle = false }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className={`text-xs ${subtle ? "text-slate-500" : "text-slate-600"}`}>{label}</span>
    <span className={`text-xs ${bold ? "font-semibold text-slate-900" : "text-slate-700"}`}>{value}</span>
  </div>
);

const Icon = ({ name, className = "h-4 w-4 text-slate-700" }) => {
  switch (name) {
    case "price":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M3 7h18M3 17h18M6 7v10m12-10v10M8.5 12h7" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0" />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="1.8" />
          <path strokeWidth="1.8" d="M8 7V6a4 4 0 0 1 8 0v1" />
        </svg>
      );
    case "seat":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M7 12V5a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v7" />
          <path strokeWidth="1.8" d="M4 14h14a2 2 0 0 1 2 2v4H4z" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <path strokeWidth="1.8" d="M12 7v6l4 2" />
        </svg>
      );
    case "airline":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.6" d="M2 16l20-8-9 9-2 5-3-4-6-2z" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M12 3l8 4v6a9 9 0 0 1-8 8 9 9 0 0 1-8-8V7z" />
          <path strokeWidth="1.8" d="M9 12l2 2 4-4" />
        </svg>
      );
    case "changes":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M3 12a9 9 0 1 1 2.64 6.36M3 12h4m-4 0v-4" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <path strokeWidth="1.8" d="M12 8h.01M11 12h2v5h-2z" />
        </svg>
      );
    default:
      return null;
  }
};

const SectionHeader = ({ icon, title, hint }) => (
  <div className="mb-2 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 bg-slate-50">
        <Icon name={icon} />
      </span>
      <div className="text-xs font-semibold text-slate-900">{title}</div>
    </div>
    {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
  </div>
);

const Tile = ({ icon, title, hint, children }) => (
  <div className="rounded-xl border border-slate-200 p-3 md:p-4">
    <SectionHeader icon={icon} title={title} hint={hint} />
    {children}
  </div>
);

const PAX_ORDER = ["ADT", "CHD", "INF"]; // preferred display order

const ItineraryList = ({
  paginatedItineraries,
  openDetailsId,
  setOpenDetailsId,
  searchParams,
  getAirlineLogo,
  getAirlineName,
  formatDate,
  formatToYMD,
  formatTime,
  formatTimeOnly,
  calculateDuration,
  getAirportName,
  agentMarkupPercent = 0,
  currency = "USD",
  totalCount,
  currentPage,
  pageSize,
}) => {
  const navigate = useNavigate();

  const pageSummary = useMemo(() => {
    if (!totalCount || !currentPage || !pageSize) return null;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return { start, end, total: totalCount };
  }, [totalCount, currentPage, pageSize]);

  const selectItinerary = (itinerary) => {
    const isMulti =
      (searchParams?.tripType || "").toLowerCase() === "multi" ||
      (Array.isArray(itinerary.legs) && itinerary.legs.length > 0);

    const params = new URLSearchParams();

    if (isMulti) {
      params.set("tripType", "multi");
      params.set("solutionId", itinerary.solutionId || itinerary.legs?.[0]?.solutionId || "");
      params.set("cabin", itinerary.cabin || itinerary.legs?.[0]?.cabin || "Economy");
    } else {
      const out = itinerary.outbound || {};
      params.set("solutionKey", out.solutionKey || "");
      params.set("solutionId", out.solutionId || "");
      params.set("tripType", itinerary.return ? "return" : "oneway");
      if (itinerary.return?.segments?.[0]?.departureTime) {
        params.set("returnDate", formatToYMD(itinerary.return.segments[0].departureTime));
      }
      params.set("cabin", itinerary.outbound?.cabin || "Economy");
      params.set("flightId", itinerary.outbound?.id || "");
      params.set("returnFlightId", itinerary.return ? itinerary.return.id : "");
      params.set("flightNumber", itinerary.outbound?.flightNumber || "");
    }

    params.set("adults", `${searchParams?.adults || 1}`);
    params.set("children", `${searchParams?.children || 0}`);
    params.set("infants", `${searchParams?.infants || 0}`);

    // ---- Write segments into flights[i], tagging journeyIndex ----
    let idx = 0;
    const writeSeg = (seg, ji = 0) => {
      params.set(`flights[${idx}][origin]`, seg.departure);
      params.set(`flights[${idx}][destination]`, seg.arrival);
      params.set(`flights[${idx}][airline]`, seg.airline);
      params.set(`flights[${idx}][flightNum]`, seg.flightNum);
      params.set(`flights[${idx}][arrival]`, seg.arrival);
      params.set(`flights[${idx}][arrivalDate]`, seg.strArrivalDate || seg.arrivalDate || "");
      params.set(`flights[${idx}][arrivalTime]`, seg.strArrivalTime || seg.arrivalTime || "");
      params.set(`flights[${idx}][departure]`, seg.departure);
      params.set(`flights[${idx}][departureDate]`, seg.strDepartureDate || seg.departureDate || "");
      params.set(`flights[${idx}][departureTime]`, seg.strDepartureTime || seg.departureTime || "");
      params.set(`flights[${idx}][bookingCode]`, seg.bookingCode || "");
      params.set(`flights[${idx}][journeyIndex]`, String(ji)); // <-- important
      idx += 1;
    };

    if (isMulti) {
      (itinerary.legs || []).forEach((leg, ji) => {
        (leg.segments || []).forEach((seg) => writeSeg(seg, ji));
      });
    } else {
      (itinerary.outbound?.segments || []).forEach((seg) => writeSeg(seg, 0));
      (itinerary.return?.segments || []).forEach((seg) => writeSeg(seg, 1));
    }

    // ---- Pricing/markup (use backend totals only; do NOT normalize) ----
    const pb = itinerary.priceBreakdown || {};
    const pbCurrency = pb.currency || currency;
    const backendGrand = Number(pb?.totals?.grand || itinerary.totalPrice || 0);
    const markupAmount = +((backendGrand || 0) * (agentMarkupPercent / 100)).toFixed(2);
    const totalWithMarkup = +((backendGrand || 0) + markupAmount).toFixed(2);

    params.set("basePrice", String(backendGrand));
    params.set("agentMarkupPercent", String(agentMarkupPercent));
    params.set("agentMarkupAmount", String(markupAmount));
    params.set("totalWithMarkup", String(totalWithMarkup));
    params.set("currency", pbCurrency);

    navigate(`/flight/booking/details?${params.toString()}`);
  };

  const pax = useMemo(() => {
    const a = Number(searchParams?.adults || 1);
    const c = Number(searchParams?.children || 0);
    const i = Number(searchParams?.infants || 0);
    const total = a + c + i;
    return { adults: a, children: c, infants: i, total };
  }, [searchParams?.adults, searchParams?.children, searchParams?.infants]);

  const isOpen = (id) => openDetailsId === id;
  const toggleOpen = (id) => setOpenDetailsId(isOpen(id) ? null : id);

  // --- helpers for duration label (works for multi/return/oneway) ---
  const totalDurationText = (it) => {
    if (Array.isArray(it.legs) && it.legs.length) {
      const first = it.legs[0];
      const last = it.legs[it.legs.length - 1];
      const dep = first?.departureTime || first?.segments?.[0]?.departureDate;
      const arr = last?.arrivalTime || last?.segments?.slice(-1)?.[0]?.arrivalDate;
      return dep && arr ? `${calculateDuration(dep, arr)}` : "—";
    }
    if (it.return && it.outbound) {
      return `${calculateDuration(it.outbound.departureTime, it.return?.arrivalTime)}`;
    }
    if (it.outbound) {
      return `${calculateDuration(it.outbound.departureTime, it.outbound.arrivalTime)}`;
    }
    return "—";
  };

  if (!paginatedItineraries || paginatedItineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-10">
        <img src="/assets/img/flights_search.gif" alt="No flights" style={{ width: 220 }} />
        <div className="text-slate-700">No results match your filters.</div>
      </div>
    );
  }

  return (
    <div className="mt-3" aria-live="polite">
      {pageSummary && (
        <div className="mb-2 text-sm text-slate-600">
          Showing <span className="font-medium text-slate-800">{pageSummary.start}–{pageSummary.end}</span> of{" "}
          <span className="font-medium text-slate-800">{pageSummary.total}</span> results
        </div>
      )}

      <motion.ul layout className="mt-2 space-y-3">
        <AnimatePresence mode="sync" initial={false}>
          {paginatedItineraries.map((itinerary) => {
            const key = computeItinKey(itinerary);

            // --- Backend priceBreakdown (raw) ---
            const pb = itinerary.priceBreakdown || {};
            const pbCurrency = pb.currency || currency;
            const pbTotals = pb.totals || {};
            const pbFees = pb.fees || {};
            const pbFeeItems = (pbFees.items && typeof pbFees.items === "object") ? pbFees.items : {};
            const perPassengerRaw = (pb.perPassenger && typeof pb.perPassenger === "object") ? pb.perPassenger : {};

            const backendBase = Number(pbTotals.base || 0);
            const backendTaxes = Number(pbTotals.taxes || 0);
            const backendFees = Number(pbTotals.fees || pbFees.total || 0);
            const backendGrand = Number(pbTotals.grand || itinerary.totalPrice || 0);

            const markupAmount = +((backendGrand || 0) * (agentMarkupPercent / 100)).toFixed(2);
            const grandWithMarkup = +((backendGrand || 0) + markupAmount).toFixed(2);

            const paxEntries = Object.entries(perPassengerRaw)
              .sort(([a], [b]) => {
                const ia = PAX_ORDER.indexOf(a);
                const ib = PAX_ORDER.indexOf(b);
                if (ia === -1 && ib === -1) return a.localeCompare(b);
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
              })
              .filter(([, data]) => Number(data?.count || 0) > 0);

            const perTypeSummary = paxEntries.map(([ptype, data]) => {
              const count = Number(data?.count || 0);
              const subTot = Number(data?.subtotal?.total || 0);
              return { ptype, count, subTot };
            });

            const direct = Number(itinerary.totalStops || 0) === 0;
            const airlines = itinerary.airlines || [];
            const isMulti =
              (searchParams?.tripType || "").toLowerCase() === "multi" ||
              (Array.isArray(itinerary.legs) && itinerary.legs.length > 0);
            const isRoundTrip = !isMulti && !!itinerary.return;

            const durText = totalDurationText(itinerary);
            const detailsId = `fare-details-${key.replace(/[^a-zA-Z0-9]/g, "")}`;
            const open = isOpen(key);

            return (
              <motion.li
                key={key}
                layout="position"
                presenceAffectsLayout={false}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-12 gap-0">
                  {/* Left: segments & badges */}
                  <div className="col-span-12 md:col-span-9 p-3 md:p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {airlines.map((code) => (
                        <div
                          key={`${key}-${code}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                        >
                          <img
                            src={getAirlineLogo(code)}
                            alt={`${getAirlineName(code)} logo`}
                            className="h-4 w-4 rounded object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                            }}
                          />
                          <span className="text-xs text-slate-700">{getAirlineName(code)}</span>
                          <span className="text-[10px] text-slate-500">{code}</span>
                        </div>
                      ))}
                    </div>

                    {isMulti ? (
                      <>
                        {(itinerary.legs || []).map((leg, li) => (
                          <div key={`leg-${li}`} className={li > 0 ? "mt-2 border-t border-dashed border-slate-200 pt-2" : ""}>
                            <FlightSegment
                              flight={leg}
                              segmentType={`Leg ${li + 1}`}
                              formatDate={formatDate}
                              formatTime={formatTime}
                              calculateDuration={calculateDuration}
                              getAirportName={getAirportName}
                              getAirlineName={getAirlineName}
                              getAirlineLogo={getAirlineLogo}
                            />
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <FlightSegment
                          flight={itinerary.outbound}
                          segmentType="Outbound"
                          formatDate={formatDate}
                          formatTime={formatTime}
                          calculateDuration={calculateDuration}
                          getAirportName={getAirportName}
                          getAirlineName={getAirlineName}
                          getAirlineLogo={getAirlineLogo}
                          expectedOutboundOrigin={searchParams?.origin}
                          expectedOutboundDestination={searchParams?.destination}
                        />
                        {isRoundTrip && (
                          <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                            <FlightSegment
                              flight={itinerary.return}
                              segmentType="Return"
                              formatDate={formatDate}
                              formatTime={formatTime}
                              calculateDuration={calculateDuration}
                              getAirportName={getAirportName}
                              getAirlineName={getAirlineName}
                              getAirlineLogo={getAirlineLogo}
                              expectedReturnOrigin={searchParams?.destination}
                              expectedReturnDestination={searchParams?.origin}
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <Pill tone={direct ? "green" : "blue"}>
                        {direct ? "Direct" : `${itinerary.totalStops} stop${itinerary.totalStops > 1 ? "s" : ""}`}
                      </Pill>
                      <Pill tone="slate">
                        Duration: <span className="ml-1 font-medium">{durText}</span>
                      </Pill>
                      {itinerary.cabin && (
                        <Pill tone="slate">
                          Cabin: <span className="ml-1 font-medium">{itinerary.cabin}</span>
                        </Pill>
                      )}
                      {itinerary.baggage && (
                        <Pill tone="slate">
                          Baggage: <span className="ml-1 font-medium">{itinerary.baggage}</span>
                        </Pill>
                      )}
                      <Pill tone={itinerary.refundable ? "green" : "red"}>
                        {itinerary.refundable ? "Refundable" : "Non-refundable"}
                      </Pill>
                    </div>
                  </div>

                  {/* Right: price & actions */}
                  <div className="col-span-12 md:col-span-3 border-t md:border-t-0 md:border-l border-slate-200 p-3 md:p-4 md:rounded-l-none rounded-t-none md:rounded-r-2xl bg-slate-50">
                    {/* Main total (backend grand + markup) */}
                    <div className="text-[12px] text-[#9aa3b2]">Total (incl. taxes & fees)</div>
                    <div className="mt-1 text-2xl font-bold leading-none">{money(grandWithMarkup, pbCurrency)}</div>

                    {/* If multiple pax types present, show a compact per-type summary */}
                    {perTypeSummary.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-slate-700">
                        {perTypeSummary.map(({ ptype, count, subTot }) => (
                          <div key={`${key}-${ptype}`} className="flex items-center justify-between">
                            <span className="text-slate-600">{ptype} × {count}</span>
                            <span className="font-medium">{money(subTot, pbCurrency)}</span>
                          </div>
                        ))}
                        {backendFees > 0 && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Fees</span>
                            <span className="font-medium">{money(backendFees, pbCurrency)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                      <Row label="Base (all pax)" value={money(backendBase, pbCurrency)} />
                      <Row label="Taxes (all pax)" value={money(backendTaxes, pbCurrency)} />
                      <Row label="Fees (all pax)" value={money(backendFees, pbCurrency)} />
                      <Row label="Agent markup" value={money(markupAmount, pbCurrency)} />
                      <div className="mt-1 border-t border-slate-200 pt-1">
                        <Row label="Total to pay" value={money(grandWithMarkup, pbCurrency)} bold />
                      </div>
                    </div>

                    {agentMarkupPercent > 0 && (
                      <div className="mt-2">
                        <Pill tone="amber">Agent earns {money(markupAmount, pbCurrency)}</Pill>
                      </div>
                    )}

                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        className="btn btn-primary d-flex items-center justify-center gap-2 rounded-4"
                        onClick={() => selectItinerary(itinerary)}
                      >
                        <span>Select flight</span>
                        <i className="bi bi-arrow-right" />
                      </button>

                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-3 border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => toggleOpen(key)}
                        aria-expanded={open}
                        aria-controls={detailsId}
                      >
                        {open ? "Hide fare details" : "Show fare details"}
                        <Chevron open={open} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fare details */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={detailsId}
                      layout="position"
                      presenceAffectsLayout={false}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 bg-white"
                    >
                      <div className="p-3 md:p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {/* Fare breakdown by passenger type */}
                          <Tile icon="price" title="Per passenger type" hint={`Currency: ${pbCurrency}`}>
                            {pax.total > 1 && paxEntries.length === 0 && (
                              <div className="text-xs text-slate-600">No passenger-type pricing to display.</div>
                            )}

                            <div className="space-y-3">
                              {paxEntries.map(([ptype, data]) => {
                                const count = Number(data?.count || 0);
                                const unitFare = Number(data?.unit?.fare || 0);
                                const unitTax = Number(data?.unit?.tax || 0);
                                const unitTotal = Number(data?.unit?.total || 0);
                                const subBase = Number(data?.subtotal?.base || 0);
                                const subTaxes = Number(data?.subtotal?.taxes || 0);
                                const subTotal = Number(data?.subtotal?.total || 0);
                                return (
                                  <div key={`${detailsId}-${ptype}`} className="rounded-lg border border-slate-200 p-2">
                                    <div className="mb-1 flex items-center justify-between">
                                      <span className="text-xs font-semibold text-slate-900">
                                        {ptype} <span className="text-slate-500 font-normal">× {count}</span>
                                      </span>
                                      <span className="text-xs font-semibold text-slate-900">{money(subTotal, pbCurrency)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="rounded border border-slate-200 p-2">
                                        <div className="text-[11px] text-slate-500 mb-1">Unit</div>
                                        <Row label="Fare" value={money(unitFare, pbCurrency)} subtle />
                                        <Row label="Tax" value={money(unitTax, pbCurrency)} subtle />
                                        <div className="mt-1 border-t border-slate-200 pt-1">
                                          <Row label="Total" value={money(unitTotal, pbCurrency)} />
                                        </div>
                                      </div>
                                      <div className="rounded border border-slate-200 p-2">
                                        <div className="text-[11px] text-slate-500 mb-1">Subtotal</div>
                                        <Row label="Base" value={money(subBase, pbCurrency)} subtle />
                                        <Row label="Taxes" value={money(subTaxes, pbCurrency)} subtle />
                                        <div className="mt-1 border-t border-slate-200 pt-1">
                                          <Row label="Total" value={money(subTotal, pbCurrency)} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-3 border-t border-slate-200 pt-2">
                              <Row label="All pax base" value={money(backendBase, pbCurrency)} />
                              <Row label="All pax taxes" value={money(backendTaxes, pbCurrency)} />
                            </div>
                          </Tile>

                          {/* Fees */}
                          <Tile icon="bag" title="Fees">
                            {Object.entries(pbFeeItems).filter(([, v]) => Number(v || 0) > 0).length === 0 &&
                            Number(backendFees) === 0 ? (
                              <div className="text-xs text-slate-600">No additional fees from source.</div>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  {Object.entries(pbFeeItems)
                                    .filter(([, v]) => Number(v || 0) > 0)
                                    .map(([k, v]) => (
                                      <Row key={`${detailsId}-fee-${k}`} label={k} value={money(v, pbCurrency)} />
                                    ))}
                                </div>
                                <div className="mt-2 border-t border-slate-200 pt-2">
                                  <Row label="Fees total" value={money(backendFees, pbCurrency)} bold />
                                </div>
                              </>
                            )}
                          </Tile>

                          {/* Totals & notes */}
                          <Tile icon="shield" title="Totals & notes">
                            <div className="space-y-1">
                              <Row label="Base" value={money(backendBase, pbCurrency)} />
                              <Row label="Taxes" value={money(backendTaxes, pbCurrency)} />
                              <Row label="Fees" value={money(backendFees, pbCurrency)} />
                              <div className="border-t border-slate-200 pt-2">
                                <Row label="Grand total (source)" value={money(backendGrand, pbCurrency)} bold />
                              </div>
                              <Row label={`Agent markup (${agentMarkupPercent}%)`} value={money(markupAmount, pbCurrency)} />
                              <div className="border-t border-slate-200 pt-2">
                                <Row label="Estimated total to pay" value={money(grandWithMarkup, pbCurrency)} bold />
                              </div>
                              <div className="mt-2 flex items-start gap-2 text-[11px] text-slate-500">
                                <Icon name="info" className="mt-[2px] h-3.5 w-3.5 text-slate-400" />
                                <span>Final totals and fare rules are confirmed on the next step.</span>
                              </div>
                            </div>
                          </Tile>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
};

export default ItineraryList;
