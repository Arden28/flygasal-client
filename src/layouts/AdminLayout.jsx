// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar will go here later */}
      <aside className="w-64 bg-gray-900 text-white p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-4">FlyGasal Admin</h2>
        {/* Add nav links here */}
      </aside>
      <div className="flex-grow p-6 bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
}
