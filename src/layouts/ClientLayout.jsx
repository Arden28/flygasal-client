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
    const allowedPathsForUnauthenticated = [
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/signup-success' // Added '/signup-success' to allowed paths
    ];

    // Case 1: If not loading, no user, and the current path is NOT one of the allowed unauthenticated paths, redirect to login.
    // This ensures users are redirected to login if they try to access protected routes without authentication.
    if (!loading && !user && !allowedPathsForUnauthenticated.includes(location.pathname)) {
      navigate('/login');
    }

    // Case 2: If user is loaded, exists, and their status is 0 (inactivated),
    // redirect them to the '/signup-success' page, unless they are already on it.
    // This is crucial for guiding newly registered but unactivated users.
    if (!loading && user && user.is_active === 0 && location.pathname !== '/signup-success') {
      navigate('/signup-success');
    }
    // Note: If user.status is not 0, and they are not unauthenticated, they will
    // proceed to the requested page, assuming they are authenticated and active.

  }, [loading, user, navigate, location.pathname]); // Dependencies for the effect


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
