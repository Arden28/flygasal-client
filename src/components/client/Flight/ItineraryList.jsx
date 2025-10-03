import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FlightSegment from "./FlightSegment";

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
    const out = itinerary.outbound || {};
    const firstAirline = out.marketingCarriers?.[0] || out.segments?.[0]?.airline || "";
    const params = new URLSearchParams({
      solutionKey: out.solutionKey || "",
      solutionId: out.solutionId || "",
      tripType: itinerary.return ? "return" : "oneway",
      returnDate: itinerary.return ? formatToYMD(itinerary.return.segments[0]?.departureTime) : "",
      adults: `${searchParams?.adults || 1}`,
      children: `${searchParams?.children || 0}`,
      infants: `${searchParams?.infants || 0}`,
      cabin: itinerary.outbound.cabin || "Economy",
      flightId: itinerary.outbound.id,
      returnFlightId: itinerary.return ? itinerary.return.id : "",
      flightNumber: itinerary.outbound.flightNumber || "",
    });

    // Outbound segments
    itinerary.outbound.segments.forEach((seg, i) => {
      params.set(`flights[${i}][origin]`, seg.departure);
      params.set(`flights[${i}][destination]`, seg.arrival);
      params.set(`flights[${i}][airline]`, seg.airline);
      params.set(`flights[${i}][flightNum]`, seg.flightNum);
      params.set(`flights[${i}][arrival]`, seg.arrival);
      params.set(`flights[${i}][arrivalDate]`, seg.strArrivalDate);
      params.set(`flights[${i}][arrivalTime]`, seg.strArrivalTime);
      params.set(`flights[${i}][departure]`, seg.departure);
      params.set(`flights[${i}][departureDate]`, seg.strDepartureDate);
      params.set(`flights[${i}][departureTime]`, seg.strDepartureTime);
      params.set(`flights[${i}][bookingCode]`, seg.bookingCode || "");
    });

    // Return segments (if present)
    if (itinerary.return?.segments?.length) {
      itinerary.return.segments.forEach((seg, j) => {
        const i = itinerary.outbound.segments.length + j; // continue index after outbound
        params.set(`flights[${i}][origin]`, seg.departure);
        params.set(`flights[${i}][destination]`, seg.arrival);
        params.set(`flights[${i}][airline]`, seg.airline);
        params.set(`flights[${i}][flightNum]`, seg.flightNum);
        params.set(`flights[${i}][arrival]`, seg.arrival);
        params.set(`flights[${i}][arrivalDate]`, seg.strArrivalDate);
        params.set(`flights[${i}][arrivalTime]`, seg.strArrivalTime);
        params.set(`flights[${i}][departure]`, seg.departure);
        params.set(`flights[${i}][departureDate]`, seg.strDepartureDate);
        params.set(`flights[${i}][departureTime]`, seg.strDepartureTime);
        params.set(`flights[${i}][bookingCode]`, seg.bookingCode || "");
      });
    }


    const base = Number(itinerary.totalPrice) || 0;
    const markup = +(base * (agentMarkupPercent / 100)).toFixed(2);
    const total = +(base + markup).toFixed(2);
    params.set("basePrice", String(base));
    params.set("agentMarkupPercent", String(agentMarkupPercent));
    params.set("agentMarkupAmount", String(markup));
    params.set("totalWithMarkup", String(total));
    params.set("currency", currency);

    navigate(`/flight/booking/details?${params.toString()}`);
  };


  const pax = useMemo(() => {
    const a = Number(searchParams?.adults || 1);
    const c = Number(searchParams?.children || 0);
    const i = Number(searchParams?.infants || 0);
    const paying = Math.max(1, a + c);
    const total = a + c + i;
    return { adults: a, children: c, infants: i, paying, total };
  }, [searchParams?.adults, searchParams?.children, searchParams?.infants]);

  
  // console.info("Rendering ItineraryList with itineraries:", paginatedItineraries);

  const priceBreakdown = (it) => {
    const base = isNaN(Number(it.totalPrice)) ? 0 : Number(it.totalPrice) * pax.paying;
    const markup = +(base * (agentMarkupPercent / 100)).toFixed(2);
    const total = +(base + markup).toFixed(2);
    const perBase = +(base / pax.paying).toFixed(2);
    const perMarkup = +(markup / pax.paying).toFixed(2);
    const perTotal = +(base / pax.paying).toFixed(2);
    return { base, markup, total, perBase, perMarkup, perTotal };
  };

  const isOpen = (id) => openDetailsId === id;
  const toggleOpen = (id) => setOpenDetailsId(isOpen(id) ? null : id);

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
            const { base, markup, total, perBase, perMarkup, perTotal } = priceBreakdown(itinerary);
            const direct = itinerary.totalStops === 0;
            const airlines = itinerary.airlines || [];
            const isRoundTrip = !!itinerary.return;
            
            // console.info("Itinerary:", itinerary);

            const durText = isRoundTrip
              ? `${calculateDuration(itinerary.outbound.departureTime, itinerary.return?.arrivalTime)}`
              : `${calculateDuration(itinerary.outbound.departureTime, itinerary.outbound.arrivalTime)}`;

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
                      {/* {itinerary.outbound.solutionKey ?? 'Solution key'} */}
                    </div>
                  </div>

                  {/* Right: price & actions */}
                  <div className="col-span-12 md:col-span-3 border-t md:border-t-0 md:border-l border-slate-200 p-3 md:p-4 md:rounded-l-none rounded-t-none md:rounded-r-2xl bg-slate-50">
                    {pax.total > 1 ? (
                      <>
                        <div className="text-[12px] text-[#9aa3b2]">Per traveler{pax.infants > 0 ? " *" : ""}</div>
                        <div className="mt-1 text-2xl font-bold leading-none">{money(perTotal, currency)}</div>

                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <Row label="Est. total (travellers)" value={`${pax.paying} × ${money(perTotal, currency)}`} subtle />
                          <Row label="Subtotal" value={money(total, currency)} bold />
                        </div>

                        {pax.infants > 0 && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            *Infants are priced differently and may not be included in the per-traveler estimate.
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-[12px] text-[#9aa3b2]">From</div>
                        <div className="mt-1 text-2xl font-bold leading-none">{money(total, currency)}</div>
                      </>
                    )}

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <Row label="Base" value={money(base, currency)} />
                      <Row label={`Agent markup (${agentMarkupPercent}%)`} value={money(markup, currency)} />
                      <div className="mt-1 border-t border-slate-200 pt-1">
                        <Row label="Total" value={money(total, currency)} bold />
                      </div>
                    </div>

                    {agentMarkupPercent > 0 && (
                      <div className="mt-2">
                        <Pill tone="amber">Agent earns {money(markup, currency)}</Pill>
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
                          {/* Fare breakdown */}
                          <Tile icon="price" title="Fare breakdown" hint="Taxes & fees included">
                            {pax.total > 1 && (
                              <>
                                <Row
                                  label={`Per traveler${pax.infants > 0 ? " (excl. infants)" : ""}`}
                                  value={money(perTotal, currency)}
                                />
                                <div className="my-2 border-t border-slate-200" />
                              </>
                            )}
                            <Row label="Base" value={money(base, currency)} />
                            <Row label={`Agent markup (${agentMarkupPercent}%)`} value={money(markup, currency)} />
                            <div className="mt-2 border-t border-slate-200 pt-2">
                              <Row label="Estimated total" value={money(total, currency)} bold />
                            </div>
                            {pax.infants > 0 && (
                              <div className="mt-2 flex items-start gap-2 text-[11px] text-slate-500">
                                <Icon name="info" className="mt-[2px] h-3.5 w-3.5 text-slate-400" />
                                <span>Infant pricing/policies may differ by airline.</span>
                              </div>
                            )}
                          </Tile>

                          {/* Inclusions */}
                          <Tile icon="bag" title="Inclusions">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="seat" />
                                  <span className="text-slate-600">Cabin</span>
                                </div>
                                <span className="font-medium text-slate-900">
                                  {itinerary.cabin || "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="bag" />
                                  <span className="text-slate-600">Baggage</span>
                                </div>
                                <span className="font-medium text-slate-900">
                                  {itinerary.baggage || "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="airline" />
                                  <span className="text-slate-600">Airlines</span>
                                </div>
                                <span className="truncate pl-2 text-right font-medium text-slate-900">
                                  {(itinerary.airlines || [])
                                    .map((a) => getAirlineName(a))
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="clock" />
                                  <span className="text-slate-600">Journey time</span>
                                </div>
                                <span className="font-medium text-slate-900">{durText}</span>
                              </div>
                            </div>
                          </Tile>

                          {/* Rules & notes */}
                          <Tile icon="shield" title="Rules & notes">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="shield" className={`h-4 w-4 ${itinerary.refundable ? "text-emerald-700" : "text-rose-700"}`} />
                                  <span className="text-slate-600">Refundability</span>
                                </div>
                                <span className={`font-medium ${itinerary.refundable ? "text-emerald-700" : "text-rose-700"}`}>
                                  {itinerary.refundable ? "Refundable" : "Non-refundable"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="changes" />
                                  <span className="text-slate-600">Changes</span>
                                </div>
                                <span className="font-medium text-slate-900">Shown at checkout</span>
                              </div>
                              <div className="flex items-start gap-2 text-[11px] text-slate-500">
                                <Icon name="info" className="mt-[2px] h-3.5 w-3.5 text-slate-400" />
                                <span>Availability can refresh; totals finalize on the next step.</span>
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
