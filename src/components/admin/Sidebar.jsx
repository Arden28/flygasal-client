import { Link, NavLink, useLocation } from "react-router-dom";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { FaMoneyCheck } from "react-icons/fa";
import { Ticket } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

/* ============ Helpers ============ */
const cx = (...classes) => classes.filter(Boolean).join(" ");
const getInitials = (name) =>
  (name || "User")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* Media query hook to know when we're on desktop (md+) */
const useMediaQuery = (query) => {
  const getMatch = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [query]);

  return matches;
};

/* ============ Example defaults (optional) ============ */
export const defaultNavItems = [
  { name: "Dashboard", path: "/admin", icon: HomeIcon },
  { name: "Users", path: "/admin/users", icon: UsersIcon },
  { name: "Bookings", path: "/admin/flights/bookings", icon: Ticket, badge: "12" },
  { divider: true },
  { section: "Finance" },
  { name: "Transactions", path: "/admin/transactions", icon: FaMoneyCheck },
  { section: "System" },
  {
    name: "Settings",
    path: "/admin",
    icon: CogIcon,
    subItems: [
      { name: "General Settings", path: "/admin/settings" },
      { name: "User Roles", path: "/admin/settings/user-roles", badge: "New" },
    ],
  },
];

export default function Sidebar({
  isOpen,
  toggleSidebar,
  setIsSidebarOpen,
  navItems = defaultNavItems,
  logoUrl = "/assets/img/logo/flygasal.png",
  rootUrl = "/",
  userName = "Arden Bouet",
  userEmail = "arden@company.com",
  onLogout,
  onThemeToggle,
}) {
  const { user, logout, loading } = useContext(AuthContext);

  userName = user ? user.name : 'Guest';
  userEmail = user ? user.eamil : 'guest@example.com';

  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)"); // md
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar:collapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  // collapse is desktop-only; on mobile, we force expanded
  const sidebarCollapsed = isDesktop ? collapsed : false;

  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Auto-open the dropdown that contains the active route
  useEffect(() => {
    const activeParents = {};
    navItems.forEach((item) => {
      if (item && item.subItems && item.subItems.length) {
        const active = item.subItems.some((s) =>
          location.pathname.startsWith(s.path)
        );
        if (active && item.name) activeParents[item.name] = true;
      }
    });
    setOpenDropdowns((prev) => ({ ...prev, ...activeParents }));
  }, [location.pathname, navItems]);

  const toggleDropdown = (name) => {
    if (!name) return;
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isSubRouteActive = (subs) =>
    subs?.some((s) => location.pathname.startsWith(s.path));

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return navItems;
    const q = query.toLowerCase();
    return navItems
      .map((item) => {
        if (item.section || item.divider) return item;
        const matchesSelf =
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.path && item.path.toLowerCase().includes(q));
        const filteredSubs = item.subItems?.filter(
          (s) =>
            s.name.toLowerCase().includes(q) || s.path.toLowerCase().includes(q)
        );
        if (matchesSelf || (filteredSubs && filteredSubs.length)) {
          return {
            ...item,
            subItems:
              filteredSubs && filteredSubs.length ? filteredSubs : item.subItems,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [navItems, query]);

  // Close on Esc (mobile) & focus search with '/' (desktop)
  const asideRef = useRef(null);
  useEffect(() => {
    const handleKey = (e) => {
      if (isOpen && e.key === "Escape") {
        toggleSidebar();
      }
      if (!sidebarCollapsed && e.key === "/" && isDesktop) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, isDesktop, sidebarCollapsed, toggleSidebar]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (!isDesktop) {
      document.body.style.overflow = isOpen ? "hidden" : "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, isOpen]);

  const ItemBadge = ({ badge }) =>
    badge ? (
      <span
        className={cx(
          "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
          typeof badge === "string"
            ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/30"
            : "bg-white/10 text-white"
        )}
      >
        {badge}
      </span>
    ) : null;

  // Width: 18rem (w-72) on mobile; desktop can collapse to 76px
  const widthClass = sidebarCollapsed ? "w-72 md:w-[76px]" : "w-72";

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={cx(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      <aside
        ref={asideRef}
        className={cx(
          // Fixed to viewport; independent from page content
          "fixed md:static z-50 inset-y-0 left-0",
          "h-screen overscroll-contain",                // lock to viewport height
          "flex flex-col overflow-hidden",               // internal scroll only
          widthClass,
          "md:translate-x-0 transform transition-transform duration-300 ease-in-out motion-reduce:transition-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Colors
          "bg-[#101827] text-white",
          "border-r border-white/10 supports-[backdrop-filter]:bg-[#101827]/95 supports-[backdrop-filter]:backdrop-blur-xl"
        )}
        role="navigation"
        aria-label="Sidebar"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-[#101827]/90 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-3">
            <button
              className="md:hidden inline-flex p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <Link
              to={rootUrl}
              className="flex items-center gap-3 min-w-0"
              onClick={() => setIsSidebarOpen(false)}
              title="Home"
            >
              {!sidebarCollapsed ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
              ) : (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-cover rounded" />
              )}
              {/* {!sidebarCollapsed && <span className="truncate font-semibold">FlyGasal Admin</span>} */}
            </Link>

            <div className="ml-auto flex items-center gap-1">
              {/* Collapse is desktop-only; hidden on mobile */}
              <button
                className="hidden md:inline-flex p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search (white bg, dark text) — hidden when collapsed */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-3">
              <label className="sr-only" htmlFor="sidebar-search">Search navigation</label>
              <div className="relative">
                <input
                  id="sidebar-search"
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-500 pl-3 pr-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Nav Area (takes remaining height) */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ul role="menu" className="space-y-1">
            {filteredItems.map((item, idx) => {
              if (item.divider) {
                return <li key={`div-${idx}`} className="my-2 h-px bg-white/10" />;
              }
              if (item.section) {
                return (
                  <li key={`sec-${item.section}`} className={cx("px-3 pt-4", idx === 0 && "pt-1")}>
                    {!sidebarCollapsed && (
                      <div className="text-[11px] uppercase tracking-wider text-white/60">
                        {item.section}
                      </div>
                    )}
                  </li>
                );
              }

              const isActive =
                (item.path && location.pathname === item.path) ||
                isSubRouteActive(item.subItems);

              // leaf
              if (!item.subItems?.length) {
                const Inner = (
                  <>
                    {/* left active indicator bar */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded transition-colors",
                        isActive ? "bg-white/60" : "bg-transparent"
                      )}
                    />
                    {item.icon && <item.icon className="h-5 w-5 shrink-0 text-white" />}
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate text-white">{item.name}</span>
                        <ItemBadge badge={item.badge} />
                      </>
                    )}
                  </>
                );

                return (
                  <li key={item.name} role="none" className="relative">
                    {item.external ? (
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noreferrer"
                        className={cx(
                          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm ring-1 ring-transparent transition-colors motion-reduce:transition-none",
                          isActive
                            ? "bg-white/10 text-white ring-white/10"
                            : " text-white hover:text-white hover:bg-white/10"
                        )}
                        title={sidebarCollapsed ? item.name : undefined}
                        role="menuitem"
                      >
                        {Inner}
                      </a>
                    ) : (
                      <NavLink
                        to={item.path || "#"}
                        className={({ isActive: exact }) =>
                          cx(
                            "group flex items-center gap-3 text-white rounded-xl px-3 py-2 text-sm ring-1 ring-transparent transition-colors motion-reduce:transition-none",
                            (isActive || exact)
                              ? "bg-white/10 text-white ring-white/10"
                              : " text-white hover:text-white hover:bg-white/10"
                          )
                        }
                        onClick={() => setIsSidebarOpen(false)}
                        title={sidebarCollapsed ? item.name : undefined}
                        role="menuitem"
                        aria-current={isActive ? "page" : undefined}
                      >
                        {Inner}
                      </NavLink>
                    )}
                  </li>
                );
              }

              // group
              const groupOpen = openDropdowns[item.name] ?? isActive;

              return (
                <li key={item.name} className="relative">
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={cx(
                      "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ring-1 ring-transparent motion-reduce:transition-none",
                      isActive
                        ? "bg-white/10 text-white ring-white/10"
                        : " text-white hover:text-white hover:bg-white/10"
                    )}
                    aria-expanded={groupOpen}
                    aria-controls={`group-${item.name}`}
                    title={sidebarCollapsed ? item.name : undefined}
                    role="menuitem"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded transition-colors",
                        isActive ? "bg-white/60" : "bg-transparent"
                      )}
                    />
                    {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate">{item.name}</span>
                        <ItemBadge badge={item.badge} />
                        <ChevronDownIcon
                          className={cx(
                            "h-4 w-4 ml-auto transition-transform motion-reduce:transition-none",
                            groupOpen && "rotate-180"
                          )}
                        />
                      </>
                    )}
                  </button>

                  <div
                    id={`group-${item.name}`}
                    className={cx(
                      "grid overflow-hidden transition-all motion-reduce:transition-none",
                      sidebarCollapsed
                        ? "grid-rows-[0fr]"
                        : groupOpen
                        ? "grid-rows-[1fr] mt-1"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <ul className="min-h-0 space-y-1 pl-10 pr-3" role="menu">
                      {!sidebarCollapsed &&
                        item.subItems.map((sub) => {
                          const subActive = location.pathname === sub.path;
                          return (
                            <li key={sub.name} role="none">
                              <NavLink
                                to={sub.path}
                                className={({ isActive: exact }) =>
                                  cx(
                                    "flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] ring-1 ring-transparent transition-colors motion-reduce:transition-none",
                                    (subActive || exact)
                                      ? "bg-white/10 text-white ring-white/10"
                                      : " text-white hover:text-white hover:bg-white/10"
                                  )
                                }
                                onClick={() => setIsSidebarOpen(false)}
                                role="menuitem"
                                aria-current={subActive ? "page" : undefined}
                              >
                                <span className="truncate">{sub.name}</span>
                                <ItemBadge badge={sub.badge} />
                              </NavLink>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sticky Footer — always visible; compact when collapsed */}
        <div className="sticky bottom-0 z-20 bg-[#101827]/90 backdrop-blur-sm border-t border-white/10">
          <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div
              className={cx(
                "flex items-center rounded-xl px-3 py-2 bg-white/[0.03] ring-1 ring-white/10",
                sidebarCollapsed ? "justify-center gap-2" : "gap-3"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
                {getInitials(userName)}
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{userName}</div>
                  <div className="truncate text-[12px] text-white/70">{userEmail}</div>
                </div>
              )}

              <div className={cx("ml-auto flex", sidebarCollapsed ? "flex-col gap-1" : "flex-row gap-1")}>
                {onThemeToggle && (
                  <button
                    onClick={onThemeToggle}
                    className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
                    title="Toggle theme"
                    aria-label="Toggle theme"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      path: PropTypes.string,
      icon: PropTypes.any,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      external: PropTypes.bool,
      section: PropTypes.string,
      divider: PropTypes.bool,
      subItems: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          path: PropTypes.string.isRequired,
          badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
      ),
    })
  ),
  logoUrl: PropTypes.string,
  rootUrl: PropTypes.string,
  userName: PropTypes.string,
  userEmail: PropTypes.string,
  onLogout: PropTypes.func,
  onThemeToggle: PropTypes.func,
};
