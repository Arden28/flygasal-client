import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRightIcon, ClockIcon, CurrencyDollarIcon, DocumentCheckIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import { FaPlane } from 'react-icons/fa';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  // Airport code to name mapping
  const airportNames = {
    CDG: 'Paris Charles de Gaulle',
    CMN: 'Casablanca Mohammed V',
    JFK: 'New York JFK',
    LHR: 'London Heathrow',
  };

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
    const foundBooking = mockBookings.find(b => b.id === id);
    if (foundBooking) {
      setBooking(foundBooking);
      setLoading(false);
    } else {
      setError('Booking not found');
      setLoading(false);
    }
    // Future API call: GET /api/bookings/:id
    // fetch(`https://your-laravel-api.com/api/bookings/${id}`)
    //   .then(res => res.json())
    //   .then(data => setBooking(data))
    //   .catch(err => setError('Failed to fetch booking'))
    //   .finally(() => setLoading(false));
  }, [id]);

  // Handle issue ticket
  const handleIssueTicket = () => {
    setAuditLog([...auditLog, { action: `Issued ticket for booking ${id}`, timestamp: new Date().toISOString() }]);
    toast.success('Ticket issued successfully!');
    // Future API call: POST /api/bookings/:id/issue-ticket
  };

  // Handle refund
  const handleRefund = () => {
    setBooking({ ...booking, paymentStatus: 'Refunded', bookingStatus: 'Cancelled' });
    setAuditLog([...auditLog, { action: `Refunded booking ${id}`, timestamp: new Date().toISOString() }]);
    toast.success('Booking refunded successfully!');
    setShowRefundModal(false);
    // Future API call: POST /api/bookings/:id/refund
  };

  if (loading) return <div className="flex justify-center p-6"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>;

  return (
    <div className=" p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
          <FaPlane className="w-6 h-6 mr-2 text-blue-500" />
          Booking {booking.id}
        </h1>
        <Link to="/bookings" className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 text-sm" aria-label="Back to bookings">
          Back to Bookings
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {/* Flight Itinerary */}
        {booking.module === 'Flights' && booking.flightDetails && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Flight Itinerary</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FaPlane className="w-6 h-6 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">{booking.supplier} ({booking.flightDetails.flightNumber})</span>
                </div>
                <span className="text-xs font-semibold text-blue-600">{booking.flightDetails.cabin}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-lg font-semibold">{booking.flightDetails.origin}</p>
                  <p className="text-xs text-gray-600">{airportNames[booking.flightDetails.origin] || booking.flightDetails.origin}</p>
                  <p className="text-sm">{format(parseISO(booking.flightDetails.departureTime), 'HH:mm, MMM dd, yyyy')}</p>
                </div>
                <div className="flex-1 mx-4 text-center">
                  <ArrowRightIcon className="w-6 h-6 mx-auto text-gray-400" />
                  <p className="text-xs text-gray-600">
                    {booking.flightDetails.stops === 0 ? 'Non-stop' : `${booking.flightDetails.stops} stop${booking.flightDetails.stops > 1 ? 's' : ''}`}
                    {booking.flightDetails.stops > 0 && ` (${booking.flightDetails.stopoverAirportCodes.join(', ')})`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{booking.flightDetails.destination}</p>
                  <p className="text-xs text-gray-600">{airportNames[booking.flightDetails.destination] || booking.flightDetails.destination}</p>
                  <p className="text-sm">{format(parseISO(booking.flightDetails.arrivalTime), 'HH:mm, MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600"><strong>Booking Date:</strong> {booking.date}</p>
            <p className="text-sm text-gray-600"><strong>Module:</strong> {booking.module}</p>
            <p className="text-sm text-gray-600"><strong>Supplier:</strong> {booking.supplier}</p>
            <p className="text-sm text-gray-600"><strong>Traveller:</strong> {booking.traveller}</p>
            <p className="text-sm text-gray-600"><strong>Email:</strong> {booking.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Booking Status:</strong>
              <span
                className={`ml-2 px-2 py-1 text-sm font-semibold rounded-full ${
                  booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                  booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {booking.bookingStatus}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Payment Status:</strong>
              <span
                className={`ml-2 px-2 py-1 text-sm font-semibold rounded-full ${
                  booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'Unpaid' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {booking.paymentStatus}
              </span>
            </p>
            <p className="text-sm text-gray-600"><strong>Total:</strong> {booking.currency} {booking.total.toFixed(2)}</p>
            <p className="text-sm text-gray-600"><strong>PNR:</strong> {booking.pnr || 'N/A'}</p>
            <p className="text-sm text-gray-600"><strong>Payment Method:</strong> {booking.paymentMethod}</p>
            {booking.module === 'Flights' && booking.flightDetails && (
              <>
                <p className="text-sm text-gray-600"><strong>Baggage:</strong> {booking.flightDetails.baggage}</p>
                <p className="text-sm text-gray-600"><strong>Refundable:</strong> {booking.flightDetails.refundable ? 'Yes' : 'No'}</p>
              </>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-4">Booking Status Timeline</h2>
          <div className="flex items-center space-x-4">
            {['Booked', 'Confirmed', 'Ticketed'].map((status, index) => (
              <div key={status} className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${booking.bookingStatus === 'Confirmed' && index <= 1 || booking.bookingStatus === 'Ticketed' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                {index < 2 && <div className={`h-1 w-12 ${booking.bookingStatus === 'Confirmed' && index === 0 || booking.bookingStatus === 'Ticketed' ? 'bg-blue-500' : 'bg-gray-300'}`} />}
                <span className="text-sm ml-2">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flight Path Placeholder */}
        {booking.module === 'Flights' && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-4">Flight Path</h2>
            <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center text-sm text-gray-500">
              Flight path map (to be implemented with map API)
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Link to="/bookings" className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm" aria-label="Back to bookings">
            Back
          </Link>
          <a href="#" className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm" aria-label="View invoice">
            View Invoice
          </a>
          {booking.module === 'Flights' && booking.bookingStatus !== 'Ticketed' && (
            <button
              onClick={handleIssueTicket}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center"
              aria-label="Issue ticket"
            >
              <DocumentCheckIcon className="w-4 h-4 mr-1" />
              Issue Ticket
            </button>
          )}
          {booking.module === 'Flights' && booking.flightDetails?.refundable && booking.paymentStatus === 'Paid' && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center"
              aria-label="Refund booking"
            >
              <ArrowUturnLeftIcon className="w-4 h-4 mr-1" />
              Refund
            </button>
          )}
        </div>

        {/* Audit Log */}
        {auditLog.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-4">Audit Log</h2>
            <ul className="space-y-2">
              {auditLog.map((log, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {log.timestamp}: {log.action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-sm font-semibold mb-4">Refund Booking</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to refund this booking?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                aria-label="Cancel refund"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                aria-label="Confirm refund"
              >
                Refund
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}