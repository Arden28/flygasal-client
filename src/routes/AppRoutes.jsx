// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLayout from "../layouts/ClientLayout";
import AdminLayout from "../layouts/AdminLayout";

// Pages
import Home from "../pages/client/Home";
import Dashboard from "../pages/admin/Dashboard";
import FlightPage from "../pages/client/FlightPage";
import TripReviewPage from "../pages/client/TripReviewPage";
import BookingConfirmationPage from "../pages/client/BookingConfirmationPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client-side */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="/flight/availability" element={<FlightPage />} />
          <Route path="/flight/trip-review" element={<TripReviewPage />} />
          <Route path="/flight/booking-confirmation" element={<BookingConfirmationPage />} />
          <Route path="/flight/confirmation-success" element={<div>Booking Confirmed!</div>} />
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
