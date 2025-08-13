
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import flygasal from "../../api/flygasalService";
import { getAirlineLogo, getAirlineName, getAirportName } from "../../utils/utils";
import { formatDate, formatTime } from "../../utils/dateFormatter";
import html2canvas from 'html2canvas'; // Import html2canvas
import jsPDF from 'jspdf'; // Import jspdf

// Define payment gateways with their details (including placeholder icons)
const paymentGateways = [
  {
    value: "pay_later",
    name: "Pay Later",
    icon: (
      <img src="/assets/img/gateways/pay_later.png" style={{ height: "40px" }} alt="Pay Later" />
    ),
  },
  {
    value: "wallet",
    name: "Wallet Balance",
    icon: (
      <img src="/assets/img/gateways/wallet_balance.png" style={{ height: "40px" }} alt="Wallet Balance" />
    ),
  },
  {
    value: "paypal",
    name: "PayPal",
    icon: (
      <img src="/assets/img/gateways/paypal.png" style={{ height: "40px" }} alt="Paypal" />
    ),
  },
  {
    value: "stripe",
    name: "Stripe",
    icon: (
      <img src="/assets/img/gateways/stripe.png" style={{ height: "40px" }} alt="Stripe" />
    ),
  },
  {
    value: "bank_transfer",
    name: "Bank Transfer",
    icon: (
      <img src="/assets/img/gateways/bank_transfer.png" style={{ height: "40px" }} alt="Bank Transfer" />
    ),
  },
];

const ConfirmationSuccessPage = () => {
  const navigate = useNavigate();
  const { orderNumber } = useParams();

  // --- State management for booking data and UI feedback ---
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState("mpesa"); // State for selected gateway
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [showGatewaySelection, setShowGatewaySelection] = useState(false); // New state to control visibility
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // State for QR code URL
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false); // New state for PDF download loading

  // Ref to the invoice section for PDF generation
  const invoiceRef = useRef(null);

  const changeFormAction = (event) => {
    // Add your dynamic form action logic here
    const form = document.getElementById("form_gateway");
    if (form) {
      form.action = `payment/${event.target.value}`;
    }
  };

  // Duration: 30 minutes in seconds
  const TOTAL_SECONDS = 30 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef();
  const formRef = useRef(null); // Ref to the form element

  // Function to update the form action based on selected gateway
  const updateFormAction = (gatewayValue) => {
    if (formRef.current) {
      formRef.current.action = `payment/${gatewayValue}`;
    }
    setSelectedGateway(gatewayValue);
    setShowGatewaySelection(false); // Hide selection after a gateway is chosen
    setSearchTerm(""); // Clear search term when hiding
  };

  // --- `useEffect` hook for fetching data on mount ---
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const response = await flygasal.getBookingDetails(orderNumber);
        console.info('Booking Details:', response);
        const booking = response?.data?.data;
        console.info('booking: ', booking);
        const { errorCode, errorMsg } = response?.data || {};

        if (errorCode) {
          if (errorCode === 'B037') {
            setError('Order is not exists.');
          } else if (errorCode === 'B048') {
            setError('Invalid buyer.');
          } else {
            setError(errorMsg || 'Failed to load booking details.');
          }
        } else {
          setBookingData(booking);
          setError(null); // Clear any previous errors
          // Set initial form action after booking data is loaded
          updateFormAction(selectedGateway);

          // Generate QR Code URL
          if (orderNumber) {
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.href)}`);
          }
        }
      } catch (err) {
        console.error('Error loading confirmation:', err);
        setError('An unexpected error occurred. Please try again later.');
        setBookingData(null); // Ensure no old data is displayed
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [orderNumber]); // Dependency array to re-run if orderNumber changes

  // --- Timer `useEffect` hook ---
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Function to handle PDF download
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;

    setIsDownloadingPdf(true); // Set loading state

    try {
      const input = invoiceRef.current;

      // Ensure images are loaded before capturing
      const images = Array.from(input.querySelectorAll('img'));
      const imageLoadPromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Resolve even on error to not block PDF
        });
      });
      await Promise.all(imageLoadPromises);

      const canvas = await html2canvas(input, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // Enable cross-origin image loading if necessary
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${orderNumber}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      // You could display a user-friendly error message here
    } finally {
      setIsDownloadingPdf(false); // Reset loading state
    }
  };

  // Formatting mm:ss
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const progressPercent = (secondsLeft / TOTAL_SECONDS) * 100;

  // Filter gateways based on search term
  const filteredGateways = paymentGateways.filter((gateway) =>
    gateway.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the display name for the currently selected gateway
  const currentGateway = paymentGateways.find(g => g.value === selectedGateway);
  const displayGatewayName = currentGateway ? currentGateway.name : "Select Payment Method";

  // Function to get display properties for booking status
  const getBookingStatusDisplay = (status) => {
    let className = 'font-semibold';
    let text = status; // Default to the raw status if no specific mapping

    switch (status) {
      case 'ISS_PRC':
        className += ' text-blue-600'; // In progress
        text = 'Ticket is Issuing';
        break;
      case 'CHG_PRC':
        className += ' text-blue-600'; // In progress
        text = 'Change Order is Proceeding';
        break;
      case 'REFD_PRC':
        className += ' text-blue-600'; // In progress
        text = 'Refund Order is Proceeding';
        break;
      case 'VOID_PRC':
        className += ' text-blue-600'; // In progress
        text = 'Ticket is Voiding';
        break;
      case 'TO_BE_PAID':
        className += ' text-yellow-600'; // Pending payment
        text = 'To be Paid';
        break;
      case 'ISSED':
        className += ' text-green-600'; // Success
        text = 'Ticket Issued';
        break;
      case 'TO_BE_RSV':
        className += ' text-yellow-600'; // Pending reservation
        text = 'To be Reserved';
        break;
      case 'UNDER_REVIEW':
        className += ' text-yellow-600'; // Under review
        text = 'Under Review';
        break;
      case 'HOLD':
        className += ' text-orange-600'; // Action required
        text = 'Order is Holding (Contact Support)';
        break;
      case 'RSV_FAIL':
        className += ' text-red-600'; // Failed
        text = 'Reservation Failed';
        break;
      case 'CLOSED':
        className += ' text-gray-600'; // Closed
        text = 'Order Closed';
        break;
      case 'CNCL':
        className += ' text-red-600'; // Cancelled
        text = 'Order Cancelled';
        break;
      case 'CNCL_TO_BE_REIM':
        className += ' text-blue-600'; // Processing refund
        text = 'Cancelled, Reimbursement Processing';
        break;
      case 'CNCL_REIMED':
        className += ' text-green-600'; // Refunded
        text = 'Cancelled, Payment Reimbursed';
        break;
      case 'CHG_RQ':
        className += ' text-blue-600'; // Change requested
        text = 'Change Order Requested';
        break;
      case 'CHG_TO_BE_PAID':
        className += ' text-yellow-600'; // Change payment pending
        text = 'Change Order To Be Paid';
        break;
      case 'CHG_REJ':
        className += ' text-red-600'; // Change rejected
        text = 'Change Order Rejected';
        break;
      case 'CHGD':
        className += ' text-green-600'; // Changed successfully
        text = 'Order Changed';
        break;
      case 'REDF_RQ':
        className += ' text-blue-600'; // Refund requested
        text = 'Refund Order Under Review';
        break;
      case 'REFD_REJ':
        className += ' text-red-600'; // Refund rejected
        text = 'Refund Order Rejected';
        break;
      case 'REFD_TO_BE_REIM':
        className += ' text-blue-600'; // Refund processing
        text = 'Refunded To Be Reimbursed';
        break;
      case 'REFD_REIMED':
        className += ' text-green-600'; // Refunded and reimbursed
        text = 'Refunded and Reimbursed';
        break;
      case 'REFD':
        className += ' text-green-600'; // Refunded
        text = 'Refunded';
        break;
      case 'VOID_REJ':
        className += ' text-red-600'; // Void rejected
        text = 'Void Request Rejected';
        break;
      case 'VOID_TO_BE_REIM':
        className += ' text-blue-600'; // Void processing
        text = 'Void To Be Reimbursed';
        break;
      case 'VOID_REIMED':
        className += ' text-green-600'; // Voided and reimbursed
        text = 'Voided and Reimbursed';
        break;
      case 'VOID':
        className += ' text-green-600'; // Voided
        text = 'Voided';
        break;
      default:
        className += ' text-gray-800'; // Default neutral color
        break;
    }
    return { className, text };
  };

  // --- Conditional Rendering based on state ---
  if (loading) {
    return (
      <div className="container pt-5 pb-5 text-center" style={{ marginTop: "70px" }}>
        <h3>Loading booking details...</h3>
        {/* You can add a spinner or loading animation here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container pt-5 pb-5 text-center" style={{ marginTop: "70px" }}>
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  // --- The rest of your component's JSX with dynamic data ---
  const {
    passengers,
    journeys,
    fareDetails,
    paymentStatus,
    bookingStatus,
  } = bookingData || {};

  const { className: bookingStatusClassName, text: bookingStatusText } = getBookingStatusDisplay(bookingData.orderStatus);
  
  return (
    <div className="container pt-5 pb-5" style={{ maxWidth: "800px", marginTop: "70px" }}>
      {/* Timer */}
      <div className="card border-primary shadow-sm mb-3">
        <div className="card-body p-2">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-alarm" style={{ color: "#0d6efd" }}></i>
              <span className="text-primary fw-bold">Payment Time</span>
            </div>
            <div id="timer" className="fw-bold fs-5 text-primary">
              {minutes}:{secs}
            </div>
          </div>
          <div className="progress mt-1" style={{ height: "4px" }}>
            <div
              className="progress-bar bg-primary"
              id="timer-progress"
              role="progressbar"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {secondsLeft <= 0 && <div id="expired" className="alert alert-warning text-center">⏰ Payment time expired!</div>}

      {/* Invoice */}
      <button
        className="btn btn-primary mb-3 w-100 no_print"
        onClick={() => navigate("/")}
      >
        Back to Home
      </button>

      <div className="card p-3 mx-auto rounded-4 shadow-sm" id="invoice" ref={invoiceRef}>
        <div className="border p-3 mb-3 rounded-4">
          <div className="row">
            <div className="col-sm-4 d-flex align-items-center justify-content-center">
              <img
                src="/assets/img/logo/flygasal.png"
                style={{ maxWidth: "140px" }}
                className="logo px-1 rounded"
                alt="Logo"
              />
            </div>
            <div className="col-sm-8 text-right invoice_contact d-flex justify-content-end gap-3">
              <div>
                <p className="mb-0 text-start">
                  <strong>Payment Status:</strong>{" "}
                  <span className={paymentStatus === 'unpaid' ? 'text-danger' : 'text-success'}>{paymentStatus}</span>
                </p>
                <p className="mb-0 text-start">
                  <strong>Booking Status:</strong>{" "}
                  <span className={bookingStatusClassName}>{bookingStatusText}</span>
                </p>
                <p className="mb-0 text-start">
                  <strong>Phone:</strong> +254 700 000 000
                </p>
                <p className="mb-0 text-start">
                  <strong>Email:</strong> example@email.com
                </p>
              </div>
              <div id="InvoiceQR" className="flex-shrink-0" style={{ width: "80px", height: "80px" }}>
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    style={{ maxWidth: "80px" }}
                    alt={`QR Code for order ${orderNumber}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80x80/cccccc/000000?text=QR+Error"; }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500 rounded">
                    QR Loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Selection Form */}
        <form ref={formRef} action={`payment/${selectedGateway}`} method="post" className="border border-blue-200 p-4 rounded-lg mb-6">
          <h4 className="text-xl font-semibold mb-3 text-gray-800">Pay With</h4>

          {!showGatewaySelection ? (
            <div
              className="flex gap-2 p-2 justify-content-between border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-50 hover:border-blue-300"
              onClick={() => setShowGatewaySelection(true)}
            >
                {currentGateway && currentGateway.icon}
                <span className="text-lg font-medium text-gray-800">{displayGatewayName}</span>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search payment gateways..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Payment Gateway Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredGateways.length > 0 ? (
                  filteredGateways.map((gateway) => (
                    <div
                      key={gateway.value}
                      className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                        ${selectedGateway === gateway.value ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`
                      }
                      onClick={() => updateFormAction(gateway.value)}
                    >
                      {gateway.icon}
                      <span className="mt-2 text-lg font-medium text-gray-800">{gateway.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 col-span-full">No payment gateways found matching "{searchTerm}".</p>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col mt-3 md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto md:order-2">
              <button
                type="submit"
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out"
              >
                Proceed to Payment
              </button>
            </div>
            <div className="w-full md:w-auto text-center md:text-left text-2xl font-bold text-gray-800 md:order-1">
              <small className="font-normal text-lg text-gray-600 mr-1">{bookingData?.currency || 'USD'}</small>{" "}
              <span>{bookingData?.solutions?.[0]?.buyerAmount || 'N/A'}</span>
            </div>
          </div>
          <input type="hidden" name="payload" value="SAMPLE_PAYLOAD_DATA" />
        </form>


        {/* */}
        {bookingData && (
          <>
            <table className="table table-bordered">
              <thead className="bg-light">
                <tr>
                  <th className="text-center">Booking ID</th>
                  <th className="text-center">Booking Reference</th>
                  <th className="text-center">Order Reference</th>
                  <th className="text-center">PNR</th>
                  <th className="text-center">Booking Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{bookingData.bookingId}</td>
                  <td className="text-center">{bookingData.orderNum}</td>
                  <td className="text-center">{bookingData.refOrderNum}</td>
                  <td className="text-center">{bookingData.pnr}</td>
                  <td className="text-center">{bookingData.createdTime}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* */}
        {passengers && passengers.length > 0 && (
          <>
            <p className="border mb-0 p-2 px-3"><strong className="text-uppercase"><small>Travellers</small></strong></p>
            <table className="table table-bordered">
              <thead className="bg-light">
                <tr>
                  <th className="text-center">No</th>
                  <th className="text-center">Sr</th>
                  <th className="text-center">Name</th>
                  <th className="text-center">Passport No.</th>
                  <th className="text-center">Passport Issue - Expiry</th>
                  <th className="text-center">DOB</th>
                  <th className="text-center">PNR</th>
                  <th className="text-center">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((traveler, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td className="text-center">{traveler.salutation}</td>
                    <td className="text-center">{traveler.firstName} {traveler.lastName}<small className="d-block fw-light">{traveler.email}</small><small className="d-block fw-light">{traveler.phone}</small></td>
                    <td className="text-center">{traveler.cardNum}</td>
                    <td className="text-center">{traveler.passportIssue} -- {traveler.cardExpiredDate}</td>
                    <td className="text-center">{traveler.birthday}</td>
                    <td className="text-center">{traveler.pnr || 'N/A'}</td>
                    <td className="text-center">{traveler.ticketNum || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* */}
        {journeys && journeys.length > 0 && (
          <>
            <p className="border mb-0 p-2 px-3"><strong className="text-uppercase"><small>Flights</small></strong></p>
            {journeys.map((flight, index) => (
              <div key={index} className="mb-4">
                {flight.segments.map((segment, index) => (
                  <> 
                  <div className="border">
                    <div className="row g-1 p-2">
                      <div className="col-md-1 d-flex align-items-center col-3">
                        <img style={{ width: "50px" }} src={`/assets/img/airlines/${getAirlineLogo(segment.airline)}.png`} className="px-2" alt="" />
                      </div>
                      <div className="col-md-7 col-9">
                        <div className="p-2 lh-sm mt-2">
                          <small className="mb-0"><strong className="border p-2 rounded mt-5 mx-3">{segment.type} {segment.flightNum}</strong></small>
                          <small className="mb-0">{getAirlineName(segment.airline)}</small>
                        </div>
                      </div>
                      <div className="col-md-3 col-9">
                        <div className="p-2 lh-sm">
                          <small className="mb-0"><strong>Cabin Baggage: {segment.cabinBaggage}</strong></small>
                          <small className="d-block mb-0">Baggage: {segment.checkedBaggage}</small>
                        </div>
                      </div>
                      <div className="col-md-1 d-flex align-items-center col-3">
                        <svg fill="#393e4b" height="35px" width="35px" viewBox="0 0 512 512"><path d="M389.742,77.553H329.99V30.417h15.146V0H166.865v30.417h15.146v47.135h-59.752c-19.059,0-34.566,15.506-34.566,34.566V438.41c0,19.059,15.506,34.566,34.566,34.566h26.268V512h30.417v-39.024h154.114V512h30.417v-39.024h26.268c19.059,0,34.566-15.506,34.566-34.566V112.119C424.308,93.058,408.802,77.553,389.742,77.553z"></path></svg>
                      </div>
                    </div>
                  </div>

                  {/* Responsive Timeline: Vertical on Mobile, Horizontal on Desktop */}
                  <div className="relative p-4 bg-gray-50 border-x border-b rounded-b-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between relative">
                      {/* Vertical line and plane icon for mobile */}
                      <div className="md:hidden absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300"></div>
                      <div className="md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-1 bg-white rounded-full">
                          <svg width="20" height="20" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                              <g transform="translate(-624.000000, 0.000000)">
                                <g transform="translate(624.000000, 0.000000)">
                                  <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"></path>
                                  <path
                                    d="M20.9999,20 C21.5522,20 21.9999,20.4477 21.9999,21 C21.9999,21.51285 21.613873,21.9355092 21.1165239,21.9932725 L20.9999,22 L2.99988,22 C2.44759,22 1.99988,21.5523 1.99988,21 C1.99988,20.48715 2.38591566,20.0644908 2.8832579,20.0067275 L2.99988,20 L20.9999,20 Z M7.26152,3.77234 C7.60270875,3.68092 7.96415594,3.73859781 8.25798121,3.92633426 L8.37951,4.0147 L14.564,9.10597 L18.3962,8.41394 C19.7562,8.16834 21.1459,8.64954 22.0628,9.68357 C22.5196,10.1987 22.7144,10.8812 22.4884,11.5492 C22.1394625,12.580825 21.3287477,13.3849891 20.3041894,13.729249 L20.0965,13.7919 L5.02028,17.8315 C4.629257,17.93626 4.216283,17.817298 3.94116938,17.5298722 L3.85479,17.4279 L0.678249,13.1819 C0.275408529,12.6434529 0.504260903,11.8823125 1.10803202,11.640394 L1.22557,11.6013 L3.49688,10.9927 C3.85572444,10.8966111 4.23617877,10.9655 4.53678409,11.1757683 L4.64557,11.2612 L5.44206,11.9612 L7.83692,11.0255 L3.97034,6.11174 C3.54687,5.57357667 3.77335565,4.79203787 4.38986791,4.54876405 L4.50266,4.51158 L7.26152,3.77234 Z M7.40635,5.80409 L6.47052,6.05484 L10.2339,10.8375 C10.6268063,11.3368125 10.463277,12.0589277 9.92111759,12.3504338 L9.80769,12.4028 L5.60866,14.0433 C5.29604667,14.1654333 4.9460763,14.123537 4.67296914,13.9376276 L4.57438,13.8612 L3.6268,13.0285 L3.15564,13.1547 L5.09121,15.7419 L19.5789,11.86 C20.0227,11.7411 20.3838,11.4227 20.5587,11.0018 C20.142625,10.53815 19.5333701,10.3022153 18.9191086,10.3592364 L18.7516,10.3821 L14.4682,11.1556 C14.218,11.2007714 13.9615551,11.149698 13.7491184,11.0154781 L13.6468,10.9415 L7.40635,5.80409 Z"
                                    fill="#333333"
                                  ></path>
                                </g>
                              </g>
                            </g>
                          </svg>
                      </div>

                      {/* Departure Details */}
                      <div className="text-center md:text-left md:w-1/3 p-2">
                        <div className="text-xl font-bold">{formatDate(segment.departureDate)}</div>
                        <div className="text-lg font-medium text-gray-800">{segment.departureTime}</div>
                        <p className="text-sm text-gray-600">Depart from <span className="font-bold">{getAirportName(segment.departure)}</span></p>
                      </div>

                      {/* Timeline center for desktop */}
                      <div className="hidden md:flex flex-col items-center justify-center md:w-1/3 relative">
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-300"></div>
                        <div className="relative z-10 p-1 bg-white rounded-full">
                          <svg width="20" height="20" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                              <g transform="translate(-624.000000, 0.000000)">
                                <g transform="translate(624.000000, 0.000000)">
                                  <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"></path>
                                  <path
                                    d="M20.9999,20 C21.5522,20 21.9999,20.4477 21.9999,21 C21.9999,21.51285 21.613873,21.9355092 21.1165239,21.9932725 L20.9999,22 L2.99988,22 C2.44759,22 1.99988,21.5523 1.99988,21 C1.99988,20.48715 2.38591566,20.0644908 2.8832579,20.0067275 L2.99988,20 L20.9999,20 Z M7.26152,3.77234 C7.60270875,3.68092 7.96415594,3.73859781 8.25798121,3.92633426 L8.37951,4.0147 L14.564,9.10597 L18.3962,8.41394 C19.7562,8.16834 21.1459,8.64954 22.0628,9.68357 C22.5196,10.1987 22.7144,10.8812 22.4884,11.5492 C22.1394625,12.580825 21.3287477,13.3849891 20.3041894,13.729249 L20.0965,13.7919 L5.02028,17.8315 C4.629257,17.93626 4.216283,17.817298 3.94116938,17.5298722 L3.85479,17.4279 L0.678249,13.1819 C0.275408529,12.6434529 0.504260903,11.8823125 1.10803202,11.640394 L1.22557,11.6013 L3.49688,10.9927 C3.85572444,10.8966111 4.23617877,10.9655 4.53678409,11.1757683 L4.64557,11.2612 L5.44206,11.9612 L7.83692,11.0255 L3.97034,6.11174 C3.54687,5.57357667 3.77335565,4.79203787 4.38986791,4.54876405 L4.50266,4.51158 L7.26152,3.77234 Z M7.40635,5.80409 L6.47052,6.05484 L10.2339,10.8375 C10.6268063,11.3368125 10.463277,12.0589277 9.92111759,12.3504338 L9.80769,12.4028 L5.60866,14.0433 C5.29604667,14.1654333 4.9460763,14.123537 4.67296914,13.9376276 L4.57438,13.8612 L3.6268,13.0285 L3.15564,13.1547 L5.09121,15.7419 L19.5789,11.86 C20.0227,11.7411 20.3838,11.4227 20.5587,11.0018 C20.142625,10.53815 19.5333701,10.3022153 18.9191086,10.3592364 L18.7516,10.3821 L14.4682,11.1556 C14.218,11.2007714 13.9615551,11.149698 13.7491184,11.0154781 L13.6468,10.9415 L7.40635,5.80409 Z"
                                    fill="#333333"
                                  ></path>
                                </g>
                              </g>
                            </g>
                          </svg>
                        </div>
                        <small className="absolute top-1/2 -translate-y-1/2 mt-8 text-gray-500">
                          {segment.duration}
                        </small>
                      </div>

                      {/* Arrival Details */}
                      <div className="text-center md:text-right md:w-1/3 p-2">
                        <div className="text-xl font-bold">{formatDate(segment.arrivalDate)}</div>
                        <div className="text-lg font-medium text-gray-800">{segment.arrivalTime}</div>
                        <p className="text-sm text-gray-600">Arrive at <span className="font-bold">{getAirportName(segment.arrival)}</span></p>
                      </div>
                    </div>
                  </div>
                  </>
                ))}
              </div>
            ))}
          </>
        )}

        {/* */}
        {bookingData.solutions[0] && (
          <>
            <p><strong>Fare Details</strong></p>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th className="text-start">Tax</th>
                  <th className="text-end">% 0</th>
                </tr>
                <tr className="bg-light">
                  <th className="text-start"><strong>Total</strong></th>
                  <th className="text-end"><strong>{bookingData.solutions[0].currency} {bookingData.solutions[0].buyerAmount}</strong></th>
                </tr>
              </thead>
            </table>
          </>
        )}

        {/* */}
        <div className="row g-2 options mb-4">
          <div className="col">
            <button
              className="btn border no_print w-100 d-flex align-items-center justify-content-center p-3"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf} // Disable button during download
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
                  <span>Download as PDF</span>
                </>
              )}
            </button>
          </div>

          <div className="col">
            <a id="whatsappBtn" className="btn border gap-2 no_print w-100 d-flex align-items-center justify-content-center p-3" target="_blank" href={`https://wa.me/?text=Your booking confirmation: ${window.location.href}`} rel="noreferrer">
              <i class="bi bi-whatsapp"></i>
              <span>Send to WhatsApp</span>
            </a>
          </div>

          <div className="col">
            <form id="cancelForm" onSubmit={(e) => { e.preventDefault(); /* show_alert(e); */ }}>
              <button type="submit" className="btn border no_print w-100 d-flex align-items-center justify-content-center p-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <span>Request for Cancellation</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationSuccessPage;