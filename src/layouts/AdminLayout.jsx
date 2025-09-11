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
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Auth guard (after loading)
  useEffect(() => {
    if (!loading && user?.role !== "admin") navigate("/dashboard");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  return (
    // Full viewport, 2-column flex: Sidebar (shrink-0) + Content (flex-1)
    <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((v) => !v)}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* If your Header is sticky, it can sit here without affecting layout */}
        <Header toggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        {/* Main scroll area */}
        <main className="flex-1 min-h-0 overflow-y-auto px-2 py-2 sm:px-4 sm:py-4">
          <div className="mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
