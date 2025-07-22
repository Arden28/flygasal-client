// src/layouts/ClientLayout.jsx
import Navbar from "../components/client/Navbar";
import Footer from "../components/client/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import AppPromoSection from "../components/client/AppPromoSection";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ClientLayout() {

  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

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
