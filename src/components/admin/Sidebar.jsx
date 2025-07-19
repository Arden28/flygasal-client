import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UsersIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: HomeIcon },
  { name: 'Users', path: '/admin/users', icon: UsersIcon },
  { name: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', path: '/admin/settings', icon: CogIcon },
];

export default function Sidebar({ isOpen, toggleSidebar, setIsSidebarOpen }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-4 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:block transition-transform duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">FlyGasal Admin</h2>
        <button className="md:hidden text-white" onClick={toggleSidebar}>
          ✕
        </button>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center p-2 rounded text-white ${
                  location.pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
                } transition`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-2 text-white" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}