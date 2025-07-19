import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DocumentArrowDownIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { airlines } from '../../data/fakeData';
import { FaPlane } from 'react-icons/fa';

export default function Airlines() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [airlinesPerPage, setAirlinesPerPage] = useState(10);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [airlineList, setAirlineList] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [editAirline, setEditAirline] = useState(null);
  const [addAirline, setAddAirline] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Mock data
  useEffect(() => {
    const mockAirlines = airlines.map(airline => ({ ...airline, status: 'Active' }));
    setAirlineList(mockAirlines);
    setLoading(false);
    // Future API call: GET /api/airlines
    // fetch('https://your-laravel-api.com/api/airlines')
    //   .then(res => res.json())
    //   .then(data => setAirlineList(data))
    //   .catch(err => setError('Failed to fetch airlines'))
    //   .finally(() => setLoading(false));
  }, []);

  // Mock PKFARE search
  const handleSearchSelect = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    // Mock PKFARE API call: GET /api/pkfare/search?type=airline&q=query
    const mockResults = airlines
      .filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.code.toLowerCase().includes(query.toLowerCase()))
      .map(a => ({ code: a.code, name: a.name, logo: a.logo }));
    setSearchResults(mockResults.slice(0, 5)); // Limit to 5 results
    // Future API call:
    // fetch(`https://pkfare-api.com/search?type=airline&q=${query}`)
    //   .then(res => res.json())
    //   .then(data => setSearchResults(data.results))
    //   .catch(err => toast.error('Failed to search airlines'));
  };

  // Sorting logic
  const sortedAirlines = useMemo(() => {
    let sortableAirlines = [...airlineList];
    if (sortConfig.key) {
      sortableAirlines.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableAirlines;
  }, [airlineList, sortConfig]);

  // Filtering logic
  const filteredAirlines = useMemo(() => {
    return sortedAirlines.filter(airline => {
      const matchesSearch = airline.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           airline.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || airline.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sortedAirlines, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAirlines.length / airlinesPerPage);
  const paginatedAirlines = filteredAirlines.slice((currentPage - 1) * airlinesPerPage, currentPage * airlinesPerPage);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAirlines.map(airline => ({
      'Airline Code': airline.code,
      'Airline Name': airline.name,
      'Logo': airline.logo,
      'Status': airline.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.sheet_add_aoa(worksheet, [['Airline Code', 'Airline Name', 'Logo', 'Status']], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Airlines');
    XLSX.writeFile(workbook, 'airlines_export.xlsx');
    toast.success('Exported to Excel successfully!');
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle airline selection
  const handleSelectAirline = (code) => {
    setSelectedAirlines(prev =>
      prev.includes(code) ? prev.filter(id => id !== code) : [...prev, code]
    );
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    setAirlineList(airlineList.map(airline =>
      selectedAirlines.includes(airline.code) ? { ...airline, status: action === 'activate' ? 'Active' : 'Inactive' } : airline
    ));
    setAuditLog([...auditLog, { action: `Bulk ${action} for ${selectedAirlines.length} airlines`, timestamp: new Date().toISOString() }]);
    toast.success(`Bulk ${action} completed for ${selectedAirlines.length} airlines!`);
    setSelectedAirlines([]);
    // Future API call: POST /api/airlines/bulk
  };

  // Handle delete
  const handleDelete = (code) => {
    setAirlineList(airlineList.filter(airline => airline.code !== code));
    setAuditLog([...auditLog, { action: `Deleted airline ${code}`, timestamp: new Date().toISOString() }]);
    toast.success('Airline deleted successfully!');
    setShowDeleteModal(null);
    // Future API call: DELETE /api/airlines/:code
  };

  // Handle edit
  const handleEdit = (airline) => {
    setEditAirline({ ...airline });
  };

  // Handle add
  const handleAdd = () => {
    setAddAirline({ code: '', name: '', logo: '', status: 'Active' });
  };

  // Handle save (add/edit)
  const handleSave = (e) => {
    e.preventDefault();
    const isEdit = !!editAirline;
    const airline = isEdit ? editAirline : addAirline;
    if (!airline.code || !airline.name) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (isEdit) {
      setAirlineList(airlineList.map(a => a.code === airline.code ? airline : a));
      setAuditLog([...auditLog, { action: `Edited airline ${airline.code}`, timestamp: new Date().toISOString() }]);
      // Future API call: PUT /api/airlines/:code
    } else {
      setAirlineList([...airlineList, airline]);
      setAuditLog([...auditLog, { action: `Added airline ${airline.code}`, timestamp: new Date().toISOString() }]);
      // Future API call: POST /api/airlines
    }
    toast.success(`Airline ${isEdit ? 'updated' : 'added'} successfully!`);
    setEditAirline(null);
    setAddAirline(null);
  };

  // Handle select change
  const handleSelectChange = (selected) => {
    if (editAirline) {
      setEditAirline({ ...editAirline, code: selected.code, name: selected.name, logo: selected.logo });
    } else {
      setAddAirline({ ...addAirline, code: selected.code, name: selected.name, logo: selected.logo });
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Airlines Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            aria-label="Add new airline"
          >
            Add Airline
          </button>
          <Link to="/" className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm" aria-label="Back to dashboard">
            Back
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Airline Code or Name"
              aria-label="Search by airline code or name"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Search</label>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Status</label>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-sm"
            aria-label="Export airlines to Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4 inline-block mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="flex overflow-x-auto mb-6 gap-2 py-2">
        {[
          { label: 'All', value: '', count: filteredAirlines.length },
          { label: 'Active', value: 'Active', count: filteredAirlines.filter(a => a.status === 'Active').length },
          { label: 'Inactive', value: 'Inactive', count: filteredAirlines.filter(a => a.status === 'Inactive').length },
        ].map(({ label, value, count }) => (
          <div
            key={label}
            onClick={() => setStatusFilter(value)}
            className={`p-3 border rounded-lg cursor-pointer min-w-[120px] flex-shrink-0 ${
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
      {selectedAirlines.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => handleBulkAction('activate')}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            aria-label="Activate selected airlines"
          >
            Activate Selected
          </button>
          <button
            onClick={() => handleBulkAction('deactivate')}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            aria-label="Deactivate selected airlines"
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
        <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-12 p-3">
                  <input
                    type="checkbox"
                    checked={selectedAirlines.length === filteredAirlines.length && filteredAirlines.length > 0}
                    onChange={() => setSelectedAirlines(
                      selectedAirlines.length === filteredAirlines.length ? [] : filteredAirlines.map(a => a.code)
                    )}
                    aria-label="Select all airlines"
                  />
                </th>
                <th className="w-24 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                  Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-48 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-32 p-3 text-left text-xs font-semibold text-gray-600">Logo</th>
                <th className="w-28 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-48 p-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedAirlines.map((airline) => (
                <tr key={airline.code} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedAirlines.includes(airline.code)}
                      onChange={() => handleSelectAirline(airline.code)}
                      aria-label={`Select airline ${airline.code}`}
                    />
                  </td>
                  <td className="p-3 truncate">{airline.code}</td>
                  <td className="p-3 truncate">{airline.name}</td>
                  <td className="p-3">
                    <img src={airline.logo} alt={`${airline.name} logo`} className="h-8 w-auto" />
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                        airline.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {airline.status === 'Active' && <CheckIcon className="w-4 h-4 mr-1" />}
                      {airline.status === 'Inactive' && <XMarkIcon className="w-4 h-4 mr-1" />}
                      {airline.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(airline)}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                      aria-label={`Edit airline ${airline.code}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(airline.code)}
                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                      aria-label={`Delete airline ${airline.code}`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedAirlines.length === 0 && (
            <div className="p-4 text-center text-gray-500">No airlines found.</div>
          )}
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="md:hidden space-y-4">
          {paginatedAirlines.map((airline) => (
            <div key={airline.code} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedAirlines.includes(airline.code)}
                  onChange={() => handleSelectAirline(airline.code)}
                  className="mr-2"
                  aria-label={`Select airline ${airline.code}`}
                />
                <FaPlane className="w-5 h-5 text-gray-400 mr-2" />
                <span className="font-medium text-sm">{airline.code}</span>
              </div>
              <p className="text-xs text-gray-600">Name: {airline.name}</p>
              <p className="text-xs text-gray-600">
                Status: <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                    airline.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {airline.status === 'Active' && <CheckIcon className="w-3 h-3 mr-1" />}
                  {airline.status === 'Inactive' && <XMarkIcon className="w-3 h-3 mr-1" />}
                  {airline.status}
                </span>
              </p>
              <div className="mt-2">
                <img src={airline.logo} alt={`${airline.name} logo`} className="h-6 w-auto" />
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleEdit(airline)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={`Edit airline ${airline.code}`}
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(airline.code)}
                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                  aria-label={`Delete airline ${airline.code}`}
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {paginatedAirlines.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">No airlines found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredAirlines.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Show</span>
            <select
              value={airlinesPerPage}
              onChange={(e) => setAirlinesPerPage(parseInt(e.target.value))}
              className="p-2 border rounded-lg text-xs"
              aria-label="Select number of airlines per page"
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
      {(editAirline || addAirline) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">{editAirline ? 'Edit Airline' : 'Add Airline'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Search Airline (PKFARE)</label>
                <Select
                  options={searchResults}
                  onInputChange={handleSearchSelect}
                  onChange={handleSelectChange}
                  placeholder="Search airline..."
                  className="mt-1"
                  aria-label="Search and select airline"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Airline Code</label>
                <input
                  type="text"
                  value={editAirline ? editAirline.code : addAirline.code}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (editAirline) setEditAirline({ ...editAirline, code: value });
                    else setAddAirline({ ...addAirline, code: value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  maxLength={2}
                  aria-label="Airline code"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Airline Name</label>
                <input
                  type="text"
                  value={editAirline ? editAirline.name : addAirline.name}
                  onChange={(e) => {
                    if (editAirline) setEditAirline({ ...editAirline, name: e.target.value });
                    else setAddAirline({ ...addAirline, name: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  aria-label="Airline name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Logo URL</label>
                <input
                  type="text"
                  value={editAirline ? editAirline.logo : addAirline.logo}
                  onChange={(e) => {
                    if (editAirline) setEditAirline({ ...editAirline, logo: e.target.value });
                    else setAddAirline({ ...addAirline, logo: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  aria-label="Airline logo URL"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                  value={editAirline ? editAirline.status : addAirline.status}
                  onChange={(e) => {
                    if (editAirline) setEditAirline({ ...editAirline, status: e.target.value });
                    else setAddAirline({ ...addAirline, status: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  aria-label="Airline status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditAirline(null);
                    setAddAirline(null);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={editAirline ? 'Save airline changes' : 'Add airline'}
                >
                  {editAirline ? 'Save' : 'Add'}
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
            <h3 className="text-sm font-semibold mb-4">Delete Airline</h3>
            <p className="text-xs text-gray-600 mb-4">Are you sure you want to delete this airline?</p>
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

// Mock Select component (replace with react-select or similar)
function Select({ options, onInputChange, onChange, placeholder, className }) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onInputChange(e.target.value);
  };

  const handleSelect = (option) => {
    onChange(option);
    setInputValue(option.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        aria-label="Search select input"
      />
      {isOpen && options.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <li
              key={option.code}
              onClick={() => handleSelect(option)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
              role="option"
              aria-selected={inputValue === option.name}
            >
              <img src={option.logo} alt={`${option.name} logo`} className="h-6 w-auto mr-2" />
              {option.name} ({option.code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}