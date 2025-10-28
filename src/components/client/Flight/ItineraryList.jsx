import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FlightSegment from "./FlightSegment";
import { formatDuration } from "../../../lib/helper";

/* ---------- tiny utils ---------- */
const money = (n, currency = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency });

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

const Icon = ({ name, className = "h-4 w-4" }) => {
  switch (name) {
    case "info":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-.75-11.5h1.5V17h-1.5v-6.5Zm0-3h1.5V9h-1.5V7.5Z" />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="1.8" />
          <path strokeWidth="1.8" d="M8 7V6a4 4 0 0 1 8 0v1" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0" />
        </svg>
      );
    case "plane":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path strokeWidth="1.8" d="M2 16l20-8-9 9-2 5-3-4-6-2z" />
        </svg>
      );
    default:
      return null;
  }
};

const PAX_ORDER = ["ADT", "CHD", "INF"];

/* ================================================================== */
/*                           Itinerary List                           */
/* ================================================================== */
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

    const isMultiTrip = (searchParams?.tripType || "").toLowerCase() === "multi" || Array.isArray(itinerary.legs);
    if (isMultiTrip) {
      (itinerary.legs || []).forEach((leg, ji) => (leg.segments || []).forEach((seg) => writeSeg(seg, ji)));
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

  const pax = useMemo(() => {
    const a = Number(searchParams?.adults || 1);
    const c = Number(searchParams?.children || 0);
    const i = Number(searchParams?.infants || 0);
    const total = a + c + i;
    return { adults: a, children: c, infants: i, total };
  }, [searchParams?.adults, searchParams?.children, searchParams?.infants]);

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
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl ring-1 ring-slate-200 bg-white py-10">
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

            // pricing (keep exact backend usage)
            const pb = itinerary.priceBreakdown || {};
            const pbCurrency = pb.currency || currency;
            const pbTotals = pb.totals || {};
            const pbFees = pb.fees || {};
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

            const isMulti =
              (searchParams?.tripType || "").toLowerCase() === "multi" ||
              (Array.isArray(itinerary.legs) && itinerary.legs.length > 0);
            const isRoundTrip = !isMulti && !!itinerary.return;

            // route header bits
            const outDep = itinerary?.outbound?.segments?.[0]?.departureTime || itinerary?.outbound?.departureTime;
            const routeLeft =
              itinerary?.outbound
                ? `${itinerary.outbound.origin || itinerary.outbound.segments?.[0]?.departure} → ${itinerary.outbound.destination || itinerary.outbound.segments?.slice(-1)?.[0]?.arrival}`
                : isMulti
                ? `${(itinerary.legs?.[0]?.segments?.[0]?.departure || itinerary.legs?.[0]?.departure) ?? "—"} → ${(itinerary.legs?.slice(-1)?.[0]?.segments?.slice(-1)?.[0]?.arrival || itinerary.legs?.slice(-1)?.[0]?.arrival) ?? "—"}`
                : "—";

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
                {/* Price stripe header */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                  <div className="inline-flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-900">
                    {money(grandWithMarkup, pbCurrency)}
                    <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Icon name="info" className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* Route bar */}
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2.5 md:px-5 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium">{routeLeft}</span>
                    <span className="ml-2 h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  {outDep && (
                    <div className="text-slate-600">
                      {formatDate(outDep)}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="grid grid-cols-12 gap-0">
                  {/* Left: segments list */}
                  <div className="col-span-12 md:col-span-9 px-4 py-4 md:px-5 md:py-5">
                    {isMulti ? (
                      (itinerary.legs || []).map((leg, li) => (
                        <div
                          key={`leg-${li}`}
                          className={li > 0 ? "border-t border-slate-200/70 pt-4 mt-4" : ""}
                        >
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
                        />
                        {isRoundTrip && (
                          <div className="border-t border-slate-200/70 pt-4 mt-4">
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

                    {/* Bottom badges row (left) */}
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
                        <Icon name="bag" className="h-3.5 w-3.5 text-slate-700" />
                        Baggage info
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
                        <Icon name="user" className="h-3.5 w-3.5 text-slate-700" />
                        {pax.total} traveller{pax.total > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
                        <Icon name="plane" className="h-3.5 w-3.5 text-slate-700" />
                        {formatDuration(itinerary?.outbound?.journeyTime || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Right: totals & CTA */}
                  <div className="col-span-12 md:col-span-3 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50/60 px-4 py-4 md:px-5 md:py-5">
                    {/* compact breakdown */}
                    <div className="rounded-xl bg-white ring-1 ring-slate-200 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Base</span>
                        <span className="font-semibold text-slate-900">{money(backendBase, pbCurrency)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-600">Taxes</span>
                        <span className="font-semibold text-slate-900">{money(backendTaxes, pbCurrency)}</span>
                      </div>
                      {backendFees > 0 && (
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-slate-600">Fees</span>
                          <span className="font-semibold text-slate-900">{money(backendFees, pbCurrency)}</span>
                        </div>
                      )}
                      {agentMarkupPercent > 0 && (
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-slate-600">Markup</span>
                          <span className="font-semibold text-slate-900">{money(markupAmount, pbCurrency)}</span>
                        </div>
                      )}
                      <div className="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">Total to pay</span>
                        <span className="font-bold text-slate-900">{money(grandWithMarkup, pbCurrency)}</span>
                      </div>
                    </div>

                    {/* per type (if any) */}
                    {perTypeSummary.length > 0 && (
                      <div className="mt-2 rounded-xl bg-white ring-1 ring-slate-200 p-3 space-y-1">
                        {perTypeSummary.map(({ ptype, count, subTot }) => (
                          <div key={`${key}-${ptype}`} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{ptype} × {count}</span>
                            <span className="font-medium text-slate-900">{money(subTot, pbCurrency)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5A46E0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4b3acb] transition"
                      onClick={() => selectItinerary(itinerary)}
                    >
                      Next step
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
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
