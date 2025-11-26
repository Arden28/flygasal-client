import React, { useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { Bars3Icon, BellIcon, MagnifyingGlassIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../../context/AuthContext";

export default function Header({ toggleSidebar }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [query, setQuery] = useState("");

  // Breadcrumbs Logic
  const crumbs = location.pathname.split("/").filter(x => x && x !== "admin").map(x => x.charAt(0).toUpperCase() + x.slice(1));

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-sm border-b border-slate-200/60 h-15 transition-all">
       <div className="h-full px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Left: Breadcrumbs & Toggle */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
             <button onClick={toggleSidebar} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                <Bars3Icon className="h-6 w-6" />
             </button>

             <nav className="hidden md:flex items-center text-sm font-medium text-slate-500">
                <span className="hover:text-slate-900 transition-colors cursor-pointer">Dashboard</span>
                {crumbs.map((crumb, index) => (
                   <React.Fragment key={index}>
                      <ChevronRightIcon className="h-3 w-3 mx-3 text-slate-300" />
                      <span className={`capitalize ${index === crumbs.length - 1 ? 'text-[#EB7313] font-bold bg-[#EB7313]/5 px-2 py-0.5 rounded-md' : 'hover:text-slate-900'}`}>
                         {crumb}
                      </span>
                   </React.Fragment>
                ))}
             </nav>
          </div>

          {/* Center/Right: Search & Actions */}
          <div className="flex items-center gap-3 md:gap-6">


             <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all">
                   <BellIcon className="h-6 w-6" />
                   <span className="absolute top-2.5 right-3 h-2 w-2 bg-[#EB7313] rounded-full ring-2 ring-white animate-pulse"></span>
                </button>

                {/* Profile Snippet (Mobile Only - Desktop handles in sidebar) */}
                <div className="md:hidden h-8 w-8 rounded-full bg-[#EB7313] text-white flex items-center justify-center text-xs font-bold">
                   {user?.name?.[0] || "A"}
                </div>
             </div>

          </div>
       </div>
    </header>
  );
}