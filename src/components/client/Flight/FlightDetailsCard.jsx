import { motion } from "framer-motion";
import { calculateLayover } from "../../../lib/pkfare/utils";
// If you're using lucide or another icon set, you can swap the inline SVGs.

export default function FlightDetailsCard({
  flight,
  tripDetails,
  outbound,
  returnFlight,
  tripType,
  openSections,            // { outbound: boolean, return: boolean }
  toggleAccordion,         // (key: 'outbound' | 'return') => void
  getAirportName,
  formatDate,
  formatTime,
  getAirlineLogo,
  getCityName,
  getAirlineName,
  calculateDuration,       // (start, end) => string  e.g., "2h 15m"
}) {
  const outId = `acc-outbound-${outbound?.id ?? "x"}`;
  const retId = `acc-return-${returnFlight?.id ?? "x"}`;

  const OutboundSummary = (
    <>
    <div className="flex items-start">
        {/* Airline logo (optional, if you want to keep it) */}
        {getAirlineLogo(outbound.airline) && (
            <img
            src={getAirlineLogo(outbound.airline)}
            alt={getAirlineName(outbound.airline)}
            className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded-full mr-2 shrink-0"
            />
        )}

        {/* Flight info */}
        <div className="flex flex-col">
            {/* Origin -> Destination with arrow circle */}
            <div className="flex items-center text-sm font-medium text-slate-900">
                <span className="truncate">{outbound.origin}</span>
                <span className="mx-2 flex items-center justify-center">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-slate-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8m0 0-3-3m3 3-3 3" />
                    </svg>
                </span>
                <span className="truncate">{outbound.destination}</span>
            </div>

            {/* Date + Stops + Duration */}
            <div className="text-xs text-slate-600 mt-0.5">
                {formatDate(outbound.departureTime)} •{" "}
                {outbound.segments.length > 1
                    ? `${outbound.segments.length - 1} stop${outbound.segments.length - 1 > 1 ? "s" : ""}`
                    : "Nonstop"}{" "}
                •{" "}
                {outbound.journeyTime != null
                    ? `${Math.floor(outbound.journeyTime / 60)}h ${outbound.journeyTime % 60}m`
                    : calculateDuration?.(outbound.departureTime, outbound.arrivalTime)}
            </div>
        </div>
    </div>

    </>
  );

  const ReturnSummary = returnFlight && (
    <>
      <div className="text-sm font-medium text-slate-900">
        {returnFlight.origin} → {returnFlight.destination}
        <span className="ml-2 text-slate-600">{formatDate(returnFlight.departureTime)}</span>
      </div>
      <div className="text-xs text-slate-600">
        {returnFlight.segments.length > 1
            ? `${returnFlight.segments.length - 1} stop${returnFlight.segments.length - 1 > 1 ? "s" : ""}`
            : "Nonstop"}{" "}
        • {calculateDuration?.(returnFlight.departureTime, returnFlight.arrivalTime)}
      </div>
    </>
  );

  return (
    <motion.div
      className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
        {/* Header (no flashy bg, no shadow) */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
            <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
            {/* Minimal airplane mark */}
            <svg xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 rotate-200"
                fill="currentColor"
                viewBox="0 0 640 640"
                aria-hidden>
                <path d="M552 264C582.9 264 608 289.1 608 320C608 350.9 582.9 376 552 376L424.7 376L265.5 549.6C259.4 556.2 250.9 560 241.9 560L198.2 560C187.3 560 179.6 549.3 183 538.9L237.3 376L137.6 376L84.8 442C81.8 445.8 77.2 448 72.3 448L52.5 448C42.1 448 34.5 438.2 37 428.1L64 320L37 211.9C34.4 201.8 42.1 192 52.5 192L72.3 192C77.2 192 81.8 194.2 84.8 198L137.6 264L237.3 264L183 101.1C179.6 90.7 187.3 80 198.2 80L241.9 80C250.9 80 259.4 83.8 265.5 90.4L424.7 264L552 264z"/>
            </svg>
            </div>
            <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Flight details</h2>
            <p className="text-xs text-slate-600">Review your selected flights</p>
            </div>
        </header>
        <div className="divide-y divide-slate-200">
        {/* Outbound */}
        <section className="bg-white">
            <h3 className="sr-only">Outbound flight</h3>
            <button
            type="button"
            onClick={() => toggleAccordion("outbound")}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 transition-colors"
            aria-controls={outId}
            aria-expanded={!!openSections.outbound}
            >
            <div className="min-w-0">{OutboundSummary}</div>
            <Chevron isOpen={!!openSections.outbound} />
            </button>

            <div id={outId} className={openSections.outbound ? "block" : "hidden"}>
<div className="px-4 pb-5 pt-4">
  {/* Timeline */}
<ol className="relative border-s border-gray-200 dark:border-gray-700">

  {outbound.segments.map((seg, i) => (
    <li key={i} className="mb-10 ms-4">
      {/* Timeline dot */}
      <div className="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-brand"></div>

      {/* Departure */}
      <time className="mb-1 text-sm font-normal leading-none text-gray-400">
        {formatDate(seg.departureTime)} — {formatTime(seg.departureTime)}
      </time>
      <h3 className="text-lg font-semibold text-gray-900">
        {getCityName(seg.departure)} ({seg.departure})
      </h3>
      <p className="text-sm text-gray-500">
        {getAirportName(seg.departure)}
      </p>

      {/* Flight Details */}
      <div className="mt-2 text-sm text-gray-700 flex flex-wrap gap-4">
        <span>✈️ {getAirlineName(seg.airline)} ({seg.airline})</span>
        <span>Flight {seg.flightNum}</span>
        <span>Class: {seg.bookingCode || "Economy"}</span>
      </div>

      {/* Layover info (if not last segment) */}
      {i < outbound.segments.length - 1 && (
        <div className="mt-3 text-xs font-medium text-orange-600">
          ⏱ {calculateLayover(seg.arrivalTime, outbound.segments[i + 1].departureTime)}
        </div>
      )}
    </li>
  ))}

  {/* Final Arrival */}
  <li className="ms-4">
    <div className="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-brand"></div>
    <time className="mb-1 text-sm font-normal leading-none text-gray-400">
      {formatDate(outbound.segments[outbound.segments.length - 1].arrivalTime)} — {formatTime(outbound.segments[outbound.segments.length - 1].arrivalTime)}
    </time>
    <h3 className="text-lg font-semibold text-gray-900">
      {getCityName(outbound.segments[outbound.segments.length - 1].arrival)} ({outbound.segments[outbound.segments.length - 1].arrival})
    </h3>
    <p className="text-sm text-gray-500">
      {getAirportName(outbound.segments[outbound.segments.length - 1].arrival)}
    </p>
  </li>

</ol>


  {/* Flight Extras */}
  <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
    <div className="flex flex-col">
      <span className="text-slate-500">Airline</span>
      <span className="flex items-center gap-2 font-medium">
        {getAirlineLogo(outbound.airline) && (
          <img
            src={getAirlineLogo(outbound.airline)}
            alt={getAirlineName(outbound.airline)}
            className="h-5 w-5 object-contain"
          />
        )}
        {getAirlineName(outbound.airline) || "N/A"}
      </span>
    </div>
    <div>
      <span className="text-slate-500">Flight no.</span>
      <span className="block font-medium">
        {outbound.flightNumber || "N/A"}
      </span>
    </div>
    <div>
      <span className="text-slate-500">Plane</span>
      <span className="block font-medium">{outbound.plane || "N/A"}</span>
    </div>
    <div>
      <span className="text-slate-500">Class</span>
      <span className="block font-medium">{outbound.cabin || "Economy"}</span>
    </div>
    <div>
      <span className="text-slate-500">Baggage</span>
      <span className="block font-medium">{outbound.baggage || "N/A"}</span>
    </div>
    <div>
      <span className="text-slate-500">Cabin baggage</span>
      <span className="block font-medium">{outbound.cabin_baggage || "N/A"}</span>
    </div>
  </div>
</div>

            </div>
        </section>

        {/* Return */}
        {tripType === "return" && returnFlight && (
            <section className="bg-white">
            <h3 className="sr-only">Return flight</h3>
            <button
                type="button"
                onClick={() => toggleAccordion("return")}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 transition-colors"
                aria-controls={retId}
                aria-expanded={!!openSections.return}
            >
                <div className="min-w-0">{ReturnSummary}</div>
                <Chevron isOpen={!!openSections.return} />
            </button>

            <div id={retId} className={openSections.return ? "block" : "hidden"}>
                <div className="px-4 pb-5 pt-4">
                {/* Timeline */}
                <div className="relative border-l-2 border-slate-200 pl-5">
                    {/* Departure */}
                    <div className="mb-6">
                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 border-brand bg-white"></div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                        <span className="text-base font-semibold text-slate-900">
                            {formatTime(returnFlight.departureTime)}
                        </span>
                        <span className="text-xs text-slate-500">
                            {formatDate(returnFlight.departureTime)}
                        </span>
                        </div>

                        <div className="font-medium">
                        <div className="text-sm font-medium text-slate-700">
                            {getCityName(returnFlight.origin)}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                            {getAirportName(returnFlight.origin)}
                        </div>
                        </div>

                        <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-sm font-medium text-slate-700 border p-2 rounded-full">
                            {returnFlight.origin}
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* Arrival */}
                    <div>
                    <div className="absolute -left-[11px] bottom-1 h-5 w-5 rounded-full border-2 border-brand bg-white"></div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                        <span className="text-base font-semibold text-slate-900">
                            {formatTime(returnFlight.arrivalTime)}
                        </span>
                        <span className="text-xs text-slate-500">
                            {formatDate(returnFlight.arrivalTime)}
                        </span>
                        </div>

                        <div className="font-medium">
                        <div className="text-sm font-medium text-slate-700">
                            {getCityName(returnFlight.destination)}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                            {getAirportName(returnFlight.destination)}
                        </div>
                        </div>

                        <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-sm font-medium text-slate-700 border p-2 rounded-full">
                            {returnFlight.destination}
                        </div>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Flight extras */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                    <span className="text-slate-500">Airline</span>
                    <span className="flex items-center gap-2 font-medium">
                        {getAirlineLogo(returnFlight.airline) && (
                        <img
                            src={getAirlineLogo(returnFlight.airline)}
                            alt={getAirlineName(returnFlight.airline)}
                            className="h-5 w-5 object-contain"
                        />
                        )}
                        {getAirlineName(returnFlight.airline) || "N/A"}
                    </span>
                    </div>
                    <div>
                    <span className="text-slate-500">Flight no.</span>
                    <span className="block font-medium">
                        {returnFlight.flightNumber || "N/A"}
                    </span>
                    </div>
                    <div>
                    <span className="text-slate-500">Plane</span>
                    <span className="block font-medium">
                        {returnFlight.planeType || "N/A"}
                    </span>
                    </div>
                    <div>
                    <span className="text-slate-500">Class</span>
                    <span className="block font-medium">
                        {returnFlight.cabin || "Economy"}
                    </span>
                    </div>
                    <div>
                    <span className="text-slate-500">Baggage</span>
                    <span className="block font-medium">
                        {returnFlight.baggage || "N/A"}
                    </span>
                    </div>
                    <div>
                    <span className="text-slate-500">Cabin baggage</span>
                    <span className="block font-medium">
                        {returnFlight.cabin_baggage || "N/A"}
                    </span>
                    </div>
                </div>
                </div>
            </div>
            </section>
        )}
        </div>


    </motion.div>
  );
}

/* ------------ Small, reusable bits (keep in the same file) ------------ */

function Chevron({ isOpen }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-600 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden
    >
      <path d="M9 5 5 1 1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetaRow({ left, right }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-600">{left}</span>
      <span className="text-xs text-slate-700">{right}</span>
    </div>
  );
}

function FlightMeta({ left, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-200">
      <div className="text-sm font-medium text-slate-900">{left}</div>
      <div className="text-xs text-slate-600">{right}</div>
    </div>
  );
}
