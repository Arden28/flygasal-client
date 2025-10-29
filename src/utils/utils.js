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
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
}

export const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : "";
export const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

export const safeDate = (d) => (d ? formatDate(d) : "—");
export const safeTime = (d) => (d ? formatTime(d) : "—");