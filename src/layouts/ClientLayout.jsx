import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import { AuthContext } from "../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";
import Navbar from "../components/client/Navbar";

// Brand color
const ORANGE = "#F68221";

export default function ClientLayout() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [acctOpen, setAcctOpen] = useState(false);

  // 1. Routes that don't use the standard layout wrapper (No Navbar/Footer)
  const noLayoutPatterns = [
    /^\/flight\/availability$/, // Optional: Remove this line if you WANT Navbar on availability page
    /^\/flight\/booking-confirmation$/,
    /^\/flight\/booking\/details$/,
    /^\/flight\/booking\/invoice\/[^/]+$/,
    /^\/flights\/invoice\/[^/]+$/,
  ];
  const isNoLayout = noLayoutPatterns.some((pattern) => pattern.test(location.pathname));

  // 2. REDIRECT LOGIC
  useEffect(() => {
    // === PUBLIC ROUTES (Guests Allowed) ===
    const publicPaths = [
      "/",                    // Home
      "/about",               // About
      // "/flight/availability", // Flight Search Results
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/signup-success"
    ];

    const isPublic = publicPaths.includes(location.pathname);

    // If not loading, not logged in, and NOT a public path -> Go to Login
    if (!loading && !user && !isPublic) {
      navigate("/login");
    }

    // If logged in but account inactive -> Go to Success/Pending page
    if (!loading && user && user.is_active === 0 && location.pathname !== "/signup-success") {
      navigate("/signup-success");
    }
  }, [loading, user, navigate, location.pathname]);

  // Close menus on route change
  useEffect(() => {
    setAcctOpen(false);
  }, [location.pathname]);

  // Esc to close menu
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setAcctOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside to close menu
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
    try {
      await logout();
      navigate("/login");
    } catch {
      alert("Failed to log out. Please try again.");
    }
  };

  if (isNoLayout) return <Outlet />;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* --- NAVBAR --- */}
      <Navbar />

      <SpinnerOrbit />
      
      {/* Main Content */}
      <main className="w-full">
        <Outlet />
      </main>

      {/* --- LIGHT MODERN FOOTER --- */}
      <footer className="mt-auto border-t border-gray-100 bg-gray-50 text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Newsletter Section - White Card Style */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  Stay in the loop
                </div>
                <h4 className="mt-4 text-2xl font-bold leading-tight text-slate-900">
                  Exclusive flight tips, fare drops & product updates.
                </h4>
                <p className="mt-2 text-slate-500">
                  No spam. Just useful stuff from Fly Gasal, unsubscribe anytime.
                </p>
              </div>

              <form
                className="w-full max-w-md"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1.5 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100 transition-all">
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    className="w-full rounded-full bg-transparent px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-md shadow-orange-200"
                    style={{ backgroundColor: ORANGE }}
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-3 ml-2 text-[12px] text-slate-400">
                  By subscribing you agree to our Terms &amp; Privacy.
                </p>
              </form>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-16 grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="FlyGasal" className="h-9 w-auto" />
              </Link>
              <p className="text-sm leading-relaxed text-slate-500">
                Your one stop travel solutions. Simple, flexible, and reliable for every journey.
              </p>
            </div>

            <FooterColumn title="Book with us" links={["Search & book", "Multi-city search", "Flight status"]} />
            <FooterColumn title="My booking" links={["Manage my booking", "Check-in", "Help centre"]} />
            <FooterColumn title="Company" links={["About us", "Reviews", "Blog", "Careers"]} />
          </div>

          {/* Bottom bar */}
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 text-sm md:flex-row">
            <div className="flex items-center gap-1 text-slate-500">
              <span>© {new Date().getFullYear()} Fly Gasal.</span>
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>
            <ul className="flex items-center gap-6">
              <li><a href="#" className="font-medium text-slate-500 hover:text-[#F68221] transition-colors">Terms</a></li>
              <li><a href="#" className="font-medium text-slate-500 hover:text-[#F68221] transition-colors">Privacy</a></li>
              <li><a href="#" className="font-medium text-slate-500 hover:text-[#F68221] transition-colors">Cookies</a></li>
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
      <h5 className="font-semibold tracking-wide text-slate-900">{title}</h5>
      <ul className="mt-4 space-y-3">
        {links.map((text) => (
          <li key={text}>
            <a href="#" className="text-sm text-slate-500 hover:text-[#F68221] transition-colors duration-200">
              {text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}