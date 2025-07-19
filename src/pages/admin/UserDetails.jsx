import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export default function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data (replace with API call)
  useEffect(() => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', type: 'Client', status: 'Active', walletBalance: 150.25, registrationDate: '2025-01-15', lastLogin: '2025-07-19' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', type: 'Agent', status: 'Inactive', walletBalance: 320.50, registrationDate: '2025-02-10', lastLogin: '2025-07-18' },
      // Add more mock users as needed
    ];
    const foundUser = mockUsers.find(u => u.id === parseInt(id));
    if (foundUser) {
      setUser(foundUser);
      setLoading(false);
    } else {
      setError('User not found');
      setLoading(false);
    }
    // Future API call: GET /api/users/:id
    // fetch(`https://your-laravel-api.com/api/users/${id}`)
    //   .then(res => res.json())
    //   .then(data => setUser(data))
    //   .catch(err => setError('Failed to fetch user'))
    //   .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center p-6"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="p-6 bg-red-100 text-red-800 rounded-lg">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Details</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <UserCircleIcon className="w-10 h-10 text-gray-400 mr-4" />
          <h2 className="text-xl font-semibold">{user.name}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm text-gray-600"><strong>Type:</strong> {user.type}</p>
            <p className="text-sm text-gray-600"><strong>Status:</strong>
              <span
                className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  user.status === 'Active' ? 'bg-green-100 text-green-800' :
                  user.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {user.status}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600"><strong>Wallet Balance:</strong> ${user.walletBalance.toFixed(2)}</p>
            <p className="text-sm text-gray-600"><strong>Registration Date:</strong> {user.registrationDate}</p>
            <p className="text-sm text-gray-600"><strong>Last Login:</strong> {user.lastLogin}</p>
          </div>
        </div>
        <div className="mt-6">
          <Link to="/users" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}