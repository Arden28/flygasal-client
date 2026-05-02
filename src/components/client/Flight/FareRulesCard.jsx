import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";

/* ------------ Helpers ------------ */

// Standardize penalty types into clear, human-readable categories
function getPenaltyDetails(t) {
  switch (Number(t)) {
    case 0: return { label: "Cancellations / Refunds", icon: "refund" };
    case 1: return { label: "Flight Changes", icon: "change" };
    case 2: return { label: "No-Show", icon: "noshow" };
    case 3: return { label: "Reissue / Reroute", icon: "change" };
    default: return { label: "Other Rules", icon: "info" };
  }
}

// Format the specific rule phrasing based on industry standards
function buildRuleText(penaltyType, permitted, amount, currency) {
  const { label } = getPenaltyDetails(penaltyType);
  const formattedAmount = amount ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount) : null;

  // PKFare sometimes uses 0 for false, 1 for true, or true/false
  const isPermitted = permitted === true || permitted === 1 || String(permitted) === "1";
  const isNotPermitted = permitted === false || permitted === 0 || String(permitted) === "0";

  if (isNotPermitted) {
    return { text: `${label} are not permitted for this fare.`, status: "danger" };
  }

  if (isPermitted) {
    if (formattedAmount && Number(amount) > 0) {
      return { text: `${label} are permitted for a fee of ${formattedAmount} (plus any fare difference).`, status: "warning" };
    }
    return { text: `${label} are permitted free of charge (fare differences may apply).`, status: "success" };
  }

  // Fallback if data is vague
  return { text: `Specific rules apply for ${label.toLowerCase()}. Please check with our support team.`, status: "info" };
}

// Icon renderer based on status
const RuleIcon = ({ status }) => {
  switch (status) {
    case "success": return <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={15} />;
    case "danger": return <FaTimesCircle className="text-rose-500 mt-0.5 shrink-0" size={15} />;
    case "warning": return <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" size={15} />;
    default: return <FaInfoCircle className="text-slate-400 mt-0.5 shrink-0" size={15} />;
  }
};

/* ------------ Component ------------ */
export default function FareRulesCard({
  flight,
  tripDetails,
  openSections,
  toggleAccordion,
  getAirportName,
}) {
  
  // Build a flat list of rules. We try to map by Leg, but if PKFare gave us unmapped global rules, we fallback to showing them globally.
  const extractRules = (legSegments) => {
    try {
      const adtRules = flight?.rules?.adt;
      if (!adtRules || !Array.isArray(adtRules)) return [];

      let matchedRules = [];

      // Try to find rules specifically mapped to this leg's segments
      if (legSegments && Array.isArray(legSegments)) {
        const segIdsOfLeg = new Set(legSegments.map((s) => s?.segmentId).filter(Boolean));
        const matchedBlocks = adtRules.filter((block) => {
          const ids = Array.isArray(block?.segmentIds) ? block.segmentIds : [];
          return ids.some((id) => segIdsOfLeg.has(id));
        });
        matchedRules = matchedBlocks.flatMap((b) => Array.isArray(b?.miniRules) ? b.miniRules : []);
      }

      // FALLBACK: If strict segment mapping yielded 0 rules, just grab all the global rules PKFare provided.
      // This is crucial because PKFare sometimes sends rules without segment mappings.
      if (matchedRules.length === 0) {
        matchedRules = adtRules.flatMap((b) => Array.isArray(b?.miniRules) ? b.miniRules : []);
      }

      // Deduplicate by penaltyType
      const byType = new Map();
      for (const r of matchedRules) {
        if (r && typeof r === "object") {
           // Create a unique key combining penaltyType and 'when' (e.g. before/after departure) if available
           const key = `${r.penaltyType ?? r.label}-${r.when ?? 'any'}`;
           if (!byType.has(key)) byType.set(key, r);
        }
      }

      return Array.from(byType.values()).sort((a, b) => (a.penaltyType ?? 99) - (b.penaltyType ?? 99));
    } catch {
      return [];
    }
  };

  const legs = tripDetails?.legs || [];
  const accId = `acc-fare-rules-${flight?.id ?? "x"}`;

  return (
    <motion.div
      className="bg-white rounded-2xl w-full mb-3 overflow-hidden ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FFF3E8] text-[#F68221]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 640 640" aria-hidden>
              <path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Fare Rules</h2>
            <p className="text-[13px] font-medium text-slate-500">Cancellations, changes, and no-show policies</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleAccordion("fare")}
          className="flex items-center p-2 hover:bg-slate-50 rounded-full focus:outline-none transition-colors"
          aria-controls={accId}
          aria-expanded={!!openSections.fare}
        >
          <Chevron isOpen={!!openSections.fare} />
        </button>
      </header>

      <div className="divide-y divide-slate-100">
        <section className="bg-slate-50/30">
          <div id={accId} className={`${openSections.fare ? "block" : "hidden"} px-5 py-4`}>
            
            {/* Dynamic Rendering for 1...N Legs */}
            {legs.length > 0 ? (
              legs.map((leg, idx) => {
                const legRules = extractRules(leg.segments);
                const titleLeft = legs.length > 1 ? (idx === 0 ? "Outbound" : (idx === 1 ? "Return" : `Leg ${idx + 1}`)) : "Flight Rules";

                return (
                  <div key={idx} className={idx > 0 ? "mt-6 pt-5 border-t border-slate-200 border-dashed" : ""}>
                    
                    {/* Leg Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        {titleLeft}
                      </span>
                      <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                        {getAirportName(leg.origin || leg.segments?.[0]?.departure)}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        {getAirportName(leg.destination || leg.segments?.[leg.segments.length - 1]?.arrival)}
                      </h3>
                    </div>

                    {/* Rules List */}
                    <dl className="grid grid-cols-1 gap-y-3 text-sm bg-white p-4 rounded-xl ring-1 ring-slate-100 shadow-sm">
                      {legRules.length > 0 ? (
                        legRules.map((rule, i) => {
                          // Accommodate PKFare's data shape (isPermited vs isPermitted, and 0/1 vs false/true)
                          const permitted = rule.isPermited ?? rule.isPermitted ?? null;
                          const amount = rule.amount ?? rule.maxAmount ?? null;
                          const ccy = rule.currencyCode ?? rule.currency ?? "";
                          
                          const { text, status } = buildRuleText(rule.penaltyType, permitted, amount, ccy);
                          
                          // Optional: Identify if the rule is before or after departure based on 'when' param
                          const timingLabel = rule.when === 0 ? " (Before Departure)" : rule.when === 1 ? " (After Departure)" : "";
                          const { label } = getPenaltyDetails(rule.penaltyType);

                          return (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                              <RuleIcon status={status} />
                              <div>
                                <dt className="font-semibold text-slate-800 text-[13px]">
                                  {label} <span className="text-slate-400 font-normal">{timingLabel}</span>
                                </dt>
                                <dd className="mt-0.5 text-slate-600 text-[13px] leading-relaxed">
                                  {text}
                                </dd>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-start gap-3">
                          <FaInfoCircle className="text-slate-400 mt-0.5 shrink-0" size={15} />
                          <div>
                            <dt className="font-semibold text-slate-800 text-[13px]">No specific rules provided</dt>
                            <dd className="mt-0.5 text-slate-600 text-[13px]">Please refer to the airline's standard terms and conditions.</dd>
                          </div>
                        </div>
                      )}
                    </dl>

                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-600 text-center py-4">No fare rules available for this itinerary.</div>
            )}

            {/* Disclaimer Footer */}
            <div className="mt-5 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
              <FaInfoCircle className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-800 leading-relaxed font-medium">
                Please note that the fare rules provided at the time of booking will be manually verified by the airline if you wish to change or cancel. The fees shown above are estimates and do not include potential fare differences.
              </p>
            </div>

          </div>
        </section>
      </div>
    </motion.div>
  );
}

/* ------------ Small, reusable bits ------------ */
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