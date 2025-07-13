// src/layouts/ClientLayout.jsx
import Navbar from "../components/client/Navbar";
import Footer from "../components/client/Footer";
import { Outlet } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";

export default function ClientLayout() {
  return (
    <div id="fadein">
      <Navbar />
      <SpinnerOrbit />
        <Outlet />
      {/* <main className="layout-container">
      </main> */}
      <Footer />
    </div>
  );
}
