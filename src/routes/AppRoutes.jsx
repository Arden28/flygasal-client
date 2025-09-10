// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientLayout from "../layouts/ClientLayout";
import AdminLayout from "../layouts/AdminLayout";
import { ClientContext } from "../context/ClientContext";
import { AuthContext } from "../context/AuthContext";

// Pages
import Home from "../pages/client/Home";
import Dashboard from "../pages/admin/Dashboard";
import FlightPage from "../pages/client/Flight/FlightPage";
import Login from "../pages/client/Auth/Login";
import Register from "../pages/client/Auth/Register";
import RegisterSuccessPage from "../pages/client/Auth/RegisterSuccessPage";
import DashboardPage from "../pages/client/Account/DashboardPage";
import BookingsPage from "../pages/client/Account/BookingsPage";
import ProfilePage from "../pages/client/Account/ProfilePage";
import { useContext, useState } from "react";
import Users from "../pages/admin/Users";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";
import UserDetails from "../pages/admin/UserDetails";
import Bookings from "../pages/admin/Bookings";
import BookingDetails from "../pages/admin/BookingDetails";
import BookingDetail from "../pages/client/Flight/BookingDetail";
import Airlines from "../pages/admin/Airlines";
import Airports from "../pages/admin/Airports";
import Transactions from "../pages/admin/Transactions";
import UserRoles from "../pages/admin/UserRoles";
import AdminLogin from "../pages/admin/Login";
import AgencyPage from "../pages/client/Account/AgencyPage";
import Deposits from "../pages/client/Account/DepositPage";
import About from "../pages/client/Company/About";
import NotFound from "../pages/error/NotFound";
import BookingConfirmation from "../pages/client/Flight/BookingConfirmation";

export default function AppRoutes() {

    const { user, logout, loading } = useContext(AuthContext);
    // console.log('ClientLayout user:', user);
    const [message, setMessage] = useState({ text: '', type: '' }); // Global message state
    const [currentView, setCurrentView] = useState('');
    

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Client-side */}
        <Route
          path="/"  element={<ClientLayout user={user} />} >
          <Route index element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/flight/availability" element={<FlightPage />} />
          <Route path="/flight/booking/details" element={<BookingDetail user={user} />} />
          <Route
            path="/flight/booking/invoice/:orderNumber"
            element={<BookingConfirmation user={user} />}
          />
          <Route path="/signup-success" element={<RegisterSuccessPage />} />
          {/* Profile */}
          <Route path="/dashboard" element={<DashboardPage user={user} /> } />
          <Route path="/bookings" element={<BookingsPage user={user} />} />
          <Route path="/agency" element={<AgencyPage user={user} />} />
          <Route path="/deposits" element={<Deposits user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          

          {/* Add more client pages here */}
        </Route>
        
        {/* Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />

        <Route path="/" element={<ClientLayout />}>
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register signupUrl="http://flygasal.test/api/auth/register" />} />
        </Route>

        {/* Admin-side */}
        {/* <Route path="/admin" element={<AdminLayout />}> */}
        <Route
          path="/admin"
          element={
            !loading && user ? (
              <AdminLayout />
            ) : (
              <Navigate to="/admin/login" />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="flights/bookings" element={<Bookings />} />
          <Route path="flights/bookings/:id" element={<BookingDetails />} />
          <Route path="flights/airlines" element={<Airlines />} />
          <Route path="flights/airports" element={<Airports />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/user-roles" element={<UserRoles />} />
        </Route>
        <Route path="/admin">
          <Route path="login" element={<AdminLogin setMessage={setMessage}/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
