import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";
import usFlag from "/assets/img/flags/us.svg";

/**
 * Navbar
 * - Language fixed to English, currency fixed to USD (no dropdowns)
 * - Crisp, compact, accessible, with improved focus/hover states
 * - Account dropdown + mobile hamburger remain interactive
 * - Closes menus on route change / outside click / ESC
 */
export default function Navbar() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

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

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setAcctOpen(false);
  }, [location.pathname]);

  // ESC key closes menus
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

  // Outside click close
  const rootRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setAcctOpen(false);
      }
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

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-[250] border-b border-slate-200/60 bg-white/70 backdrop-blur-md"
    >
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <img src={logo} alt="FlyGasal" className="h-8 w-auto transition-transform group-hover:scale-[1.02]" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:block">
            <ul className="flex gap-1">
              {navLinks.map((it) => (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={`rounded-xl px-3 py-2 text-sm transition ${
                      isActive(it.to)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right controls (desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Fixed language (English) */}
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
              title="Language"
              aria-label="Language"
            >
              <img src={usFlag} alt="" className="h-4 w-4 rounded-sm" />
              <span className="font-medium">English</span>
            </div>

            {/* Fixed currency (USD) */}
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
              title="Currency"
              aria-label="Currency"
            >
              <span className="font-semibold">$ USD</span>
            </div>

            {/* Account */}
            <div className="relative">
              <button
                onClick={() => setAcctOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={acctOpen}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <img
                  src={
                    user?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?radius=50&seed=${encodeURIComponent(
                      user?.name || "U"
                    )}`
                  }
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                />
                <span className="max-w-[12rem] truncate">{isLoggingOut ? "Logging out..." : userDisplayName}</span>
                <Caret />
              </button>

              {acctOpen && (
                <ul
                  role="menu"
                  className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  {accountOptions.map((opt) => (
                    <li key={opt.label}>
                      <Link
                        to={opt.to}
                        className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                        onClick={() => setAcctOpen(false)}
                      >
                        {opt.label}
                      </Link>
                    </li>
                  ))}
                  {!loading && user && (
                    <li>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
            {/* Fixed language & currency compact badges */}
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
              title="English · USD"
              aria-label="English · USD"
            >
              <img src={usFlag} alt="" className="h-3.5 w-3.5 rounded-sm" />
              <span>EN</span>
              <span className="mx-1 h-3 w-px bg-slate-300" />
              <span>$</span>
            </div>

            {/* Account avatar */}
            <div className="relative">
              <button
                onClick={() => setAcctOpen((v) => !v)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={acctOpen}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <img
                  src={
                    user?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?radius=50&seed=${encodeURIComponent(
                      user?.name || "U"
                    )}`
                  }
                  alt="Account"
                  className="h-8 w-8 rounded-full object-cover"
                />
              </button>

              {acctOpen && (
                <ul
                  role="menu"
                  className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  {accountOptions.map((opt) => (
                    <li key={opt.label}>
                      <Link
                        to={opt.to}
                        className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                        onClick={() => setAcctOpen(false)}
                      >
                        {opt.label}
                      </Link>
                    </li>
                  ))}
                  {!loading && user && (
                    <li>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`${mobileOpen ? "block" : "hidden"} lg:hidden border-t border-slate-200 bg-white shadow-sm`}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2">
          {/* Primary links */}
          <ul className="flex flex-col gap-1 py-2">
            {navLinks.map((it) => (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={`block rounded-xl px-3 py-2 text-sm ${
                    isActive(it.to) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Fixed language & currency row (non-interactive) */}
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2">
              <img src={usFlag} alt="" className="h-4 w-4 rounded-sm" />
              <span>English</span>
            </span>
            <span className="mx-2 h-4 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">$ USD</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

const Caret = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
