import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  diffMinutes,
  formatDuration,
  parseAirportLabel,
  safeDate,
  getAirlineLogo as utilsGetAirlineLogo,
  getAirlineName as utilsGetAirlineName,
} from "../../../utils/utils";
import { IoTicketSharp } from "react-icons/io5";
import { FaPersonWalking } from "react-icons/fa6";
import { FaSuitcase } from "react-icons/fa";
import { BsFillBackpack2Fill, BsSuitcase2Fill } from "react-icons/bs";
import { createPortal } from "react-dom";

/* ---------------- tiny helpers ---------------- */
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

      const cabinClass = s?.cabinClass ?? "";
      const availabilityCount = s?.availabilityCount ?? "";
      const arrivalTerminal = s?.arrivalTerminal ?? "";
      const codeShare = s?.codeShare ?? "";
      const departureTerminal = s?.departureTerminal ?? "";
      const flightTime = s?.flightTime ?? "";

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
        segmentId: s.segmentId || s.segmentID || s.segment_id || "",
        airline,
        flightNo,
        departure,
        arrival,
        departureAt,
        arrivalAt,
        departureTimeAt: isTimeOnly(depTime) ? depTime : "",
        arrivalTimeAt: isTimeOnly(arrTime) ? arrTime : "",
        refundable,
        bookingCode,
        cabinClass,
        availabilityCount,
        arrivalTerminal,
        codeShare,
        departureTerminal,
        flightTime,
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

/* ============== Shared Row + SegmentInfoTooltip (Big card) ============== */
function Row({ label, value, sub }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-slate-700">{label}</div>
        {sub ? <div className="text-[12px] text-slate-500">{sub}</div> : null}
      </div>
      <div className="text-right tabular-nums font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SegmentInfoTooltip({ open, onClose, anchorId, title = "Segment details", rows = [] }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const el = anchorId ? document.getElementById(anchorId) : null;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gutter = 10;

      const cardW = Math.min(vw * 0.92, 520);
      const cardMaxH = Math.min(vh * 0.8, 560);

      let left = r.right - cardW;
      let top = r.bottom + 8;

      if (left + cardW > vw - gutter) left = vw - gutter - cardW;
      if (left < gutter) left = gutter;

      if (top + cardMaxH > vh - gutter) {
        top = Math.max(gutter, r.top - 8 - cardMaxH);
      }

      setCoords({ left, top, cardW, cardMaxH });
    };

    update();
    const opts = { passive: true, capture: true };
    window.addEventListener("resize", update, opts);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update, opts);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorId]);

  if (!open) return null;

  return createPortal(
    <>
      <motion.div
        key="seginfo-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        key="seginfo-card"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        role="dialog"
        aria-label={title}
        className="z-[9999] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={{
          position: "fixed",
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          width: "min(92vw, 520px)",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="text-[12px] text-slate-500">Applies to this flight segment</div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Close segment details"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-2 pb-4 overflow-auto" style={{ maxHeight: "calc(80vh - 52px)" }}>
          {rows.map((r, i) => (
            <Row key={i} label={r.label} value={r.value} sub={r.sub} />
          ))}
          <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Info provided by airline/offer rules. Actual allowances may vary at check-in.
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* ============== Layover ribbon ============== */
function LayoverBar({ minutes, city, airport, short, long, protectedTransfer = true }) {
  const hh = Math.floor((minutes || 0) / 60);
  const mm = Math.max(0, Math.round((minutes || 0) % 60));

  return (
    <div className="mt-3 border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: icon + text */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-7 w-7 items-center text-white justify-center rounded-full bg-emerald-500">
            <FaPersonWalking className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-slate-800">
              Connection in {city || "—"}
            </div>
            <div className="text-[12px] text-slate-600">
              {hh}h {mm}m{airport ? <> &nbsp;•&nbsp; {airport}</> : null}
            </div>
          </div>
        </div>

        {/* Right: badges */}
        <div className="flex flex-wrap items-center gap-2">
          {protectedTransfer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-white">
              Protected transfer
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
                i
              </span>
            </span>
          )}

          {long && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/80 px-3 py-1 text-[11px] font-medium text-white">
              Longer transfer
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
                i
              </span>
            </span>
          )}

          {short && !long && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-medium text-white">
              Short transfer
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
                i
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= component ================= */
const FlightSegment = ({
  flight,
  segmentType, // "Outbound" | "Return" | "Leg n"
  getAirportName,
  // airline helpers (fallback to utils)
  getAirlineLogo,
  getAirlineName,
  // optional anchors
  expectedOutboundOrigin,
  expectedOutboundDestination,
  expectedReturnOrigin,
  expectedReturnDestination,
  // NEW: baggage map from MapOffer.normalize
  baggage,
  globalIdxToSegId
}) => {
  const airlineLogo = typeof getAirlineLogo === "function" ? getAirlineLogo : utilsGetAirlineLogo;
  const airlineName = typeof getAirlineName === "function" ? getAirlineName : utilsGetAirlineName;

  /* -------- Normalize & anchor leg -------- */
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
      findLeg(allSegs, RET_D, OUT_O, { prefer: "earliest" });
    return chain || [];
  }, [allSegs, RET_O, RET_D, outboundArrivesAt]);

  const isReturn = segmentType === "Return";
  let legSegs = isReturn ? returnSegs : outboundSegs;

  // Last-resort single segment
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
          segmentId: flight?.segmentId || flight?.segmentID || flight?.segment_id || "",
          airline: flight?.airline || flight?.marketingCarriers?.[0] || "",
          flightNo: flight?.flightNum || flight?.flightNumber || "",
          departure: flight?.origin || "",
          arrival: flight?.destination || "",
          departureAt: depAt || arrAt,
          arrivalAt: arrAt || depAt,
          departureTimeAt: isTimeOnly(flight?.strDepartureTime) ? flight?.strDepartureTime : "",
          arrivalTimeAt: isTimeOnly(flight?.strArrivalTime) ? flight?.strArrivalTime : "",
          refundable: !!flight?.refundable,

          cabinClass: flight?.cabinClass,
          availabilityCount: flight?.availabilityCount,
          bookingCode: flight?.bookingCode,
          arrivalTerminal: flight?.arrivalTerminal,
          codeShare: flight?.codeShare,
          departureTerminal: flight?.departureTerminal,
          flightTime: flight?.flightTime,
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

  /* -------- Baggage maps (normalized or PKFare raw) -------- */
  const maps = useMemo(() => {
    const normalized = {
      checkedBySegment: baggage?.adt?.checkedBySegment || {},
      carryOnBySegment: baggage?.adt?.carryOnBySegment || {},
    };

    if (Object.keys(normalized.checkedBySegment).length || Object.keys(normalized.carryOnBySegment).length) {
      return normalized;
    }

    const adtBlocks = baggage?.ADT;
    const idxMap = (typeof globalIdxToSegId === "object" && globalIdxToSegId) ? globalIdxToSegId : null;
    if (!Array.isArray(adtBlocks) || !idxMap) return normalized;

    const checked = {};
    const cabin = {};
    adtBlocks.forEach((b) => {
      const indices = Array.isArray(b?.segmentIndexList) ? b.segmentIndexList : (Array.isArray(b?.segmentIndex) ? b.segmentIndex : []);
      indices.forEach((n) => {
        const sid = idxMap[n];
        if (!sid) return;
        if (b.baggageAmount || b.baggageWeight) {
          checked[sid] = {
            amount: b.baggageAmount || null,
            weight: b.baggageWeight || null,
          };
        }
        if (b.carryOnAmount || b.carryOnWeight || b.carryOnSize) {
          cabin[sid] = {
            amount: b.carryOnAmount || null,
            weight: b.carryOnWeight || null,
            size:   b.carryOnSize   || null,
          };
        }
      });
    });

    return { checkedBySegment: checked, carryOnBySegment: cabin };
  }, [baggage, globalIdxToSegId]);

  const checkedBySeg = maps.checkedBySegment;
  const cabinBySeg   = maps.carryOnBySegment;

  /* -------- Local tooltip state (one open per FlightSegment) -------- */
  const [openInfoKey, setOpenInfoKey] = useState(null);
  const closeInfo = () => setOpenInfoKey(null);
  const toggleInfo = (key) => setOpenInfoKey((p) => (p === key ? null : key));

  return (
    <div className="bg-white rounded-xl px-0 py-2">

      {/* Route header */}
      <div className="border-b px-4 py-3 mb-3">
        <div className="flex justify-between items-start">
          <span className="font-medium text-md">
            {firstSegment?.departure || headerOrigin || ""} → {lastSegment?.arrival || headerDest || ""}
          </span>
          <div className="text-right text-xs text-slate-500">{formatDuration(flight?.journeyTime)}</div>
        </div>
      </div>

      {/* Render individual segments */}
      {(legSegs || []).map((segment, idx) => {
        const next = legSegs[idx + 1];
        const layoverMins = next ? diffMinutes(segment?.arrivalAt, next?.departureAt) : 0;
        const isShort = layoverMins > 0 && layoverMins < 60;
        const isLong = layoverMins >= 180;
        const nextDepLabel = next ? getAirportName(next.departure || "") : "";
        const { city, airport } = parseAirportLabel(nextDepLabel);

        // per-segment baggage strings
        const sid = segment.segmentId || "";
        const ch = sid ? checkedBySeg[sid] : null;
        const cb = sid ? cabinBySeg[sid] : null;

        const carryOnStr = cb ? [cb.amount, cb.weight, cb.size].filter(Boolean).join(" ") : null;
        const checkedStr = ch ? [ch.amount, ch.weight].filter(Boolean).join(" ") : null;

        // tooltip anchor + rows
        const anchorId = `seg-info-${sid || idx}`;
        const infoRows = [
          { label: "Airline", value: airlineName(segment.airline) || segment.airline || "—" },
          { label: "Flight", value: segment.flightNo ? `${segment.airline}${segment.flightNo}` : "—" },
          { label: "Cabin", value: segment.cabinClass || "—", sub: segment.bookingCode ? `Fare class ${segment.bookingCode}` : undefined },
          { label: "Seats left", value: segment.availabilityCount || "—" },
          { label: "Terminals", value: `Dep ${segment.departureTerminal || "—"} • Arr ${segment.arrivalTerminal || "—"}` },
          ...(segment.codeShare ? [{ label: "Codeshare", value: String(segment.codeShare) }] : []),
          { label: "Carry-on", value: carryOnStr || "Not included" },
          { label: "Checked bag", value: checkedStr || "Not included" },
        ];

        return (
          <React.Fragment key={sid || idx}>
            {/* header: airline + meta + right pill */}
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

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700">
                  Inflight experience
                </span>

                {/* NEW: Segment info trigger (uses big anchored tooltip pattern) */}
                <button
                  type="button"
                  id={anchorId}
                  onClick={() => toggleInfo(anchorId)}
                  aria-expanded={openInfoKey === anchorId}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#F68221]/40 ring-offset-2"
                  title="View segment details"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>

                <SegmentInfoTooltip
                  open={openInfoKey === anchorId}
                  onClose={closeInfo}
                  anchorId={anchorId}
                  title="Segment details"
                  rows={infoRows}
                />
              </div>
            </div>

            {/* body */}
            <div className="relative px-4 pb-3 pt-3">
              <div className="absolute right-5 top-3 text-xs text-slate-500">{formatDuration(segment?.flightTime)}</div>

              <div className="grid grid-cols-[20px_1fr] gap-4">
                {/* vertical timeline */}
                <div className="relative">
                  <div className="absolute left-[8px] top-2 bottom-8 w-[2px] bg-orange-200" />
                  <span className="absolute left-[5px] top-2 h-3 w-3 rounded-full bg-[#F68221]" />
                  <span className="absolute left-[5px] bottom-8 h-3 w-3 rounded-full bg-[#F68221]" />
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

                    {/* badges row (fare + seats) */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {segment.bookingCode && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          Fare:&nbsp;<b className="font-medium">Class {segment.bookingCode ?? segment.bookingClass}</b>
                        </span>
                      )}

                      {segment.availabilityCount && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 flex gap-2">
                          Seats:&nbsp;<b className="font-medium">{segment.availabilityCount}</b> <IoTicketSharp />
                        </span>
                      )}
                    </div>

                    {/* baggage chips (per segment) */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                        title={carryOnStr ? `Carry-on for this segment: ${carryOnStr}` : "Carry-on allowance not specified"}
                      >
                        <BsFillBackpack2Fill />
                        {carryOnStr ? `Carry on ${carryOnStr}` : "Carry-on not included"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                          checkedStr ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-400"
                        }`}
                        title={checkedStr ? `Checked for this segment: ${checkedStr}` : "No checked baggage included for this segment"}
                      >
                        <FaSuitcase />
                        {checkedStr ? `Checked ${checkedStr}` : "No checked bag"}
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

            {/* layover bar */}
            {next && layoverMins > 0 && (
              <div className="px-0">
                <LayoverBar
                  minutes={layoverMins}
                  city={city || getAirportName(next.departure || "")}
                  airport={airport}
                  short={isShort}
                  long={isLong}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* notes */}
      <div className="mt-6 px-4 flex items-center justify-between">
        <div className="text-[11px] text-slate-500">* All times are local</div>
        <span>&nbsp;</span>
      </div>

    </div>
  );
};

export default FlightSegment;
