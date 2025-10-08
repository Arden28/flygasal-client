import React, { useState, useMemo } from "react";
import {
  getAirlineLogo as utilsGetAirlineLogo,
  getAirlineName as utilsGetAirlineName,
} from "../../../utils/utils";

/* --------------------------------------------------------
   Helpers
   -------------------------------------------------------- */

const norm = (s = "") =>
  String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
const isTimeOnly = (s) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(s || ""));

const toIsoOrRaw = (dt) => {
  if (!dt) return "";
  // If it already parses, keep as-is (browser can format it)
  const t = new Date(dt).toString();
  if (t !== "Invalid Date") return dt;
  return ""; // give up (we’ll fall back to other fields)
};

const combineDateTime = (d, t) => {
  if (!d && !t) return "";
  // Try to combine date + time (local ISO). Keep as string; display formatters tolerate it.
  if (isDateOnly(d) && isTimeOnly(t)) return `${d}T${t}`;
  if (isDateOnly(d) && !t) return `${d}T00:00`;
  if (!d && isTimeOnly(t)) return `1970-01-01T${t}`;
  return toIsoOrRaw(d || t);
};

const byDepTime = (a, b) => {
  const ta = new Date(a.departureAt || a.arrivalAt || 0).getTime();
  const tb = new Date(b.departureAt || b.arrivalAt || 0).getTime();
  return ta - tb;
};

/**
 * Normalize raw supplier segment(s) into a consistent internal structure.
 * Handles variations in supplier keys across oneway/return/multi.
 */
const normalizeSegments = (flightLike) => {
  const raw =
    Array.isArray(flightLike?.segments) && flightLike.segments.length
      ? flightLike.segments
      : [flightLike];

  const segs = raw
    .filter(Boolean)
    .map((s) => {
      const airline = s.airline ?? s.carrier ?? "";
      const flightNo = s.flightNum ?? s.flightNumber ?? "";

      const departure = s.departure ?? s.origin ?? s.departureAirport ?? flightLike?.origin ?? "";
      const arrival = s.arrival ?? s.destination ?? s.arrivalAirport ?? flightLike?.destination ?? "";

      // Inputs potentially split across date-only + time-only fields
      const depDate = s.strDepartureDate ?? s.departureDate ?? s.depDate ?? "";
      const depTime = s.strDepartureTime ?? s.departureTime ?? s.depTime ?? "";
      const arrDate = s.strArrivalDate ?? s.arrivalDate ?? s.arrDate ?? "";
      const arrTime = s.strArrivalTime ?? s.arrivalTime ?? s.arrTime ?? "";
      

      const departureAt = combineDateTime(depDate, depTime) || toIsoOrRaw(s.departureTime) || toIsoOrRaw(s.departureDate);
      const arrivalAt = combineDateTime(arrDate, arrTime) || toIsoOrRaw(s.arrivalTime) || toIsoOrRaw(s.arrivalDate);

      const bookingCode = s.bookingCode ?? s.bookingClass ?? "";
      const refundable = !!s.refundable;

      return {
        airline,
        flightNo,
        departure,
        arrival,
        departureAt,
        arrivalAt,
        // keep the time-only strings for UI if present
        departureTimeAt: isTimeOnly(depTime) ? depTime : "",
        arrivalTimeAt: isTimeOnly(arrTime) ? arrTime : "",
        bookingCode,
        refundable,
      };
    })
    // Relaxed filter: keep if we have endpoints, and at least one datetime we can show
    .filter((s) => (s.departure || s.arrival) && (s.departureAt || s.arrivalAt))
    .sort(byDepTime);

  return segs;
};

/**
 * Find a contiguous chain of segments from ORIGIN → DEST.
 * Options: prefer: "earliest" | "latest"; notBefore: ISO datetime fence
 */
const findLeg = (segs, ORIGIN, DEST, { prefer = "earliest", notBefore } = {}) => {
  const O = norm(ORIGIN);
  const D = norm(DEST);
  if (!O || !D || !segs?.length) return null;

  const chains = [];
  for (let i = 0; i < segs.length; i++) {
    if (norm(segs[i].departure) !== O) continue;
    if (notBefore && new Date(segs[i].departureAt) < new Date(notBefore)) continue;

    const chain = [segs[i]];
    if (norm(segs[i].arrival) === D) {
      chains.push(chain.slice());
      continue;
    }
    for (let j = i + 1; j < segs.length; j++) {
      const prev = chain[chain.length - 1];
      const cur = segs[j];
      if (norm(cur.departure) !== norm(prev.arrival)) break;
      chain.push(cur);
      if (norm(cur.arrival) === D) {
        chains.push(chain.slice());
        break;
      }
    }
  }

  if (!chains.length) return null;

  return chains.reduce((best, c) => {
    const tBest = new Date(best[0].departureAt || 0);
    const tCur = new Date(c[0].departureAt || 0);
    return prefer === "latest" ? (tCur > tBest ? c : best) : tCur < tBest ? c : best;
  });
};

/** Guess first contiguous chain when no anchors are given */
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
  segmentType,

  // formatting utilities injected from parent
  formatDate,
  formatTime,
  calculateDuration,
  getAirportName,

  // airline helpers (fallback to utils)
  getAirlineLogo,
  getAirlineName,

  // optional anchors
  expectedOutboundOrigin,
  expectedOutboundDestination,
  expectedReturnOrigin,
  expectedReturnDestination,
}) => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleDetails = (index) => setOpenIndex((v) => (v === index ? null : index));

  const airlineLogo = typeof getAirlineLogo === "function" ? getAirlineLogo : utilsGetAirlineLogo;
  const airlineName = typeof getAirlineName === "function" ? getAirlineName : utilsGetAirlineName;
  const safeDate = (d) => (d ? formatDate(d) : "—");
  const safeTime = (d) => (d ? formatTime(d) : "—");

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

  // Absolute last-resort synthetic single-segment if everything else failed
  if (!legSegs?.length) {
    const depAt =
      flight?.departureTime ||
      combineDateTime(flight?.strDepartureDate, flight?.strDepartureTime) ||
      flight?.departureDate ||
      "";
    const arrAt =
      flight?.arrivalTime ||
      combineDateTime(flight?.strArrivalDate, flight?.strArrivalTime) ||
      flight?.arrivalDate ||
      "";

    if ((flight?.origin || flight?.destination) && (depAt || arrAt)) {
      legSegs = [
        {
          airline: flight?.airline || flight?.marketingCarriers?.[0] || "",
          flightNo: flight?.flightNum || flight?.flightNumber || "",
          departure: flight?.origin || "",
          arrival: flight?.destination || "",
          departureAt: depAt || arrAt, // at least one
          arrivalAt: arrAt || depAt,
          departureTimeAt: isTimeOnly(flight?.strDepartureTime) ? flight?.strDepartureTime : "",
          arrivalTimeAt: isTimeOnly(flight?.strArrivalTime) ? flight?.strArrivalTime : "",
          bookingCode: flight?.bookingCode || "",
          refundable: !!flight?.refundable,
        },
      ];
    } else {
      legSegs = [];
    }
  }

  const hasSegments = Array.isArray(legSegs) && legSegs.length > 0;
  const firstSegment = hasSegments ? legSegs[0] : null;
  const lastSegment = hasSegments ? legSegs[legSegs.length - 1] : null;

  const headerOrigin = isReturn ? RET_O : OUT_O;
  const headerDest = isReturn ? RET_D : OUT_D;

  /* ---------------- Render ---------------- */
  return (
    <div className="mb-4 rounded-3 bg-white">
      {/* Leg type chip */}
      <div className="d-flex justify-content-end pt-2 pe-2">
        <span className="badge text-dark border rounded-pill px-3" style={{ background: "#EEF4FB" }}>
          {segmentType || "Segment"}
        </span>
      </div>

      {/* Header block */}
      <div className="row g-3 mb-2 pb-2">
        <div className="col-md-12">
          <div className="d-flex flex-column mb-3 flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            {/* Departure */}
            <div className="text-start w-100 w-md-25">
              <div className="fw-semibold text-dark text-xl">{safeDate(firstSegment?.departureAt)}</div>
              <div className="text-muted small">
                Departure Time: <b>{firstSegment?.departureTimeAt ? firstSegment.departureTimeAt : safeTime(firstSegment?.departureAt)}</b>
              </div>
              <div className="text-muted small">
                From: <b>{getAirportName(firstSegment?.departure || headerOrigin || "")}</b>
              </div>
            </div>

            {/* Timeline */}
            <div className="d-flex align-items-center justify-content-center flex-grow-1 position-relative w-100 w-md-50">
              <div className="w-100 position-relative" style={{ height: "1px", backgroundColor: "#dee2e6" }} />
              <div className="position-absolute top-50 start-50 translate-middle bg-white px-2">
                <svg width="25" height="25" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g transform="translate(-624.000000, 0.000000)">
                      <g transform="translate(624.000000, 0.000000)">
                        <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"></path>
                        <path
                          d="M20.9999,20 C21.5522,20 21.9999,20.4477 21.9999,21 C21.9999,21.51285 21.613873,21.9355092 21.1165239,21.9932725 L20.9999,22 L2.99988,22 C2.44759,22 1.99988,21.5523 1.99988,21 C1.99988,20.48715 2.38591566,20.0644908 2.8832579,20.0067275 L2.99988,20 L20.9999,20 Z M7.26152,3.77234 C7.60270875,3.68092 7.96415594,3.73859781 8.25798121,3.92633426 L8.37951,4.0147 L14.564,9.10597 L18.3962,8.41394 C19.7562,8.16834 21.1459,8.64954 22.0628,9.68357 C22.5196,10.1987 22.7144,10.8812 22.4884,11.5492 C22.1394625,12.580825 21.3287477,13.3849891 20.3041894,13.729249 L20.0965,13.7919 L5.02028,17.8315 C4.629257,17.93626 4.216283,17.817298 3.94116938,17.5298722 L3.85479,17.4279 L0.678249,13.1819 C0.275408529,12.6434529 0.504260903,11.8823125 1.10803202,11.640394 L1.22557,11.6013 L3.49688,10.9927 C3.85572444,10.8966111 4.23617877,10.9655 4.53678409,11.1757683 L4.64557,11.2612 L5.44206,11.9612 L7.83692,11.0255 L3.97034,6.11174 C3.54687,5.57357667 3.77335565,4.79203787 4.38986791,4.54876405 L4.50266,4.51158 L7.26152,3.77234 Z M7.40635,5.80409 L6.47052,6.05484 L10.2339,10.8375 C10.6268063,11.3368125 10.463277,12.0589277 9.92111759,12.3504338 L9.80769,12.4028 L5.60866,14.0433 C5.29604667,14.1654333 4.9460763,14.123537 4.67296914,13.9376276 L4.57438,13.8612 L3.6268,13.0285 L3.15564,13.1547 L5.09121,15.7419 L19.5789,11.86 C20.0227,11.7411 20.3838,11.4227 20.5587,11.0018 C20.142625,10.53815 19.5333701,10.3022153 18.9191086,10.3592364 L18.7516,10.3821 L14.4682,11.1556 C14.218,11.2007714 13.9615551,11.149698 13.7491184,11.0154781 L13.6468,10.9415 L7.40635,5.80409 Z"
                          fill="#333333"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            {/* Arrival */}
            <div className="text-end w-100 w-md-25">
              <div className="fw-semibold text-dark text-xl">{safeDate(lastSegment?.arrivalAt)}</div>
              <div className="text-muted small">
                Arrival Time: <b>{lastSegment?.arrivalTimeAt ? lastSegment.arrivalTimeAt : safeTime(lastSegment?.arrivalAt)}</b>
              </div>
              <div className="text-muted small">
                To: <b>{getAirportName(lastSegment?.arrival || headerDest || "")}</b>
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
                className={`w-4 h-4 transform transition-transform duration-300 ${openIndex === index ? "rotate-90" : "rotate-0"}`}
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
                  {safeDate(segment.departureAt)} {segment.departureTimeAt || ""}
                </div>
                <div className="text-xs text-gray-500">{getAirportName(segment.departure || "")}</div>
              </div>

              {/* Timeline */}
              <div className="relative flex-1 h-[1px] bg-gray-300 mx-2 mt-2">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                  <svg width="25" height="25" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                      <g transform="translate(-624.000000, 0.000000)">
                        <g transform="translate(624.000000, 0.000000)">
                          <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"></path>
                          <path
                            d="M20.9999,20 C21.5522,20 21.9999,20.4477 21.9999,21 C21.9999,21.51285 21.613873,21.9355092 21.1165239,21.9932725 L20.9999,22 L2.99988,22 C2.44759,22 1.99988,21.5523 1.99988,21 C1.99988,20.48715 2.38591566,20.0644908 2.8832579,20.0067275 L2.99988,20 L20.9999,20 Z M7.26152,3.77234 C7.60270875,3.68092 7.96415594,3.73859781 8.25798121,3.92633426 L8.37951,4.0147 L14.564,9.10597 L18.3962,8.41394 C19.7562,8.16834 21.1459,8.64954 22.0628,9.68357 C22.5196,10.1987 22.7144,10.8812 22.4884,11.5492 C22.1394625,12.580825 21.3287477,13.3849891 20.3041894,13.729249 L20.0965,13.7919 L5.02028,17.8315 C4.629257,17.93626 4.216283,17.817298 3.94116938,17.5298722 L3.85479,17.4279 L0.678249,13.1819 C0.275408529,12.6434529 0.504260903,11.8823125 1.10803202,11.640394 L1.22557,11.6013 L3.49688,10.9927 C3.85572444,10.8966111 4.23617877,10.9655 4.53678409,11.1757683 L4.64557,11.2612 L5.44206,11.9612 L7.83692,11.0255 L3.97034,6.11174 C3.54687,5.57357667 3.77335565,4.79203787 4.38986791,4.54876405 L4.50266,4.51158 L7.26152,3.77234 Z M7.40635,5.80409 L6.47052,6.05484 L10.2339,10.8375 C10.6268063,11.3368125 10.463277,12.0589277 9.92111759,12.3504338 L9.80769,12.4028 L5.60866,14.0433 C5.29604667,14.1654333 4.9460763,14.123537 4.67296914,13.9376276 L4.57438,13.8612 L3.6268,13.0285 L3.15564,13.1547 L5.09121,15.7419 L19.5789,11.86 C20.0227,11.7411 20.3838,11.4227 20.5587,11.0018 C20.142625,10.53815 19.5333701,10.3022153 18.9191086,10.3592364 L18.7516,10.3821 L14.4682,11.1556 C14.218,11.2007714 13.9615551,11.149698 13.7491184,11.0154781 L13.6468,10.9415 L7.40635,5.80409 Z"
                            fill="#333333"
                          ></path>
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <div className="text-md font-semibold text-gray-800">
                  {safeDate(segment.arrivalAt)} {segment.arrivalTimeAt || ""}
                </div>
                <div className="text-xs text-gray-500">{getAirportName(segment.arrival || "")}</div>
              </div>
            </div>

            {/* Tags */}
            <div className="d-flex flex-wrap mt-2 mb-2 text-muted fw-bold gap-2" style={{ fontSize: "12px" }}>
              <span className="border rounded-5 px-3 text-capitalize">
                {segment.refundable ? "Refundable" : "Non-refundable"}
              </span>
              {segment.bookingCode ? <span className="border rounded-5 px-3">Class: {segment.bookingCode}</span> : null}
            </div>
          </div>
        </div>
      ))}

      {/* If nothing survived even after synthetic fallback, stay quiet (no scary message) */}
      {!hasSegments && <div className="text-center text-muted py-3">Segment details unavailable for this leg.</div>}
    </div>
  );
};

export default FlightSegment;
