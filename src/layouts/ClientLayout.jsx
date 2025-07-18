// src/layouts/ClientLayout.jsx
import Navbar from "../components/client/Navbar";
import Footer from "../components/client/Footer";
import { Outlet } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import AppPromoSection from "../components/client/AppPromoSection";

export default function ClientLayout() {

  return (
    <div id="fadein">
      <Navbar />
      <SpinnerOrbit />
      
      {/* Page Content */}
      <Outlet />
      
      {/* App Promo Section */}
      <AppPromoSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
