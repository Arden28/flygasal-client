import React, { useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FlightSegment from "./FlightSegment";
import { AuthContext } from "../../../context/AuthContext";

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

/** Build a collision-proof key per itinerary (works for OW + RT) */
const computeItinKey = (it) => {
  const out = it.outbound || {};
  const ret = it.return || {};
  const outKey =
    out.id ||
    out.solutionId ||
    `${out.airline || ""}-${out.flightNumber || ""}-${out.departureTime || ""}-${out.arrivalTime || ""}`;
  const retKey = it.return
    ? ret.id ||
      ret.solutionId ||
      `${ret.airline || ""}-${ret.flightNumber || ""}-${ret.departureTime || ""}-${ret.arrivalTime || ""}`
    : "OW";
  // Include pax total price to avoid rare collisions from same legs with different pricing
  return `${outKey}|${retKey}|${it.totalPrice}`;
};

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
    const params = new URLSearchParams({
      solutionId: itinerary.outbound.solutionId || "",
      tripType: itinerary.return ? "return" : "oneway",
      "flights[0][origin]": itinerary.outbound.origin,
      "flights[0][destination]": itinerary.outbound.destination,
      "flights[0][depart]": formatToYMD(itinerary.outbound.departureTime),
      "flights[0][airline]": itinerary.outbound.airline,
      "flights[0][flightNum]": itinerary.outbound.flightNumber,
      "flights[0][arrival]": itinerary.outbound.destination,
      "flights[0][arrivalDate]": formatToYMD(itinerary.outbound.arrivalTime),
      "flights[0][arrivalTime]": formatTimeOnly(itinerary.outbound.arrivalTime),
      "flights[0][departure]": itinerary.outbound.origin,
      "flights[0][departureDate]": formatToYMD(itinerary.outbound.departureTime),
      "flights[0][departureTime]": formatTimeOnly(itinerary.outbound.departureTime),
      "flights[0][bookingCode]": itinerary.outbound.bookingCode || "",
      returnDate: itinerary.return ? formatToYMD(itinerary.return.departureTime) : "",
      adults: `${searchParams?.adults || 1}`,
      children: `${searchParams?.children || 0}`,
      infants: `${searchParams?.infants || 0}`,
      cabin: itinerary.outbound.cabin || "Economy",
      flightId: itinerary.outbound.id,
      returnFlightId: itinerary.return ? itinerary.return.id : "",
    });

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

  const priceBreakdown = (it) => {
    const base = Number(it.totalPrice) || 0;
    const markup = +(base * (agentMarkupPercent / 100)).toFixed(2);
    const total = +(base + markup).toFixed(2);
    return { base, markup, total };
  };

  const isOpen = (id) => openDetailsId === id;
  const toggleOpen = (id) => setOpenDetailsId(isOpen(id) ? null : id);

  if (!paginatedItineraries || paginatedItineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-10">
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

      {/* Layout animations on the list root; items animate position only */}
      <motion.ul layout className="mt-2 space-y-3">
        <AnimatePresence mode="sync" initial={false}>
          {paginatedItineraries.map((itinerary) => {
            const key = computeItinKey(itinerary);
            const { base, markup, total } = priceBreakdown(itinerary);
            const direct = itinerary.totalStops === 0;
            const airlines = itinerary.airlines || [];
            const isRoundTrip = !!itinerary.return;
            const durText = itinerary.journeyTime
              ? `${Math.floor(itinerary.journeyTime / 60)}h ${itinerary.journeyTime % 60}m`
              : isRoundTrip
              ? `${calculateDuration(itinerary.outbound.departureTime, itinerary.return?.arrivalTime)}`
              : `${calculateDuration(itinerary.outbound.departureTime, itinerary.outbound.arrivalTime)}`;

            return (
              <motion.li
                key={key}
                layout="position"
                presenceAffectsLayout={false}
                className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-12 md:col-span-9 p-3 md:p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {airlines.map((code) => (
                        <div key={`${key}-${code}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          <img
                            src={getAirlineLogo(code)}
                            alt={`${getAirlineName(code)} logo`}
                            className="h-4 w-4 object-contain rounded"
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
                      <Pill tone={direct ? "green" : "blue"}>{direct ? "Direct" : `${itinerary.totalStops} stop${itinerary.totalStops > 1 ? "s" : ""}`}</Pill>
                      <Pill tone="slate">Duration: <span className="ml-1 font-medium">{durText}</span></Pill>
                      {itinerary.cabin && <Pill tone="slate">Cabin: <span className="ml-1 font-medium">{itinerary.cabin}</span></Pill>}
                      {itinerary.baggage && <Pill tone="slate">Baggage: <span className="ml-1 font-medium">{itinerary.baggage}</span></Pill>}
                      <Pill tone="red">{itinerary.refundable ? "Refundable" : "Non-refundable"}</Pill>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-3 bg-[#EEF4FB] p-3 md:p-4 md:rounded-l-none rounded-t-none md:rounded-r-2xl">
                    <div className="text-[12px] text-[#9aa3b2]">From</div>
                    <div className="mt-1 text-2xl font-bold leading-none">{money(total, currency)}</div>

                    <div className="mt-2 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between"><span>Base</span><span>{money(base, currency)}</span></div>
                      <div className="flex justify-between">
                        <span>Agent markup ({agentMarkupPercent}%)</span>
                        <span>{money(markup, currency)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-800">
                        <span>Total</span><span>{money(total, currency)}</span>
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
                        className="inline-flex items-center justify-center gap-2 rounded-3 border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => toggleOpen(key)}
                        aria-expanded={isOpen(key)}
                      >
                        {isOpen(key) ? "Hide fare details" : "Show fare details"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen(key) && (
                    <motion.div
                      layout="position"
                      presenceAffectsLayout={false}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 bg-slate-50 p-3 md:p-4 text-sm text-slate-700"
                    >
                      {/* …fare details… */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {/* Left */}
                        <div>
                          <div className="font-medium text-slate-900 mb-1">Fare</div>
                          <div>Base: {money(base, currency)}</div>
                          <div>Markup ({agentMarkupPercent}%): {money(markup, currency)}</div>
                          <div className="font-medium">Total: {money(total, currency)}</div>
                        </div>
                        {/* Middle */}
                        <div>
                          <div className="font-medium text-slate-900 mb-1">Cabin & baggage</div>
                          <div>Cabin: {itinerary.cabin || "—"}</div>
                          <div>Baggage: {itinerary.baggage || "—"}</div>
                        </div>
                        {/* Right */}
                        <div>
                          <div className="font-medium text-slate-900 mb-1">Rules</div>
                          <div>{itinerary.refundable ? "Refundable" : "Non-refundable"}</div>
                          <div>Changes: see next step</div>
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
