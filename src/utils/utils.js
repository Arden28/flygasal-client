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