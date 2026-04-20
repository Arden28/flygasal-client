import { NavLink, useLocation, Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import {
  HomeIcon, UsersIcon, Cog6ToothIcon, ChevronDownIcon, 
  XMarkIcon, ArrowRightOnRectangleIcon, BanknotesIcon, 
  TicketIcon, ChartBarIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon
} from "@heroicons/react/24/outline";
import { AuthContext } from "../../context/AuthContext";

// Default Navigation
const defaultNavItems = [
  { section: "Overview" },
  { name: "Dashboard", path: "/admin", icon: HomeIcon },
  { name: "Bookings", path: "/admin/flights/bookings", icon: TicketIcon },
  { name: "Transactions", path: "/admin/transactions", icon: BanknotesIcon },
  
  { section: "Management" },
  { name: "Users", path: "/admin/users", icon: UsersIcon },
  
  { section: "System" },
  { name: "Settings", path: "/admin/settings", icon: Cog6ToothIcon },
//   { name: "Reports", path: "/admin/reports", icon: ChartBarIcon },
];

export default function Sidebar({
  isOpen,
  toggleSidebar,
  navItems = defaultNavItems,
  logoUrl = "/assets/img/logo/flygasal.png",
}) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  // Desktop Collapsed State (Persisted)
  const [collapsed, setCollapsed] = useState(() => {
     const saved = localStorage.getItem("sidebar:collapsed");
     return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
     localStorage.setItem("sidebar:collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Smart Active Route Check
  const checkActive = (itemPath, subItems) => {
    if (subItems?.some(s => location.pathname.startsWith(s.path))) return true;
    if (itemPath === "/admin") return location.pathname === "/admin";
    return itemPath ? location.pathname.startsWith(itemPath) : false;
  };

  // Auto-open dropdowns
  useEffect(() => {
    const active = {};
    navItems.forEach(item => {
      if (item.subItems?.some(s => location.pathname.startsWith(s.path))) {
        active[item.name] = true;
      }
    });
    setOpenDropdowns(prev => ({ ...prev, ...active }));
  }, [location.pathname, navItems]);

  const toggleDropdown = (name) => setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <>
      {/* Mobile Backdrop - Enhanced Blur */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 md:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        onClick={toggleSidebar} 
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static z-50 inset-y-0 left-0 flex flex-col border-r border-slate-200/80 bg-white
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0 md:shadow-none"}
          ${collapsed ? "w-[80px]" : "w-72"}
        `}
      >
        {/* 1. Header */}
        <div className={`h-20 flex items-center border-b border-slate-100/80 shrink-0 transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
           <Link to="/admin" className="flex items-center gap-3 overflow-hidden group">
              {!collapsed ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
              ) : (
                <div className="h-10 w-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                    <img src={logoUrl} alt="Logo" className="h-6 w-6 object-cover" />
                </div>
              )}
           </Link>
           <button onClick={toggleSidebar} className="md:hidden ml-auto p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <XMarkIcon className="h-5 w-5" />
           </button>
        </div>

        {/* 2. Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
           {navItems.map((item, i) => {
              
              // Section Header
              if (item.section) {
                 if (collapsed) return <div key={i} className="h-px bg-slate-100 my-4 mx-2" />;
                 return (
                    <div key={i} className="px-3 mt-8 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-opacity duration-300">
                       {item.section}
                    </div>
                 );
              }

              const isActive = checkActive(item.path, item.subItems);
              const hasSubs = item.subItems?.length > 0;

              // Dropdown Item
              if (hasSubs) {
                 const isOpen = openDropdowns[item.name];
                 return (
                    <div key={item.name} className="relative group">
                       <button
                          onClick={() => !collapsed && toggleDropdown(item.name)}
                          className={`
                             w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                             ${isActive ? 'text-[#EB7313] bg-[#FFF7ED]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                             ${collapsed ? 'justify-center' : ''}
                          `}
                       >
                          <div className="flex items-center gap-3">
                             <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#EB7313]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                             {!collapsed && <span className="truncate">{item.name}</span>}
                          </div>
                          {!collapsed && <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-[#EB7313]' : 'text-slate-400'}`} />}
                       </button>
                       
                       {/* Custom Tooltip for Collapsed State */}
                       {collapsed && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-xl">
                             {item.name}
                             <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[6px] border-transparent border-r-slate-800"></div>
                          </div>
                       )}
                       
                       {/* Sub Items */}
                       {!collapsed && (
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                             {item.subItems.map(sub => {
                                const isSubActive = location.pathname === sub.path;
                                return (
                                   <NavLink 
                                      key={sub.path} 
                                      to={sub.path}
                                      className={`
                                         flex items-center pl-11 pr-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 my-0.5
                                         ${isSubActive ? 'text-[#EB7313] bg-white shadow-sm ring-1 ring-slate-100/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'}
                                      `}
                                   >
                                      {sub.name}
                                   </NavLink>
                                );
                             })}
                          </div>
                       )}
                    </div>
                 );
              }

              // Single Item
              return (
                 <NavLink
                    key={item.path}
                    to={item.path}
                    className={`
                       relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                       ${isActive ? 'text-[#EB7313] bg-[#FFF7ED]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                       ${collapsed ? 'justify-center' : ''}
                    `}
                 >
                    {/* Active Edge Indicator */}
                    {isActive && (
                       <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#EB7313] shadow-[0_0_8px_rgba(235,115,19,0.4)]" />
                    )}

                    <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#EB7313]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                    
                    {/* Badge */}
                    {!collapsed && item.badge && (
                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${isActive ? 'bg-[#EB7313] text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {item.badge}
                       </span>
                    )}

                    {/* Custom Tooltip for Collapsed State */}
                    {collapsed && (
                       <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-xl">
                          {item.name}
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[6px] border-transparent border-r-slate-800"></div>
                       </div>
                    )}
                 </NavLink>
              );
           })}
        </nav>

        {/* 3. Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
           
           {/* User Profile / Logout */}
           <div className={`flex ${collapsed ? 'flex-col items-center justify-center gap-4' : 'items-center gap-3'}`}>
              <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-[#EB7313] shadow-sm shrink-0">
                 {user?.name?.[0] || "A"}
              </div>
              
              {!collapsed && (
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Admin"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                 </div>
              )}
              
              <button 
                onClick={logout} 
                className={`text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-lg ${collapsed ? 'p-2.5 bg-white border border-slate-200 shadow-sm' : 'p-2'}`} 
                title="Logout"
              >
                 <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
           </div>

           {/* Desktop Collapse Button */}
           <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex w-full mt-4 items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
           >
              {collapsed ? <ChevronDoubleRightIcon className="h-4 w-4" /> : <ChevronDoubleLeftIcon className="h-4 w-4" />}
           </button>
        </div>
      </aside>
    </>
  );
}