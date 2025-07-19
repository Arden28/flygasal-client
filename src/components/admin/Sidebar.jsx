import { Link, useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { HomeIcon, UsersIcon, ChartBarIcon, CogIcon, PaperAirplaneIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FaPlaneDeparture } from 'react-icons/fa';
// import { ClientContext } from './ClientContext';

// Default navigation items (used if none provided via props)
const defaultNavItems = [
  { name: 'Dashboard', path: '/admin', icon: HomeIcon },
  { name: 'Users', path: '/admin/users', icon: UsersIcon },
  { name: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon },
  {
    name: 'Flights',
    path: '/admin/flights',
    icon: FaPlaneDeparture,
    subItems: [
      { name: 'Airlines', path: '/admin/flights/airlines' },
      { name: 'Airports', path: '/admin/flights/airports' },
      { name: 'Bookings', path: '/admin/flights/bookings' },
      { name: 'Transactions', path: '/admin/flights/transactions' },
    ],
  },
  { name: 'settings', path: '/admin/settings', icon: CogIcon },
];

export default function Sidebar({ isOpen, toggleSidebar, setIsSidebarOpen, navItems = defaultNavItems, logoUrl = '/assets/img/logo.png', rootUrl = '/' }) {
  const location = useLocation();
  const [isFlightsOpen, setIsFlightsOpen] = useState(true);
  // const { t } = useContext() || { t: (key) => key }; // Fallback to key if context unavailable

  const isFlightActive = navItems
    .find((item) => item.name === 'flights')
    ?.subItems?.some((subItem) => location.pathname.startsWith(subItem.path));

  return (
    <aside
      className={`col-lg-2 position-fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-4 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:block transition-transform duration-300 ease-in-out`}
    >
      <div className="flex flex-col items-center justify-between mb-6">
        {/* <img
          src={`${rootUrl}${logoUrl}`}
          alt="FlyGasal Logo"
          className="w-32 mb-4"
          style={{ maxHeight: '64px', objectFit: 'contain' }}
        /> */}
        <div className="flex items-center justify-between w-full">
                            <img 
                                className="logo p-1 rounded" 
                                style={{ maxWidth: '140px', maxHeight: '50px' }} 
                                src="/assets/img/logo/flygasal.png" 
                                alt="FlyGasal Logo" 
                            />
          <button className="md:hidden text-white" onClick={toggleSidebar} aria-label="Close sidebar">
            ✕
          </button>
        </div>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              {item.subItems ? (
                <>
                  <button
                    className={`flex items-center p-2 rounded text-white w-full text-left ${
                      isFlightActive || location.pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
                    } transition`}
                    onClick={() => setIsFlightsOpen(!isFlightsOpen)}
                    aria-expanded={isFlightsOpen}
                    aria-label={`Toggle ${item.name} dropdown`}
                  >
                    <item.icon className="w-5 h-5 mr-2 text-white" />
                    {item.name}
                    <ChevronDownIcon
                      className={`w-4 h-4 ml-auto transition-transform ${isFlightsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isFlightsOpen && (
                    <ul className="pl-8">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.name} className="mb-2">
                          <Link
                            to={subItem.path}
                            className={`flex items-center p-2 rounded text-white ${
                              location.pathname === subItem.path ? 'bg-gray-700' : 'hover:bg-gray-700'
                            } transition`}
                            onClick={() => setIsSidebarOpen(false)}
                            aria-label={subItem.name}
                          >
                            <span className="ml-2">{subItem.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded text-white ${
                    location.pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
                  } transition`}
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label={item.name}
                >
                  <item.icon className="w-5 h-5 mr-2 text-white" />
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      subItems: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          path: PropTypes.string.isRequired,
        })
      ),
    })
  ),
  logoUrl: PropTypes.string,
  rootUrl: PropTypes.string,
};