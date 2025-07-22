import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TicketIcon, DocumentArrowDownIcon, PencilIcon, TrashIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [editBooking, setEditBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data
  useEffect(() => {
    const mockBookings = [
      {
        id: 'AT9002',
        date: '2025-07-20',
        module: 'Flights',
        supplier: 'Royal Air Maroc',
        traveller: 'John Doe',
        email: 'john.doe@example.com',
        bookingStatus: 'Confirmed',
        paymentStatus: 'Paid',
        total: 310,
        currency: 'USD',
        pnr: 'ABC123',
        paymentMethod: 'Visa',
        flightDetails: {
          airline: 'AT',
          origin: 'CDG',
          destination: 'CMN',
          departureTime: '2025-07-20T13:00:00Z',
          arrivalTime: '2025-07-20T16:45:00Z',
          flightNumber: 'AT801',
          stops: 0,
          stopoverAirportCodes: [],
          cabin: 'Economy',
          baggage: '23kg',
          refundable: true,
        },
      },
      {
        id: 'BKG67890',
        date: '2025-07-14',
        module: 'Hotels',
        supplier: 'SupplierName',
        traveller: 'Jane Smith',
        email: 'jane.smith@example.com',
        bookingStatus: 'Cancelled',
        paymentStatus: 'Unpaid',
        total: 300,
        currency: 'USD',
        pnr: null,
        paymentMethod: 'PayPal',
      },
    ];
    setBookings(mockBookings);
    setLoading(false);
    // Future API call: GET /api/bookings
    // fetch('https://your-laravel-api.com/api/bookings')
    //   .then(res => res.json())
    //   .then(data => setBookings(data.data))
    //   .catch(err => setError('Failed to fetch bookings'))
    //   .finally(() => setLoading(false));
  }, []);

  // Sorting logic
  const sortedBookings = useMemo(() => {
    let sortableBookings = [...bookings];
    if (sortConfig.key) {
      sortableBookings.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableBookings;
  }, [bookings, sortConfig]);

  // Filtering logic
  const filteredBookings = useMemo(() => {
    return sortedBookings.filter(booking => {
      const matchesSearch = booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.traveller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = !moduleFilter || booking.module === moduleFilter;
      const matchesBookingStatus = !bookingStatusFilter || booking.bookingStatus === bookingStatusFilter;
      const matchesPaymentStatus = !paymentStatusFilter || booking.paymentStatus === paymentStatusFilter;
      const matchesDate = !dateFilter || booking.date.includes(dateFilter);
      const matchesAmount = (!amountFilter.min || booking.total >= amountFilter.min) &&
                           (!amountFilter.max || booking.total <= amountFilter.max);
      return matchesSearch && matchesModule && matchesBookingStatus && matchesPaymentStatus && matchesDate && matchesAmount;
    });
  }, [sortedBookings, searchTerm, moduleFilter, bookingStatusFilter, paymentStatusFilter, dateFilter, amountFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredBookings.map(booking => ({
      'Booking ID': booking.id,
      'Booking Date': booking.date,
      Module: booking.module,
      Supplier: booking.supplier,
      Traveller: booking.traveller,
      Email: booking.email,
      'Booking Status': booking.bookingStatus,
      'Payment Status': booking.paymentStatus,
      Total: `${booking.currency} ${booking.total.toFixed(2)}`,
      PNR: booking.pnr || 'N/A',
      'Payment Method': booking.paymentMethod,
      'Flight Number': booking.flightDetails?.flightNumber || 'N/A',
      'Origin': booking.flightDetails?.origin || 'N/A',
      'Destination': booking.flightDetails?.destination || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.sheet_add_aoa(worksheet, [['Booking ID', 'Booking Date', 'Module', 'Supplier', 'Traveller', 'Email', 'Booking Status', 'Payment Status', 'Total', 'PNR', 'Payment Method', 'Flight Number', 'Origin', 'Destination']], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    XLSX.writeFile(workbook, 'bookings_export.xlsx');
    toast.success('Exported to Excel successfully!');
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle booking selection
  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId) ? prev.filter(id => id !== bookingId) : [...prev, bookingId]
    );
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    setBookings(bookings.map(booking =>
      selectedBookings.includes(booking.id) ? { ...booking, bookingStatus: action === 'confirm' ? 'Confirmed' : 'Cancelled' } : booking
    ));
    setAuditLog([...auditLog, { action: `Bulk ${action} for ${selectedBookings.length} bookings`, timestamp: new Date().toISOString() }]);
    toast.success(`Bulk ${action} completed for ${selectedBookings.length} bookings!`);
    setSelectedBookings([]);
    // Future API call: POST /api/bookings/bulk
  };

  // Handle confirm
  const handleConfirm = (bookingId) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, bookingStatus: 'Confirmed' } : booking
    ));
    setAuditLog([...auditLog, { action: `Confirmed booking ${bookingId}`, timestamp: new Date().toISOString() }]);
    toast.success('Booking confirmed successfully!');
    setShowConfirmModal(null);
    // Future API call: POST /api/bookings/:id/confirm
  };

  // Handle cancel
  const handleCancel = (bookingId) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, bookingStatus: 'Cancelled' } : booking
    ));
    setAuditLog([...auditLog, { action: `Cancelled booking ${bookingId}`, timestamp: new Date().toISOString() }]);
    toast.success('Booking cancelled successfully!');
    setShowCancelModal(null);
    // Future API call: POST /api/bookings/:id/cancel
  };

  // Handle delete
  const handleDelete = (bookingId) => {
    setBookings(bookings.filter(booking => booking.id !== bookingId));
    setAuditLog([...auditLog, { action: `Deleted booking ${bookingId}`, timestamp: new Date().toISOString() }]);
    toast.success('Booking deleted successfully!');
    setShowDeleteModal(null);
    // Future API call: DELETE /api/bookings/:id
  };

  // Handle issue PNR
  const handleIssuePNR = (bookingId) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, pnr: `PNR${Math.floor(100000 + Math.random() * 900000)}` } : booking
    ));
    setAuditLog([...auditLog, { action: `Issued PNR for booking ${bookingId}`, timestamp: new Date().toISOString() }]);
    toast.success('PNR issued successfully!');
    // Future API call: POST /api/bookings/:id/issue-pnr
  };

  // Handle edit
  const handleEdit = (booking) => {
    setEditBooking({ ...booking });
  };

  // Handle save edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editBooking.traveller || !editBooking.email.includes('@') || editBooking.total < 0) {
      toast.error('Please fill all fields correctly.');
      return;
    }
    setBookings(bookings.map(booking =>
      booking.id === editBooking.id ? editBooking : booking
    ));
    setAuditLog([...auditLog, { action: `Edited booking ${editBooking.id}`, timestamp: new Date().toISOString() }]);
    toast.success('Booking updated successfully!');
    setEditBooking(null);
    // Future API call: PUT /api/bookings/:id
  };

  return (
    <div className="relative max-w-full mx-auto p-2 xs:p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 bg-white rounded-lg shadow p-3 xs:p-4 sm:p-5">
        <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">Bookings Management</h1>
        <Link to="/" className="bg-yellow-500 text-white px-3 py-1.5 xs:px-4 xs:py-2 rounded-lg hover:bg-yellow-600 text-xs sm:text-sm transition-colors duration-200" aria-label="Back to dashboard">
          Back
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-3 xs:p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
        <form className="grid grid-cols-1 gap-3 xs:gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 xs:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm focus:outline-none"
              placeholder="Booking ID, Traveller, or Email"
              aria-label="Search by booking ID, traveller, or email"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Search</label>
          </div>
          <div className="relative">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full p-2 xs:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none focus:outline-none"
              aria-label="Filter by module"
            >
              <option value="">All Modules</option>
              <option value="Hotels">Hotels</option>
              <option value="Flights">Flights</option>
              <option value="Tours">Tours</option>
              <option value="Cars">Cars</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Module</label>
          </div>
          <div className="relative">
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="w-full p-2 xs:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none focus:outline-none"
              aria-label="Filter by booking status"
            >
              <option value="">All Booking Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Booking Status</label>
          </div>
          <div className="relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full p-2 xs:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none focus:outline-none"
              aria-label="Filter by payment status"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Refunded">Refunded</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Payment Status</label>
          </div>
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 xs:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm focus:outline-none"
              aria-label="Filter by booking date"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Booking Date</label>
          </div>
        </form>
        <div className="mt-3 xs:mt-4 flex flex-wrap gap-2 xs:gap-3">
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="bg-blue-500 text-white px-3 py-1.5 xs:px-4 xs:py-2 rounded-lg hover:bg-blue-600 text-xs xs:text-sm transition-colors duration-200 touch-manipulation"
            aria-label="Open advanced filters"
          >
            Advanced Filters
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            className="bg-green-500 text-white px-3 py-1.5 xs:px-4 xs:py-2 rounded-lg hover:bg-green-600 text-xs xs:text-sm transition-colors duration-200 touch-manipulation"
            aria-label="Export bookings to Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4 xs:w-5 xs:h-5 inline-block mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Payment Filter Cards */}
      <div className="flex overflow-x-auto mb-4 sm:mb-6 gap-2 xs:gap-3 py-2 snap-x snap-mandatory scrollbar-hide">
        {[
          { label: 'All', value: '', count: filteredBookings.length },
          { label: 'Succeeded', value: 'Paid', count: filteredBookings.filter(b => b.paymentStatus === 'Paid').length },
          { label: 'Refunded', value: 'Refunded', count: filteredBookings.filter(b => b.paymentStatus === 'Refunded').length },
          { label: 'Disputed', value: 'Disputed', count: filteredBookings.filter(b => b.paymentStatus === 'Disputed').length },
          { label: 'Failed', value: 'Unpaid', count: filteredBookings.filter(b => b.paymentStatus === 'Unpaid').length },
          { label: 'Uncaptured', value: 'Uncaptured', count: filteredBookings.filter(b => b.paymentStatus === 'Uncaptured').length },
        ].map(({ label, value, count }) => (
          <div
            key={label}
            onClick={() => setPaymentStatusFilter(value)}
            className={`p-2 xs:p-3 border rounded-lg cursor-pointer min-w-[90px] xs:min-w-[100px] sm:min-w-[110px] flex-shrink-0 snap-center touch-manipulation ${
              paymentStatusFilter === value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'
            }`}
            aria-label={`Filter by ${label} payment status`}
          >
            <span className="text-xs xs:text-sm">{label}</span>
            <strong className={`text-sm xs:text-base ${paymentStatusFilter === value ? 'text-indigo-600' : 'text-gray-800'}`}>{count}</strong>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 xs:gap-3">
          <button
            onClick={() => handleBulkAction('confirm')}
            className="px-3 py-1.5 xs:px-4 xs:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs xs:text-sm transition-colors duration-200 touch-manipulation"
            aria-label="Confirm selected bookings"
          >
            Confirm Selected
          </button>
          <button
            onClick={() => handleBulkAction('cancel')}
            className="px-3 py-1.5 xs:px-4 xs:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs xs:text-sm transition-colors duration-200 touch-manipulation"
            aria-label="Cancel selected bookings"
          >
            Cancel Selected
          </button>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center p-4 xs:p-6">
          <div className="animate-spin h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {error && (
        <div className="p-4 xs:p-6 bg-red-100 text-red-800 rounded-lg mb-4 xs:mb-6 text-xs xs:text-sm">{error}</div>
      )}

      {/* Desktop Table */}
      {!loading && !error && (
        <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-10 p-2 xs:p-3">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onChange={() => setSelectedBookings(
                      selectedBookings.length === filteredBookings.length ? [] : filteredBookings.map(b => b.id)
                    )}
                    className="h-4 w-4 xs:h-5 xs:w-5"
                    aria-label="Select all bookings"
                  />
                </th>
                <th className="w-20 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                  Booking ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-24 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                  Booking Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-28 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('module')}>
                  Module {sortConfig.key === 'module' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-28 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('traveller')}>
                  Traveller {sortConfig.key === 'traveller' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-36 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                  Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-24 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('bookingStatus')}>
                  Booking Status {sortConfig.key === 'bookingStatus' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-24 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('paymentStatus')}>
                  Payment Status {sortConfig.key === 'paymentStatus' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-20 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total')}>
                  Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-20 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600">PNR</th>
                <th className="w-60 p-2 xs:p-3 text-left text-xs xs:text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="p-2 xs:p-3">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => handleSelectBooking(booking.id)}
                      className="h-4 w-4 xs:h-5 xs:w-5"
                      aria-label={`Select booking ${booking.id}`}
                    />
                  </td>
                  <td className="p-2 xs:p-3 text-xs xs:text-sm truncate">{booking.id}</td>
                  <td className="p-2 xs:p-3 text-xs xs:text-sm truncate">{booking.date}</td>
                  <td className="p-2 xs:p-3">
                    <div className="flex items-center">
                      <span
                        className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-white text-[10px] xs:text-xs mr-1 xs:mr-2 ${
                          booking.paymentMethod === 'Visa' ? 'bg-blue-700' :
                          booking.paymentMethod === 'PayPal' ? 'bg-black' :
                          'bg-green-500'
                        }`}
                      >
                        {booking.paymentMethod[0]}
                      </span>
                      <span className="text-xs xs:text-sm truncate">{booking.supplier}</span>
                    </div>
                  </td>
                  <td className="p-2 xs:p-3 text-xs xs:text-sm truncate">{booking.traveller}</td>
                  <td className="p-2 xs:p-3 text-xs xs:text-sm truncate">{booking.email}</td>
                  <td className="p-2 xs:p-3">
                    <span
                      className={`px-2 py-1 text-[10px] xs:text-xs font-semibold rounded-full flex items-center ${
                        booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.bookingStatus === 'Confirmed' && <CheckIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />}
                      {booking.bookingStatus === 'Cancelled' && <XMarkIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />}
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="p-2 xs:p-3">
                    <span
                      className={`px-2 py-1 text-[10px] xs:text-xs font-semibold rounded-full ${
                        booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        booking.paymentStatus === 'Unpaid' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="p-2 xs:p-3 text-xs xs:text-sm"><strong>{booking.currency} {booking.total.toFixed(2)}</strong></td>
                  <td className="p-2 xs:p-3 text-xs xs:text-sm">
                    {booking.pnr ? booking.pnr : (
                      <button
                        onClick={() => handleIssuePNR(booking.id)}
                        className="px-2 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-[10px] xs:text-xs touch-manipulation"
                        aria-label={`Issue PNR for booking ${booking.id}`}
                      >
                        Issue PNR
                      </button>
                    )}
                  </td>
                  <td className="p-2 xs:p-3 flex flex-wrap gap-1 xs:gap-2">
                    <Link
                      to={`/admin/flights/bookings/${booking.id}`}
                      className="flex items-center px-2 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-[10px] xs:text-xs touch-manipulation"
                      aria-label={`View details for booking ${booking.id}`}
                    >
                      <EyeIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                      View
                    </Link>
                    <button
                      onClick={() => handleEdit(booking)}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[10px] xs:text-xs touch-manipulation"
                      aria-label={`Edit booking ${booking.id}`}
                    >
                      <PencilIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                      Edit
                    </button>
                    {booking.bookingStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => setShowConfirmModal(booking.id)}
                          className="flex items-center px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-[10px] xs:text-xs touch-manipulation"
                          aria-label={`Confirm booking ${booking.id}`}
                        >
                          <CheckIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowCancelModal(booking.id)}
                          className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px] xs:text-xs touch-manipulation"
                          aria-label={`Cancel booking ${booking.id}`}
                        >
                          <XMarkIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDeleteModal(booking.id)}
                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px] xs:text-xs touch-manipulation"
                      aria-label={`Delete booking ${booking.id}`}
                    >
                      <TrashIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                      Delete
                    </button>
                    <a
                      href="#"
                      className="flex items-center px-2 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-[10px] xs:text-xs touch-manipulation"
                      aria-label={`View invoice for booking ${booking.id}`}
                    >
                      Invoice
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedBookings.length === 0 && (
            <div className="p-4 xs:p-6 text-center text-gray-500 text-xs xs:text-sm">No bookings found.</div>
          )}
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="md:hidden space-y-3 xs:space-y-4">
          {paginatedBookings.map((booking) => (
            <div key={booking.id} className="bg-white p-3 xs:p-4 rounded-lg shadow">
              <div className="flex items-center mb-2 xs:mb-3">
                <input
                  type="checkbox"
                  checked={selectedBookings.includes(booking.id)}
                  onChange={() => handleSelectBooking(booking.id)}
                  className="h-4 w-4 xs:h-5 xs:w-5 mr-2"
                  aria-label={`Select booking ${booking.id}`}
                />
                <TicketIcon className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 mr-2" />
                <span className="font-medium text-xs xs:text-sm">{booking.id}</span>
              </div>
              <p className="text-xs xs:text-sm text-gray-600">Date: {booking.date}</p>
              <p className="text-xs xs:text-sm text-gray-600">
                Module: <span
                  className={`w-4 h-4 xs:w-5 xs:h-5 rounded flex items-center justify-center text-white text-[10px] xs:text-xs mr-1 inline-block ${
                    booking.paymentMethod === 'Visa' ? 'bg-blue-700' :
                    booking.paymentMethod === 'PayPal' ? 'bg-black' :
                    'bg-green-500'
                  }`}
                >
                  {booking.paymentMethod[0]}
                </span>
                {booking.supplier}
              </p>
              <p className="text-xs xs:text-sm text-gray-600">Traveller: {booking.traveller}</p>
              <p className="text-xs xs:text-sm text-gray-600">Email: {booking.email}</p>
              <p className="text-xs xs:text-sm text-gray-600">
                Booking Status: <span
                  className={`px-2 py-1 text-[10px] xs:text-xs font-semibold rounded-full flex items-center ${
                    booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                    booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {booking.bookingStatus === 'Confirmed' && <CheckIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />}
                  {booking.bookingStatus === 'Cancelled' && <XMarkIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />}
                  {booking.bookingStatus}
                </span>
              </p>
              <p className="text-xs xs:text-sm text-gray-600">
                Payment Status: <span
                  className={`px-2 py-1 text-[10px] xs:text-xs font-semibold rounded-full ${
                    booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'Unpaid' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {booking.paymentStatus}
                </span>
              </p>
              <p className="text-xs xs:text-sm text-gray-600">Total: {booking.currency} {booking.total.toFixed(2)}</p>
              <p className="text-xs xs:text-sm text-gray-600">
                PNR: {booking.pnr || (
                  <button
                    onClick={() => handleIssuePNR(booking.id)}
                    className="px-2 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-[10px] xs:text-xs touch-manipulation"
                    aria-label={`Issue PNR for booking ${booking.id}`}
                  >
                    Issue PNR
                  </button>
                )}
              </p>
              <div className="mt-2 xs:mt-3 flex flex-wrap gap-1 xs:gap-2">
                <Link
                  to={`/admin/flights/bookings/${booking.id}`}
                  className="flex items-center px-2 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-[10px] xs:text-xs touch-manipulation"
                  aria-label={`View details for booking ${booking.id}`}
                >
                  <EyeIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                  View
                </Link>
                <button
                  onClick={() => handleEdit(booking)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[10px] xs:text-xs touch-manipulation"
                  aria-label={`Edit booking ${booking.id}`}
                >
                  <PencilIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                  Edit
                </button>
                {booking.bookingStatus === 'Pending' && (
                  <>
                    <button
                      onClick={() => setShowConfirmModal(booking.id)}
                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-[10px] xs:text-xs touch-manipulation"
                      aria-label={`Confirm booking ${booking.id}`}
                    >
                      <CheckIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowCancelModal(booking.id)}
                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px] xs:text-xs touch-manipulation"
                      aria-label={`Cancel booking ${booking.id}`}
                    >
                      <XMarkIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDeleteModal(booking.id)}
                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px] xs:text-xs touch-manipulation"
                  aria-label={`Delete booking ${booking.id}`}
                >
                  <TrashIcon className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                  Delete
                </button>
                <a
                  href="#"
                  className="flex items-center px-2 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-[10px] xs:text-xs touch-manipulation"
                  aria-label={`View invoice for booking ${booking.id}`}
                >
                  Invoice
                </a>
              </div>
            </div>
          ))}
          {paginatedBookings.length === 0 && (
            <div className="p-4 xs:p-6 text-center text-gray-500 text-xs xs:text-sm">No bookings found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="flex flex-col xs:flex-row justify-between items-center mt-4 xs:mt-6 gap-3 xs:gap-4">
          <div className="flex items-center gap-2 xs:gap-3">
            <span className="text-xs xs:text-sm text-gray-600">Show</span>
            <select
              value={bookingsPerPage}
              onChange={(e) => setBookingsPerPage(parseInt(e.target.value))}
              className="p-2 xs:p-3 border rounded-lg text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select number of bookings per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs xs:text-sm text-gray-600">per page</span>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 xs:px-4 xs:py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 text-xs xs:text-sm min-w-[80px] touch-manipulation"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-xs xs:text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 xs:px-4 xs:py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 text-xs xs:text-sm min-w-[80px] touch-manipulation"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {!loading && !error && auditLog.length > 0 && (
        <div className="mt-4 xs:mt-6 bg-white p-3 xs:p-4 rounded-lg shadow">
          <h2 className="text-xs xs:text-sm font-semibold mb-3 xs:mb-4">Audit Log</h2>
          <ul className="space-y-2">
            {auditLog.map((log, index) => (
              <li key={index} className="text-xs xs:text-sm text-gray-600">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 xs:p-5 sm:p-6 rounded-lg shadow-lg w-full max-w-[90vw] xs:max-w-[400px] sm:max-w-md mx-2">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">Advanced Filters</h3>
            <form className="space-y-3 xs:space-y-4">
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Min Amount</label>
                <input
                  type="number"
                  value={amountFilter.min}
                  onChange={(e) => setAmountFilter({ ...amountFilter, min: parseFloat(e.target.value) || '' })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm"
                  aria-label="Minimum amount"
                />
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Max Amount</label>
                <input
                  type="number"
                  value={amountFilter.max}
                  onChange={(e) => setAmountFilter({ ...amountFilter, max: parseFloat(e.target.value) || '' })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm"
                  aria-label="Maximum amount"
                />
              </div>
              <div className="flex justify-end gap-2 xs:gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-3 py-1.5 xs:px-4 xs:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs xs:text-sm touch-manipulation"
                  aria-label="Cancel advanced filters"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-3 py-1.5 xs:px-4 xs:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs xs:text-sm touch-manipulation"
                  aria-label="Apply advanced filters"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 xs:p-5 sm:p-6 rounded-lg shadow-lg w-full max-w-[90vw] xs:max-w-[360px] sm:max-w-sm mx-2">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">Confirm Booking</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-3 xs:mb-4">Are you sure you want to confirm this booking?</p>
            <div className="flex justify-end gap-2 xs:gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-3 py-1.5 xs:px-4 xs:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs xs:text-sm touch-manipulation"
                aria-label="Cancel confirmation"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm(showConfirmModal)}
                className="px-3 py-1.5 xs:px-4 xs:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs xs:text-sm touch-manipulation"
                aria-label="Confirm booking"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 xs:p-5 sm:p-6 rounded-lg shadow-lg w-full max-w-[90vw] xs:max-w-[360px] sm:max-w-sm mx-2">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">Cancel Booking</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-3 xs:mb-4">Are you sure you want to cancel this booking?</p>
            <div className="flex justify-end gap-2 xs:gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="px-3 py-1.5 xs:px-4 xs:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs xs:text-sm touch-manipulation"
                aria-label="Cancel cancellation"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                className="px-3 py-1.5 xs:px-4 xs:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs xs:text-sm touch-manipulation"
                aria-label="Confirm cancellation"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 xs:p-5 sm:p-6 rounded-lg shadow-lg w-full max-w-[90vw] xs:max-w-[360px] sm:max-w-sm mx-2">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">Delete Booking</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-3 xs:mb-4">Are you sure you want to delete this booking?</p>
            <div className="flex justify-end gap-2 xs:gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1.5 xs:px-4 xs:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs xs:text-sm touch-manipulation"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-3 py-1.5 xs:px-4 xs:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs xs:text-sm touch-manipulation"
                aria-label="Confirm deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 xs:p-5 sm:p-6 rounded-lg shadow-lg w-full max-w-[90vw] xs:max-w-[400px] sm:max-w-md mx-2">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">Edit Booking</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 xs:space-y-4">
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Traveller</label>
                <input
                  type="text"
                  value={editBooking.traveller}
                  onChange={(e) => setEditBooking({ ...editBooking, traveller: e.target.value })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm"
                  required
                  aria-label="Traveller name"
                />
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editBooking.email}
                  onChange={(e) => setEditBooking({ ...editBooking, email: e.target.value })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm"
                  required
                  aria-label="Traveller email"
                />
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Module</label>
                <select
                  value={editBooking.module}
                  onChange={(e) => setEditBooking({ ...editBooking, module: e.target.value })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none"
                  required
                  aria-label="Booking module"
                >
                  <option value="Hotels">Hotels</option>
                  <option value="Flights">Flights</option>
                  <option value="Tours">Tours</option>
                  <option value="Cars">Cars</option>
                </select>
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Booking Status</label>
                <select
                  value={editBooking.bookingStatus}
                  onChange={(e) => setEditBooking({ ...editBooking, bookingStatus: e.target.value })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none"
                  required
                  aria-label="Booking status"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  value={editBooking.paymentStatus}
                  onChange={(e) => setEditBooking({ ...editBooking, paymentStatus: e.target.value })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none"
                  required
                  aria-label="Payment status"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBooking.total}
                  onChange={(e) => setEditBooking({ ...editBooking, total: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm"
                  required
                  min="0"
                  aria-label="Booking total"
                />
              </div>
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={editBooking.currency}
                  onChange={(e) => setEditBooking({ ...editBooking, currency: e.target.value })}
                  className="mt-1 w-full p-2 xs:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm appearance-none"
                  required
                  aria-label="Currency"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 xs:gap-3">
                <button
                  type="button"
                  onClick={() => setEditBooking(null)}
                  className="px-3 py-1.5 xs:px-4 xs:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs xs:text-sm touch-manipulation"
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 xs:px-4 xs:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs xs:text-sm touch-manipulation"
                  aria-label="Save booking changes"
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