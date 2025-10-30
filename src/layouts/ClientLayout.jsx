import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import { AuthContext } from "../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";

// Brand color
const ORANGE = "#F68221";

export default function ClientLayout() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

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

  const userDisplayName = user?.name || user?.email || "Account";

  // Close menus on route change
  useEffect(() => {
    setAcctOpen(false);
  }, [location.pathname]);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setAcctOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside to close
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

  if (isNoLayout) return <Outlet />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* --- NAVBAR (kept minimal, hero-friendly, no shadows) --- */}
      <header
        ref={rootRef}
        className="relative z-[250] bg-transparent backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Brand */}
            <Link to="/" className="group flex items-center gap-2">
              <img src={logo} alt="FlyGasal" className="h-8 w-auto" />
            </Link>

            {/* Account only (no language, no extra links) */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setAcctOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800"
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
                  <span className="truncate max-w-[12rem]">
                    {isLoggingOut ? "Logging out..." : userDisplayName}
                  </span>
                  <Caret />
                </button>

                {acctOpen && (
                  <ul
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white"
                    // no shadow; clean and minimal
                  >
                    {(user
                      ? [
                          { label: "Dashboard", to: user.role === "admin" ? "/admin" : "/dashboard" },
                          { label: "Bookings", to: user.role === "admin" ? "/admin" : "/bookings" },
                          { label: "Deposits", to: user.role === "admin" ? "/admin" : "/deposits" },
                        ]
                      : [
                          { label: "Login", to: "/login" },
                          { label: "Signup", to: "/signup" },
                        ]
                    ).map((opt) => (
                      <li key={opt.label}>
                        <Link
                          to={opt.to}
                          className="block px-3 py-2 text-sm hover:bg-slate-50"
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
          </div>
        </div>
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
                  No spam. Just useful stuff from Fly Gasal, unsubscribe anytime.
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
                    className="ml-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white transition"
                    style={{ backgroundColor: ORANGE }}
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
              <Link to="/" className="flex items-center gap-2">
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
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm md:flex-row">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Fly Gasal.</span>
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>
            <ul className="flex items-center gap-4">
              <li><a href="#" className="text-white hover:opacity-90">Terms</a></li>
              <li><a href="#" className="text-white hover:opacity-90">Privacy</a></li>
              <li><a href="#" className="text-white hover:opacity-90">Cookies</a></li>
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
      <h5 className="text-sm font-semibold tracking-wide text-white">{title}</h5>
      <ul className="mt-3 space-y-2">
        {links.map((text) => (
          <li key={text}>
            {/* Force white (not black), normal size */}
            <a href="#" className="text-white hover:opacity-90">
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
    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
