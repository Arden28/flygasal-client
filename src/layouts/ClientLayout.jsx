// src/layouts/ClientLayout.jsx
import Navbar from "../components/client/Navbar";
import Footer from "../components/client/Footer";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SpinnerOrbit from "../components/client/SpinnerOrbit";
import AppPromoSection from "../components/client/AppPromoSection";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ClientLayout() {

  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  useEffect(() => {
    // Define paths where unauthenticated users should be allowed
    const allowedPathsForUnauthenticated = ['/signup', '/forgot-password', '/reset-password']; // Add any other relevant paths

    // If not loading, no user, and the current path is NOT one of the allowed paths, redirect to login
    if (!loading && !user && !allowedPathsForUnauthenticated.includes(location.pathname)) {
      navigate('/login');
    }
  }, [loading, user, navigate, location.pathname]); // Add location.pathname to dependencies


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
