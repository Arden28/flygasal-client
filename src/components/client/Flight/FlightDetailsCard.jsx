import { AnimatePresence, motion } from "framer-motion";
import { calculateLayover } from "../../../lib/pkfare/utils";

/**
 * FlightDetailsCard.jsx
 * One card, two legs (outbound + return) with shared timeline UX.
 *
 * Props (same as before):
 * - flight, tripDetails, outbound, returnFlight, tripType
 * - openSections, toggleAccordion
 * - helpers: getAirportName, formatDate, formatTime, getAirlineLogo, getCityName, getAirlineName, calculateDuration
 */
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
  calculateDuration,
}) {
  const outId = `acc-outbound-${outbound?.id ?? "x"}`;
  const retId = `acc-return-${returnFlight?.id ?? "x"}`;

  return (
    <motion.div
      className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
        <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
          {/* Minimal airplane mark */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 rotate-180"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 10-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">Flight details</h2>
          <p className="text-xs text-slate-600">Review your selected flights</p>
        </div>
      </header>

      <div className="divide-y divide-slate-200">
        {/* Outbound */}
        {outbound && (
          <FlightLegAccordion
            id={outId}
            legKey="outbound"
            title="Outbound flight"
            leg={outbound}
            isOpen={!!openSections.outbound}
            toggleAccordion={toggleAccordion}
            getAirportName={getAirportName}
            getCityName={getCityName}
            getAirlineName={getAirlineName}
            getAirlineLogo={getAirlineLogo}
            formatDate={formatDate}
            formatTime={formatTime}
            calculateDuration={calculateDuration}
          />
        )}

        {/* Return */}
        {tripType === "return" && returnFlight && (
          <FlightLegAccordion
            id={retId}
            legKey="return"
            title="Return flight"
            leg={returnFlight}
            isOpen={!!openSections.return}
            toggleAccordion={toggleAccordion}
            getAirportName={getAirportName}
            getCityName={getCityName}
            getAirlineName={getAirlineName}
            getAirlineLogo={getAirlineLogo}
            formatDate={formatDate}
            formatTime={formatTime}
            calculateDuration={calculateDuration}
          />
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------- Leg Accordion ------------------------- */

function FlightLegAccordion({
  id,
  legKey,                 // 'outbound' | 'return'
  title,                  // "Outbound flight" | "Return flight"
  leg,                    // { origin, destination, segments[], departureTime, arrivalTime, ... }
  isOpen,
  toggleAccordion,
  getAirportName,
  getCityName,
  getAirlineName,
  getAirlineLogo,
  formatDate,
  formatTime,
  calculateDuration,
}) {
  const firstSeg = leg?.segments?.[0] || {};
  const airlineCode = firstSeg?.airline || leg?.airline;
  const airlineLogo = airlineCode ? getAirlineLogo(airlineCode) : null;
  const airlineName = airlineCode ? getAirlineName(airlineCode) : null;

  const stops = Math.max((leg?.segments?.length || 1) - 1, 0);
  const journeyDur =
    leg?.journeyTime != null
      ? `${Math.floor(leg.journeyTime / 60)}h ${leg.journeyTime % 60}m`
      : calculateDuration?.(leg?.departureTime, leg?.arrivalTime);

  return (
    <section className="bg-white">
      <h3 className="sr-only">{title}</h3>

      {/* Header / summary */}
      <button
        type="button"
        onClick={() => toggleAccordion(legKey)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        aria-controls={id}
        aria-expanded={!!isOpen}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start">
            {airlineLogo && (
              <img
                src={airlineLogo}
                alt={airlineName || airlineCode}
                className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded-full mr-2 shrink-0"
              />
            )}
            <div className="flex flex-col">
              <div className="flex items-center text-sm font-medium text-slate-900">
                <span className="truncate">{leg.origin}</span>
                <span className="mx-2 flex items-center justify-center">
                  <ArrowCircle />
                </span>
                <span className="truncate">{leg.destination}</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {formatDate(leg.departureTime)} • {stops ? `${stops} stop${stops > 1 ? "s" : ""}` : "Nonstop"} • {journeyDur}
              </div>
            </div>
          </div>
        </div>
        <Chevron isOpen={!!isOpen} />
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={id}
            key={`${legKey}-panel`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="will-change-auto"
          >
            <div className="px-4 pb-5 pt-4">
              {/* Timeline */}
              <ol className="relative ms-4 border-s border-slate-200">
                {leg.segments.map((seg, i) => {
                  const depAt = new Date(seg.strDepartureDate || seg.departureTime);
                  const depTimeAt = seg.strDepartureTime || seg.departureTime;
                  const arrAt = new Date(seg.strArrivalDate || seg.arrivalTime);
                  const arrTimeAt = seg.strDepartureTime || seg.arrivalTime;
                  const next = leg.segments[i + 1];
                  const hasNext = Boolean(next);
                  const layoverMins = hasNext
                    ? Math.max(0, (new Date(next.departureDate || next.departureTime) - arrAt) / 60000)
                    : 0;

                  const isOvernight = depAt.getDate() !== arrAt.getDate();
                  const shortLayover = hasNext && layoverMins > 0 && layoverMins < 50;
                  const longLayover = hasNext && layoverMins >= 240;

                  const airlineLogoSeg = seg?.airline ? getAirlineLogo(seg.airline) : null;

                  return (
                    <li key={i} className="mb-8 ms-6">
                      {/* node */}
                      <span
                        className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border bg-white border-sky-500"
                        aria-hidden="true"
                      />

                      {/* hop header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <time className="block text-xs text-slate-500">
                            {formatDate(depAt)} • {depTimeAt}
                          </time>
                          <h4 className="text-base font-semibold text-slate-900">
                            {getCityName(seg.departure)} ({seg.departure})
                          </h4>
                          <p className="text-sm text-slate-600">{getAirportName(seg.departure)}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isOvernight && <Badge tone="amber">Overnight</Badge>}
                          {seg.bookingCode && <Badge tone="sky">{seg.bookingCode}</Badge>}
                        </div>
                      </div>

                      {/* flight row */}
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            {airlineLogoSeg && (
                              <img
                                src={airlineLogoSeg}
                                alt={getAirlineName(seg.airline)}
                                className="h-5 w-5 object-contain"
                              />
                            )}
                            <span className="font-medium">{getAirlineName(seg.airline)}</span>
                            <span className="text-slate-500">({seg.airline})</span>
                          </div>

                          <Sep />

                          <div className="font-medium">Flight {seg.flightNum}</div>

                          <Sep />

                          <div>
                            <span className="text-slate-500">Duration:</span>{" "}
                            <span className="font-medium">{calculateDuration(depAt, arrAt)}</span>
                          </div>

                          {seg.cabinClass && (
                            <>
                              <Sep />
                              <div>
                                <span className="text-slate-500">Class:</span>{" "}
                                <span className="font-medium">{seg.cabinClass}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* segment route mini-timeline */}
                        <div className="mt-3 grid grid-cols-[auto,1fr,auto] items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{depTimeAt}</div>
                          <div className="relative h-1 rounded-full bg-slate-200">
                            <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-sky-600" aria-hidden="true" />
                          </div>
                          <div className="text-sm font-semibold text-slate-900">{arrTimeAt}</div>

                          <div className="col-span-3 -mt-1 text-xs text-slate-500">
                            {seg.departure} • {seg.arrival}
                          </div>
                        </div>
                      </div>

                      {/* layover */}
                      {hasNext && (
                        <LayoverBar
                          minutes={layoverMins}
                          city={getCityName(seg.arrival)}
                          airport={`${seg.arrival} • ${getAirportName(seg.arrival)}`}
                          short={shortLayover}
                          long={longLayover}
                        />
                      )}

                      {/* destination (for this segment) */}
                      <div className="mt-4">
                        <time className="block text-xs text-slate-500">
                          {formatDate(arrAt)} • {arrTimeAt}
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

              {/* Flight extras */}
              {/* <ExtrasGrid
                leg={leg}
                getAirlineName={getAirlineName}
                getAirlineLogo={getAirlineLogo}
              /> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------- Pieces & UI bits ------------------------- */

function ExtrasGrid({ leg, getAirlineName, getAirlineLogo }) {
  const seg0 = leg?.segments?.[0] || {};
  const airline = seg0?.airline || leg?.airline;
  const flightNo = leg?.flightNumber || (seg0?.airline && seg0?.flightNum ? `${seg0.airline}${seg0.flightNum}` : "");
  const cabin = leg?.cabin || seg0?.cabinClass || "Economy";
  const plane = leg?.equipment || "N/A";

  // If you have baggage maps on the offer (e.g., adt.checkedBySegment),
  // you could look up the first segment’s baggage here. For now keep friendly fallbacks.
  const baggage = leg?.baggage || "N/A";
  const cabinBaggage = leg?.cabin_baggage || "N/A";

  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
      <div className="flex flex-col">
        <span className="text-slate-500">Airline</span>
        <span className="mt-0.5 flex items-center gap-2 font-medium">
          {airline && getAirlineLogo(airline) && (
            <img
              src={getAirlineLogo(airline)}
              alt={getAirlineName(airline)}
              className="h-5 w-5 object-contain"
            />
          )}
          {airline ? getAirlineName(airline) : "N/A"}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-slate-500">Flight no.</span>
        <span className="mt-0.5 font-medium">{flightNo || "N/A"}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-slate-500">Plane</span>
        <span className="mt-0.5 font-medium">{plane}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-slate-500">Class</span>
        <span className="mt-0.5 font-medium">{cabin}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-slate-500">Baggage</span>
        <span className="mt-0.5 font-medium">{baggage}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-slate-500">Cabin baggage</span>
        <span className="mt-0.5 font-medium">{cabinBaggage}</span>
      </div>
    </div>
  );
}

function LayoverBar({ minutes, city, airport, short, long }) {
  const cls = short
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : long
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${cls}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">
          Layover {short ? "(short)" : long ? "(long)" : ""}
        </span>
        <span className="font-mono">
          {Math.floor(minutes / 60)}h {Math.round(minutes % 60)}m
        </span>
      </div>
      <div className="mt-0.5">
        Change at <span className="font-medium">{city}</span> • {airport}
      </div>
    </div>
  );
}

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

function ArrowCircle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-slate-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8m0 0-3-3m3 3-3 3" />
    </svg>
  );
}

function Badge({ tone = "sky", children }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Sep() {
  return <div className="h-4 w-px bg-slate-300 hidden sm:block" aria-hidden="true" />;
}
