import React, { useState, useMemo } from "react";
import {
  getAirlineLogo as utilsGetAirlineLogo,
  getAirlineName as utilsGetAirlineName,
} from "../../../utils/utils";

/* ---------------- helpers ---------------- */
const norm = (s = "") =>
  String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
const isTimeOnly = (s) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(s || ""));

const toIsoOrRaw = (dt) => {
  if (!dt) return "";
  const t = new Date(dt).toString();
  if (t !== "Invalid Date") return dt;
  return "";
};

const combineDateTime = (d, t) => {
  if (!d && !t) return "";
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

      const depDate = s.strDepartureDate ?? s.departureDate ?? s.depDate ?? "";
      const depTime = s.strDepartureTime ?? s.departureTime ?? s.depTime ?? "";
      const arrDate = s.strArrivalDate ?? s.arrivalDate ?? s.arrDate ?? "";
      const arrTime = s.strArrivalTime ?? s.arrivalTime ?? s.arrTime ?? "";

      const departureAt =
        combineDateTime(depDate, depTime) ||
        toIsoOrRaw(s.departureTime) ||
        toIsoOrRaw(s.departureDate);
      const arrivalAt =
        combineDateTime(arrDate, arrTime) ||
        toIsoOrRaw(s.arrivalTime) ||
        toIsoOrRaw(s.arrivalDate);

      const bookingCode = s.bookingCode ?? s.bookingClass ?? "";
      const refundable = !!s.refundable;

      return {
        airline,
        flightNo,
        departure,
        arrival,
        departureAt,
        arrivalAt,
        departureTimeAt: isTimeOnly(depTime) ? depTime : "",
        arrivalTimeAt: isTimeOnly(arrTime) ? arrTime : "",
        bookingCode,
        refundable,
      };
    })
    .filter((s) => (s.departure || s.arrival) && (s.departureAt || s.arrivalAt))
    .sort(byDepTime);

  return segs;
};

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

/* ---------------- component ---------------- */
const FlightSegment = ({
  flight,
  segmentType,
  formatDate,
  formatTime,
  calculateDuration,
  getAirportName,
  getAirlineLogo,
  getAirlineName,
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

  const allSegs = useMemo(() => normalizeSegments(flight), [flight]);
  const guess = useMemo(() => guessFirstChain(allSegs), [allSegs]);

  const OUT_O =
    expectedOutboundOrigin || guess?.origin || allSegs[0]?.departure || flight?.origin || "";
  const OUT_D =
    expectedOutboundDestination ||
    guess?.destination ||
    (allSegs.at ? allSegs.at(-1)?.arrival : allSegs[allSegs.length - 1]?.arrival) ||
    flight?.destination ||
    "";

  const outboundSegs = useMemo(() => {
    const found = findLeg(allSegs, OUT_O, OUT_D, { prefer: "earliest" }) || null;
    return found?.length ? found : guess?.chain || allSegs;
  }, [allSegs, OUT_O, OUT_D, guess]);

  const RET_O = expectedReturnOrigin || OUT_D;
  const RET_D = expectedReturnDestination || OUT_O;
  const outboundArrivesAt =
    (outboundSegs.at ? outboundSegs.at(-1) : outboundSegs[outboundSegs.length - 1])?.arrivalAt ||
    null;

  const returnSegs = useMemo(() => {
    let chain =
      findLeg(allSegs, RET_O, RET_D, { prefer: "earliest", notBefore: outboundArrivesAt }) ||
      findLeg(allSegs, RET_O, RET_D, { prefer: "earliest" }) ||
      findLeg(allSegs, RET_D, RET_O, { prefer: "earliest" });
    return chain || [];
  }, [allSegs, RET_O, RET_D, outboundArrivesAt]);

  const isReturn = segmentType === "Return";
  let legSegs = isReturn ? returnSegs : outboundSegs;

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
          departureAt: depAt || arrAt,
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

  return (
    <div className="mb-4 rounded-3 bg-white">
      {/* chip */}
      <div className="d-flex justify-content-end pt-2 pe-2">
        <span className="badge text-dark border rounded-pill px-3" style={{ background: "#EEF4FB" }}>
          {segmentType || "Segment"}
        </span>
      </div>

      {/* header */}
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

            {/* timeline icon */}
            <div className="d-flex align-items-center justify-content-center flex-grow-1 position-relative w-100 w-md-50">
              <div className="w-100 position-relative" style={{ height: "1px", backgroundColor: "#dee2e6" }} />
              <div className="position-absolute top-50 start-50 translate-middle bg-white px-2">
                <svg width="25" height="25" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5l1.4.4 3.1 8.8 9.4 2.5c1 .3 2-.3 2.3-1.3.3-1-.3-2-1.3-2.3l-7.7-2.1L7.1 5.8 3 5z" fill="#333" />
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

          <div className="text-muted" style={{ fontSize: 11 }}>* All times are local</div>
        </div>
      </div>

      {/* segments */}
      {(legSegs || []).map((segment, index) => (
        <div
          key={`${segment.airline || "XX"}-${segment.flightNo || "000"}-${segment.departureAt || index}-${index}`}
          className="border rounded-4 p-2 mb-2"
        >
          {/* summary */}
          <div className="d-flex justify-content-between gap-2">
            <div className="d-flex justify-content-start text-start align-items-center gap-2">
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

          {/* expanded */}
          <div
            className={`overflow-hidden mt-2 gap-2 border-top p-3 transition-all duration-500 ease-in-out ${
              openIndex === index ? "max-h-[1000px] opacity-100" : "d-none opacity-0"
            }`}
          >
            <div className="flex justify-between gap-4 w-full mx-auto mt-2">
              <div className="text-center">
                <div className="text-md font-semibold text-gray-800">
                  {safeDate(segment.departureAt)} {segment.departureTimeAt || ""}
                </div>
                <div className="text-xs text-gray-500">{getAirportName(segment.departure || "")}</div>
              </div>

              <div className="relative flex-1 h-[1px] bg-gray-300 mx-2 mt-2">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                  <svg width="25" height="25" viewBox="0 0 24 24">
                    <path d="M3 5l1.4.4 3.1 8.8 9.4 2.5c1 .3 2-.3 2.3-1.3.3-1-.3-2-1.3-2.3l-7.7-2.1L7.1 5.8 3 5z" fill="#333" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <div className="text-md font-semibold text-gray-800">
                  {safeDate(segment.arrivalAt)} {segment.arrivalTimeAt || ""}
                </div>
                <div className="text-xs text-gray-500">{getAirportName(segment.arrival || "")}</div>
              </div>
            </div>

            <div className="d-flex flex-wrap mt-2 mb-2 text-muted fw-bold gap-2" style={{ fontSize: "12px" }}>
              <span className="border rounded-5 px-3 text-capitalize">
                {segment.refundable ? "Refundable" : "Non-refundable"}
              </span>
              {segment.bookingCode ? <span className="border rounded-5 px-3">Booking Code: {segment.bookingCode}</span> : null}
              {segment.availabilityCount ? <span className="border rounded-5 px-3">Available Seats: {segment.availabilityCount}</span> : null}
            </div>
          </div>
        </div>
      ))}

      {!hasSegments && <div className="text-center text-muted py-3">Segment details unavailable for this leg.</div>}
    </div>
  );
};

export default FlightSegment;
