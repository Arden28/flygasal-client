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
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tones[tone] || tones.slate}`}
    >
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
}) => {
  const navigate = useNavigate();

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

    // segments
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
      params.set(`flights[${idx}][journeyIndex]`, String(ji));
      idx += 1;
    };

    const isMultiLocal =
      (searchParams?.tripType || "").toLowerCase() === "multi" ||
      (Array.isArray(itinerary.legs) && itinerary.legs.length > 0);

    if (isMultiLocal) {
      (itinerary.legs || []).forEach((leg, ji) => {
        (leg.segments || []).forEach((seg) => writeSeg(seg, ji));
      });
    } else {
      (itinerary.outbound?.segments || []).forEach((seg) => writeSeg(seg, 0));
      (itinerary.return?.segments || []).forEach((seg) => writeSeg(seg, 1));
    }

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

  const isOpen = (id) => openDetailsId === id;
  const toggleOpen = (id) => setOpenDetailsId(isOpen(id) ? null : id);

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
        <div className="text-slate-700">No results match your search or filters.</div>
      </div>
    );
  }

  return (
    <div className="mt-3" aria-live="polite">
      <motion.ul layout className="mt-1 space-y-3">
        <AnimatePresence mode="sync" initial={false}>
          {paginatedItineraries.map((itinerary) => {
            const key = computeItinKey(itinerary);
            const pb = itinerary.priceBreakdown || {};
            const pbCurrency = pb.currency || currency;
            const totals = pb.totals || {};
            const backendGrand = Number(totals.grand || itinerary.totalPrice || 0);
            const markupAmount = +((backendGrand || 0) * (agentMarkupPercent / 100)).toFixed(2);
            const grandWithMarkup = +((backendGrand || 0) + markupAmount).toFixed(2);
            const perPassengerRaw = (pb.perPassenger && typeof pb.perPassenger === "object") ? pb.perPassenger : {};
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
            const perTypeSummary = paxEntries.map(([ptype, data]) => ({
              ptype,
              count: Number(data?.count || 0),
              subTot: Number(data?.subtotal?.total || 0),
            }));

            const open = isOpen(key);
            const isMulti =
              (searchParams?.tripType || "").toLowerCase() === "multi" ||
              (Array.isArray(itinerary.legs) && itinerary.legs.length > 0);
            const isRoundTrip = !isMulti && !!itinerary.return;
            const direct = Number(itinerary.totalStops || 0) === 0;
            const airlines = itinerary.airlines || [];

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
                {/* Top stripe: price left, route summary bar right (like screenshots) */}
                <div className="flex items-stretch justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2 px-3 py-2 md:px-4">
                    <div className="text-2xl font-bold">{money(grandWithMarkup, pbCurrency)}</div>
                    <span className="text-xs text-slate-500 i bi-info-circle ms-1" />
                  </div>

                  <div className="flex-1 px-3 py-2 md:px-4">
                    {/* condensed global route bar */}
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <div className="shrink-0">{formatTimeOnly(itinerary?.outbound?.segments?.[0]?.departureTime || itinerary?.outbound?.departureTime) || ""}</div>
                      <div className="relative flex-1">
                        <div className="h-[2px] w-full bg-violet-600/80 rounded-full" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                          {/* plane dot */}
                          <div className="h-2 w-2 rounded-full bg-violet-600" />
                        </div>
                      </div>
                      <div className="shrink-0">
                        {formatTimeOnly(
                          (isRoundTrip ? itinerary.return?.arrivalTime : itinerary.outbound?.arrivalTime) ||
                            itinerary?.outbound?.arrivalTime
                        ) || ""}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <div className="uppercase">
                        {itinerary?.outbound?.origin || itinerary?.legs?.[0]?.origin || ""} &nbsp;→&nbsp;{" "}
                        {(isRoundTrip ? itinerary?.return?.destination : itinerary?.outbound?.destination) ||
                          itinerary?.legs?.slice(-1)?.[0]?.destination ||
                          ""}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{direct ? "Non-stop" : `${itinerary.totalStops} stop${itinerary.totalStops > 1 ? "s" : ""}`}</span>
                        <span className="text-slate-400">•</span>
                        <span>{totalDurationText(itinerary)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleOpen(key)}
                    className="px-3 md:px-4 text-violet-700 hover:text-violet-900 font-medium"
                  >
                    Details
                    <span
                      className={`ms-2 inline-block transition-transform ${open ? "rotate-180" : "rotate-0"}`}
                    >
                      ▼
                    </span>
                  </button>
                </div>

                {/* Body */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="grid grid-cols-12">
                        {/* Left: legs & badges */}
                        <div className="col-span-12 md:col-span-9 p-3 md:p-4">
                          {/* airlines row */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
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

                          {/* Legs (each has its own route bar + collapsible segments) */}
                          {Array.isArray(itinerary.legs) && itinerary.legs.length ? (
                            (itinerary.legs || []).map((leg, li) => (
                              <div
                                key={`leg-${li}`}
                                className={li > 0 ? "mt-3 border-t border-dashed border-slate-200 pt-3" : ""}
                              >
                                <FlightSegment
                                  flight={leg}
                                  segmentType={`Segment ${li + 1}`}
                                  formatDate={formatDate}
                                  formatTime={formatTime}
                                  calculateDuration={calculateDuration}
                                  getAirportName={getAirportName}
                                  getAirlineName={getAirlineName}
                                  getAirlineLogo={getAirlineLogo}
                                  formatTimeOnly={formatTimeOnly}
                                />
                              </div>
                            ))
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
                                formatTimeOnly={formatTimeOnly}
                              />
                              {isRoundTrip && (
                                <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
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
                                    formatTimeOnly={formatTimeOnly}
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {/* chips row under legs */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                            <Pill tone={direct ? "green" : "blue"}>
                              {direct ? "Non-stop" : `${itinerary.totalStops} stop${itinerary.totalStops > 1 ? "s" : ""}`}
                            </Pill>
                            <Pill tone="slate">
                              Duration:
                              <span className="ml-1 font-medium">
                                {formatDuration(itinerary?.outbound?.journeyTime || 0)}
                              </span>
                            </Pill>
                            {itinerary.cabin && (
                              <Pill tone="slate">
                                Cabin:<span className="ml-1 font-medium">{itinerary.cabin}</span>
                              </Pill>
                            )}
                            {itinerary.baggage && (
                              <Pill tone="slate">
                                Baggage:<span className="ml-1 font-medium">{itinerary.baggage}</span>
                              </Pill>
                            )}
                            <Pill tone={itinerary.refundable ? "green" : "red"}>
                              {itinerary.refundable ? "Refundable" : "Non-refundable"}
                            </Pill>
                          </div>

                          {/* “Select this flight” like screenshot */}
                          <div className="mt-4">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition"
                              onClick={() => selectItinerary(itinerary)}
                            >
                              Select this flight
                            </button>
                          </div>
                        </div>

                        {/* Right: price & CTA */}
                        <div className="col-span-12 md:col-span-3 border-t md:border-t-0 md:border-l border-slate-200 p-3 md:p-4 bg-slate-50">
                          <div className="text-[12px] text-[#9aa3b2]">Total (incl. taxes & fees)</div>
                          <div className="mt-1 text-2xl font-bold leading-none">
                            {money(grandWithMarkup, pbCurrency)}
                          </div>

                          {perTypeSummary.length > 0 && (
                            <div className="mt-2 space-y-1 text-xs text-slate-700">
                              {perTypeSummary.map(({ ptype, count, subTot }) => (
                                <div key={`${key}-${ptype}`} className="flex items-center justify-between">
                                  <span className="text-slate-600">
                                    {ptype} × {count}
                                  </span>
                                  <span className="font-medium">{money(subTot, pbCurrency)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {agentMarkupPercent > 0 && (
                            <div className="mt-2">
                              <Pill tone="amber">Agent earns {money(markupAmount, pbCurrency)}</Pill>
                            </div>
                          )}

                          <div className="mt-3 flex flex-col gap-2">
                            <button
                              type="button"
                              className="btn btn-primary bg-[#5B3DF7] hover:bg-[#5134f3] d-flex items-center justify-center gap-2 rounded-4"
                              onClick={() => selectItinerary(itinerary)}
                            >
                              <span>Next step</span>
                              <i className="bi bi-arrow-right" />
                            </button>
                          </div>
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
