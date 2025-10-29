import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FlightSegment from "./FlightSegment";
import { formatDuration } from "../../../lib/helper";
import { findLeg, formatDate, formatTime, getAirportName, getCityName, guessFirstChain, normalizeSegments, safeDate } from "../../../utils/utils";
import { FaPersonWalking } from "react-icons/fa6";
import { MdLuggage } from "react-icons/md";
import { FaPlaneDeparture } from "react-icons/fa";
import { FaPlaneArrival, FaInfo } from "react-icons/fa";

/* -------------------- tiny utils -------------------- */
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

/* -------------------- icons -------------------- */
const Icon = ({ name, className = "h-4 w-4" }) => {
  switch (name) {
    case "info":
      return <FaInfo className="h-3 w-3" />;
    case "takeoff":
      return <FaPlaneDeparture />;
    case "landing":
      return <FaPlaneArrival />;
    default:
      return null;
  }
};

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
      {/* top row: plane icons + duration */}
      <div className="flex items-center justify-between text-[11px] leading-none text-slate-600 mb-1">
        <Icon name="takeoff" className="h-3.5 w-3.5 opacity-70" />
        <div className="text-xs font-medium text-slate-700">{durationText}</div>
        <Icon name="landing" className="h-3.5 w-3.5 opacity-70" />
      </div>

      {/* middle row: the rail */}
      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div className="absolute left-0 top-0 h-1.5 rounded-full bg-[#F68221]" style={{ width }} />
        {/* end caps */}
        <span className="absolute left-0 -top-[3px] h-2.5 w-2.5 rounded-full bg-[#F68221]" />
        <span className="absolute right-0 -top-[3px] h-2.5 w-2.5 rounded-full bg-slate-300" />
      </div>

      {/* bottom row: codes + stops */}
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
  flight,
  id,
  segmentType,
  openId,
  setOpenId,
  titleLeft,
  titleRight,
  logoSrc,
  logoAlt,

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
  // optional anchors
  expectedOutboundOrigin,
  expectedOutboundDestination,
  expectedReturnOrigin,
  expectedReturnDestination,

  body,
}) => {
  const open = openId === id;
  const toggle = () => setOpenId(open ? null : id);

  // guess a simple progress: 60% so the bar looks alive even w/o true time ratio
  const progress = 0.62;

  /* ---------------- Normalization & anchors ---------------- */
  const allSegs = useMemo(() => normalizeSegments(flight), [flight]);
  const guess = useMemo(() => guessFirstChain(allSegs), [allSegs]);

  const OUT_O =
    expectedOutboundOrigin ||
    guess?.origin ||
    allSegs[0]?.departure ||
    flight?.origin ||
    "";
  const OUT_D =
    expectedOutboundDestination ||
    guess?.destination ||
    allSegs.at?.(-1)?.arrival ||
    flight?.destination ||
    "";

  const outboundSegs = useMemo(() => {
    const found =
      findLeg(allSegs, OUT_O, OUT_D, { prefer: "earliest" }) ||
      null;
    return found?.length ? found : guess?.chain || allSegs;
  }, [allSegs, OUT_O, OUT_D, guess]);

  const RET_O = expectedReturnOrigin || OUT_D;
  const RET_D = expectedReturnDestination || OUT_O;

  const outboundArrivesAt = outboundSegs.at?.(-1)?.arrivalAt || null;

  const returnSegs = useMemo(() => {
    let chain =
      findLeg(allSegs, RET_O, RET_D, { prefer: "earliest", notBefore: outboundArrivesAt }) ||
      findLeg(allSegs, RET_O, RET_D, { prefer: "earliest" }) ||
      findLeg(allSegs, RET_D, RET_O, { prefer: "earliest" });
    return chain || [];
  }, [allSegs, RET_O, RET_D, outboundArrivesAt]);

  const isReturn = segmentType === "Return";
  let legSegs = isReturn ? returnSegs : outboundSegs;

  const hasSegments = Array.isArray(legSegs) && legSegs.length > 0;
  const firstSegment = hasSegments ? legSegs[0] : null;
  const lastSegment = hasSegments ? legSegs[legSegs.length - 1] : null;

  // ---------- SAFE fallbacks to avoid null crashes ----------
  const leftDateText =
    depDateText ||
    (firstSegment ? safeDate(firstSegment?.departureAt || firstSegment?.departureDate || firstSegment?.departureTime) : "");

  const leftTimeText =
    firstSegment?.departureTimeAt ||
    depTime ||
    "";

  const leftCity =
    getCityName(firstSegment?.departure) ||
    depCity ||
    "";
    
    const leftAirportName =
    getAirportName(firstSegment?.departure) ||
    (depAirport ? getAirportName(depAirport) : "") ||
    "";
    
    const rightDateText =
    arrDateText ||
    (lastSegment ? safeDate(lastSegment?.arrivalAt || lastSegment?.arrivalDate || lastSegment?.arrivalTime) : "");
    
    const rightTimeText =
    lastSegment?.arrivalTimeAt ||
    arrTime ||
    "";
    
    const rightAirportName =
    getAirportName(lastSegment?.arrival) ||
    (arrAirport ? getAirportName(arrAirport) : "") ||
    "";
    
    const rightCity =
      getCityName(lastSegment?.arrival) ||
      arrCity ||
      "";

    // console.log("Flight object:", flight);
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
          {/* left column */}
          <div className="col-span-12 sm:col-span-3 md:col-span-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              {Array.isArray(flight?.marketingCarriers) && flight.marketingCarriers.length > 0 ? (
                flight.marketingCarriers.map((code, i) => (
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
                  src="/assets/img/airlines/placeholder.png"
                  alt="Airline"
                  className="h-9 w-9 rounded-full object-contain ring-1 ring-slate-200 bg-white"
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">{leftDateText}</div>
              <div className="text-slate-900 font-semibold leading-5 tabular-nums">{leftTimeText}</div>
              <div className="text-[11px] text-slate-600 truncate">{leftCity || "—"}</div>
              <div
                className="text-[11px] text-slate-500 truncate max-w-[120px]"
                title={leftAirportName}
              >
                {leftAirportName || "—"}
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
              <div className="text-[11px] text-rose-600">{rightDateText}</div>
              <div className="text-slate-900 font-semibold leading-5 tabular-nums">{rightTimeText}</div>
              <div className="text-[11px] text-slate-600 truncate">{rightCity || "—"}</div>
              <div
                className="text-[11px] text-slate-500 truncate max-w-[120px]"
                title={rightAirportName}
              >
                {rightAirportName || "—"}
              </div>
            </div>

            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700"
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
            <div className="">{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ===================================================== */
/*                    Itinerary List                     */
/* ===================================================== */
const ItineraryList = ({
  paginatedItineraries,
  openDetailsId,
  setOpenDetailsId,
  searchParams,
  getAirlineLogo,
  getAirlineName,
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

    const isMultiTrip =
      (searchParams?.tripType || "").toLowerCase() === "multi" || Array.isArray(itinerary.legs);
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

  const isOpen = (id) => openDetailsId === id;
  const setOpen = (id) => setOpenDetailsId(id);

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
            const key = computeItinKey(itinerary);

            const pb = itinerary.priceBreakdown || {};
            const pbCurrency = pb.currency || currency;
            const totals = pb.totals || {};
            const backendGrand = Number(totals.grand || itinerary.totalPrice || 0);
            const markupAmount = +((backendGrand || 0) * ((agentMarkupPercent || 0) / 100)).toFixed(2);
            const grandWithMarkup = +((backendGrand || 0) + markupAmount).toFixed(2);

            const airlines = itinerary.airlines || [];

            const isMulti =
              (searchParams?.tripType || "").toLowerCase() === "multi" ||
              (Array.isArray(itinerary.legs) && itinerary.legs.length > 0);
            const isRoundTrip = !isMulti && !!itinerary.return;

            // helpers
            const outSeg0 = itinerary?.outbound?.segments?.[0];
            const outSegLast = itinerary?.outbound?.segments?.slice(-1)?.[0];
            const outLeft = getCityName(itinerary?.outbound)
              ? `${(getCityName(itinerary.outbound.origin) || getCityName(outSeg0?.departure)) ?? "—"} → ${(getCityName(itinerary.outbound.destination) || getCityName(outSegLast?.arrival)) ?? "—"}`
              : "—";
            const outDateRight = outSeg0?.departureTime || itinerary?.outbound?.departureTime;

            const retSeg0 = itinerary?.return?.segments?.[0];
            const retSegLast = itinerary?.return?.segments?.slice(-1)?.[0];
            const retLeft = itinerary?.return
              ? `${(getCityName(itinerary.return.origin) || getCityName(retSeg0?.departure)) ?? "—"} → ${(getCityName(itinerary.return.destination) || getCityName(retSegLast?.arrival)) ?? "—"}`
              : "—";
            const retDateRight = retSeg0?.departureTime || itinerary?.return?.departureTime;

            const airlineCode = itinerary.airlines?.[0];
            const airlineLogo = airlineCode ? `/assets/img/airlines/${airlineCode}.png` : "/assets/img/airlines/placeholder.png";
            const airlineName = airlineCode ? (typeof getAirlineName === "function" ? getAirlineName(airlineCode) : airlineCode) : "Airline";

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
                  <div className="inline-flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-900">
                    {money(grandWithMarkup, pbCurrency)}
                    <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Icon name="info" className="h-1 w-1" />
                    </span>
                  </div>
                </div>

                {/* SEGMENTS */}
                <div className="px-0 pb-2 md:pb-3 space-y-2">
                  {/* Outbound */}
                  {itinerary.outbound && (
                    <SegmentBlock
                      id={`${key}-out`}
                      flight={itinerary.outbound}
                      segmentType="Outbound"
                      openId={openDetailsId}
                      setOpenId={setOpen}
                      titleLeft={outLeft}
                      titleRight={outDateRight ? formatDate(outDateRight) : ""}

                      logoSrc={airlineLogo}
                      logoAlt={`${airlineName} logo`}

                      depDateText={outSeg0?.departureTime ? formatDate(outSeg0.departureTime) : ""}
                      depTime={
                        itinerary.outbound.departureTime
                          ? formatTime(itinerary.outbound.departureTime)
                          : outSeg0?.departureTime
                          ? formatTime(outSeg0.departureTime)
                          : ""
                      }
                      depCity={airlineName}
                      depAirport={(itinerary.outbound.origin || outSeg0?.departure || "—")}

                      durationText={formatDuration(itinerary?.outbound?.journeyTime || 0)}
                      stopsText={
                        Number(itinerary?.outbound?.stops || 0) === 0
                          ? "Non-stop"
                          : `${itinerary.outbound.stops} stop${itinerary.outbound.stops > 1 ? "s" : ""}`
                      }

                      arrDateText={outSegLast?.arrivalTime ? formatDate(outSegLast.arrivalTime) : ""}
                      arrTime={
                        itinerary.outbound.arrivalTime
                          ? formatTime(itinerary.outbound.arrivalTime)
                          : outSegLast?.arrivalTime
                          ? formatTime(outSegLast.arrivalTime)
                          : ""
                      }
                      arrCity={(itinerary.outbound.destination || outSegLast?.arrival || "—")}
                      arrAirport={(itinerary.outbound.destination || outSegLast?.arrival || "—")}
                      expectedOutboundOrigin={searchParams?.origin}
                      expectedOutboundDestination={searchParams?.destination}

                      body={
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
                      }
                    />
                  )}

                  {/* Return */}
                  {isRoundTrip && itinerary.return && (
                    <SegmentBlock
                      flight={itinerary.return}
                      id={`${key}-ret`}
                      segmentType="Return"
                      openId={openDetailsId}
                      setOpenId={setOpen}
                      titleLeft={retLeft}
                      titleRight={retDateRight ? formatDate(retDateRight) : ""}

                      logoSrc={airlineLogo}
                      logoAlt={`${airlineName} logo`}

                      depDateText={retSeg0?.departureTime ? formatDate(retSeg0.departureTime) : ""}
                      depTime={
                        itinerary.return.departureTime
                          ? formatTime(itinerary.return.departureTime)
                          : retSeg0?.departureTime
                          ? formatTime(retSeg0.departureTime)
                          : ""
                      }
                      depCity={airlineName}
                      depAirport={(itinerary.return.origin || retSeg0?.departure || "—")}

                      durationText={formatDuration(itinerary?.return?.journeyTime || 0)}
                      stopsText={
                        Number(itinerary?.return?.stops || 0) === 0
                          ? "Non-stop"
                          : `${itinerary.return.stops} stop${itinerary.return.stops > 1 ? "s" : ""}`
                      }

                      arrDateText={retSegLast?.arrivalTime ? formatDate(retSegLast.arrivalTime) : ""}
                      arrTime={
                        itinerary.return.arrivalTime
                          ? formatTime(itinerary.return.arrivalTime)
                          : retSegLast?.arrivalTime
                          ? formatTime(retSegLast.arrivalTime)
                          : ""
                      }
                      arrCity={(itinerary.return.destination || retSegLast?.arrival || "—")}
                      arrAirport={(itinerary.return.destination || retSegLast?.arrival || "—")}
                      expectedReturnOrigin={searchParams?.origin}
                      expectedReturnDestination={searchParams?.destination}

                      body={
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
                      }
                    />
                  )}

                  {/* Multi-city */}
                  {Array.isArray(itinerary.legs) &&
                    itinerary.legs.length > 0 &&
                    itinerary.legs.map((leg, li) => {
                      const seg0 = leg?.segments?.[0];
                      const segLast = leg?.segments?.slice(-1)?.[0];
                      const left = `${(leg.origin || seg0?.departure || "—")} → ${(leg.destination || segLast?.arrival || "—")}`;
                      const right = leg?.departureTime || seg0?.departureDate || seg0?.departureTime || "";
                      const logoCode = seg0?.airline || itinerary.airlines?.[0];
                      const logoSrc = logoCode ? `/assets/img/airlines/${logoCode}.png` : "/assets/img/airlines/placeholder.png";
                      const aName = logoCode ? (typeof getAirlineName === "function" ? getAirlineName(logoCode) : logoCode) : "Airline";
                      return (
                        <SegmentBlock
                          flight={leg}
                          key={`${key}-leg-${li}`}
                          id={`${key}-leg-${li}`}
                          segmentType={`Leg ${li + 1}`}
                          openId={openDetailsId}
                          setOpenId={setOpen}
                          titleLeft={`${left}`}
                          titleRight={
                            right
                              ? // Only call formatDate when we have a date or datetime (leg.departureTime or seg0.departureDate)
                                (leg?.departureTime || seg0?.departureDate ? formatDate(leg?.departureTime || seg0?.departureDate) : "")
                              : ""
                          }

                          logoSrc={logoSrc}
                          logoAlt={`${aName} logo`}

                          depDateText={
                            seg0?.departureDate
                              ? formatDate(seg0.departureDate)
                              : leg?.departureTime
                              ? formatDate(leg.departureTime)
                              : ""
                          }
                          depTime={leg.departureTime ? formatTime(leg.departureTime) : seg0?.departureTime ? formatTime(seg0.departureTime) : ""}
                          depCity={aName}
                          depAirport={(leg.origin || seg0?.departure || "—")}

                          durationText={formatDuration(leg?.journeyTime || 0)}
                          stopsText={Number(leg?.stops || 0) === 0 ? "Non-stop" : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`}

                          arrDateText={
                            segLast?.arrivalDate
                              ? formatDate(segLast.arrivalDate)
                              : leg?.arrivalTime
                              ? formatDate(leg.arrivalTime)
                              : ""
                          }

                          arrTime={
                            leg.arrivalTime
                              ? formatTime(leg.arrivalTime)
                              : segLast?.arrivalTime
                              ? formatTime(segLast.arrivalTime)
                              : ""
                          }
                          arrCity={(leg.destination || segLast?.arrival || "—")}
                          arrAirport={(leg.destination || segLast?.arrival || "—")}

                          body={
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
