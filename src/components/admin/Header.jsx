import React, { useState, useRef, useEffect, useContext } from 'react';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext'; // Import AuthContext
import { useNavigate } from 'react-router-dom';

export default function Header({ toggleSidebar, setCurrentView }) { // Added setCurrentView prop
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user, logout, loading } = useContext(AuthContext);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
        await logout(); // wait for logout to complete
        navigate('/admin/login');
        } catch (error) {
        alert('Failed to log out. Please try again.');
        } finally {
        setIsLoggingOut(false);
        }
    };

    return (
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-40"> {/* Added z-index */}
            <div className="flex items-center">
                <button
                    className="md:hidden mr-4 text-gray-700 hover:text-black"
                    onClick={toggleSidebar}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <img
                    className="logo p-1 rounded"
                    style={{ maxWidth: '140px', maxHeight: '50px' }}
                    src="/assets/img/logo/flygasal.png" // Ensure this path is correct relative to your public folder
                    alt="FlyGasal Logo"
                />
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-black focus:outline-none"
                >
                    <UserCircleIcon className="w-8 h-8" />
                    <span className="hidden sm:inline font-medium">
                        {user ? user.name : 'Guest'} {/* Display user's name or 'Guest' */}
                    </span>
                    <ChevronDownIcon className="w-5 h-5" />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg overflow-hidden z-50">
                        {!loading && user && ( // Only show profile/settings if user is logged in
                            <>
                                <button
                                    onClick={() => { navigate('/admin/profile'); setDropdownOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => { navigate('/admin/settings'); setDropdownOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Settings
                                </button>
                                <div className="border-t border-gray-100 my-1"></div> {/* Separator */}
                                <button
                                    onClick={handleLogout} // Call handleLogout function
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
