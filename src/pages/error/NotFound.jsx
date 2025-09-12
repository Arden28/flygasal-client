import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "/assets/img/logo/flygasal.png";

/**
 * NotFound (404) — Travel themed + Flygasal branding
 * - Header with Flygasal logo (customize LOGO_SRC if needed)
 * - Split-flap "404"
 * - Plane flying along a curved route (CSS motion path) + cross-screen jet
 * - Decorative clouds & soft gradients
 * - Quick actions & helpful suggestions
 */
const LOGO_SRC = "/assets/img/logo.svg"; // change if your logo lives elsewhere

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const attempted = location?.pathname || "/";

  const mailSubject = encodeURIComponent("Broken link on Flygasal");
  const mailBody = encodeURIComponent(
    [
      "Hi Flygasal team,",
      "",
      "I ran into a broken link/page not found.",
      `Tried URL: ${typeof window !== "undefined" ? window.location.href : attempted}`,
      `Referrer: ${typeof document !== "undefined" && document.referrer ? document.referrer : "Direct / Unknown"}`,
      "",
      "Steps I took:",
      "- ",
      "",
      "Thanks!"
    ].join("\n")
  );

  const supportsMotionPath = useMemo(() => {
    if (typeof window === "undefined") return true; // let client hydrate decide
    const test = 'path("M 0 0, 1 1")';
    // Some browsers require both checks
    return !!(window.CSS && (CSS.supports?.("offset-path", test) || CSS.supports?.("motion-path", test)));
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-white to-white">
      {/* Header with logo */}
      <Header />

      {/* Background blobs + dotted overlay */}
      <Decor />

      {/* Cross-screen jet (always visible as fun fallback) */}
      <CrossScreenJet />

      {/* Curved route with moving plane (uses CSS motion path if supported) */}
      <RoutePlane enabled={supportsMotionPath} />

      {/* Content */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-24 pb-16 md:pt-28 md:pb-24">
        {/* Split-flap 404 */}
        <div className="mb-6 flex items-center gap-2 md:mb-8">
          {["4", "0", "4"].map((d, i) => (
            <SplitFlap key={i}>{d}</SplitFlap>
          ))}
        </div>

        <h1 className="text-center text-2xl font-semibold text-gray-900 md:text-4xl">
          This route isn’t in our timetable
        </h1>
        <p className="mt-2 max-w-2xl text-center text-gray-600 md:text-lg">
          The page you’re looking for might have been moved, removed, or never departed.
        </p>

        {/* Attempted path */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-xs text-gray-600 md:text-sm">
          <span className="font-medium text-gray-800">Attempted:</span>{" "}
          <code className="break-all text-gray-700">{attempted}</code>
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            <HomeIcon />
            Home
          </Link>
          <Link
            to="/flight/availability"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 hover:bg-gray-50"
          >
            <SearchIcon />
            Search flights
          </Link>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 hover:bg-gray-50"
          >
            <TicketIcon />
            View bookings
          </Link>
          <a
            href={`mailto:support@flygasal.com?subject=${mailSubject}&body=${mailBody}`}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 hover:bg-gray-50"
          >
            <HelpIcon />
            Report broken link
          </a>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 hover:bg-gray-50"
          >
            <BackIcon />
            Go back
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SuggestionCard
            title="Popular routes"
            desc="Discover great fares on frequently traveled routes."
            to="/flight/availability"
            icon={<CompassIcon />}
          />
          <SuggestionCard
            title="Travel support"
            desc="Need help with a visa, change, or cancellation?"
            to="/support"
            icon={<LifeBuoyIcon />}
          />
          <SuggestionCard
            title="Deals & offers"
            desc="Explore limited-time discounts and seasonal offers."
            to="/deals"
            icon={<SparklesIcon />}
          />
        </div>

        {/* Decorative clouds */}
        <div aria-hidden="true" className="pointer-events-none mt-10 w-full max-w-5xl">
          <div className="mx-auto flex items-center justify-center gap-2 sm:gap-4">
            <Cloud className="h-6 w-14 sm:h-8 sm:w-20" />
            <Cloud className="h-8 w-20 sm:h-10 sm:w-28 opacity-80" />
            <Cloud className="h-5 w-12 sm:h-7 sm:w-16 opacity-60" />
          </div>
        </div>
      </section>
    </main>
  );
};

/* ---------------- Header with Logo ---------------- */
const Header = () => {
  const [fail, setFail] = useState(false);
  return (
    <header className="absolute left-0 right-0 top-0 z-20 bg-transparent shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-2">
            <img
              src={logo}
              onError={() => setFail(true)}
              alt="Flygasal"
              className="h-8 w-auto md:h-9"
              loading="eager"
              decoding="async"
            />
          <span className="sr-only">Flygasal Home</span>
        </Link>
        <Link
          to="/flight/availability"
          className="inline-flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-1.5 text-sm shadow-sm backdrop-blur hover:bg-white"
        >
          <SearchIcon />
          Book a flight
        </Link>
      </div>
    </header>
  );
};

/* ---------------- Background Decor ---------------- */
const Decor = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
    <div className="absolute top-10 right-0 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
    <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(#00000011_1px,transparent_1px)] [background-size:18px_18px] opacity-10" />
  </div>
);

/* ---------------- Cross-screen Jet ---------------- */
const CrossScreenJet = () => (
  <motion.div
    aria-hidden="true"
    className="pointer-events-none absolute left-[-10%] top-28 z-10 md:top-32"
    initial={{ x: "-10%", y: 0, rotate: -2, opacity: 0 }}
    animate={{ x: "120%", opacity: 1 }}
    transition={{ duration: 18, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
  >
    <div className="relative">
      <PlaneSilhouette className="h-6 w-6 text-sky-500 md:h-7 md:w-7" />
      {/* tiny contrail */}
      <div className="absolute -right-6 top-1/2 h-[2px] w-16 -translate-y-1/2 bg-gradient-to-l from-sky-300/60 to-transparent" />
    </div>
  </motion.div>
);

/* ---------------- Route-following Plane ---------------- */
const RoutePlane = ({ enabled }) => {
  // svg path visible as dashed route
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-20 -z-0 mx-auto hidden h-28 w-[92%] md:block">
      <svg viewBox="0 0 1200 120" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 100 C 300 30, 900 30, 1180 100"
          stroke="currentColor"
          className="text-sky-300"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />
      </svg>

      {enabled ? (
        <motion.div
          className="absolute left-0 top-0 h-6 w-6 md:h-7 md:w-7"
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={{ offsetDistance: ["0%", "100%"], opacity: 1 }}
          transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
          style={{
            offsetPath: "path('M20 100 C 300 30, 900 30, 1180 100')",
            offsetRotate: "auto",
          }}
        >
          <PlaneSilhouette className="h-6 w-6 text-sky-600 drop-shadow" />
        </motion.div>
      ) : null}
    </div>
  );
};

/* ---------------- Split-flap digit ---------------- */
const SplitFlap = ({ children }) => {
  return (
    <motion.div
      className="relative h-20 w-16 select-none rounded-xl bg-black text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] md:h-28 md:w-20"
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.05 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center font-mono text-4xl tabular-nums md:text-6xl">
        {children}
      </div>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" />
      <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
    </motion.div>
  );
};

/* ---------------- Suggestion card ---------------- */
const SuggestionCard = ({ title, desc, to, icon }) => (
  <Link
    to={to}
    className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{desc}</p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-sky-700">
          Explore
          <svg
            className="ml-1 transition group-hover:translate-x-0.5"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
          >
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </div>
  </Link>
);

/* ---------------- Icons ---------------- */
const PlaneSilhouette = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
        <path d="M624 448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h608c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM80.55 341.27c6.28 6.84 15.1 10.72 24.33 10.71l130.54-.18a65.62 65.62 0 0 0 29.64-7.12l290.96-147.65c26.74-13.57 50.71-32.94 67.02-58.31 18.31-28.48 20.3-49.09 13.07-63.65-7.21-14.57-24.74-25.27-58.25-27.45-29.85-1.94-59.54 5.92-86.28 19.48l-98.51 49.99-218.7-82.06a17.799 17.799 0 0 0-18-1.11L90.62 67.29c-10.67 5.41-13.25 19.65-5.17 28.53l156.22 98.1-103.21 52.38-72.35-36.47a17.804 17.804 0 0 0-16.07.02L9.91 230.22c-10.44 5.3-13.19 19.12-5.57 28.08l76.21 82.97z"/>
    </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3l9-8z" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 11-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
  </svg>
);
const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 7a2 2 0 012-2h7v4a2 2 0 100 4v4H5a2 2 0 01-2-2V7zm18 0v10a2 2 0 01-2 2h-7v-4a2 2 0 100-4V5h7a2 2 0 012 2z" />
  </svg>
);
const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10
    10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41
    0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8
    8zm0-14a4 4 0 00-4 4h2a2 2 0 114 0c0 2-3 1.75-3
    5h2c0-2.25 3-2.5 3-5a4 4 0 00-4-4z" />
  </svg>
);
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);
const CompassIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.6 6.4l-1.8 5.4-5.4 1.8 1.8-5.4 5.4-1.8z"/>
  </svg>
);
const LifeBuoyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.1 6.1L15 11.2V9a3 3 0 10-6 0v2.2L5.9 8.1A8 8 0 1120.1 8.1z"/>
  </svg>
);
const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zm14 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
  </svg>
);

/* ---------------- Clouds ---------------- */
const Cloud = ({ className = "" }) => (
  <div className={`relative ${className}`}>
    <div className="absolute left-1/2 top-1/2 h-[60%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100" />
    <div className="absolute left-[35%] top-[35%] h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100" />
    <div className="absolute left-[60%] top-[40%] h-[35%] w-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100" />
  </div>
);

export default NotFound;
