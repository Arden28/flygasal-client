import { useState } from "react";
import { Link } from "react-router-dom";
import { UserIcon, ChevronDownIcon, MenuIcon, XIcon } from "@heroicons/react/outline";
import logo from '/assets/uploads/global/logo.png';
import usFlag from '/assets/img/flags/us.svg';
import arFlag from '/assets/img/flags/ar.svg';
import frFlag from '/assets/img/flags/fr.svg';
import euFlag from '/assets/img/flags/eu.svg';
import keFlag from '/assets/img/flags/ke.svg';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleDropdown = (dropdown) => setOpenDropdown(openDropdown === dropdown ? null : dropdown);

  const navLinks = [
    { href: '/flights/availability', label: 'Flights' },
    { href: '/visa', label: 'Visa' },
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

  const accountOptions = [
    { label: 'Login', href: '/login' },
    { label: 'Signup', href: '/signup' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-sm z-50 transition-all duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-transform duration-300 hover:scale-105">
            <img
              className="h-10 w-auto rounded"
              src={logo}
              alt="FlyGasal Logo"
            />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-600 hover:text-blue-600 focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>

          {/* Navigation Items */}
          <nav className={`md:flex md:items-center md:gap-6 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block absolute md:static top-full left-0 w-full md:w-auto bg-white md:bg-transparent transition-all duration-300 ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 md:max-h-full md:opacity-100'} overflow-hidden`}>
            <ul className="flex flex-col md:flex-row md:gap-6 p-4 md:p-0">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="relative text-gray-700 hover:text-blue-600 font-medium text-sm py-2 px-3 rounded-md transition-colors duration-300 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right Side Controls */}
            <ul className="flex flex-col md:flex-row md:gap-2 p-4 md:p-0">
              {/* Language Dropdown */}
              <li className="relative">
                <button
                  className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md transition-colors duration-300"
                  onClick={() => toggleDropdown('language')}
                >
                  <img src={usFlag} alt="Language Flag" className="w-5 h-5" />
                  <span className="text-sm font-medium">English</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${openDropdown === 'language' ? 'rotate-180' : ''}`} />
                </button>
                <ul
                  className={`absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-2 transition-all duration-300 ${openDropdown === 'language' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                  {languageOptions.map((option) => (
                    <li key={option.label}>
                      <Link
                        to={option.href}
                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md text-sm"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <img src={option.flag} alt={`${option.label} Flag`} className="w-5 h-5" />
                        <span>{option.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Currency Dropdown */}
              <li className="relative">
                <button
                  className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md transition-colors duration-300"
                  onClick={() => toggleDropdown('currency')}
                >
                  <span className="text-sm font-medium">USD $</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${openDropdown === 'currency' ? 'rotate-180' : ''}`} />
                </button>
                <ul
                  className={`absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-2 transition-all duration-300 ${openDropdown === 'currency' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                  {currencyOptions.map((option) => (
                    <li key={option.code}>
                      <Link
                        to={option.href}
                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md text-sm"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <img src={option.flag} alt={`${option.name} Flag`} className="w-5 h-5" />
                        <span><strong>{option.code}</strong> - {option.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Account Dropdown */}
              <li className="relative">
                <button
                  className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md transition-colors duration-300"
                  onClick={() => toggleDropdown('account')}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Account</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${openDropdown === 'account' ? 'rotate-180' : ''}`} />
                </button>
                <ul
                  className={`absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-2 transition-all duration-300 ${openDropdown === 'account' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                  {accountOptions.map((option) => (
                    <li key={option.label}>
                      <Link
                        to={option.href}
                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md text-sm"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {option.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}