import React, { useMemo } from "react";
import {
  formatDuration,
  safeDate,
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
  segmentType, // "Outbound" | "Return" | "Leg n"
  // formatting utilities
  formatDate,
  formatTime,
  calculateDuration,
  getAirportName,
  // airline helpers (fallback to utils)
  getAirlineLogo,
  getAirlineName,
  // optional: when you want a "Select this flight" action here too

  // optional anchors
  expectedOutboundOrigin,
  expectedOutboundDestination,
  expectedReturnOrigin,
  expectedReturnDestination,
  // onSelect,
}) => {

  const airlineLogo = typeof getAirlineLogo === "function" ? getAirlineLogo : utilsGetAirlineLogo;
  const airlineName = typeof getAirlineName === "function" ? getAirlineName : utilsGetAirlineName;

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
  // const airlineLogo =
  //   typeof getAirlineLogo === "function" ? getAirlineLogo : utilsGetAirlineLogo;
  // const airlineName =
  //   typeof getAirlineName === "function" ? getAirlineName : utilsGetAirlineName;

  const segments = useMemo(() => normalizeSegments(flight), [flight]);
  const first = segments[0];
  const last = segments[segments.length - 1];

  // const carrier = first?.airline || flight?.marketingCarriers?.[0] || "";
  // const flightNo = first?.flightNo || flight?.flightNumber || "";
  // const logoSrc = airlineLogo(carrier);
  // const airline = airlineName(carrier) || "Airline";

  const depDate = first?.departureAt ? formatDate(first.departureAt) : "";

  const arrTime = last?.arrivalTimeAt || (last?.arrivalAt ? formatTime(last.arrivalAt) : "");
  const arrDate = last?.arrivalAt ? formatDate(last.arrivalAt) : "";

  // total duration
  const durationText =
    first?.departureAt && last?.arrivalAt
      ? calculateDuration(first.departureAt, last.arrivalAt)
      : "";

  // stops label
  // const stops = Math.max(0, (segments?.length || 1) - 1);
  // const stopsText = stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`;

  // soft baggage & fare hints (use available fields if present, otherwise hide)
  // const fareText =
  //   flight?.fareClassLabel ||
  //   flight?.cabin ||
  //   (flight?.bookingCode ? `Class ${flight.bookingCode}` : "");
  // const personalItem =
  //   flight?.baggage?.personal ||
  //   flight?.allowances?.personal ||
  //   null; // e.g. "18 x 14 x 8 inches"
  const carryOn =
    flight?.baggage?.carry ||
    flight?.allowances?.carry ||
    (flight?.carryOn ? `(${flight.carryOn})` : null); // e.g. "1 x 7kg"
  const checked =
    flight?.baggage?.checked ||
    flight?.allowances?.checked ||
    (flight?.checkedBags ? `(${flight.checkedBags})` : null);

  return (
    <div className="bg-white rounded-xl px-0 py-2">

      {/* Route header */}
      <div className="border-b px-4 py-3 mb-3">
        <div className="flex justify-between items-start">
          <span className="font-medium text-md">{firstSegment?.departure || headerOrigin || ""} → {lastSegment?.arrival || headerDest || ""}</span>
          {/* right-corner duration (like the mock card top-right small meta) */}
          <div className="text-right text-xs text-slate-500">{durationText}</div>
        </div>
      </div>


      {/* Render individual segments */}
      {(legSegs || []).map((segment) => (  
        <>
        {/* header: route airline + meta + right pill */}
        <div className="flex items-start justify-between px-4 mt-3">
          <div className="flex items-center gap-3">
            <img
              src={airlineLogo(segment.airline)}
              alt={`${airlineName(segment.airline)} logo`}
              className="h-10 w-10 rounded-full object-contain ring-1 ring-slate-200 bg-white"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/img/airlines/placeholder.png";
              }}
            />
            <div>
              <div className="text-slate-900 font-semibold">{airlineName(segment.airline) || "N/A"}</div>
              <div className="text-xs text-slate-500">
                {formatDuration(segment.flightTime || "")} {segment.flightNo ? " • " : " "}
                {segment.flightNo ? `${segment.airline}${segment.flightNo}` : null}
              </div>
            </div>
          </div>

          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">
            Inflight experience
          </span>
        </div>

        {/* body */}
        <div className="relative px-4 pb-3 pt-3">
          {/* right-corner duration */}
          <div className="absolute right-5 top-3 text-xs text-slate-500">{formatDuration(segment.flightTime)}</div>

          <div className="grid grid-cols-[20px_1fr] gap-4">
            {/* vertical timeline */}
            <div className="relative">
              <div className="absolute left-[8px] top-2 bottom-8 w-[2px] bg-violet-200" />
              <span className="absolute left-[5px] top-2 h-3 w-3 rounded-full bg-[#6C54FF]" />
              <span className="absolute left-[5px] bottom-8 h-3 w-3 rounded-full bg-[#6C54FF]" />
            </div>

            {/* content column */}
            <div className="space-y-6">
              {/* departure block */}
              <div>
                <div className="text-md font-semibold leading-6 text-slate-900 tabular-nums">
                  {segment.departureTimeAt || ""}
                </div>
                <div className="text-md text-slate-900">{getAirportName(segment.departure || "")}</div>
                <div className="text-xs text-slate-500">
                  {safeDate(segment.departureAt)} <span className="mx-1">•</span> Terminal {segment?.departureTerminal || "—"}
                </div>

                {/* badges row (fare + personal item) */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {segment.bookingCode && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                      Fare:&nbsp;<b className="font-medium">Class {segment.bookingCode ?? segment.bookingClass}</b>
                    </span>
                  )}

                  {/* {flight?.baggage && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                      <span className="h-3 w-[2px] rounded bg-emerald-500" />
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <rect x="5" y="7" width="14" height="11" rx="2" />
                        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
                      </svg>
                      Personal Item ({personalItem})
                    </span>
                  )} */}
                </div>

                {/* baggage chips row */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {carryOn && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <rect x="3" y="7" width="18" height="13" rx="2" />
                        <path d="M8 7V6a4 4 0 0 1 8 0v1" />
                      </svg>
                      Carry on bag {carryOn}
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      checked
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M8 7V6a4 4 0 0 1 8 0v1" />
                    </svg>
                    {checked ? `Checked bag ${checked}` : "No checked bag"}
                  </span>
                </div>
              </div>

              {/* arrival block */}
              <div className="relative">
                <div className="text-md font-semibold leading-6 text-slate-900 tabular-nums">
                  {segment.arrivalTimeAt || ""}
                </div>
                <div className="text-md text-slate-900">{getAirportName(segment.arrival) || "—"}</div>
                <div className="text-xs text-slate-500">
                  {safeDate(segment.arrivalAt)} <span className="mx-1">•</span> Terminal {segment?.arrivalTerminal || "—"}
                </div>
              </div>
            </div>
          </div>

        </div>
        </>
      ))}
          {/* notes */}
          <div className="mt-6 px-4 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">* All times are local</div>
            <span>&nbsp;</span>
          </div>
    </div>
  );
};

export default FlightSegment;
