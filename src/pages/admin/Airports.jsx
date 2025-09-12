import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DocumentArrowDownIcon, PencilIcon, TrashIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { airports } from '../../data/fakeData';
import { FaPlane, FaPlaneDeparture } from 'react-icons/fa';

export default function Airports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [airportsPerPage, setAirportsPerPage] = useState(10);
  const [selectedAirports, setSelectedAirports] = useState([]);
  const [airportList, setAirportList] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [editAirport, setEditAirport] = useState(null);
  const [addAirport, setAddAirport] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Mock data
  useEffect(() => {
    const mockAirports = airports.map(airport => ({ ...airport, status: 'Active' }));
    setAirportList(mockAirports);
    setLoading(false);
    // Future API call: GET /api/airports
    // fetch('https://your-laravel-api.com/api/airports')
    //   .then(res => res.json())
    //   .then(data => setAirportList(data))
    //   .catch(err => setError('Failed to fetch airports'))
    //   .finally(() => setLoading(false));
  }, []);

  // Mock PKFARE search
  const handleSearchSelect = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    // Mock PKFARE API call: GET /api/pkfare/search?type=airport&q=query
    const mockResults = airports
      .filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || a.value.toLowerCase().includes(query.toLowerCase()))
      .map(a => ({ code: a.value, name: a.label, city: a.city, country: a.country }));
    setSearchResults(mockResults.slice(0, 5)); // Limit to 5 results
    // Future API call:
    // fetch(`https://pkfare-api.com/search?type=airport&q=${query}`)
    //   .then(res => res.json())
    //   .then(data => setSearchResults(data.results))
    //   .catch(err => toast.error('Failed to search airports'));
  };

  // Sorting logic
  const sortedAirports = useMemo(() => {
    let sortableAirports = [...airportList];
    if (sortConfig.key) {
      sortableAirports.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableAirports;
  }, [airportList, sortConfig]);

  // Filtering logic
  const filteredAirports = useMemo(() => {
    return sortedAirports.filter(airport => {
      const matchesSearch = airport.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           airport.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           airport.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !countryFilter || airport.country === countryFilter;
      const matchesStatus = !statusFilter || airport.status === statusFilter;
      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [sortedAirports, searchTerm, countryFilter, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAirports.length / airportsPerPage);
  const paginatedAirports = filteredAirports.slice((currentPage - 1) * airportsPerPage, currentPage * airportsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAirports.map(airport => ({
      'Airport Code': airport.value,
      'Airport Name': airport.label,
      'City': airport.city,
      'Country': airport.country,
      'Status': airport.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.sheet_add_aoa(worksheet, [['Airport Code', 'Airport Name', 'City', 'Country', 'Status']], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Airports');
    XLSX.writeFile(workbook, 'airports_export.xlsx');
    toast.success('Exported to Excel successfully!');
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle airport selection
  const handleSelectAirport = (code) => {
    setSelectedAirports(prev =>
      prev.includes(code) ? prev.filter(id => id !== code) : [...prev, code]
    );
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    setAirportList(airportList.map(airport =>
      selectedAirports.includes(airport.value) ? { ...airport, status: action === 'activate' ? 'Active' : 'Inactive' } : airport
    ));
    setAuditLog([...auditLog, { action: `Bulk ${action} for ${selectedAirports.length} airports`, timestamp: new Date().toISOString() }]);
    toast.success(`Bulk ${action} completed for ${selectedAirports.length} airports!`);
    setSelectedAirports([]);
    // Future API call: POST /api/airports/bulk
  };

  // Handle delete
  const handleDelete = (code) => {
    setAirportList(airportList.filter(airport => airport.value !== code));
    setAuditLog([...auditLog, { action: `Deleted airport ${code}`, timestamp: new Date().toISOString() }]);
    toast.success('Airport deleted successfully!');
    setShowDeleteModal(null);
    // Future API call: DELETE /api/airports/:code
  };

  // Handle edit
  const handleEdit = (airport) => {
    setEditAirport({ ...airport });
  };

  // Handle add
  const handleAdd = () => {
    setAddAirport({ value: '', label: '', city: '', country: '', status: 'Active' });
  };

  // Handle save (add/edit)
  const handleSave = (e) => {
    e.preventDefault();
    const isEdit = !!editAirport;
    const airport = isEdit ? editAirport : addAirport;
    if (!airport.value || !airport.label || !airport.city || !airport.country) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (isEdit) {
      setAirportList(airportList.map(a => a.value === airport.value ? airport : a));
      setAuditLog([...auditLog, { action: `Edited airport ${airport.value}`, timestamp: new Date().toISOString() }]);
      // Future API call: PUT /api/airports/:code
    } else {
      setAirportList([...airportList, airport]);
      setAuditLog([...auditLog, { action: `Added airport ${airport.value}`, timestamp: new Date().toISOString() }]);
      // Future API call: POST /api/airports
    }
    toast.success(`Airport ${isEdit ? 'updated' : 'added'} successfully!`);
    setEditAirport(null);
    setAddAirport(null);
  };

  // Handle select change
  const handleSelectChange = (selected) => {
    if (editAirport) {
      setEditAirport({ ...editAirport, value: selected.code, label: selected.name, city: selected.city, country: selected.country });
    } else {
      setAddAirport({ ...addAirport, value: selected.code, label: selected.name, city: selected.city, country: selected.country });
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Airports Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            aria-label="Add new airport"
          >
            Add Airport
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
              placeholder="Airport Code, Name, or City"
              aria-label="Search by airport code, name, or city"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Search</label>
          </div>
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Filter by country"
            >
              <option value="">All Countries</option>
              {[...new Set(airports.map(a => a.country))].sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Country</label>
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
            aria-label="Export airports to Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4 inline-block mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="flex overflow-x-auto mb-6 gap-2 py-2">
        {[
          { label: 'All', value: '', count: filteredAirports.length },
          { label: 'Active', value: 'Active', count: filteredAirports.filter(a => a.status === 'Active').length },
          { label: 'Inactive', value: 'Inactive', count: filteredAirports.filter(a => a.status === 'Inactive').length },
        ].map(({ label, value, count }) => (
          <div
            key={label}
            onClick={() => setStatusFilter(value)}
            className={`p-3 border rounded-lg cursor-pointer min-w-[120px] flex-shrink-0 ${
              statusFilter === value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
            }`}
            aria-label={`Filter by ${label} status`}
          >
            <span className="text-xs">{label}</span>
            <strong className={`text-sm ${statusFilter === value ? 'text-blue-600' : 'text-gray-800'}`}>{count}</strong>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedAirports.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => handleBulkAction('activate')}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            aria-label="Activate selected airports"
          >
            Activate Selected
          </button>
          <button
            onClick={() => handleBulkAction('deactivate')}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            aria-label="Deactivate selected airports"
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
                    checked={selectedAirports.length === filteredAirports.length && filteredAirports.length > 0}
                    onChange={() => setSelectedAirports(
                      selectedAirports.length === filteredAirports.length ? [] : filteredAirports.map(a => a.value)
                    )}
                    aria-label="Select all airports"
                  />
                </th>
                <th className="w-24 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('value')}>
                  Code {sortConfig.key === 'value' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-48 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('label')}>
                  Name {sortConfig.key === 'label' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-32 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('city')}>
                  City {sortConfig.key === 'city' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-32 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('country')}>
                  Country {sortConfig.key === 'country' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-28 p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-48 p-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedAirports.map((airport) => (
                <tr key={airport.value} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedAirports.includes(airport.value)}
                      onChange={() => handleSelectAirport(airport.value)}
                      aria-label={`Select airport ${airport.value}`}
                    />
                  </td>
                  <td className="p-3 truncate">{airport.value}</td>
                  <td politan className="p-3 truncate">{airport.label}</td>
                  <td className="p-3 truncate">{airport.city}</td>
                  <td className="p-3 truncate">{airport.country}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                        airport.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {airport.status === 'Active' && <CheckIcon className="w-4 h-4 mr-1" />}
                      {airport.status === 'Inactive' && <XMarkIcon className="w-4 h-4 mr-1" />}
                      {airport.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(airport)}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                      aria-label={`Edit airport ${airport.value}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(airport.value)}
                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                      aria-label={`Delete airport ${airport.value}`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedAirports.length === 0 && (
            <div className="p-4 text-center text-gray-500">No airports found.</div>
          )}
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="md:hidden space-y-4">
          {paginatedAirports.map((airport) => (
            <div key={airport.value} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedAirports.includes(airport.value)}
                  onChange={() => handleSelectAirport(airport.value)}
                  className="mr-2"
                  aria-label={`Select airport ${airport.value}`}
                />
                <FaPlaneDeparture className="w-5 h-5 text-gray-400 mr-2" />
                <span className="font-medium text-sm">{airport.value}</span>
              </div>
              <p className="text-xs text-gray-600">Name: {airport.label}</p>
              <p className="text-xs text-gray-600">City: {airport.city}</p>
              <p className="text-xs text-gray-600">Country: {airport.country}</p>
              <p className="text-xs text-gray-600">
                Status: <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                    airport.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {airport.status === 'Active' && <CheckIcon className="w-3 h-3 mr-1" />}
                  {airport.status === 'Inactive' && <XMarkIcon className="w-3 h-3 mr-1" />}
                  {airport.status}
                </span>
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleEdit(airport)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={`Edit airport ${airport.value}`}
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(airport.value)}
                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                  aria-label={`Delete airport ${airport.value}`}
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {paginatedAirports.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">No airports found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredAirports.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Show</span>
            <select
              value={airportsPerPage}
              onChange={(e) => setAirportsPerPage(parseInt(e.target.value))}
              className="p-2 border rounded-lg text-xs"
              aria-label="Select number of airports per page"
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
      {(editAirport || addAirport) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">{editAirport ? 'Edit Airport' : 'Add Airport'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Search Airport (PKFARE)</label>
                <Select
                  options={searchResults}
                  onInputChange={handleSearchSelect}
                  onChange={handleSelectChange}
                  placeholder="Search airport..."
                  className="mt-1"
                  aria-label="Search and select airport"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Airport Code</label>
                <input
                  type="text"
                  value={editAirport ? editAirport.value : addAirport.value}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (editAirport) setEditAirport({ ...editAirport, value });
                    else setAddAirport({ ...addAirport, value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  maxLength={3}
                  aria-label="Airport code"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Airport Name</label>
                <input
                  type="text"
                  value={editAirport ? editAirport.label : addAirport.label}
                  onChange={(e) => {
                    if (editAirport) setEditAirport({ ...editAirport, label: e.target.value });
                    else setAddAirport({ ...addAirport, label: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  aria-label="Airport name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={editAirport ? editAirport.city : addAirport.city}
                  onChange={(e) => {
                    if (editAirport) setEditAirport({ ...editAirport, city: e.target.value });
                    else setAddAirport({ ...addAirport, city: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  aria-label="City"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={editAirport ? editAirport.country : addAirport.country}
                  onChange={(e) => {
                    if (editAirport) setEditAirport({ ...editAirport, country: e.target.value });
                    else setAddAirport({ ...addAirport, country: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  aria-label="Country"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                  value={editAirport ? editAirport.status : addAirport.status}
                  onChange={(e) => {
                    if (editAirport) setEditAirport({ ...editAirport, status: e.target.value });
                    else setAddAirport({ ...addAirport, status: e.target.value });
                  }}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  aria-label="Airport status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditAirport(null);
                    setAddAirport(null);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={editAirport ? 'Save airport changes' : 'Add airport'}
                >
                  {editAirport ? 'Save' : 'Add'}
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
            <h3 className="text-sm font-semibold mb-4">Delete Airport</h3>
            <p className="text-xs text-gray-600 mb-4">Are you sure you want to delete this airport?</p>
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
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              role="option"
              aria-selected={inputValue === option.name}
            >
              {option.name} ({option.code}, {option.city}, {option.country})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}