import { motion } from "framer-motion";
// If you're using lucide or another icon set, you can swap the inline SVGs.

export default function FareRulesCard({
  outbound,
  returnFlight,
  tripType,
  openSections,            // { outbound: boolean, return: boolean }
  toggleAccordion,
  getAirportName
}) {
  const outId = `acc-outbound-fare-${outbound?.id ?? "x"}`;


  return (
    <motion.div
      className="bg-white rounded-2xl w-full mb-3 overflow-hidden ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
                {/* Minimal airplane mark */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 640 640"
                    aria-hidden
                >
                    <path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/>
                </svg>
                </div>
                <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">Fare rules</h2>
                <p className="text-xs text-slate-600">Review airline fare rules</p>
                </div>
            </div>

            {/* Right: Chevron */}
            <button
                type="button"
                onClick={() => toggleAccordion("fare")}
                className="flex items-center p-2 hover:bg-slate-50 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 transition-colors"
                aria-controls={outId}
                aria-expanded={!!openSections.fare}
            >
                <Chevron isOpen={!!openSections.fare} />
            </button>
        </header>

        <div className="divide-y divide-slate-200">
            {/* Outbound */}
            <section className="bg-white">
                <h3 className="sr-only">Outbound fare rules</h3>

                <div id={outId} className={`${ openSections.fare ? "block" : "hidden" } px-4 py-3`}>

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

                    <dl className="grid grid-cols-1 sm:grid-cols-1 gap-x-6 gap-y-4 text-sm mb-3">

                      {/* Changes */}
                      <div>
                          <dt className="font-medium text-slate-700">Can I change this ticket?</dt>
                          <dd className="mt-1 text-slate-600 pl-2">
                            This ticket cannot be changed prior to departure. Once the journey has begun, changes may be subject to the fare rules and conditions.
                          </dd>
                      </div>

                      {/* Cancel */}
                      <div>
                          <dt className="font-medium text-slate-700">Can I cancel this ticket?</dt>
                          <dd className="mt-1 text-slate-600 pl-2">
                            This ticket cannot be cancelled before departure. After departure, cancellation options may depend on the fare conditions that apply.
                          </dd>
                      </div>
                    </dl>


                    {tripType === "return" && returnFlight && (
                      <>
                    <h3 className="text-base font-semibold flex gap-2 text-slate-900 mb-4">
                    {getAirportName(returnFlight.origin)} 
                            <svg xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4 rotate-90"
                                fill="currentColor"
                                viewBox="0 0 640 640"
                                aria-hidden>
                                <path d="M552 264C582.9 264 608 289.1 608 320C608 350.9 582.9 376 552 376L424.7 376L265.5 549.6C259.4 556.2 250.9 560 241.9 560L198.2 560C187.3 560 179.6 549.3 183 538.9L237.3 376L137.6 376L84.8 442C81.8 445.8 77.2 448 72.3 448L52.5 448C42.1 448 34.5 438.2 37 428.1L64 320L37 211.9C34.4 201.8 42.1 192 52.5 192L72.3 192C77.2 192 81.8 194.2 84.8 198L137.6 264L237.3 264L183 101.1C179.6 90.7 187.3 80 198.2 80L241.9 80C250.9 80 259.4 83.8 265.5 90.4L424.7 264L552 264z"/>
                            </svg> 
                        {getAirportName(returnFlight.destination)}
                    </h3>

                    <dl className="grid grid-cols-1 sm:grid-cols-1 gap-x-6 gap-y-4 text-sm mb-3">

                      {/* Changes */}
                      <div>
                          <dt className="font-medium text-slate-700">Can I change this ticket?</dt>
                          <dd className="mt-1 text-slate-600 pl-2">
                            This ticket cannot be changed prior to departure. Once the journey has begun, changes may be subject to the fare rules and conditions.
                          </dd>
                      </div>

                      {/* Cancel */}
                      <div>
                          <dt className="font-medium text-slate-700">Can I cancel this ticket?</dt>
                          <dd className="mt-1 text-slate-600 pl-2">
                            This ticket cannot be cancelled before departure. After departure, cancellation options may depend on the fare conditions that apply.
                          </dd>
                      </div>
                    </dl>
                    </>
                    )}

                    <hr className="" />
                    
                    <p className="mt-2 text-sm text-muted py-3">
                      Please note that the fare rules provided at time of booking will be manually verified if you wish to change and/or cancel at the time of your request and you will be quoted accordingly
                    </p>
                </div>

            </section>



        
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
