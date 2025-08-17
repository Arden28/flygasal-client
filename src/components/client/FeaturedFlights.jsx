// src/components/client/FeaturedFlights.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { ClientContext } from "../../context/ClientContext";

// Simple utils
const fallbackImg =
  "https://images.unsplash.com/photo-1470115636492-6d2b56f9146e?q=80&w=1600&auto=format&fit=crop"; // plane wing

const cx = (...classes) => classes.filter(Boolean).join(" ");
const toCode = (c) => String(c || "").toUpperCase();
const slugCodes = (a, b) => `${String(a || "").toLowerCase()}-${String(b || "").toLowerCase()}`;

/**
 * Highly responsive Featured Flights section
 * - Tailwind-only, accessible, keyboard-friendly
 * - Uses ClientContext for i18n + currency formatting if available
 * - Mobile: horizontal scroll (snap) carousel; Desktop: grid (2/3/4 cols)
 * - Image lazy-loading, graceful fallback, subtle hover animation
 */
export default function FeaturedFlights({
  items,
  title,
  subtitle,
  className = "",
}) {
  // Optional i18n/currency from global context (falls back gracefully if not wrapped)
  const client = useContext(ClientContext);
  const t = client?.t ?? ((k) => k);
  const formatCurrency =
    client?.formatCurrency ?? ((amount) => `$${Number(amount || 0).toLocaleString()}`);

  // Sample data (can be overridden via props.items)
  const defaults = useMemo(
    () => [
      {
        id: 1,
        origin: "New York (JFK)",
        origin_code: "JFK",
        destination: "London (LHR)",
        destination_code: "LHR",
        airline_name: "British Airways",
        price: 599,
        image:
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 2,
        origin: "Dubai (DXB)",
        origin_code: "DXB",
        destination: "Paris (CDG)",
        destination_code: "CDG",
        airline_name: "Emirates",
        price: 749,
        image:
          "https://images.unsplash.com/photo-1542316042-8ef59b94f47d?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 3,
        origin: "Tokyo (NRT)",
        origin_code: "NRT",
        destination: "Sydney (SYD)",
        destination_code: "SYD",
        airline_name: "Qantas",
        price: 899,
        image:
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 4,
        origin: "Los Angeles (LAX)",
        origin_code: "LAX",
        destination: "Miami (MIA)",
        destination_code: "MIA",
        airline_name: "American Airlines",
        price: 299,
        image:
          "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=1400&auto=format&fit=crop",
      },
    ],
    []
  );

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulate load / accept external items
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setFlights(Array.isArray(items) && items.length ? items : defaults);
      setLoading(false);
    }, 200); // quick shimmer
    return () => clearTimeout(timer);
  }, [items, defaults]);

  return (
    <section className={cx("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-10", className)}>
      {/* Header */}
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {title || t("Featured Flights")}
          </h2>
          <p className="text-gray-600 text-sm">
            {subtitle || t("These alluring destinations are picked just for you")}
          </p>
        </div>
        <Link
          to="/flight/availability"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t("View all deals")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      {/* Mobile: horizontal snap carousel; Desktop: responsive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-5">
        {/* On small screens, we use a CSS trick: each card is full width but we also keep a horizontal scroller for overflow.
            Using display grid keeps it simple; cards are responsive anyway. */}

        {loading
          ? Array.from({ length: 4 }).map((_, i) => <FlightCardSkeleton key={i} />)
          : flights.map((f) => <FlightCard key={f.id ?? `${f.origin}-${f.destination}`} flight={f} formatCurrency={formatCurrency} />)}
      </div>

      {/* View all (mobile) */}
      <div className="mt-5 sm:hidden">
        <Link
          to="/flight/availability"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t("View all deals")}
        </Link>
      </div>
    </section>
  );
}

const FlightCard = ({ flight, formatCurrency }) => {
  const fromCode = toCode(flight.origin_code);
  const toCodeVal = toCode(flight.destination_code);
  const href = `/flight/${flight.id ?? `${fromCode}-${toCodeVal}`}/${slugCodes(fromCode, toCodeVal)}`;

  return (
    <Link
      to={href}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
      aria-label={`${flight.origin} to ${flight.destination} with ${flight.airline_name}`}
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={flight.image || fallbackImg}
          alt={`${flight.origin} to ${flight.destination}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
          }}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {/* soft gradient for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
        {/* Airline pill */}
        {flight.airline_name ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-800 shadow">
            {flight.airline_name}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">{fromCode}</div>
            <div className="truncate font-medium text-gray-900">{flight.origin}</div>
          </div>

          <FlightArrow />

          <div className="text-right min-w-0">
            <div className="text-xs text-gray-500">{toCodeVal}</div>
            <div className="truncate font-medium text-gray-900">{flight.destination}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="sr-only">Price:</span>
            {formatCurrency(flight.price, "USD")}
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {`View deal`}
            <svg
              className="opacity-80"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

const FlightCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="h-40 w-full animate-pulse bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
    </div>
  </div>
);

const FlightArrow = () => (
  <div className="mx-2 flex flex-col items-center text-gray-400">
    <div className="h-5 w-px bg-gray-200" />
    <svg
      className="my-0.5"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* tiny plane icon */}
      <path d="M2.2 10.7l3.7.9 2 3.8c.1.2.4.3.6.2l.4-.2c.2-.1.3-.4.2-.6l-1.2-3.9 4.6-4.6 3 .4c.3 0 .6-.2.6-.5l.1-.6c0-.3-.2-.6-.5-.6l-3.7-.4-4.9 4.9-3.9-1.2c-.2-.1-.5 0-.6.2l-.2.4c-.2.2 0 .5.2.6z" />
    </svg>
    <div className="h-5 w-px bg-gray-200" />
  </div>
);
