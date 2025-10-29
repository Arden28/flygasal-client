import { airlines, airports } from "../data/fakeData";


  // Get airport name from code
  export const getCityName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.city}` : code;
  };


  // Get airport name from code
  export const getAirportName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.label}` : code;
  };

  // Get airline name from code
  export const getAirlineName = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.name : code;
  };

  // Get airline logo from code
  export const getAirlineLogo = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? code : code;
    // return airline ? airline.logo : code;
  };

export function formatDuration(minutes) {
  if (minutes <= 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : "";
export const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

export const safeDate = (d) => (d ? formatDate(d) : "—");
export const safeTime = (d) => (d ? formatTime(d) : "—");

export const diffMinutes = (a, b) => {
  if (!a || !b) return 0
  const ta = new Date(a).getTime()
  const tb = new Date(b).getTime()
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0
  return Math.max(0, Math.round((tb - ta) / 60000))
}

export const parseAirportLabel = (label = "") => {
  const [left, right] = String(label).split(/\s*-\s*/)
  if (!right) return { city: label, airport: "" }
  const codeMatch = left.match(/\(([A-Z0-9]{3,4})\)/)
  const code = codeMatch ? codeMatch[1] : ""
  const city = left.replace(/\s*\([A-Z0-9]{3,4}\)\s*$/, "").trim()
  return { city, airport: code ? `${right} (${code})` : right }
}


export const findLeg = (segs, ORIGIN, DEST, { prefer = "earliest", notBefore } = {}) => {
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


export const norm = (s = "") =>
  String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

export const guessFirstChain = (segs) => {
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



export const normalizeSegments = (flightLike) => {
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

export const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
export const isTimeOnly = (s) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(s || ""));

export const toIsoOrRaw = (dt) => {
  if (!dt) return "";
  const t = new Date(dt).toString();
  if (t !== "Invalid Date") return dt;
  return "";
};

export const combineDateTime = (d, t) => {
  if (!d && !t) return "";
  if (isDateOnly(d) && isTimeOnly(t)) return `${d}T${t}`;
  if (isDateOnly(d) && !t) return `${d}T00:00`;
  if (!d && isTimeOnly(t)) return `1970-01-01T${t}`;
  return toIsoOrRaw(d || t);
};

export const byDepTime = (a, b) => {
  const ta = new Date(a.departureAt || a.arrivalAt || 0).getTime();
  const tb = new Date(b.departureAt || b.arrivalAt || 0).getTime();
  return ta - tb;
};