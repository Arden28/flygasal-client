import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";
import { AuthContext } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, loading } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => setIsSidebarOpen(false), [location.pathname]);

  // Auth guard
  useEffect(() => {
    if (!loading && user?.role !== "admin") navigate("/dashboard");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#EB7313] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar (Collapsible on Desktop, Drawer on Mobile) */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((v) => !v)}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto focus:outline-none scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}