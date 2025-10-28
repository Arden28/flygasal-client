import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import { AuthContext } from "../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";
import usFlag from "/assets/img/flags/us.svg";

export default function ClientLayout() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  const noLayoutPatterns = [
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
    <div className="flex min-h-screen flex-col" id="fadein">
      {/* --- NAVBAR --- */}
      <header ref={rootRef} className="relative z-[250] text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Brand */}
            <Link to="/" className="group flex items-center gap-2">
              <img src={logo} alt="FlyGasal" className="h-8 w-auto sm:h-9" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              <ul className="flex items-center gap-1 rounded-full bg-white/0">
                {navLinks.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive(it.to)
                          ? "bg-white/15 text-white shadow-sm backdrop-blur"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right controls */}
            <div className="hidden items-center gap-2 lg:flex">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
                <img src={usFlag} alt="" className="h-4 w-4 rounded-sm" />
                <span>English</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
                <span className="font-semibold">$ USD</span>
              </div>

              {/* Account */}
              <div className="relative">
                <button
                  onClick={() => setAcctOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-sm text-white/90 backdrop-blur hover:bg-white/15"
                >
                  <img
                    src={
                      user?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?radius=50&seed=${encodeURIComponent(
                        user?.name || "U"
                      )}`
                    }
                    alt="Avatar"
                    className="h-8 w-8 rounded-full border border-white/20 object-cover"
                  />
                  <span className="max-w-[12rem] truncate">
                    {isLoggingOut ? "Logging out..." : userDisplayName}
                  </span>
                  <Caret />
                </button>

                {acctOpen && (
                  <ul className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-white/15 bg-white/90 text-slate-900 shadow-2xl backdrop-blur">
                    {accountOptions.map((opt) => (
                      <li key={opt.label}>
                        <Link
                          to={opt.to}
                          className="block px-3 py-2 text-sm hover:bg-black/5"
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
                          className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/80"
                        >
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white lg:hidden backdrop-blur"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Sheet */}
        {mobileOpen && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-[240] bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-x-0 top-0 z-[245] origin-top rounded-b-2xl border-b border-white/10 bg-[#0b0b0b]/95 px-4 pb-6 pt-4 text-white shadow-2xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between">
                <img src={logo} className="h-8 w-auto" />
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
              <ul className="mx-auto mt-4 max-w-7xl space-y-1">
                {navLinks.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`block rounded-xl px-3 py-3 text-base ${
                        isActive(it.to)
                          ? "bg-white/10 text-white"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mx-auto mt-4 flex max-w-7xl items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-sm">
                  <img src={usFlag} alt="" className="h-4 w-4 rounded-sm" />
                  <span>English</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-sm">
                  <span className="font-semibold">$ USD</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <SpinnerOrbit />
      <Outlet />

      {/* --- FOOTER --- */}
      <footer className="mt-auto bg-[#0E0A1A] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          {/* Newsletter */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs text-orange-200">
                  Stay in the loop
                </div>
                <h4 className="mt-3 text-2xl font-semibold leading-tight">
                  Exclusive flight tips, fare drops & product updates.
                </h4>
                <p className="mt-1 text-white/70 text-sm">
                  No spam. Just useful stuff from Fly Gasal — unsubscribe anytime.
                </p>
              </div>

              <form
                className="w-full max-w-md"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="flex rounded-full border border-white/15 bg-white/10 p-1.5 focus-within:border-white/25">
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    className="w-full rounded-full bg-transparent px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="ml-1 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-white/60">
                  By subscribing you agree to our Terms & Privacy.
                </p>
              </form>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-10 grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="FlyGasal" className="h-8 w-auto" />
              </Link>
              <p className="text-sm text-white/70">
                Your one stop travel solutions — simple, flexible and reliable.
              </p>
            </div>

            <FooterColumn title="Book with us" links={["Search & book", "Multi-city search"]} />
            <FooterColumn title="My booking" links={["Manage my booking", "Help centre", "Contact us"]} />
            <FooterColumn title="Company" links={["About us", "Reviews", "Blog"]} />
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Fly Gasal.</span>
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>
            <ul className="flex items-center gap-4">
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Cookies</a></li>
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
            <a href="#" className="text-white/70 hover:text-white">
              {text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Caret() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="opacity-90">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
