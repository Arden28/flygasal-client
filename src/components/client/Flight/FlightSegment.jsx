import React, { useState, useMemo } from "react";
import {
  getAirlineLogo as utilsGetAirlineLogo,
  getAirlineName as utilsGetAirlineName,
} from "../../../utils/utils";

/* --------------------------------------------------------
   Helpers
   -------------------------------------------------------- */

/** Normalize airport/airline code (uppercase, alphanumeric, max 3 chars) */
const norm = (s = "") =>
  String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

/** Sort segments chronologically by departure time */
const byDepTime = (a, b) =>
  new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();

/**
 * Normalize raw supplier segment(s) into a consistent internal structure.
 * Handles variations in supplier keys (airline, carrier, origin, etc.).
 */
const normalizeSegments = (flightLike) => {
  const raw =
    Array.isArray(flightLike?.segments) && flightLike.segments.length
      ? flightLike.segments
      : [flightLike];

  return raw
    .filter(Boolean)
    .map((s) => ({
      airline: s.airline ?? s.carrier ?? "",
      flightNo: s.flightNum ?? s.flightNumber ?? "",
      departure: s.departure ?? s.origin ?? s.departureAirport ?? "",
      arrival: s.arrival ?? s.destination ?? s.arrivalAirport ?? "",
      departureAt: s.strDepartureDate ?? "",
      departureTimeAt: s.strDepartureTime ?? s.depTime ?? "",
      arrivalAt: s.strArrivalDate ?? s.arrivalTime ?? s.arrTime ?? "",
      arrivalTimeAt: s.strArrivalTime ?? s.arrTime ?? "",
      refundable: !!s.refundable,
      bookingCode: s.bookingCode ?? s.bookingClass ?? "",
    }))
    .filter((s) => s.departureAt && s.arrivalAt)
    .sort(byDepTime);
};

/**
 * Find a contiguous chain of segments from ORIGIN → DEST.
 *
 * Options:
 *  - prefer: "earliest" | "latest"
 *  - notBefore: ISO datetime; enforces first departure >= this
 */
const findLeg = (segs, ORIGIN, DEST, { prefer = "earliest", notBefore } = {}) => {
  const O = norm(ORIGIN);
  const D = norm(DEST);
  if (!O || !D || !segs?.length) return null;

  const chains = [];

  for (let i = 0; i < segs.length; i++) {
    // Start only from matching origin
    if (norm(segs[i].departure) !== O) continue;
    if (notBefore && new Date(segs[i].departureAt) < new Date(notBefore)) continue;

    const chain = [segs[i]];

    // Direct flight
    if (norm(segs[i].arrival) === D) {
      chains.push(chain.slice());
      continue;
    }

    // Try to extend chain with contiguous connections
    for (let j = i + 1; j < segs.length; j++) {
      const prev = chain[chain.length - 1];
      const cur = segs[j];
      if (norm(cur.departure) !== norm(prev.arrival)) break; // lost continuity
      chain.push(cur);
      if (norm(cur.arrival) === D) {
        chains.push(chain.slice());
        break;
      }
    }
  }

  if (!chains.length) return null;

  // Pick chain based on "prefer" option
  return chains.reduce((best, c) => {
    const tBest = new Date(best[0].departureAt);
    const tCur = new Date(c[0].departureAt);
    return prefer === "latest" ? (tCur > tBest ? c : best) : tCur < tBest ? c : best;
  });
};

/**
 * Guess the *first outbound chain* purely by continuity starting
 * from the earliest departure. Used as a fallback when no anchors are provided.
 */
const guessFirstChain = (segs) => {
  if (!segs?.length) return null;
  const chain = [segs[0]];
  for (let i = 1; i < segs.length; i++) {
    const prev = chain[chain.length - 1];
    const cur = segs[i];
    if (norm(cur.departure) !== norm(prev.arrival)) break;
    chain.push(cur);
  }
  return {
    chain,
    origin: chain[0]?.departure || "",
    destination: chain[chain.length - 1]?.arrival || "",
  };
};

/* --------------------------------------------------------
   Component
   -------------------------------------------------------- */

const FlightSegment = ({
  flight,
  segmentType, // "Outbound" | "Return"

  // formatting utilities injected from parent
  formatDate,
  formatTime,
  calculateDuration,
  getAirportName,

  // airline helpers (fall back to utils if not provided)
  getAirlineLogo,
  getAirlineName,

  // Leg anchors (recommended if supplier data is ambiguous)
  expectedOutboundOrigin,
  expectedOutboundDestination,
  expectedReturnOrigin,
  expectedReturnDestination,
}) => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleDetails = (index) => setOpenIndex((v) => (v === index ? null : index));

  /* ---------------- Normalization & anchors ---------------- */
  const allSegs = useMemo(() => normalizeSegments(flight), [flight]);
  const guess = useMemo(() => guessFirstChain(allSegs), [allSegs]);

  // Outbound anchors
  const OUT_O =
    expectedOutboundOrigin || guess?.origin || allSegs[0]?.departure || flight?.origin || "";
  const OUT_D = expectedOutboundDestination || guess?.destination || flight?.destination || "";

  // Outbound chain
  const outboundSegs = useMemo(() => {
    const found = findLeg(allSegs, OUT_O, OUT_D, { prefer: "earliest" });
    return found?.length ? found : guess?.chain || [];
  }, [allSegs, OUT_O, OUT_D, guess]);

  // Return anchors (reverse trip)
  const RET_O = expectedReturnOrigin || OUT_D;
  const RET_D = expectedReturnDestination || OUT_O;

  // Return chain (with outbound arrival fence)
  const outboundArrivesAt = outboundSegs.at(-1)?.arrivalAt || null;
  const returnSegs = useMemo(() => {
    let chain =
      findLeg(allSegs, RET_O, RET_D, { prefer: "earliest", notBefore: outboundArrivesAt }) ||
      findLeg(allSegs, RET_O, RET_D, { prefer: "earliest" }) ||
      findLeg(allSegs, RET_D, RET_O, { prefer: "earliest" }); // last resort swap
    return chain || [];
  }, [allSegs, RET_O, RET_D, outboundArrivesAt]);

  // Pick active leg
  const legSegs = segmentType === "Return" ? returnSegs : outboundSegs;
  const firstSegment = legSegs?.[0];
  const lastSegment = legSegs?.at(-1);

  // Header labels (with fallbacks)
  const headerOrigin = segmentType === "Return" ? RET_O : OUT_O;
  const headerDest = segmentType === "Return" ? RET_D : OUT_D;

  // Safe wrappers
  const safeDate = (d) => (d ? formatDate(d) : "—");
  const safeTime = (d) => (d ? formatTime(d) : "—");

  // Airline helpers (use injected first, utils fallback second)
  const airlineLogo = typeof getAirlineLogo === "function" ? getAirlineLogo : utilsGetAirlineLogo;
  const airlineName = typeof getAirlineName === "function" ? getAirlineName : utilsGetAirlineName;

  // console.info("Flight:", flight);

  /* ---------------- Render ---------------- */
  return (
    <div className="mb-4 rounded-3 bg-white">
      {/* Leg type chip (Outbound / Return) */}
      <div className="d-flex justify-content-end pt-2 pe-2">
        <span className="badge text-dark border rounded-pill px-3" style={{ background: "#EEF4FB" }}>
          {segmentType || "Segment"}
        </span>
      </div>

      {/* Header block: departure vs arrival */}
      <div className="row g-3 mb-2 pb-2">
        <div className="col-md-12">
          <div className="d-flex flex-column mb-3 flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            {/* Departure */}
            <div className="text-start w-100 w-md-25">
              <div className="fw-semibold text-dark text-xl">{safeDate(firstSegment?.departureAt)}</div>
              <div className="text-muted small">
                Departure Time: <b>{firstSegment?.departureTimeAt}</b>
              </div>
              <div className="text-muted small">
                From: <b>{getAirportName(firstSegment?.departure || headerOrigin)}</b>
              </div>
            </div>

            {/* Timeline w/ plane icon */}
            <div className="d-flex align-items-center justify-content-center flex-grow-1 position-relative w-100 w-md-50">
              <div className="w-100 position-relative" style={{ height: "1px", backgroundColor: "#dee2e6" }} />
              <div className="position-absolute top-50 start-50 translate-middle bg-white px-2">
                {/* plane svg */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M404 207.9L204.7 104.2C196.7 100.1 187.4 99.4 179 102.5L137.9 117.5C127.6 121.2 124.1 133.9 130.8 142.5L232.3 270.4L132.1 306.8L72 270.2C65.8 266.4 58.2 265.7 51.3 268.1L35 274.1C25.6 277.5 21.6 288.6 26.7 297.2L80.3 389C95.9 415.7 128.4 427.4 157.4 416.8L170.3 412.1L170.3 412.1L568.7 267.1C597.8 256.5 612.7 224.4 602.2 195.3C591.7 166.2 559.5 151.3 530.4 161.8L404 207.9zM64.2 512C46.5 512 32.2 526.3 32.2 544C32.2 561.7 46.5 576 64.2 576L576.2 576C593.9 576 608.2 561.7 608.2 544C608.2 526.3 593.9 512 576.2 512L64.2 512z"/>
                </svg>
              </div>
            </div>

            {/* Arrival */}
            <div className="text-end w-100 w-md-25">
              <div className="fw-semibold text-dark text-xl">{safeDate(lastSegment?.arrivalAt)}</div>
              <div className="text-muted small">
                Arrival Time: <b>{lastSegment?.arrivalTimeAt}</b>
              </div>
              <div className="text-muted small">
                To: <b>{getAirportName(lastSegment?.arrival || headerDest)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Render individual segments */}
      {(legSegs || []).map((segment, index) => (
        <div
          key={`${segment.airline || "XX"}-${segment.flightNo || "000"}-${segment.departureAt || index}-${index}`}
          className="border rounded-4 p-2 mb-2"
        >
          {/* Summary row */}
          <div className="d-flex justify-content-between gap-2">
            <div className="d-flex justify-content-start text-start align-items-center gap-2">
              {/* Airline logo */}
              <img
                className="w-[35px]"
                src={airlineLogo(segment.airline)}
                alt={airlineName(segment.airline)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                }}
              />
              <div className="pb-2 border-md border-end w-100 pe-5">
                <span className="fw-bold text-sm">{airlineName(segment.airline) || "N/A"}</span>
                <span className="text-secondary d-block fw-light mt-1 lh-0">
                  <small>
                    Flight No. {segment.flightNo || "—"} - {segment.departure || "—"} - {segment.arrival || "—"}
                  </small>
                </span>
              </div>
            </div>

            {/* Expand toggle */}
            <span
              onClick={() => toggleDetails(index)}
              className="d-flex h-[40px] cursor-pointer rounded-4 p-2 text-sm px-3 bg-[#EEF4FB] active:bg-[#cfd4da] items-center gap-2"
            >
              Details
              <svg
                className={`w-4 h-4 transform transition-transform duration-300 ${
                  openIndex === index ? "rotate-90" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Expanded details */}
          <div
            className={`overflow-hidden mt-2 gap-2 border-top p-3 transition-all duration-500 ease-in-out ${
              openIndex === index ? "max-h-[1000px] opacity-100" : "d-none opacity-0"
            }`}
          >
            <div className="flex justify-between gap-4 w-full mx-auto mt-2">
              {/* Departure */}
              <div className="text-center">
                <div className="text-md font-semibold text-gray-800">
                  {safeDate(segment.departureAt)} {segment.departureTimeAt}
                </div>
                <div className="text-xs text-gray-500">{getAirportName(segment.departure || "")}</div>
              </div>

              {/* Timeline */}
              <div className="relative flex-1 h-[1px] bg-gray-300 mx-2 mt-2">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                  <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path d="M404 207.9L204.7 104.2C196.7 100.1 187.4 99.4 179 102.5L137.9 117.5C127.6 121.2 124.1 133.9 130.8 142.5L232.3 270.4L132.1 306.8L72 270.2C65.8 266.4 58.2 265.7 51.3 268.1L35 274.1C25.6 277.5 21.6 288.6 26.7 297.2L80.3 389C95.9 415.7 128.4 427.4 157.4 416.8L170.3 412.1L170.3 412.1L568.7 267.1C597.8 256.5 612.7 224.4 602.2 195.3C591.7 166.2 559.5 151.3 530.4 161.8L404 207.9zM64.2 512C46.5 512 32.2 526.3 32.2 544C32.2 561.7 46.5 576 64.2 576L576.2 576C593.9 576 608.2 561.7 608.2 544C608.2 526.3 593.9 512 576.2 512L64.2 512z"/>
                  </svg>
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <div className="text-md font-semibold text-gray-800">
                  {safeDate(segment.arrivalAt)} {segment.arrivalTimeAt}
                </div>
                <div className="text-xs text-gray-500">{getAirportName(segment.arrival || "")}</div>
              </div>
            </div>

            {/* Tags */}
            <div className="d-flex flex-wrap mt-2 mb-2 text-muted fw-bold gap-2" style={{ fontSize: "12px" }}>
              <span className="border rounded-5 px-3 text-capitalize">
                {segment.refundable ? "Refundable" : "Non-refundable"}
              </span>
              {segment.bookingCode ? (
                <span className="border rounded-5 px-3">Class: {segment.bookingCode}</span>
              ) : null}
            </div>
          </div>
        </div>
      ))}

      {/* Fallback if no valid chain */}
      {!legSegs?.length && (
        <div className="text-center text-muted py-3">
          No segments found for {segmentType?.toLowerCase() || "segment"} leg ({headerOrigin} →{" "}
          {headerDest}).
        </div>
      )}
    </div>
  );
};

export default FlightSegment;
