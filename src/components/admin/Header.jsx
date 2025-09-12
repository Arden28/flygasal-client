// src/components/admin/Header.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  BellIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { AuthContext } from "../../context/AuthContext";

/* Helpers */
const cx = (...c) => c.filter(Boolean).join(" ");
const getInitials = (name = "User") =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function useOnClickOutside(refs, handler) {
  useEffect(() => {
    const listener = (e) => {
      const arr = Array.isArray(refs) ? refs : [refs];
      if (arr.some((r) => r?.current && r.current.contains(e.target))) return;
      handler(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]);
}

export default function Header({
  toggleSidebar,
  onThemeToggle,           // optional
  setCurrentView = () => {}, // compatibility
  onSearch,                // optional: (q) => void
  logoUrl = "/assets/img/logo/flygasal.png",
  brandName = "FlyGasal Admin",
}) {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // menus
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [kbdOpen, setKbdOpen] = useState(false);

  // search palette
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const createRef = useRef(null);
  const paletteRef = useRef(null);
  const searchRef = useRef(null);

  useOnClickOutside([profileRef, notifRef, createRef], () => {
    setProfileOpen(false);
    setNotifOpen(false);
    setCreateOpen(false);
  });

  // Close search palette on outside click
  useOnClickOutside([paletteRef], () => setSearchOpen(false));

  // Hotkeys
  useEffect(() => {
    const onKey = (e) => {
      // open/focus palette
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSearchOpen(true);
        // focus after opening
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      // toggle shortcuts
      if ((e.key === "?" || (e.key === "/" && e.shiftKey)) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setKbdOpen((v) => !v);
      }
      // close everything with Esc
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false);
        setCreateOpen(false);
        setKbdOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when search palette open (mobile nicety)
  useEffect(() => {
    if (searchOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [searchOpen]);

  // Breadcrumbs
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    return { label, path };
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/admin/login");
    } catch {
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const submitSearch = (e) => {
    e?.preventDefault?.();
    const q = query.trim();
    if (!q) return;
    if (onSearch) onSearch(q);
    setSearchOpen(false);
  };

  const notifications = [
    // { id: "1", title: "New booking", note: "Ref #FG-2391", time: "2m" },
    // { id: "2", title: "Payment received", note: "USD 420.00", time: "1h" },
  ];

  return (
    <>
      {/* Sticky header */}
      <header
        className={cx(
          "sticky top-0 z-30",
          "bg-white/80 backdrop-blur border-b border-gray-200"
        )}
        aria-label="Top navigation"
      >
        <div className="h-16 px-3 sm:px-4 flex items-center gap-3">
          {/* Sidebar toggle (mobile) */}
          <button
            onClick={toggleSidebar}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo + brand */}
          <Link to="/admin" className="shrink-0 flex items-center gap-2" title="Home">
            <img src={logoUrl} alt="FlyGasal Logo" className="h-8 w-auto object-contain rounded" />
            {/* <span className="hidden sm:block text-sm font-semibold text-gray-900">
              {brandName}
            </span> */}
          </Link>

          {/* Left: breadcrumbs / mobile title */}
          <div className="min-w-0 flex-1">
            <nav className="hidden md:flex items-center text-sm text-gray-500 gap-2">
              <Link to="/admin" className="hover:text-gray-900">Home</Link>
              {crumbs.map((c, i) => (
                <React.Fragment key={c.path}>
                  <span className="text-gray-300">/</span>
                  {i < crumbs.length - 1 ? (
                    <Link to={c.path} className="truncate max-w-[12rem] hover:text-gray-900">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate max-w-[12rem] text-gray-900 font-medium">
                      {c.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <div className="md:hidden text-base font-semibold text-gray-900 truncate">
              {crumbs.length ? crumbs[crumbs.length - 1].label : "Dashboard"}
            </div>
          </div>

          {/* Actions cluster */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search icon only (opens palette) */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => searchRef.current?.focus(), 0);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Open search"
              title="Search (/)"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Create */}
            <div className="relative" ref={createRef}>
              <button
                onClick={() => setCreateOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-haspopup="menu"
                aria-expanded={createOpen}
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden sm:inline">New</span>
              </button>
              {createOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden z-40" role="menu">
                  <button
                    onClick={() => {
                      setCreateOpen(false);
                      navigate("/admin/flights/bookings/new");
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    role="menuitem"
                  >
                    New Booking
                  </button>
                  <button
                    onClick={() => {
                      setCreateOpen(false);
                      navigate("/admin/users/new");
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    role="menuitem"
                  >
                    New User
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-haspopup="menu"
                aria-expanded={notifOpen}
                aria-label="Notifications"
                title="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden z-40">
                  <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">Notifications</div>
                  <ul className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-500">{n.note}</div>
                        <div className="text-[11px] text-gray-400 mt-1">{n.time} ago</div>
                      </li>
                    ))}
                    {notifications.length === 0 && (
                      <li className="px-4 py-6 text-sm text-gray-500">You are all caught up.</li>
                    )}
                  </ul>
                  <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
                    <button className="text-xs text-gray-600 hover:text-gray-900" onClick={() => setNotifOpen(false)}>
                      Close
                    </button>
                    <button
                      className="text-xs font-medium text-gray-700 hover:text-gray-900"
                      onClick={() => {
                        // mark all as read hook
                        setNotifOpen(false);
                      }}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shortcuts */}
            <button
              onClick={() => setKbdOpen((v) => !v)}
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Account menu"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold text-gray-700">
                  {getInitials(user?.name)}
                </div>
                <span className="hidden md:inline text-sm font-medium truncate max-w-[10rem]">
                  {user?.name || "Guest"}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden z-40" role="menu">
                  {!loading && user && (
                    <>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/admin/profile");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        role="menuitem"
                      >
                        <UserCircleIcon className="h-5 w-5 text-gray-500" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/admin/settings");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        role="menuitem"
                      >
                        <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                        Settings
                      </button>
                      <div className="my-1 border-t" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-gray-50"
                        role="menuitem"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </>
                  )}
                  {(!user || loading) && (
                    <div className="px-4 py-3 text-sm text-gray-500">Not signed in</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Command-palette style Search (click icon or press "/") */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6"
          aria-modal="true"
          role="dialog"
          aria-label="Global search"
          onClick={() => setSearchOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            ref={paletteRef}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <form onSubmit={submitSearch} className="relative p-3 sm:p-4 border-b">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bookings, users, transactions..."
                className="w-full h-12 rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-500 pl-11 pr-12 outline-none ring-1 ring-gray-200 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
                aria-label="Close search"
              >
                Esc
              </button>
            </form>

            {/* Suggestions / results hint */}
            <div className="p-3 sm:p-4">
              {query.trim() === "" ? (
                <div className="grid gap-2 text-sm text-gray-700">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Quick actions
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        navigate("/admin/flights/bookings/new");
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      Create new booking
                    </button>
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        navigate("/admin/users/new");
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      Add new user
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    Tip: Press <kbd className="rounded bg-gray-100 px-1">/</kbd> to open,{" "}
                    <kbd className="rounded bg-gray-100 px-1">Enter</kbd> to search,{" "}
                    <kbd className="rounded bg-gray-100 px-1">Esc</kbd> to close.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Press <strong>Enter</strong> to search for “{query}”.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {kbdOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onClick={() => setKbdOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b">
              <div className="text-base font-semibold text-gray-900">Keyboard shortcuts</div>
              <div className="text-sm text-gray-500">Press Esc to close</div>
            </div>
            <div className="p-5 grid gap-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Open search</span>
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Toggle sidebar (mobile)</span>
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Menu</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Open shortcuts</span>
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Shift + /</kbd>
              </div>
            </div>
            <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setKbdOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
