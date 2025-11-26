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

  // --- FIX: Smart Active Route Check ---
  // This prevents "Dashboard" (/admin) from being active when on "/admin/users"
  const checkActive = (itemPath, subItems) => {
    // 1. Check if any sub-item is active
    if (subItems?.some(s => location.pathname.startsWith(s.path))) return true;
    
    // 2. Strict check for Root Admin path
    if (itemPath === "/admin") return location.pathname === "/admin";
    
    // 3. Standard prefix check for other paths (e.g. /admin/users matches /admin/users/new)
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
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        onClick={toggleSidebar} 
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static z-50 inset-y-0 left-0 flex flex-col border-r border-slate-200 bg-white
          transform transition-all duration-300 ease-out shadow-xl md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "w-[80px]" : "w-72"}
        `}
      >
        {/* 1. Header */}
        <div className={`h-20 flex items-center border-b border-slate-100 shrink-0 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
           <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
              {!collapsed ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
              ) : (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-cover rounded" />
              )}
           </Link>
           <button onClick={toggleSidebar} className="md:hidden ml-auto text-slate-400 hover:text-slate-600">
              <XMarkIcon className="h-6 w-6" />
           </button>
        </div>

        {/* 2. Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
           {navItems.map((item, i) => {
              
              // Section Header
              if (item.section) {
                 if (collapsed) return <div key={i} className="h-px bg-slate-100 my-4 mx-2" />;
                 return (
                    <div key={i} className="px-3 mt-6 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-opacity duration-300">
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
                    <div key={item.name}>
                       <button
                          onClick={() => !collapsed && toggleDropdown(item.name)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                             ${isActive 
                                ? 'text-[#EB7313] bg-[#EB7313]/5' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                             }
                             ${collapsed ? 'justify-center' : ''}
                          `}
                          title={collapsed ? item.name : ""}
                       >
                          <div className="flex items-center gap-3">
                             <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#EB7313]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                             {!collapsed && <span className="truncate">{item.name}</span>}
                          </div>
                          {!collapsed && <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-[#EB7313]' : 'text-slate-400'}`} />}
                       </button>
                       
                       {/* Sub Items */}
                       {!collapsed && (
                          <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-1' : 'max-h-0'}`}>
                             {item.subItems.map(sub => {
                                const isSubActive = location.pathname === sub.path;
                                return (
                                   <NavLink 
                                      key={sub.path} 
                                      to={sub.path}
                                      className={`
                                         flex items-center pl-11 pr-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                                         ${isSubActive 
                                            ? 'text-[#EB7313] bg-white shadow-sm ring-1 ring-slate-100' 
                                            : 'text-slate-500 hover:text-slate-800'
                                         }
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
                       ${isActive 
                          ? 'text-[#EB7313] bg-[#EB7313]/5 shadow-sm ring-1 ring-[#EB7313]/10' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                       }
                       ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? item.name : ""}
                 >
                    <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#EB7313]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                    
                    {/* Badge */}
                    {!collapsed && item.badge && (
                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isActive ? 'bg-[#EB7313] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {item.badge}
                       </span>
                    )}

                    {/* Collapsed Indicator Line */}
                    {collapsed && isActive && (
                       <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-[#EB7313]" />
                    )}
                 </NavLink>
              );
           })}
        </nav>

        {/* 3. Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           
           {/* User Profile */}
           <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-[#EB7313] shadow-sm">
                 {user?.name?.[0] || "A"}
              </div>
              {!collapsed && (
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Admin"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                 </div>
              )}
              {!collapsed && (
                 <button onClick={logout} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Logout">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                 </button>
              )}
           </div>

           {/* Desktop Collapse Button */}
           <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex w-full mt-4 items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
           >
              {collapsed ? <ChevronDoubleRightIcon className="h-4 w-4" /> : <ChevronDoubleLeftIcon className="h-4 w-4" />}
           </button>
        </div>
      </aside>
    </>
  );
}