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
<section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  <h3 className="sr-only">Outbound flight</h3>

  {/* Accordion header */}
  <button
    type="button"
    onClick={() => toggleAccordion("outbound")}
    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
    aria-controls={outId}
    aria-expanded={!!openSections.outbound}
  >
    <div className="min-w-0 flex-1">
      {OutboundSummary}
    </div>
    <Chevron isOpen={!!openSections.outbound} />
  </button>

  {/* Accordion content */}
  <AnimatePresence initial={false}>
    {openSections.outbound && (
      <motion.div
        id={outId}
        key="outbound-panel"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="will-change-auto"
      >
        <div className="px-4 pb-5 pt-4">

          {/* Timeline */}
          <ol className="relative ms-4 border-s border-slate-200">
            {outbound.segments.map((seg, i) => {
              const depAt = new Date(seg.departureDate || seg.departureTime);
              const arrAt = new Date(seg.arrivalDate || seg.arrivalTime);
              const next = outbound.segments[i + 1];
              const hasNext = Boolean(next);
              const layoverMins = hasNext
                ? Math.max(0, (new Date(next.departureDate || next.departureTime) - arrAt) / 60000)
                : 0;

              const isOvernight = depAt.getDate() !== arrAt.getDate();
              const shortLayover = hasNext && layoverMins > 0 && layoverMins < 50;
              const longLayover = hasNext && layoverMins >= 240;

              return (
                <li key={i} className="mb-8 ms-6">
                  {/* node */}
                  <span
                    className={[
                      "absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border",
                      "bg-white border-sky-500"
                    ].join(" ")}
                    aria-hidden="true"
                  />

                  {/* hop header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <time className="block text-xs text-slate-500">
                        {formatDate(depAt)} • {formatTime(depAt)}
                      </time>
                      <h4 className="text-base font-semibold text-slate-900">
                        {getCityName(seg.departure)} ({seg.departure})
                      </h4>
                      <p className="text-sm text-slate-600">{getAirportName(seg.departure)}</p>
                    </div>

                    {/* badges */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isOvernight && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                          Overnight
                        </span>
                      )}
                      {seg.bookingCode && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200">
                          {seg.bookingCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* flight row */}
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <img
                          src={getAirlineLogo(seg.airline)}
                          alt={getAirlineName(seg.airline)}
                          className="h-5 w-5 object-contain"
                        />
                        <span className="font-medium">{getAirlineName(seg.airline)}</span>
                        <span className="text-slate-500">({seg.airline})</span>
                      </div>

                      <div className="h-4 w-px bg-slate-300 hidden sm:block" aria-hidden="true" />

                      <div className="font-medium">Flight {seg.flightNum}</div>

                      <div className="h-4 w-px bg-slate-300 hidden sm:block" aria-hidden="true" />

                      <div>
                        <span className="text-slate-500">Duration:</span>{" "}
                        <span className="font-medium">
                          {calculateDuration(depAt, arrAt)}
                        </span>
                      </div>

                      {seg.cabinClass && (
                        <>
                          <div className="h-4 w-px bg-slate-300 hidden sm:block" aria-hidden="true" />
                          <div>
                            <span className="text-slate-500">Class:</span>{" "}
                            <span className="font-medium">{seg.cabinClass}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* segment route mini-timeline */}
                    <div className="mt-3 grid grid-cols-[auto,1fr,auto] items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{formatTime(depAt)}</div>
                      <div className="relative h-1 rounded-full bg-slate-200">
                        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-sky-600" aria-hidden="true" />
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{formatTime(arrAt)}</div>

                      <div className="col-span-3 -mt-1 text-xs text-slate-500">
                        {seg.departure} • {seg.arrival}
                      </div>
                    </div>
                  </div>

                  {/* layover */}
                  {hasNext && (
                    <div
                      className={[
                        "mt-3 rounded-lg border px-3 py-2 text-xs",
                        shortLayover
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : longLayover
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-700",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          Layover {shortLayover ? "(short)" : longLayover ? "(long)" : ""}
                        </span>
                        <span className="font-mono">
                          {Math.floor(layoverMins / 60)}h {Math.round(layoverMins % 60)}m
                        </span>
                      </div>
                      <div className="mt-0.5">
                        Change at <span className="font-medium">{getCityName(seg.arrival)}</span>{" "}
                        ({seg.arrival}) • {getAirportName(seg.arrival)}
                      </div>
                    </div>
                  )}

                  {/* destination (for this segment) */}
                  <div className="mt-4">
                    <time className="block text-xs text-slate-500">
                      {formatDate(arrAt)} • {formatTime(arrAt)}
                    </time>
                    <h5 className="text-base font-semibold text-slate-900">
                      {getCityName(seg.arrival)} ({seg.arrival})
                    </h5>
                    <p className="text-sm text-slate-600">{getAirportName(seg.arrival)}</p>
                  </div>
                </li>
              );
            })}

            {/* Final dot */}
            <li className="ms-6">
              <span
                className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border bg-white border-sky-500"
                aria-hidden="true"
              />
            </li>
          </ol>

          {/* Flight extras (denser, consistent) */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-500">Airline</span>
              <span className="mt-0.5 flex items-center gap-2 font-medium">
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
            <div className="flex flex-col">
              <span className="text-slate-500">Flight no.</span>
              <span className="mt-0.5 font-medium">{outbound.flightNumber || "N/A"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Plane</span>
              <span className="mt-0.5 font-medium">{outbound.plane || "N/A"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Class</span>
              <span className="mt-0.5 font-medium">{outbound.cabin || "Economy"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Baggage</span>
              <span className="mt-0.5 font-medium">{outbound.baggage || "N/A"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Cabin baggage</span>
              <span className="mt-0.5 font-medium">{outbound.cabin_baggage || "N/A"}</span>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
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
