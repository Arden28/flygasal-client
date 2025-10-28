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
        departureTimeAt: isTimeOnly(depTime) ? depTime : "",
        arrivalTimeAt: isTimeOnly(arrTime) ? arrTime : "",
        bookingCode,
        refundable,
        availabilityCount: s.availabilityCount,
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
  formatTimeOnly, // <- used for header times to match screenshot
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
    expectedOutboundDestination || guess?.destination || allSegs.at?.(-1)?.arrival || flight?.destination || "";

  const outboundSegs = useMemo(() => {
    const found = findLeg(allSegs, OUT_O, OUT_D, { prefer: "earliest" }) || null;
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

  const headerDepartTime =
    firstSegment?.departureTimeAt ||
    (firstSegment?.departureAt ? formatTimeOnly?.(firstSegment.departureAt) : "");
  const headerArriveTime =
    lastSegment?.arrivalTimeAt ||
    (lastSegment?.arrivalAt ? formatTimeOnly?.(lastSegment.arrivalAt) : "");

  const totalStops = Math.max(0, legSegs.length - 1);
  const legDuration =
    firstSegment?.departureAt && lastSegment?.arrivalAt
      ? calculateDuration(firstSegment.departureAt, lastSegment.arrivalAt)
      : "—";

  /* ---------------- render ---------------- */

  return (
    <div className="rounded-2xl border border-slate-200">
      {/* Header route bar like screenshots */}
      <div className="flex items-center gap-3 px-3 py-3 md:px-4">
        {/* left chip */}
        <span className="rounded-full border px-3 py-1 text-xs bg-[#EEF4FB] text-slate-700">
          {segmentType || "Segment"}
        </span>

        {/* time bar */}
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm text-slate-800">
            <div className="shrink-0 font-medium">{headerDepartTime || ""}</div>
            <div className="relative flex-1">
              <div className="h-[3px] w-full rounded-full bg-violet-600/80" />
              {/* dots for stops */}
              <div className="absolute inset-0 flex items-center justify-between">
                {legSegs.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rounded-full ${i === 0 || i === legSegs.length - 1 ? "bg-violet-600" : "bg-violet-600/50"}`}
                    style={{ transform: "translateY(-1px)" }}
                  />
                ))}
              </div>
            </div>
            <div className="shrink-0 font-medium">{headerArriveTime || ""}</div>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <div className="uppercase">
              {(firstSegment?.departure || legSegs[0]?.departure || "").slice(0, 3)} →{" "}
              {(lastSegment?.arrival || "").slice(0, 3)}
            </div>
            <div className="flex items-center gap-2">
              <span>{totalStops === 0 ? "Non-stop" : `${totalStops} stop${totalStops > 1 ? "s" : ""}`}</span>
              <span className="text-slate-400">•</span>
              <span>{legDuration}</span>
            </div>
          </div>
        </div>

        {/* toggle */}
        <button
          type="button"
          onClick={() => toggleDetails(0)}
          className="rounded-full px-3 py-1 text-violet-700 hover:bg-violet-50 text-sm"
        >
          Details
          <span className={`ms-2 inline-block transition-transform ${openIndex === 0 ? "rotate-180" : "rotate-0"}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Collapsible segment list */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          openIndex === 0 ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-3 pb-3 md:px-4">
          {(legSegs || []).map((segment, index) => (
            <div
              key={`${segment.airline || "XX"}-${segment.flightNo || "000"}-${segment.departureAt || index}-${index}`}
              className="mb-2 rounded-xl border p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    className="h-8 w-8 rounded object-contain"
                    src={airlineLogo(segment.airline)}
                    alt={airlineName(segment.airline)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/img/airlines/placeholder.png";
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold">
                      {airlineName(segment.airline) || "N/A"}{" "}
                      {segment.flightNo ? <span className="text-slate-500 font-normal">• {segment.flightNo}</span> : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      {segment.departure || "—"} → {segment.arrival || "—"}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <div>
                    {safeDate(segment.departureAt)} •{" "}
                    <b>{segment.departureTimeAt ? segment.departureTimeAt : safeTime(segment.departureAt)}</b>
                  </div>
                  <div className="text-slate-400">to</div>
                  <div>
                    {safeDate(segment.arrivalAt)} •{" "}
                    <b>{segment.arrivalTimeAt ? segment.arrivalTimeAt : safeTime(segment.arrivalAt)}</b>
                  </div>
                </div>
              </div>

              {/* small tag row */}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-700">
                <span className="rounded-full border px-2 py-0.5">
                  {segment.refundable ? "Refundable" : "Non-refundable"}
                </span>
                {segment.bookingCode ? (
                  <span className="rounded-full border px-2 py-0.5">Booking code: {segment.bookingCode}</span>
                ) : null}
                {segment.availabilityCount ? (
                  <span className="rounded-full border px-2 py-0.5">
                    Seats: {segment.availabilityCount}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasSegments && <div className="px-4 pb-4 text-center text-muted">Segment details unavailable for this leg.</div>}
    </div>
  );
};

export default FlightSegment;
