import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { 
  Menu, X, ChevronDown, LogOut, LayoutDashboard, 
  Plane, Building, User, CreditCard, MapPin 
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import logo from "/assets/img/logo/flygasal.png";
import { Link } from "react-router-dom";

/* ---------------- Mock Context ---------------- */
const useAuth = () => {
  // Toggle this state to see logged-in behavior
  const [user, setUser] = useState({ 
    name: "Ali Gasal", 
    role: "agent", 
    avatar_url: null 
  });
  
  return {
    user,
    logout: async () => setUser(null),
    loading: false
  };
};

// Mock Hooks
const useLocation = () => ({ pathname: "/" }); // Change to "/dashboard" to test spacer behavior
const useNavigate = () => (path) => console.log("Navigating to", path);

/* ---------------- Assets ---------------- */
// Replaced local import with a placeholder for preview purposes
const LOGO_URL = "https://placehold.co/140x40/transparent/orange?text=FlyGasal";
const US_FLAG = "https://flagcdn.com/w40/us.png";

/* ---------------- Navbar Component ---------------- */
export default function Navbar() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef(null);

  // 2. Smart Logic: Only Home page is "Hero" style (transparent). Others get a solid/glass bg immediately.
  const isHome = location.pathname === "/"; 
  
  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (acctRef.current && !acctRef.current.contains(event.target)) {
        setAcctOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = [
    { to: "/", label: "Flights", icon: <Plane size={16} /> },
    { to: "/hotel/availability", label: "Hotels", icon: <Building size={16} /> },
  ];

  const accountOptions = user
    ? [
        { label: "Dashboard", to: user.role === "admin" ? "/admin" : "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "My Bookings", to: "/bookings", icon: <MapPin size={16} /> },
        { label: "Deposits", to: "/deposits", icon: <CreditCard size={16} /> },
      ]
    : [
        { label: "Sign In", to: "/login" },
        { label: "Register", to: "/signup" },
      ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setAcctOpen(false);
  };

  // 3. Dynamic Styles
  // If it's NOT home, or if we scrolled, show the glass background.
  const showBackground = !isHome || isScrolled;

  const headerClasses = `
    top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out
    ${showBackground 
      ? "bg-white/90 backdrop-blur-lg shadow-sm border-b border-slate-200/50 py-2" 
      : "bg-transparent py-2"
    }
  `;

  return (
    <>
      <header className={headerClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            
            {/* --- Logo --- */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="group transition-transform active:scale-95 flex items-center gap-2">
                <img src={logo} alt="FlyGasal" className="h-8 w-auto transition-transform group-hover:scale-[1.02]" />
              </Link>
            </div>

            {/* --- Desktop Navigation --- */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/60 p-1 rounded-full border border-slate-200/50 backdrop-blur-md mx-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* --- Right Actions --- */}
            <div className="hidden lg:flex items-center gap-4">
              
              {/* Currency Pill */}
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                showBackground 
                  ? 'bg-slate-50 border-slate-200 text-slate-700' 
                  : 'bg-white/80 border-white/40 text-slate-900 backdrop-blur-sm'
              }`}>
                <div className="flex items-center gap-1.5 border-r border-slate-300/50 pr-3">
                  <img src={US_FLAG} alt="US" className="w-4 h-auto rounded-[2px] shadow-sm" />
                  <span>EN</span>
                </div>
                <span>USD</span>
              </div>

              {/* User Menu */}
              {user ? (
                <div className="relative" ref={acctRef}>
                  <button
                    onClick={() => setAcctOpen(!acctOpen)}
                    className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-200 focus:ring-2 focus:ring-orange-100 ${
                      showBackground
                        ? 'bg-white border-slate-200 hover:border-orange-200' 
                        : 'bg-white/90 border-white/50 hover:bg-white'
                    }`}
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full bg-slate-100 object-cover border border-white shadow-sm"
                    />
                    <div className="text-left hidden xl:block">
                        <p className="text-xs font-bold text-slate-800 leading-none mb-0.5">{user.name.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-500 leading-none uppercase font-medium tracking-wide">Agent</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${acctOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {acctOpen && (
                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                      <div className="px-5 py-3 border-b border-slate-50 mb-1">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">agent@flygasal.com</p>
                      </div>
                      
                      <div className="px-2">
                        {accountOptions.map((opt) => (
                          <Link
                            key={opt.label}
                            to={opt.to}
                            onClick={() => setAcctOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-700 transition-colors"
                          >
                            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                {opt.icon}
                            </span>
                            {opt.label}
                          </Link>
                        ))}
                      </div>
                      
                      <div className="border-t border-slate-50 mt-2 pt-2 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors text-left"
                        >
                          <span className="p-1.5 bg-red-50 rounded-lg text-red-500">
                            <LogOut size={16} />
                          </span>
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/login" 
                    className={`text-sm font-bold px-5 py-2.5 rounded-full transition-colors ${
                      showBackground ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' : 'text-slate-800 hover:bg-white/20'
                    }`}
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-slate-900 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* --- Mobile Toggle --- */}
            <div className="flex lg:hidden items-center gap-3">
               {user && (
                 <Link to="/dashboard" className="block lg:hidden">
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                    />
                 </Link>
               )}
              <button
                onClick={() => setMobileOpen(true)}
                className={`p-2.5 rounded-full transition-colors ${
                    showBackground ? 'text-slate-900 hover:bg-slate-100' : 'text-slate-900 bg-white/80 backdrop-blur-sm shadow-sm'
                }`}
              >
                <Menu size={24} strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 4. SPACER: 
        This div pushes content down ONLY on non-home pages so content doesn't go under the fixed navbar.
        On the Home page (Hero), it is hidden so the transparent navbar sits ON TOP of the image.
      */}
      {!isHome && <div className="h-20" aria-hidden="true" />}

      {/* --- Mobile Drawer --- */}
      <div 
        className={`fixed inset-0 z-[150] lg:hidden pointer-events-none ${mobileOpen ? 'pointer-events-auto' : ''}`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div 
          className={`absolute inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="font-bold text-lg text-slate-900">Menu</span>
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Mobile Links */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 text-base font-semibold rounded-2xl transition-colors ${
                    location.pathname === link.to 
                        ? "bg-orange-50 text-orange-700" 
                        : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {/* Colored Icon Box */}
                  <div className={`p-2 rounded-xl ${
                      location.pathname === link.to ? "bg-white text-orange-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    {link.icon}
                  </div>
                  {link.label}
                </Link>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Mobile Account */}
            <div className="space-y-1">
              {accountOptions.map((opt) => (
                <Link
                  key={opt.label}
                  to={opt.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 text-base font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-500 shadow-sm">
                    {opt.icon || <User size={18}/>}
                  </div>
                  {opt.label}
                </Link>
              ))}
              
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 text-base font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors text-left mt-2"
                >
                  <div className="p-1.5 bg-red-50 rounded-lg text-red-500">
                    <LogOut size={18} />
                  </div>
                  Log Out
                </button>
              )}
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50">
             <div className="flex items-center justify-center gap-4 text-sm font-semibold text-slate-600 bg-white py-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <img src={US_FLAG} alt="US" className="w-5 rounded shadow-sm" />
                  <span>English</span>
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <span>USD ($)</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}