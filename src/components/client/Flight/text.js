

          {/* Extras pills for return */}
          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
              <img src={getAirlineLogo(returnFlight.airline)} alt={getAirlineName(returnFlight.airline)} className="h-5 w-5 object-contain rounded-full" />
              <span className="font-medium text-slate-800">{getAirlineName(returnFlight.airline) || "N/A"}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
              <span className="text-slate-700 font-medium">{returnFlight.flightNumber || "N/A"}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
              <span className="text-slate-700 font-medium">{returnFlight.cabin || "Economy"}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm ml-auto">
              <span className="text-slate-700 font-medium">
                {returnFlight.journeyTime != null
                  ? `${Math.floor(returnFlight.journeyTime / 60)}h ${returnFlight.journeyTime % 60}m`
                  : calculateDuration?.(returnFlight.departureTime, returnFlight.arrivalTime)}
                {returnFlight.stops > 0 ? ` • ${returnFlight.stops} stop${returnFlight.stops > 1 ? "s" : ""}` : ""}
              </span>
            </div>
          </div>


<section className="bg-white px-4 py-5">
    <h3 className="text-base font-semibold flex gap-2 text-slate-900 mb-4">
      {getAirportName(outbound.origin)} 
            <svg xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 640 640"
                aria-hidden>
                <path d="M552 264C582.9 264 608 289.1 608 320C608 350.9 582.9 376 552 376L424.7 376L265.5 549.6C259.4 556.2 250.9 560 241.9 560L198.2 560C187.3 560 179.6 549.3 183 538.9L237.3 376L137.6 376L84.8 442C81.8 445.8 77.2 448 72.3 448L52.5 448C42.1 448 34.5 438.2 37 428.1L64 320L37 211.9C34.4 201.8 42.1 192 52.5 192L72.3 192C77.2 192 81.8 194.2 84.8 198L137.6 264L237.3 264L183 101.1C179.6 90.7 187.3 80 198.2 80L241.9 80C250.9 80 259.4 83.8 265.5 90.4L424.7 264L552 264z"/>
            </svg> 
        {getAirportName(outbound.destination)}
    </h3>

    <dl className="grid grid-cols-1 sm:grid-cols-1 gap-x-6 gap-y-4 text-sm">
      {/* Refundability */}
      <div>
        <dt className="font-medium text-slate-700">Can I get a refund for this ticket?</dt>
        <dd className="mt-1 text-slate-600">
          Ticket is non-refundable once issued. Partial refunds not allowed.
        </dd>
      </div>

      {/* Changes */}
      <div>
        <dt className="font-medium text-slate-700">Can I change this ticket?</dt>
        <dd className="mt-1 text-slate-600">
          Date changes permitted with a fee of USD 50 before departure.
        </dd>
      </div>

      {/* No-show */}
      <div>
        <dt className="font-medium text-slate-700">No-show</dt>
        <dd className="mt-1 text-slate-600">
          No-show will result in ticket forfeiture; no refund or revalidation
          permitted.
        </dd>
      </div>

      {/* No-show */}
      <div>
        <dt className="font-medium text-slate-700">Can I cancel this ticket?</dt>
        <dd className="mt-1 text-slate-600">
          No-show will result in ticket forfeiture; no refund or revalidation
          permitted.
        </dd>
      </div>

      {/* Baggage */}
      <div>
        <dt className="font-medium text-slate-700">Baggage</dt>
        <dd className="mt-1 text-slate-600">
          1 checked bag up to 23kg and 1 cabin bag up to 7kg allowed.
        </dd>
      </div>
    </dl>
  </section>