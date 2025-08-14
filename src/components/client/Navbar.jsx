import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";
import usFlag from "/assets/img/flags/us.svg";
import arFlag from "/assets/img/flags/ar.svg";
import frFlag from "/assets/img/flags/fr.svg";
import euFlag from "/assets/img/flags/eu.svg";
import keFlag from "/assets/img/flags/ke.svg";

/**
 * Navbar (Refined)
 * - Tailwind-only, no Bootstrap JS dependencies
 * - Stable mobile menu (no disappearing on route change); closes on outside click/ESC
 * - Controlled dropdowns for language/currency/account (desktop & mobile)
 * - SPA navigation via <Link>; active link highlighting
 * - Accessible (ARIA, focus states), responsive and keyboard-friendly
 */
export default function Navbar() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // "lang" | "curr" | "acct" | null

  const navLinks = useMemo(() => ([
    { to: "/flight/availability", label: "Flights" },
    { to: "/blogs", label: "Blog" },
    { to: "/about", label: "About Us" },
  ]), []);

  const languageOptions = [
    { label: "English", flag: usFlag, value: "en" },
    { label: "Arabic", flag: arFlag, value: "ar" },
    { label: "Français", flag: frFlag, value: "fr" },
  ];

  const currencyOptions = [
    { code: "USD", name: "United States Dollar", flag: usFlag },
    { code: "EUR", name: "Euro", flag: euFlag },
    { code: "KES", name: "Kenyan Shilling", flag: keFlag },
  ];

  const accountOptions = user
    ? [
      { label: "Dashboard", to: user.role === "admin" ? "/admin" : "/dashboard" },
      { label: "Bookings", to: user.role === "admin" ? "/admin" : "/bookings" },
      { label: "Deposits", to: user.role === "admin" ? "/admin" : "/deposits" },
    ]
    : [{ label: "Login", to: "/login" }, { label: "Signup", to: "/signup" }];

  const userDisplayName = user?.name || user?.email || "Account";

  // Close mobile + dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
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
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleDropdown = (key) => setOpenDropdown((prev) => (prev === key ? null : key));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header ref={rootRef} className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
            <img src={logo} alt="FlyGasal" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((it) => (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={`rounded-xl px-3 py-2 text-sm transition ${
                      isActive(it.to) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right controls (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("lang")}
                aria-haspopup="menu"
                aria-expanded={openDropdown === "lang"}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
              >
                <img src={usFlag} alt="Language" className="h-4 w-4" />
                <span>English</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {openDropdown === "lang" && (
                <ul role="menu" className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                  {languageOptions.map((opt) => (
                    <li key={opt.value}>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                        <img src={opt.flag} alt="" className="h-4 w-4"/>
                        <span>{opt.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Currency */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("curr")}
                aria-haspopup="menu"
                aria-expanded={openDropdown === "curr"}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
              >
                <strong>USD $</strong>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {openDropdown === "curr" && (
                <ul role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                  {currencyOptions.map((opt) => (
                    <li key={opt.code}>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                        <img src={opt.flag} alt="" className="h-4 w-4"/>
                        <span className="font-medium">{opt.code}</span>
                        <span className="mx-1">–</span>
                        <span className="text-gray-600">{opt.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Account */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("acct")}
                aria-haspopup="menu"
                aria-expanded={openDropdown === "acct"}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
              >
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "U")}`}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                />
                <span className="max-w-[12rem] truncate">{isLoggingOut ? "Logging out..." : userDisplayName}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {openDropdown === "acct" && (
                <ul role="menu" className="absolute right-0 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                  {accountOptions.map((opt) => (
                    <li key={opt.label}>
                      <Link to={opt.to} className="block px-3 py-2 text-sm hover:bg-gray-50">{opt.label}</Link>
                    </li>
                  ))}
                  {!loading && user && (
                    <li>
                      <button onClick={handleLogout} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div id="mobile-menu" className={`${mobileOpen ? "block" : "hidden"} lg:hidden border-t border-gray-100 bg-white shadow-sm`}> 
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          {/* Primary links */}
          <ul className="flex flex-col gap-1 py-2">
            {navLinks.map((it) => (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={`block rounded-xl px-3 py-2 text-sm ${isActive(it.to) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Language accordion */}
          <div className="py-1">
            <button onClick={() => toggleDropdown("lang")} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">
              <span className="flex items-center gap-2"><img src={usFlag} alt="" className="h-4 w-4"/>English</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {openDropdown === "lang" && (
              <ul className="mt-1 overflow-hidden rounded-xl border border-gray-100">
                {languageOptions.map((opt) => (
                  <li key={opt.value}>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <img src={opt.flag} alt="" className="h-4 w-4"/>
                      <span>{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Currency accordion */}
          <div className="py-1">
            <button onClick={() => toggleDropdown("curr")} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">
              <span><strong>USD $</strong></span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {openDropdown === "curr" && (
              <ul className="mt-1 overflow-hidden rounded-xl border border-gray-100">
                {currencyOptions.map((opt) => (
                  <li key={opt.code}>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <img src={opt.flag} alt="" className="h-4 w-4"/>
                      <span className="font-medium">{opt.code}</span>
                      <span className="mx-1">–</span>
                      <span className="text-gray-600">{opt.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Account */}
          <div className="py-1">
            <button onClick={() => toggleDropdown("acct")} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">
              <span className="flex items-center gap-2">
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "U")}`}
                  alt="Avatar"
                  className="h-6 w-6 rounded-full border border-gray-200 object-cover"
                />
                <span className="truncate max-w-[12rem]">{userDisplayName}</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {openDropdown === "acct" && (
              <ul className="mt-1 overflow-hidden rounded-xl border border-gray-100">
                {accountOptions.map((opt) => (
                  <li key={opt.label}>
                    <Link to={opt.to} className="block px-3 py-2 text-sm hover:bg-gray-50">{opt.label}</Link>
                  </li>
                ))}
                {!loading && user && (
                  <li>
                    <button onClick={handleLogout} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
