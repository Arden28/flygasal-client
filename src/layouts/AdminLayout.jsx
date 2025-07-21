// src/layouts/AdminLayout.jsx
import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";
import { AuthContext } from "../context/AuthContext";

export default function AdminLayout() {
  
  const { user, logout, loading } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      // Redirect non-admins to dashboard
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 bg-gray-50 md:ml-60">
        <Header toggleSidebar={toggleSidebar} />
        <main className="p-2">
          <Outlet />
        </main>
      </div>
    </div>

  );
}
