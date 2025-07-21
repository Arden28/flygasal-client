import { useState, useMemo, useEffect } from 'react';
import { UserCircleIcon, DocumentArrowDownIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiService from '../../api/apiService';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState({ min: '', max: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    // Fetch users from API
    useEffect(() => {
      const fetchUsers = async () => {
        try {
          const response = await apiService.get("/admin/users");
          const apiUsers = response.data.data.data;

          const formattedUsers = apiUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.roles?.[0]?.name ?? 'N/A',         // assuming roles is an array with objects like { name: "Admin" }
            status: user.is_active ? 'Active' : 'Inactive',
            walletBalance: user.wallet?.balance ?? 0,     // optional: handle if user has no wallet
          }));

          setUsers(formattedUsers);
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      };

      fetchUsers();
      setLoading(false);
    }, []);



  // Sorting logic
  const sortedUsers = useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // Filtering logic
  const filteredUsers = useMemo(() => {
    return sortedUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || user.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesBalance = (!balanceFilter.min || user.walletBalance >= balanceFilter.min) &&
                            (!balanceFilter.max || user.walletBalance <= balanceFilter.max);
      return matchesSearch && matchesType && matchesStatus && matchesBalance;
    });
  }, [sortedUsers, searchTerm, typeFilter, statusFilter, balanceFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  // Excel export with customization
  const exportToExcel = () => {
    const exportData = filteredUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Type: user.type,
      Status: user.status,
      'Wallet Balance': `$${user.walletBalance.toFixed(2)}`,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.sheet_add_aoa(worksheet, [['Name', 'Email', 'Type', 'Status', 'Wallet Balance']], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'users_export.xlsx');
    toast.success('Exported to Excel successfully!');
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle user selection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    setUsers(users.map(user =>
      selectedUsers.includes(user.id) ? { ...user, status: action === 'approve' ? 'Active' : 'Inactive' } : user
    ));
    setAuditLog([...auditLog, { action: `Bulk ${action} for ${selectedUsers.length} users`, timestamp: new Date().toISOString() }]);
    toast.success(`Bulk ${action} completed for ${selectedUsers.length} users!`);
    setSelectedUsers([]);
    // Future API call: POST /api/users/bulk
    // fetch('https://your-laravel-api.com/api/users/bulk', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userIds: selectedUsers, action }),
    // });
  };

  // Handle approval
  const handleApprove = async (userId) => {
    try {
      // Optimistic UI update
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: 'Active' } : user
      ));
      setAuditLog([...auditLog, { action: `Approved user ${userId}`, timestamp: new Date().toISOString() }]);
      setShowApprovalModal(null);

      // API call
      await apiService.post(`/admin/users/${userId}/approve`);

      toast.success('User approved successfully!');
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Something went wrong. Could not approve user.');
    }
  };

  // Handle decline
  const handleDecline = (userId) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: 'Inactive' } : user
    ));
    setAuditLog([...auditLog, { action: `Declined user ${userId}`, timestamp: new Date().toISOString() }]);
    toast.success('User declined successfully!');
    setShowDeclineModal(null);
    // Future API call: POST /api/users/:id/decline
    // fetch(`https://your-laravel-api.com/api/users/${userId}/decline`, { method: 'POST' });
  };

  // Handle delete
  const handleDelete = async (userId) => {
    try {
      // Optimistic UI update
      setUsers(users.filter(user => user.id !== userId));
      setAuditLog([...auditLog, {
        action: `Deleted user ${userId}`,
        timestamp: new Date().toISOString()
      }]);
      setShowDeleteModal(null);

      // API call
      await apiService.delete(`/admin/users/${userId}`);

      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Something went wrong. Could not delete user.');
    }
  };


  // Handle edit
  const handleEdit = (user) => {
    setEditUser({ ...user });
  };

  // Handle save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (
      !editUser.name ||
      !editUser.email ||
      !editUser.type ||
      !editUser.status ||
      editUser.walletBalance < 0
    ) {
      toast.error('Please fill all fields correctly.');
      return;
    }

    try {
      // Optimistic UI update
      setUsers(users.map(user =>
        user.id === editUser.id ? editUser : user
      ));
      setAuditLog([...auditLog, {
        action: `Edited user ${editUser.id}`,
        timestamp: new Date().toISOString()
      }]);
      setEditUser(null);

      // API call
      await apiService.put(`/admin/users/${editUser.id}`, editUser);

      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Something went wrong. Could not update user.');
    }
  };


  return (
    <div className="relative">
      <h1 className="text-2xl font-bold mb-6">Users Management</h1>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search users by name or email"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by user type"
          >
            <option value="all">All Types</option>
            <option value="Client">Client</option>
            <option value="Agent">Agent</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by user status"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            aria-label="Open advanced filters"
          >
            Advanced Filters
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            aria-label="Export users to Excel"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => handleBulkAction('approve')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            aria-label="Approve selected users"
          >
            Approve Selected
          </button>
          <button
            onClick={() => handleBulkAction('decline')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            aria-label="Decline selected users"
          >
            Decline Selected
          </button>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && <div className="flex justify-center p-6"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}
      {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

      {/* Desktop Table */}
      {!loading && !error && (
        <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={() => setSelectedUsers(
                      selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(user => user.id)
                    )}
                    aria-label="Select all users"
                  />
                </th>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'type', label: 'Type' },
                  { key: 'status', label: 'Status' },
                  { key: 'walletBalance', label: 'Wallet Balance' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                  >
                    {label}
                    {sortConfig.key === key && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      aria-label={`Select user ${user.name}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircleIcon className="w-6 h-6 text-gray-400 mr-2" />
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' :
                        user.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${user.walletBalance.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2 flex-wrap">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      aria-label={`View details for ${user.name}`}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Link>
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      aria-label={`Edit user ${user.name}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    {user.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => setShowApprovalModal(user.id)}
                          className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          aria-label={`Approve user ${user.name}`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setShowDeclineModal(user.id)}
                          className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          aria-label={`Decline user ${user.name}`}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {user.status === 'Inactive' && (
                      <button
                        onClick={() => setShowApprovalModal(user.id)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        aria-label={`Approve user ${user.name}`}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteModal(user.id)}
                      className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      aria-label={`Delete user ${user.name}`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedUsers.length === 0 && (
            <div className="p-4 text-center text-gray-500">No users found.</div>
          )}
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="md:hidden space-y-4">
          {paginatedUsers.map((user) => (
            <div key={user.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                  className="mr-2"
                  aria-label={`Select user ${user.name}`}
                />
                <UserCircleIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="font-medium">{user.name}</span>
              </div>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              <p className="text-sm text-gray-600">Type: {user.type}</p>
              <p className="text-sm text-gray-600">
                Status: <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' :
                    user.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {user.status}
                </span>
              </p>
              <p className="text-sm text-gray-600">Balance: ${user.walletBalance.toFixed(2)}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Link
                  to={`/users/${user.id}`}
                  className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  aria-label={`View details for ${user.name}`}
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View
                </Link>
                <button
                  onClick={() => handleEdit(user)}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  aria-label={`Edit user ${user.name}`}
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
                {user.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => setShowApprovalModal(user.id)}
                      className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      aria-label={`Approve user ${user.name}`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(user.id)}
                      className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      aria-label={`Decline user ${user.name}`}
                    >
                      Decline
                    </button>
                  </>
                )}
                {user.status === 'Inactive' && (
                  <button
                    onClick={() => setShowApprovalModal(user.id)}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    aria-label={`Approve user ${user.name}`}
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(user.id)}
                  className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  aria-label={`Delete user ${user.name}`}
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {paginatedUsers.length === 0 && (
            <div className="p-4 text-center text-gray-500">No users found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={usersPerPage}
              onChange={(e) => setUsersPerPage(parseInt(e.target.value))}
              className="p-2 border rounded-lg"
              aria-label="Select number of users per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {!loading && !error && auditLog.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Audit Log</h2>
          <ul className="space-y-2">
            {auditLog.map((log, index) => (
              <li key={index} className="text-sm text-gray-600">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Wallet Balance</label>
                <input
                  type="number"
                  value={balanceFilter.min}
                  onChange={(e) => setBalanceFilter({ ...balanceFilter, min: parseFloat(e.target.value) || '' })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Minimum wallet balance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Wallet Balance</label>
                <input
                  type="number"
                  value={balanceFilter.max}
                  onChange={(e) => setBalanceFilter({ ...balanceFilter, max: parseFloat(e.target.value) || '' })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Maximum wallet balance"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  aria-label="Cancel advanced filters"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  aria-label="Apply advanced filters"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Approve User</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to approve this user?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                aria-label="Cancel approval"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(showApprovalModal)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                aria-label="Confirm approval"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Decline User</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to decline this user?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeclineModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                aria-label="Cancel decline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecline(showDeclineModal)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                aria-label="Confirm decline"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Delete User</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this user?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                aria-label="Confirm delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="User name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="User email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={editUser.type}
                  onChange={(e) => setEditUser({ ...editUser, type: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="User type"
                >
                  <option value="Client">Client</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editUser.status}
                  onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="User status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Wallet Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={editUser.walletBalance}
                  onChange={(e) => setEditUser({ ...editUser, walletBalance: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  aria-label="User wallet balance"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  aria-label="Save user changes"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}