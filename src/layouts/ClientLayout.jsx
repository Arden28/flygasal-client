import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import { AuthContext } from "../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";
import usFlag from "/assets/img/flags/us.svg";

/** Brand palette (inline for clarity) */
const ORANGE = "#F68221";
const ORANGE_HOVER = "#e37212"; // a touch darker
const ORANGE_ACTIVE = "#c86210"; // pressed
const ORANGE_SOFT_BG = "rgba(246,130,33,0.10)"; // subtle bg chips
const BORDER_SOFT = "rgba(2,6,23,0.10)"; // slate-900/10

export default function ClientLayout() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  // Detect scroll to swap navbar styles (transparent over hero -> solid after scroll)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const noLayoutPatterns = [
    /^\/flight\/availability$/,
    /^\/flight\/booking-confirmation$/,
    /^\/flight\/booking\/details$/,
    /^\/flight\/booking\/invoice\/[^/]+$/,
    /^\/flights\/invoice\/[^/]+$/,
  ];
  const isNoLayout = noLayoutPatterns.some((pattern) => pattern.test(location.pathname));

  useEffect(() => {
    const allowed = ["/signup", "/forgot-password", "/reset-password", "/signup-success"];
    if (!loading && !user && !allowed.includes(location.pathname)) navigate("/login");
    if (!loading && user && user.is_active === 0 && location.pathname !== "/signup-success") {
      navigate("/signup-success");
    }
  }, [loading, user, navigate, location.pathname]);

  const navLinks = useMemo(
    () => [
      { to: "/", label: "Flights" },
      { to: "/hotel/availability", label: "Hotels" },
    ],
    []
  );

  const accountOptions = user
    ? [
        { label: "Dashboard", to: user.role === "admin" ? "/admin" : "/dashboard" },
        { label: "Bookings", to: user.role === "admin" ? "/admin" : "/bookings" },
        { label: "Deposits", to: user.role === "admin" ? "/admin" : "/deposits" },
      ]
    : [
        { label: "Login", to: "/login" },
        { label: "Signup", to: "/signup" },
      ];

  const userDisplayName = user?.name || user?.email || "Account";

  useEffect(() => {
    setMobileOpen(false);
    setAcctOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setAcctOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rootRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setAcctOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch {
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  if (isNoLayout) return <Outlet />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* --- NAVBAR --- */}
      <header
        ref={rootRef}
        className={[
          "sticky top-0 z-[250] backdrop-blur-md transition-colors duration-300",
          // Transparent over hero images + soft gradient on top; becomes solid on scroll
          scrolled
            ? "bg-white/95"
            : "bg-transparent",
        ].join(" ")}
      >
        {/* Soft top gradient to ensure contrast over hero images (not a shadow) */}
        {!scrolled && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-16"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.00))",
            }}
          />
        )}

        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <nav className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link
              to="/"
              className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: scrolled ? "#0f172a" : "#ffffff" }}
            >
              <img
                src={logo}
                alt="FlyGasal"
                className="h-8 w-auto"
                // prevent color-inversion artifacts if the hero is bright/dark
              />
            </Link>

            {/* Primary nav (center on desktop) */}
            <ul className="hidden lg:flex items-center gap-1">
              {navLinks.map((it) => {
                const active = isActive(it.to);
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={[
                        "inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-[color:#F68221]"
                          : scrolled
                          ? "text-slate-800 hover:text-slate-900"
                          : "text-white hover:text-white",
                      ].join(" ")}
                      // subtle underline using border (no shadow)
                      style={{
                        borderBottom: active ? `2px solid ${ORANGE}` : "2px solid transparent",
                      }}
                    >
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Right controls */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language (example chip kept minimal, no shadows) */}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                style={{
                  border: `1px solid ${BORDER_SOFT}`,
                  background: scrolled ? "white" : "rgba(255,255,255,0.10)",
                  color: scrolled ? "#0f172a" : "#ffffff",
                }}
                aria-label="Language"
              >
                <img src={usFlag} alt="" className="h-4 w-4 rounded-sm" />
                EN
              </button>

              {/* Account */}
              <div className="relative">
                <button
                  onClick={() => setAcctOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm transition-colors"
                  style={{
                    border: `1px solid ${BORDER_SOFT}`,
                    background: scrolled ? "white" : "rgba(255,255,255,0.10)",
                    color: scrolled ? "#0f172a" : "#ffffff",
                  }}
                  aria-haspopup="menu"
                  aria-expanded={acctOpen ? "true" : "false"}
                >
                  <img
                    src={
                      user?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?radius=50&seed=${encodeURIComponent(
                        user?.name || "U"
                      )}`
                    }
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover"
                    style={{ border: `1px solid ${BORDER_SOFT}` }}
                  />
                  <span className="truncate max-w-[12rem]">
                    {isLoggingOut ? "Logging out..." : userDisplayName}
                  </span>
                  <Caret scrolled={scrolled} />
                </button>

                {acctOpen && (
                  <ul
                    role="menu"
                    className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden"
                    style={{
                      background: "white",
                      border: `1px solid ${BORDER_SOFT}`,
                    }}
                  >
                    {accountOptions.map((opt) => (
                      <li key={opt.label}>
                        <Link
                          to={opt.to}
                          role="menuitem"
                          className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                          onClick={() => setAcctOpen(false)}
                        >
                          {opt.label}
                        </Link>
                      </li>
                    ))}
                    {user && (
                      <li>
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="block w-full px-3 py-2 text-left text-sm"
                          style={{ color: "#b91c1c" }} // rose-700
                        >
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Mobile Menu button */}
            <button
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen ? "true" : "false"}
              style={{
                border: `1px solid ${BORDER_SOFT}`,
                background: scrolled ? "white" : "rgba(255,255,255,0.10)",
                color: scrolled ? "#0f172a" : "#ffffff",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </nav>
        </div>

        {/* Mobile panel (no shadow, just border) */}
        {mobileOpen && (
          <div
            className="lg:hidden"
            style={{
              borderTop: `1px solid ${BORDER_SOFT}`,
              background: "white",
            }}
          >
            <ul className="flex flex-col gap-1 py-2 px-3">
              {navLinks.map((it) => {
                const active = isActive(it.to);
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className="block rounded-xl px-3 py-2 text-sm"
                      style={{
                        color: active ? ORANGE : "#0f172a",
                        background: active ? "rgba(246,130,33,0.08)" : "transparent",
                        border: active ? `1px solid ${ORANGE}20` : `1px solid transparent`,
                      }}
                    >
                      {it.label}
                    </Link>
                  </li>
                );
              })}

              <li className="mt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm w-full justify-center"
                  style={{
                    border: `1px solid ${BORDER_SOFT}`,
                    background: "white",
                    color: "#0f172a",
                  }}
                  onClick={() => setAcctOpen((v) => !v)}
                >
                  <img
                    src={
                      user?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?radius=50&seed=${encodeURIComponent(
                        user?.name || "U"
                      )}`
                    }
                    alt="Avatar"
                    className="h-6 w-6 rounded-full object-cover"
                    style={{ border: `1px solid ${BORDER_SOFT}` }}
                  />
                  {user ? userDisplayName : "Account"}
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      <SpinnerOrbit />
      <Outlet />

      {/* --- FOOTER --- */}
      <footer className="mt-auto bg-[#0E0A1A] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          {/* Newsletter */}
          <div
            className="rounded-3xl p-6 sm:p-8 backdrop-blur"
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                  style={{
                    border: `1px solid ${ORANGE}4D`, // ~30% opacity
                    background: ORANGE_SOFT_BG,
                    color: "#FED7AA", // orange-200ish
                  }}
                >
                  Stay in the loop
                </div>
                <h4 className="mt-3 text-2xl font-semibold leading-tight text-white">
                  Exclusive flight tips, fare drops & product updates.
                </h4>
                <p className="mt-1 text-white/70 text-sm">
                  No spam. Just useful stuff from Fly Gasal, unsubscribe anytime.
                </p>
              </div>

              <form
                className="w-full max-w-md"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div
                  className="flex rounded-full p-1.5 focus-within:ring-1"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.10)",
                    // subtle focus ring via focus-within:ring currentColor
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    className="w-full rounded-full bg-transparent px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="ml-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{
                      background: ORANGE,
                      color: "white",
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.background = ORANGE_ACTIVE)}
                    onMouseUp={(e) => (e.currentTarget.style.background = ORANGE)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ORANGE_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = ORANGE)}
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-white/60">
                  By subscribing you agree to our Terms &amp; Privacy.
                </p>
              </form>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-10 grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 text-white">
                <img src={logo} alt="FlyGasal" className="h-8 w-auto" />
              </Link>
              <p className="text-sm text-white/70">
                Your one stop travel solutions, simple, flexible and reliable.
              </p>
            </div>

            <FooterColumn title="Book with us" links={["Search & book", "Multi-city search"]} />
            <FooterColumn title="My booking" links={["Manage my booking", "Help centre", "Contact us"]} />
            <FooterColumn title="Company" links={["About us", "Reviews", "Blog"]} />
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/70 md:flex-row">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Fly Gasal.</span>
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>
            <ul className="flex items-center gap-4">
              <li>
                <a href="#" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h5 className="text-sm font-semibold tracking-wide text-white/90">{title}</h5>
      <ul className="mt-3 space-y-2">
        {links.map((text) => (
          <li key={text}>
            <a
              href="#"
              className="text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Caret({ scrolled }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: scrolled ? "#0f172a" : "#ffffff" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
