// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientLayout from "../layouts/ClientLayout";
import AdminLayout from "../layouts/AdminLayout";
import { ClientContext } from "../context/ClientContext";
import { AuthContext } from "../context/AuthContext";

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
import { useContext } from "react";
import Users from "../pages/admin/Users";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";
import UserDetails from "../pages/admin/UserDetails";
import Bookings from "../pages/admin/Bookings";
import BookingDetails from "../pages/admin/BookingDetails";
import Airlines from "../pages/admin/Airlines";
import Airports from "../pages/admin/Airports";

export default function AppRoutes() {

    const { user, logoutUser } = useContext(AuthContext);
    
  return (
    <BrowserRouter>
      <Routes>
        {/* Client-side */}
        <Route path="/" element={<ClientLayout logoutUser={logoutUser} />}>
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
          <Route path="/dashboard" element={
                user ? (
                  <DashboardPage 
                      user={user}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          

          {/* Add more client pages here */}
        </Route>

        {/* Admin-side */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="flights/bookings" element={<Bookings />} />
          <Route path="flights/bookings/:id" element={<BookingDetails />} />
          <Route path="flights/airlines" element={<Airlines />} />
          <Route path="flights/airports" element={<Airports />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
