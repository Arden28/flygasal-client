import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiService from '../../api/apiService';

export default function UserRoles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rolesPerPage, setRolesPerPage] = useState(10);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [editRole, setEditRole] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data
  // useEffect(() => {
  //   const mockRoles = [
  //     {
  //       id: 'ROLE001',
  //       name: 'Admin',
  //       description: 'Full system access',
  //       status: 'Active',
  //       permissions: ['manage_users', 'manage_roles', 'view_reports', 'edit_transactions'],
  //     },
  //     {
  //       id: 'ROLE002',
  //       name: 'Agent',
  //       description: 'Handles bookings and customer inquiries',
  //       status: 'Active',
  //       permissions: ['view_bookings', 'edit_bookings', 'view_transactions'],
  //     },
  //     {
  //       id: 'ROLE003',
  //       name: 'Viewer',
  //       description: 'Read-only access to reports',
  //       status: 'Inactive',
  //       permissions: ['view_reports'],
  //     },
  //   ];
  //   setRoles(mockRoles);
  //   setLoading(false);
  //   // Future API call: GET /api/roles
  //   // fetch('https://your-laravel-api.com/api/roles')
  //   //   .then(res => res.json())
  //   //   .then(data => setRoles(data.data))
  //   //   .catch(err => setError('Failed to fetch roles'))
  //   //   .finally(() => setLoading(false));
  // }, []);

  // Fetch user roles from backend API
  useEffect(() => {
    const fetchUserRoles = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/roles');
        // if (!response.ok) throw new Error('Failed to load email settings');
        const roles = response.data.data;
        // console.info(roles);
        setRoles(roles);
        setLoading(false);
      } catch (error) {
        setError('Failed to load user roles');
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, []);

  // Sorting logic
  const sortedRoles = useMemo(() => {
    let sortableRoles = [...roles];
    if (sortConfig.key) {
      sortableRoles.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableRoles;
  }, [roles, sortConfig]);

  // Filtering logic
  const filteredRoles = useMemo(() => {
    return sortedRoles.filter(role => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           role.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || role.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sortedRoles, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * rolesPerPage, currentPage * rolesPerPage);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle role selection
  const handleSelectRole = (id) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    setRoles(roles.map(r =>
      selectedRoles.includes(r.id) ? { ...r, status: action === 'activate' ? 'Active' : 'Inactive' } : r
    ));
    setAuditLog([...auditLog, { action: `Bulk ${action} for ${selectedRoles.length} roles`, timestamp: new Date().toISOString() }]);
    toast.success(`Bulk ${action} completed for ${selectedRoles.length} roles!`);
    setSelectedRoles([]);
    // Future API call: POST /api/roles/bulk
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      setRoles(roles.filter(r => r.id !== id));
      setAuditLog([...auditLog, { action: `Deleted role ${id}`, timestamp: new Date().toISOString() }]);
      setShowDeleteModal(null);

      await apiService.delete(`/admin/roles/${id}`);

      toast.success('Role deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Something went wrong. Could not delete role.');
    }
    // Future API call: DELETE /api/roles/:id
  };

  // Handle add/edit
  const handleSaveRole = (e) => {
    e.preventDefault();
    const roleData = editRole || { id: `ROLE${String(roles.length + 1).padStart(3, '0')}`, name: '', description: '', status: 'Active', permissions: [] };
    if (!roleData.name || !roleData.description || roleData.permissions.length === 0) {
      toast.error('Please fill all fields and select at least one permission.');
      return;
    }
    if (editRole) {
      setRoles(roles.map(r => r.id === roleData.id ? roleData : r));
      setAuditLog([...auditLog, { action: `Edited role ${roleData.id}`, timestamp: new Date().toISOString() }]);
      toast.success('Role updated successfully!');
      // Future API call: PUT /api/roles/:id
    } else {
      setRoles([...roles, roleData]);
      setAuditLog([...auditLog, { action: `Added role ${roleData.id}`, timestamp: new Date().toISOString() }]);
      toast.success('Role added successfully!');
      // Future API call: POST /api/roles
    }
    setEditRole(null);
    setShowAddModal(false);
  };

  // Permission options
  const permissionOptions = [
    'manage_users', 'manage_roles', 'view_reports', 'edit_transactions',
    'view_bookings', 'edit_bookings', 'view_transactions'
  ];

  return (
    <div className="relative max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">User Roles Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-xs"
            aria-label="Add new role"
          >
            Add Role
          </button>
          <Link to="/" className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 text-xs" aria-label="Back to dashboard">
            Back
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              placeholder="Role Name or Description"
              aria-label="Search by role name or description"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Search</label>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Status</label>
          </div>
        </form>
      </div>

      {/* Status Filter Cards */}
      <div className="flex overflow-x-auto mb-6 gap-2 py-2">
        {[
          { label: 'All', value: '', count: filteredRoles.length },
          { label: 'Active', value: 'Active', count: filteredRoles.filter(r => r.status === 'Active').length },
          { label: 'Inactive', value: 'Inactive', count: filteredRoles.filter(r => r.status === 'Inactive').length },
        ].map(({ label, value, count }) => (
          <div
            key={label}
            onClick={() => setStatusFilter(value)}
            className={`p-3 border rounded-lg cursor-pointer min-w-[100px] flex-shrink-0 ${
              statusFilter === value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'
            }`}
            aria-label={`Filter by ${label} status`}
          >
            <span className="text-xs">{label}</span>
            <strong className={`text-sm ${statusFilter === value ? 'text-indigo-600' : 'text-gray-800'}`}>{count}</strong>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedRoles.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => handleBulkAction('activate')}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
            aria-label="Activate selected roles"
          >
            Activate Selected
          </button>
          <button
            onClick={() => handleBulkAction('deactivate')}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
            aria-label="Deactivate selected roles"
          >
            Deactivate Selected
          </button>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && <div className="flex justify-center p-6"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}
      {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

      {/* Desktop Table */}
      {!loading && !error && (
        <div className="hidden md:block bg-white shadow rounded-lg max-w-full overflow-x-auto">
          <table className="min-w-[1000px] divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
                    onChange={() => setSelectedRoles(
                      selectedRoles.length === filteredRoles.length ? [] : filteredRoles.map(r => r.id)
                    )}
                    aria-label="Select all roles"
                  />
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                  Role ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Description</th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Permissions</th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleSelectRole(role.id)}
                      aria-label={`Select role ${role.id}`}
                    />
                  </td>
                  <td className="p-2 truncate">{role.id}</td>
                  <td className="p-2 truncate">{role.name}</td>
                  <td className="p-2 truncate">{role.description}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                        role.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {role.status === 'Active' ? <CheckIcon className="w-4 h-4 mr-1" /> : <XMarkIcon className="w-4 h-4 mr-1" />}
                      {role.status}
                    </span>
                  </td>
                  <td className="p-2 truncate">
                    {role.permissions.join(', ')}
                  </td>
                  <td className="p-2 flex flex-col gap-2">
                    <button
                      onClick={() => setEditRole(role)}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                      aria-label={`Edit role ${role.id}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(role.id)}
                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                      aria-label={`Delete role ${role.id}`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedRoles.length === 0 && (
            <div className="p-4 text-center text-gray-500">No roles found.</div>
          )}
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="md:hidden space-y-4">
          {paginatedRoles.map((role) => (
            <div key={role.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => handleSelectRole(role.id)}
                  className="mr-2"
                  aria-label={`Select role ${role.id}`}
                />
                <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="font-medium text-sm">{role.name}</span>
              </div>
              {/* <p className="text-xs text-gray-600">ID: {role.id}</p> */}
              <p className="text-xs text-gray-600">Description: {role.description}</p>
              <p className="text-xs text-gray-600">
                Status: <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                    role.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {role.status === 'Active' ? <CheckIcon className="w-3 h-3 mr-1" /> : <XMarkIcon className="w-3 h-3 mr-1" />}
                  {role.status}
                </span>
              </p>
              <p className="text-xs text-gray-600">Permissions: {role.permissions.join(', ')}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => setEditRole(role)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={`Edit role ${role.id}`}
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(role.id)}
                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                  aria-label={`Delete role ${role.id}`}
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {paginatedRoles.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">No roles found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredRoles.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Show</span>
            <select
              value={rolesPerPage}
              onChange={(e) => setRolesPerPage(parseInt(e.target.value))}
              className="p-2 border rounded-lg text-xs"
              aria-label="Select number of roles per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-600">per page</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 text-xs"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 text-xs"
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
          <h2 className="text-sm font-semibold mb-4">Audit Log</h2>
          <ul className="space-y-2">
            {auditLog.map((log, index) => (
              <li key={index} className="text-xs text-gray-600">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(editRole || showAddModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">{editRole ? 'Edit Role' : 'Add Role'}</h3>
            <form onSubmit={handleSaveRole} className="space-y-4">
                <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={editRole?.name || ''}
                    onChange={(e) => {
                    if (editRole) {
                        setEditRole({ ...editRole, name: e.target.value });
                    } else {
                        setEditRole({
                        name: e.target.value,
                        description: '',
                        status: 'Active',
                        permissions: [],
                        });
                    }
                    }}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    required
                    aria-label="Role name"
                />
                </div>

                <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <input
                    type="text"
                    value={editRole?.description || ''}
                    onChange={(e) => {
                    if (editRole) {
                        setEditRole({ ...editRole, description: e.target.value });
                    } else {
                        setEditRole({
                        name: '',
                        description: e.target.value,
                        status: 'Active',
                        permissions: [],
                        });
                    }
                    }}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    required
                    aria-label="Role description"
                />
                </div>

                <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                    value={editRole?.status || 'Active'}
                    onChange={(e) => {
                    if (editRole) {
                        setEditRole({ ...editRole, status: e.target.value });
                    } else {
                        setEditRole({
                        name: '',
                        description: '',
                        status: e.target.value,
                        permissions: [],
                        });
                    }
                    }}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    required
                    aria-label="Role status"
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
                </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Permissions</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {permissionOptions.map(perm => (
                    <label key={perm} className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={editRole ? editRole.permissions.includes(perm) : false}
                        onChange={(e) => {
                        const newPermissions = e.target.checked
                            ? [...(editRole?.permissions || []), perm]
                            : (editRole?.permissions || []).filter(p => p !== perm);

                            if (editRole) {
                                setEditRole({ ...editRole, permissions: newPermissions });
                            } else {
                                setEditRole({
                                name: '',
                                description: '',
                                status: 'Active',
                                permissions: newPermissions,
                                });
                            }
                        }}
                        className="mr-2"
                        aria-label={`Permission ${perm}`}
                      />
                      {perm.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEditRole(null); setShowAddModal(false); }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={editRole ? 'Save role changes' : 'Add role'}
                >
                  {editRole ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-sm font-semibold mb-4">Delete Role</h3>
            <p className="text-xs text-gray-600 mb-4">Are you sure you want to delete this role?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                aria-label="Confirm deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}