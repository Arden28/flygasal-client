import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header({ toggleSidebar }) {
  return (
    <header className="bg-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <button
          className="md:hidden mr-4 text-gray-600"
          onClick={toggleSidebar}
        >
          ☰
        </button>
        <h1 className="text-xl font-semibold">FlyGasal Admin</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">Admin User</span>
        <UserCircleIcon className="w-6 h-6 text-gray-600" />
        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
    </header>
  );
}