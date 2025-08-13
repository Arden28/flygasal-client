import React, { useState, useEffect } from 'react';
import Headbar from '../../components/client/Headbar';
import { useLocation } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext";

// Mock translation object to replace PHP T::
const T = {
    welcomeback: 'Welcome Back',
    dashboard: 'Dashboard',
    mybookings: 'My Bookings',
    reports: 'Reports',
    myprofile: 'My Profile',
    logout: 'Logout',
    walletbalance: 'Wallet Balance',
    totalbookings: 'Total Bookings',
    pendinginvoices: 'Pending Invoices',
};

// Mock dashboard data to replace PHP API calls
const mockDashboardDetails = {
    balance: '1000.00',
    currency: 'USD',
};

const DashboardPage = ({
    rootUrl = '/',
    apiKey = 'mock_api_key',
    apiUrl = '/api',
    user = user,
    dashboardDetails = mockDashboardDetails,
}) => {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
    const [bookings, setBookings] = useState({
        total: 0,
        pending: 0,
    });

    const location = useLocation();
    const currentPath = location.pathname;

    const meta = {
        dashboard_active: currentPath === '/dashboard',
        bookings_active: currentPath === '/bookings',
        markups_active: currentPath === '/markups',
        deposit_active: currentPath === '/deposit',
        agency_active: currentPath === '/agency',
        profile_active: currentPath === '/profile',
    };

    useEffect(() => {
        // Real-time clock update
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleString());
        }, 1000);

        // Simulate API call for bookings
        const fetchBookings = async () => {
            try {
                // Mock API response
                const response = {
                    data: {
                        flights: [{ payment_status: 'unpaid' }, { payment_status: 'paid' }],
                        hotels: [{ payment_status: 'paid' }],
                        tours: [],
                        cars: [],
                        visa: [{ payment_status: 'unpaid' }],
                    },
                };

                const flights = response.data.flights || [];
                const hotels = response.data.hotels || [];
                const tours = response.data.tours || [];
                const cars = response.data.cars || [];
                const visa = response.data.visa || [];

                const totalBookings = flights.length + hotels.length + tours.length + cars.length + visa.length;
                const pendingBookings =
                    flights.filter((f) => f.payment_status === 'unpaid').length +
                    hotels.filter((h) => h.payment_status === 'unpaid').length +
                    tours.filter((t) => t.payment_status === 'unpaid').length +
                    cars.filter((c) => c.payment_status === 'unpaid').length +
                    visa.filter((v) => v.payment_status === 'unpaid').length;

                setBookings({ total: totalBookings, pending: pendingBookings });
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };

        fetchBookings();

        return () => clearInterval(interval);
    }, []);

    // Determine active menu item based on current path (simulated)
    const getMenuClass = (menu) => {
        const path = window.location.pathname.split('/')[2] || '';
        return path === menu ? 'active btn btn-primary w-100 d-block fadeout' : 'border justify-content-center w-auto d-block fadeout';
    };

    return (
        <>
            <Headbar T={T} rootUrl={rootUrl} user={user} />
            <div className="mt-5 mb-4">
                <div className="card p-3">
                    <div className="row g-3">

                        <div className="col-lg-4 responsive-column-m user_wallet icon-layout-2 dashboard-icon-box">
                            <div className="p-4 rounded-2" style={{ background: '#ecf8f1' }}>
                                <div className="d-flex justify-content-between">
                                    {/* Icon */}
                                    <p className="mb-2 d-flex gap-2 text-start">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#000000"
                                            strokeWidth="1"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                                            <line x1="6" y1="6" x2="6.01" y2="6"></line>
                                            <line x1="6" y1="18" x2="6.01" y2="18"></line>
                                        </svg>
                                        <span>{T.walletbalance}</span>
                                    </p>
                                    <i className="bi bi-plus-circle fs-4 text-end cursor-pointer" title='Add fund'></i>
                                </div>
                                <h1 className="">
                                    <small>{user.wallet_balance}</small> <strong>{user.agency_currency}</strong>
                                </h1>
                            </div>
                        </div>
                        <div className="col-lg-4 responsive-column-m user_wallet icon-layout-2 dashboard-icon-box">
                            <div className="p-4 rounded-2" style={{ background: '#ebf8fe' }}>
                                {/* Icon */}
                                <p className="mb-2 d-flex gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#000000"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3.8 6h16.4M16 10a4 4 0 1 1-8 0" />
                                    </svg>
                                    <span>{T.totalbookings}</span>
                                </p>
                                <h1 className="">
                                    <strong>{bookings.total}</strong>
                                </h1>
                            </div>
                        </div>
                        <div className="col-lg-4 responsive-column-m user_wallet icon-layout-2 dashboard-icon-box">
                            <div className="p-4 rounded-2" style={{ background: '#f1eeff' }}>
                                {/* Icon */}
                                <p className="mb-2 d-flex gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#000000"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>{T.pendinginvoices}</span>
                                </p>
                                <h1 className="">
                                    <strong>{bookings.pending}</strong>
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardPage;