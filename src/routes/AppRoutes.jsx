// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLayout from "../layouts/ClientLayout";
import AdminLayout from "../layouts/AdminLayout";
import { ClientContext } from "../context/ClientContext";

// Pages
import Home from "../pages/client/Home";
import Dashboard from "../pages/admin/Dashboard";
import FlightPage from "../pages/client/FlightPage";
import TripReviewPage from "../pages/client/TripReviewPage";
import BookingConfirmationPage from "../pages/client/BookingConfirmationPage";
import Login from "../pages/client/Login";
import Register from "../pages/client/Register";
import SignupSuccessPage from "../pages/client/RegisterSuccessPage";
import AboutPage from "../pages/client/AboutPage";
import DashboardPage from "../pages/client/DashboardPage";
import BookingsPage from "../pages/client/BookingsPage";
import ProfilePage from "../pages/client/ProfilePage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client-side */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/flight/availability" element={<FlightPage />} />
          <Route path="/flight/trip-review" element={<TripReviewPage />} />
          <Route path="/flight/booking-confirmation" element={<BookingConfirmationPage />} />
          <Route path="/flight/confirmation-success" element={<div>Booking Confirmed!</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register signupUrl="http://flygasal.test/api/auth/register" />} />
          <Route path="/signup-success" element={<SignupSuccessPage />} />
          {/* Profile */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          

          {/* Add more client pages here */}
        </Route>

        {/* Admin-side */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          {/* Add more admin routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
