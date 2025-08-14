import React, { useMemo } from "react";

const FlightHeader = ({ onOpen, filteredItineraries = [], searchParams, formatDate, loading }) => {
  // ---- Derived labels & safe fallbacks ----
  const origin = searchParams?.origin || "JFK";
  const destination = searchParams?.destination || "LAX";
  const tripType = (searchParams?.tripType || "oneway").toLowerCase();
  const depart = searchParams?.departureDate || "";
  const ret = searchParams?.returnDate || "";
  const cabin = searchParams?.cabinType || searchParams?.flightType || "Economy";

  const paxLabel = useMemo(() => {
    const a = Number(searchParams?.adults || 1);
    const c = Number(searchParams?.children || 0);
    const i = Number(searchParams?.infants || 0);
    const parts = [];
    if (a > 0) parts.push(`${a} Adult${a > 1 ? "s" : ""}`);
    if (c > 0) parts.push(`${c} Child${c > 1 ? "ren" : ""}`);
    if (i > 0) parts.push(`${i} Infant${i > 1 ? "s" : ""}`);
    return parts.join(", ") || "1 Adult";
  }, [searchParams?.adults, searchParams?.children, searchParams?.infants]);

  const dateLabel = useMemo(() => {
    if (!formatDate) return "";
    const d1 = depart ? formatDate(depart) : "";
    const d2 = ret ? formatDate(ret) : "";
    return tripType === "return" && d2 ? `${d1} – ${d2}` : d1;
  }, [depart, ret, tripType, formatDate]);

  const countLabel = useMemo(() => {
    const n = filteredItineraries.length || 0;
    if (loading) return "Searching flights…";
    const noun = tripType === "return" ? "Itinerar" : "Flight";
    // Itineraries vs Flights pluralization
    return `${n} ${tripType === "return" ? `${noun}${n === 1 ? "y" : "ies"}` : `${noun}${n === 1 ? "" : "s"}`} Found`;
  }, [filteredItineraries.length, loading, tripType]);

  return (
    <header
      className="relative mb-4 overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,25,74,0.75) 0%, rgba(10,25,74,0.55) 100%), url('/assets/img/flight_search.avif') center/cover no-repeat",
      }}
      aria-live="polite"
    >
      {/* subtle backdrop blur on top edge for contrast */}
      <div className="absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-white">
          {/* Left: route + date + chips */}
          <div className="min-w-0">
            {/* Route */}
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
              <span className="truncate">{origin}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h13M12 5l7 7-7 7" />
              </svg>
              <span className="truncate">{destination}</span>
            </div>

            {/* Date + pax + cabin chips */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm/6 opacity-95">
              {!!dateLabel && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 2v4m8-4v4M3 10h18M5 6h14v14H5z" />
                  </svg>
                  <span>{dateLabel}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <span>{paxLabel}</span>
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 7h14M5 12h14M5 17h14" />
                </svg>
                <span>{cabin}</span>
              </span>
            </div>
          </div>

          {/* Right: results + filter button */}
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Results count / loading */}
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-sm whitespace-nowrap">
              {loading && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
                </svg>
              )}
              <span className="font-medium">{countLabel}</span>
            </div>

            {/* Filters button */}
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex text-black items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40"
              aria-label="Open filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FlightHeader;
