import { Check } from "lucide-react";
import { useMemo } from "react";

/**
 * BookingHeader (resilient)
 * - Safe fallbacks when step 1 lacks flight data
 * - Uses searchParams if outbound/returnFlight not present
 * - Orange brand default (#F68221)
 */
export default function BookingHeader({
  searchParams,
  adults,
  children,
  infants,
  outbound,
  returnFlight,
  tripType,
  totalPrice,
  getAirportName,
  formatDate,
  steps = [
    { id: 1, label: "Flights selected" },
    { id: 2, label: "Details" },
    { id: 3, label: "Confirmation" },
  ],
  currentStep = 2,
  onStepClick,
  currency = "USD",
  brandColor = "#F68221", // brand default (orange)
  className = "",
}) {
  // pax: keep your logic (adults + children; infants excluded)
  const pax = useMemo(() => {
    const a = Number(adults ?? searchParams?.adults ?? 1) || 1;
    const c = Number(children ?? searchParams?.children ?? 0) || 0;
    return a + c;
  }, [adults, children, searchParams?.adults, searchParams?.children]);

  const total = steps.length || 3;
  const step = Math.min(Math.max(currentStep, 1), total);

  // ---- Safe flight info resolution ----
  const rawOrigin = outbound?.origin ?? searchParams?.origin ?? "";
  const rawDest = outbound?.destination ?? searchParams?.destination ?? "";

  const origin = rawOrigin
    ? (getAirportName?.(rawOrigin) ?? rawOrigin)
    : ""; // blank if unknown
  const dest = rawDest
    ? (getAirportName?.(rawDest) ?? rawDest)
    : "";

  const rawOutDate =
    outbound?.departureTime ?? searchParams?.departureDate ?? null;
  const outDate =
    rawOutDate && formatDate ? formatDate(rawOutDate) : rawOutDate ?? "";

  const rawRetDate =
    (tripType === "return"
      ? (returnFlight?.departureTime ?? searchParams?.returnDate ?? null)
      : null);
  const retDate =
    rawRetDate && formatDate ? formatDate(rawRetDate) : rawRetDate ?? null;

  // determine if we have enough to show a route line elegantly
  const hasRoute = Boolean(origin || dest);
  const hasDates = Boolean(outDate || (tripType === "return" && retDate));

  // Progress percentage (step index based)
  const progressPct = total > 1 ? ((step - 1) / (total - 1)) * 100 : 0;

  // currency formatting (safe)
  const priceLabel =
    typeof totalPrice === "number"
      ? Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(totalPrice)
      : totalPrice
      ? `${totalPrice} ${currency}`
      : "—";

  return (
    <header
      className={[
        "w-full bg-white text-slate-900 border-b border-slate-200",
        className,
      ].join(" ")}
      role="banner"
      style={{ "--brand": brandColor }}
    >
      {/* Sticky top row */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200">
        {/* Flight Details */}
        <div className="mx-auto max-w-8xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* Left: Route + Dates (safe fallbacks) */}
          <div className="text-sm md:text-base font-medium min-w-0">
            {hasRoute ? (
              <div className="truncate">
                <span className="truncate">
                  {origin || "—"} {hasRoute ? "→" : ""} {dest || "—"}
                </span>
              </div>
            ) : (
              <div className="truncate">Select flights</div>
            )}
            <div className="text-slate-600 text-[13px]">
              {hasDates ? (
                <>
                  {outDate || "—"}
                  {tripType === "return" && (
                    <> {retDate ? ` · Return ${retDate}` : " · Return —"}</>
                  )}
                </>
              ) : (
                <span className="text-slate-500">Dates —</span>
              )}
            </div>
          </div>

          {/* Right: Total price (always present, with placeholder) */}
          <div
            className="items-center gap-2 bg-white px-3 py-1.5 text-sm md:text-base font-semibold shadow-xs"
            aria-label="Total price"
            title="Total price"
          >
            <span className="truncate text-xl font-semibold">{priceLabel}</span>
            <div>
              <span className="font-normal text-sm text-slate-500">
                Total Price ({pax} Pax)
              </span>
            </div>
          </div>
        </div>

        <hr className="mb-2" />

        {/* Steps */}
        <div className="mx-auto max-w-6xl px-2 sm:px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            {/* Logo Section */}
            <div className="flex justify-center sm:justify-start w-full sm:w-auto">
              <img
                src="/assets/img/logo/flygasal.png"
                alt="Fly Gasal"
                className="h-8 sm:h-10 object-contain"
              />
            </div>

            {/* Steps Section */}
            <ol
              className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar"
              aria-label="Booking steps"
            >
              {steps.map((s) => {
                const isActive = s.id === step;
                const isDone = s.id < step;

                const Node = onStepClick ? "button" : "div";
                const base =
                  "group flex items-center gap-2 min-w-0 rounded-2xl transition shadow-xs " +
                  "px-1 py-0 sm:px-3.5 sm:py-2.5 focus:outline-none ring-offset-2 focus:ring-2 hover:bg-[#FAFAFA] cursor-pointer";
                const tone = isDone
                  ? "border-slate-300 bg-slate-100 hover:bg-slate-200 focus:ring-[color:var(--brand)]"
                  : isActive
                  ? "border-[color:var(--brand)] bg-white hover:bg-slate-50 focus:ring-[color:var(--brand)]  hover:bg-[#FAFAFA]"
                  : "border-slate-200 bg-white hover:bg-slate-50 focus:ring-[color:var(--brand)]  hover:bg-[#FAFAFA]";

                return (
                  <li key={s.id} className="min-w-0">
                    <Node
                      type={onStepClick ? "button" : undefined}
                      onClick={onStepClick ? () => onStepClick(s.id) : undefined}
                      className={`${base} ${tone}`}
                      aria-current={isActive ? "step" : undefined}
                      title={s.label}
                    >
                      <span
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold shrink-0",
                          isDone
                            ? "bg-[color:var(--brand)] border-[color:var(--brand)] text-white"
                            : isActive
                            ? "bg-white border-[color:var(--brand)] text-slate-900"
                            : "bg-white border-slate-300 text-slate-600",
                        ].join(" ")}
                      >
                        {isDone ? <Check className="h-4 w-4" aria-hidden /> : s.id}
                      </span>

                      <span
                        className={[
                          "truncate font-medium",
                          "text-xs sm:text-sm",
                          isActive
                            ? "text-slate-900"
                            : isDone
                            ? "text-slate-700"
                            : "text-slate-600",
                        ].join(" ")}
                      >
                        <span className="sm:hidden">
                          {s.label.length > 14 ? s.label.slice(0, 14) + "…" : s.label}
                        </span>
                        <span className="hidden sm:inline">{s.label}</span>
                      </span>
                    </Node>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Full-width progress bar at the very bottom of the header */}
      <div className="w-full">
        {/* Track */}
        <div className="relative h-1.5 w-full bg-slate-200">
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-1.5 rounded-r-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "var(--brand)",
            }}
            aria-hidden
          />
        </div>
        {/* Meta (optional, small + subtle) */}
        <div className="mx-auto max-w-6xl px-4 py-1.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Step {step} of {total}</span>
          <span className="text-[11px] text-slate-600">{Math.round(progressPct)}%</span>
        </div>
      </div>
    </header>
  );
}

/* Tailwind helper (optional): hide scrollbar for the step row)
Add once in your global CSS if you like:

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/
