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
  const location = useLocation();

  // Regex patterns for paths with no layout
  const noLayoutPatterns = [
    /^\/flight\/booking-confirmation$/, // exact
    /^\/flight\/booking\/details$/,     // exact
    /^\/flight\/booking\/invoice\/[^/]+$/,     // exact
    /^\/flights\/invoice\/[^/]+$/,      // dynamic `:id`
  ];

  useEffect(() => {
    const allowedPathsForUnauthenticated = [
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/signup-success",
    ];

    if (
      !loading &&
      !user &&
      !allowedPathsForUnauthenticated.includes(location.pathname)
    ) {
      navigate("/login");
    }

    if (
      !loading &&
      user &&
      user.is_active === 0 &&
      location.pathname !== "/signup-success"
    ) {
      navigate("/signup-success");
    }
  }, [loading, user, navigate, location.pathname]);

  // Check if current path matches any regex
  const isNoLayout = noLayoutPatterns.some((pattern) =>
    pattern.test(location.pathname)
  );

  if (isNoLayout) {
    return <Outlet />;
  }

  return (
    <div id="fadein">
      <Navbar />
      <SpinnerOrbit />
      <Outlet />
      {/* <AppPromoSection /> */}
      <Footer />
    </div>
  );
}
