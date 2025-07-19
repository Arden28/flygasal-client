import { useContext, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from '/assets/img/logo/flygasal.png';
import usFlag from '/assets/img/flags/us.svg';
import arFlag from '/assets/img/flags/ar.svg';
import frFlag from '/assets/img/flags/fr.svg';
import euFlag from '/assets/img/flags/eu.svg';
import keFlag from '/assets/img/flags/ke.svg';

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleDropdown = (dropdown) => setOpenDropdown(openDropdown === dropdown ? null : dropdown);

  const navLinks = [
    { href: '/flight/availability', label: 'Flights' },
    { href: '/blogs', label: 'Blog' },
    { href: '/about', label: 'About Us' },
  ];

  const languageOptions = [
    { label: 'English', flag: usFlag, href: '#' },
    { label: 'Arabic', flag: arFlag, href: '#' },
    { label: 'Français', flag: frFlag, href: '#' },
  ];

  const currencyOptions = [
    { code: 'USD', name: 'United States Dollar', flag: usFlag, href: '#' },
    { code: 'EUR', name: 'Euro', flag: euFlag, href: '#' },
    { code: 'KES', name: 'Kenya', flag: keFlag, href: '#' },
  ];

  const accountOptions = user
    ? [
        { label: 'Dashboard', href: '/dashboard' },
      ]
    : [
        { label: 'Login', href: '/login' },
        { label: 'Signup', href: '/signup' },
      ];
  
  const userDisplayName = user?.name || user?.email || 'Account';

  return (
    
                <header className="navbar fixed-top navbar-expand-lg bg-white shadow-sm">
                    <div className="container mx-auto px-0">
                        {/* Logo */}
                        <a href="/" className="navbar-brand m-0 py-2 px-2 rounded-lg hover:bg-gray-200 transition">
                            <img 
                                className="logo p-1 rounded" 
                                style={{ maxWidth: '140px', maxHeight: '50px' }} 
                                src="/assets/img/logo/flygasal.png" 
                                alt="FlyGasal Logo" 
                            />
                        </a>

                        {/* Toggle button for mobile navigation */}
                        <button 
                            className="navbar-toggler rounded-md border-0" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#navbarSupportedContent" 
                            aria-controls="navbarSupportedContent" 
                            aria-expanded="false" 
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>

                        {/* Navigation items */}
                        <div className={`${isMobileMenuOpen ? 'collapse' : ''} navbar-collapse justify-content-between`} id="navbarSupportedContent">
                            {/* Left navigation items */}
                            <ul className="navbar-nav  mb-2 mb-lg-0">

                            </ul>

                            {/* Right navigation items */}
                            <ul className="navbar-nav gap-2 mb-2 mb-lg-0 flex">
                                {/* Language dropdown */}
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle d-flex align-items-center gap-1 border rounded py-2 px-3 text-dark" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <img className="me-2" style={{ width: '18px' }} src="/assets/img/flags/us.svg" alt="US Flag" />
                                        <strong className="h6 m-0">English</strong>
                                        <svg className="ms-1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </a>
                                    <ul className="dropdown-menu rounded-3 p-2">
                                        {languageOptions.map((option) => (
                                          <li key={option.label}>
                                            <a
                                              href={option.href}
                                              className="dropdown-item d-flex gap-2 align-items-center"
                                            >
                                              <img className="w-[18px]" style={{ width: '18px' }} src={option.flag} alt={`${option.label} Flag`} />
                                              <span>{option.label}</span>
                                            </a>
                                          </li>
                                        ))}
                                    </ul>
                                </li>

                                {/* Currency dropdown */}
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle d-flex align-items-center gap-1 border rounded py-2 px-3 text-dark" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <strong className="h6 m-0">USD $</strong>
                                        <svg className="ms-1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </a>
                                    <ul className="dropdown-menu rounded-3 p-2">
                                        {currencyOptions.map((option) => (
                                          <li key={option.code}>
                                            <a
                                              href={option.href}
                                              className="dropdown-item d-flex gap-2 align-items-center"
                                            >
                                              <img className="w-[18px] me-2" style={{ width: '18px' }} src={option.flag} alt={`${option.name} Flag`} />
                                              <span><strong>{option.code}</strong></span>
                                              <span className="mx-1">-</span>
                                              <small>{option.name}</small>
                                            </a>
                                          </li>
                                        ))}
                                    </ul>
                                </li>

                                {/* Account dropdown */}
                                <li className="nav-item dropdown">
                                    <a 
                                        className="nav-link dropdown-toggle flex items-center gap-1 border rounded py-1 px-3 text-gray-800 hover:bg-gray-200 transition" 
                                        href="#" 
                                        role="button" 
                                        data-bs-toggle="dropdown" 
                                        aria-expanded="false"
                                    >
                                        <svg 
                                            className="me-1" 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            width="20" 
                                            height="20" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="#000000" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span className="m-0 uppercase font-medium">{isLoggingOut ? 'Logging out...' : userDisplayName}</span>
                                        <svg 
                                            className="ms-1" 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            width="14" 
                                            height="14" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="#000000" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </a>
                                    <ul className="dropdown-menu rounded-lg p-2 shadow-md">
                                      {accountOptions
                                        .filter((option) => option.label !== 'Logout')
                                        .map((option) => (
                                          <li key={option.label}>
                                            <Link className="dropdown-item hover:bg-gray-100" to={option.href}>
                                              {option.label}
                                            </Link>
                                          </li>
                                      ))}

                                      {user && (
                                        <li>
                                          <button
                                            className="dropdown-item hover:bg-gray-100 w-100 text-start"
                                            disabled={isLoggingOut}
                                            onClick={async () => {
                                              setIsLoggingOut(true);
                                              try {
                                                await logoutUser();
                                                navigate('/login');
                                              } catch (error) {
                                                console.error('Logout error:', error.message);
                                                alert('Failed to log out. Please try again.');
                                              } finally {
                                                setIsLoggingOut(false);
                                              }
                                            }}
                                          >
                                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                                          </button>
                                        </li>
                                      )}

                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>
  );
}
