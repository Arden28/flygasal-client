import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import flygasal from "../../../api/flygasalService";
import { getAirlineLogo, getAirlineName, getAirportName } from "../../../utils/utils";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { AuthContext } from "../../../context/AuthContext";
import { Check, Download, Share2, Printer, Wallet, CreditCard, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import DepositModal from "../../../components/client/Account/DepositModal";
import apiService from "../../../api/apiService";
import useETicketPdf from "../../../hooks/useETicketPdf";
import BookingHeader from "../../../components/client/Flight/BookingHeader";

/* --- Constants --- */
const paymentGateways = [
  { value: "wallet", name: "Wallet Balance", img: "/assets/img/gateways/wallet_balance.png" },
  { value: "pay_later", name: "Pay Later", img: "/assets/img/gateways/pay_later.png" },
];

/* --- Helpers --- */
const money = (n, c = "USD") => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });

const StatusChip = ({ status }) => {
    const config = {
        ISSED: { bg: "bg-green-100", text: "text-green-700", label: "Ticket Issued" },
        TO_BE_PAID: { bg: "bg-amber-100", text: "text-amber-700", label: "Payment Required" },
        CNCL: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
        REFD: { bg: "bg-purple-100", text: "text-purple-700", label: "Refunded" },
        UNDER_REVIEW: { bg: "bg-blue-100", text: "text-blue-700", label: "Processing" },
    };
    const theme = config[status] || { bg: "bg-slate-100", text: "text-slate-600", label: status || "Unknown" };
    
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${theme.bg} ${theme.text}`}>
            {theme.label}
        </span>
    );
};

const Skeleton = ({ className }) => <div className={`animate-pulse bg-slate-100 rounded ${className}`}></div>;

export default function BookingConfirmation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { orderNumber } = useParams();

  // State
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bankTransfer, setBankTransfer] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState("wallet");
  const [showPayModal, setShowPayModal] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, currency: "USD", loading: false });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // PDF Hook
  const { downloadETicket, isDownloadingPdf } = useETicketPdf({ brandColor: "#EB7313" });

  // Fetch Data
  useEffect(() => {
    const init = async () => {
        try {
            const [resBooking, resGateway] = await Promise.all([
                flygasal.getBookingDetails(orderNumber),
                apiService.post("/payment_gateways", { api_key: "none" })
            ]);

            if (resBooking?.data?.booking) {
                setBookingData(resBooking.data.booking);
            } else {
                throw new Error(resBooking?.data?.errorMsg || "Booking not found");
            }

            if (resGateway?.data?.status === "true") {
                setBankTransfer(resGateway.data.data?.[0]);
            }
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to load booking");
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [orderNumber]);

  // Derived State
  const orderStatus = bookingData?.orderStatus;
  const isPaid = bookingData?.payStatus?.toLowerCase() === "paid";
  const amountDue = Number(bookingData?.buyerAmount || bookingData?.solutions?.[0]?.buyerAmount || 0);
  const currency = bookingData?.currency || "USD";
  const requiresPayment = !isPaid && ["TO_BE_PAID", "CHG_TO_BE_PAID"].includes(orderStatus) && amountDue > 0;

  // Handlers
  const handlePayment = async () => {
     if (selectedGateway === "wallet") {
         setWallet(prev => ({ ...prev, loading: true }));
         setShowPayModal(true);
         // Fetch real wallet balance here if needed
         const balRes = await apiService.get("/wallet/balance"); 
         setWallet({ 
             balance: balRes?.data?.balance || user?.wallet_balance || 0, 
             currency: balRes?.data?.currency || "USD", 
             loading: false 
         });
     } else {
         // Handle other gateways (redirect)
         alert("Redirecting to payment gateway...");
     }
  };

  const confirmWalletPay = async () => {
      setPaying(true);
      setPayError(null);
      try {
          if (wallet.balance < amountDue) throw new Error("Insufficient balance");
          
          await flygasal.payOrderWithWallet({
              user_id: user.id,
              order_num: orderNumber,
              amount: amountDue,
              currency,
              type: "booking_payment",
              payment_gateway: "wallet_balance"
          });

          // Issue Ticket
          await flygasal.ticketing({
              orderNum: orderNumber,
              pnr: bookingData?.pnr,
              contact: { name: user.name, email: user.email, telNum: user.phone_number }
          });

          setShowSuccess(true);
          setShowPayModal(false);
          setBookingData(prev => ({ ...prev, payStatus: "paid", orderStatus: "ISSED" })); // Optimistic update
      } catch (e) {
          setPayError(e.message || "Payment failed");
      } finally {
          setPaying(false);
      }
  };

  // Loading State
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#EB7313] mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Retrieving booking details...</p>
        </div>
    </div>
  );

  // Error State
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Not Found</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
                Return Home
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <BookingHeader 
        currentStep={3} 
        searchParams={new URLSearchParams(window.location.search)} 
        getAirportName={getAirportName}
        formatDate={formatDate}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
         
         {/* Status Banner */}
         <div className={`mb-8 p-4 rounded-2xl border flex items-start gap-4 ${
            isPaid ? "bg-green-50 border-green-100 text-green-800" : 
            requiresPayment ? "bg-amber-50 border-amber-100 text-amber-800" : 
            "bg-white border-slate-200 text-slate-600"
         }`}>
            <div className={`p-2 rounded-full ${isPaid ? "bg-green-200/50" : requiresPayment ? "bg-amber-200/50" : "bg-slate-100"}`}>
                {isPaid ? <Check size={20} /> : requiresPayment ? <Wallet size={20} /> : <CreditCard size={20} />}
            </div>
            <div>
                <h3 className="font-bold text-lg">
                    {isPaid ? "Booking Confirmed & Paid" : requiresPayment ? "Payment Required" : "Booking Processed"}
                </h3>
                <p className="text-sm opacity-90 mt-1">
                    {isPaid ? "Your e-ticket has been issued. Safe travels!" : requiresPayment ? `Please pay ${money(amountDue, currency)} to confirm your seat.` : "Check details below."}
                </p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Booking Details */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Flight Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-900">Flight Itinerary</h4>
                        <span className="text-xs font-mono text-slate-500 bg-white border px-2 py-1 rounded">PNR: {bookingData.pnr || "Processing"}</span>
                    </div>
                    <div className="p-6 space-y-8">
                        {bookingData.journeys.map((journey, jIdx) => (
                            <div key={jIdx} className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                                {journey.segments.map((seg, sIdx) => (
                                    <div key={sIdx} className="relative">
                                        {/* Airline Info */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <img 
                                                src={`/assets/img/airlines/${getAirlineLogo(seg.airline)}.png`} 
                                                alt={seg.airline} 
                                                className="w-8 h-8 object-contain"
                                                onError={(e) => e.target.src = "https://placehold.co/32x32?text=✈️"}
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{getAirlineName(seg.airline)}</p>
                                                <p className="text-xs text-slate-500">{seg.airline} {seg.flightNum} • {seg.cabin || "Economy"}</p>
                                            </div>
                                        </div>

                                        {/* Times & Route */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-lg font-bold text-slate-900">{formatTime(seg.departureTime)}</p>
                                                <p className="text-xs text-slate-500">{getAirportName(seg.origin)} ({seg.origin})</p>
                                                <p className="text-xs text-slate-400 mt-1">{formatDate(seg.departureDate)}</p>
                                            </div>
                                            
                                            {/* Duration Line */}
                                            <div className="flex-1 px-4 flex flex-col items-center mt-2">
                                                <p className="text-[10px] text-slate-400 mb-1">{seg.duration}</p>
                                                <div className="w-full h-px bg-slate-300 relative">
                                                    <div className="absolute right-0 -top-1 w-2 h-2 bg-slate-300 rounded-full"></div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900">{formatTime(seg.arrivalTime)}</p>
                                                <p className="text-xs text-slate-500">{getAirportName(seg.arrival)} ({seg.arrival})</p>
                                                <p className="text-xs text-slate-400 mt-1">{formatDate(seg.arrivalDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Passengers */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 mb-4">Passengers</h4>
                    <div className="space-y-3">
                        {bookingData.passengers.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 font-bold shadow-sm">
                                    {p.firstName[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                                    <p className="text-xs text-slate-500 capitalize">{p.type || "Adult"}</p>
                                </div>
                                {p.ticketNum && (
                                    <div className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-mono">
                                        Ticket: {p.ticketNum}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right: Payment & Actions */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Price Breakdown */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 mb-4">Summary</h4>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Base Fare</span>
                            <span>{money(amountDue * 0.8, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Taxes & Fees</span>
                            <span>{money(amountDue * 0.2, currency)}</span>
                        </div>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <div className="flex justify-between text-lg font-bold text-slate-900">
                            <span>Total</span>
                            <span>{money(amountDue, currency)}</span>
                        </div>
                    </div>

                    {requiresPayment && (
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Payment Method</label>
                                <div className="flex gap-2">
                                    {paymentGateways.map(gw => (
                                        <button 
                                            key={gw.value}
                                            onClick={() => setSelectedGateway(gw.value)}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                selectedGateway === gw.value 
                                                ? "bg-white border-[#EB7313] text-[#EB7313] shadow-sm" 
                                                : "border-transparent hover:bg-white hover:border-slate-200 text-slate-500"
                                            }`}
                                        >
                                            {gw.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={handlePayment}
                                className="w-full py-3 bg-[#EB7313] hover:bg-[#d6660f] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
                            >
                                Pay Now
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => downloadETicket({ bookingData, qrCodeUrl: "", user, getAirlineLogo, getAirlineName, getAirportName })}
                        disabled={isDownloadingPdf}
                        className="col-span-2 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                    >
                        {isDownloadingPdf ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                        Download Ticket
                    </button>
                    {/* <button className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
                        <Printer size={18} /> Print
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
                        <Share2 size={18} /> Share
                    </button> */}
                </div>
                
                {/* Support */}
                <div className="text-center text-xs text-slate-400 mt-4">
                    Need help? <a href="#" className="text-[#EB7313] hover:underline">Contact Support</a>
                </div>

            </div>
         </div>

      </div>

      {/* Wallet Payment Modal */}
      {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPayModal(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Confirm Payment</h3>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                      <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Wallet Balance</span>
                          <span className="font-bold text-slate-900">{money(wallet.balance, wallet.currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Amount Due</span>
                          <span className="font-bold text-[#EB7313]">{money(amountDue, currency)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Remaining</span>
                          <span className={`font-bold ${wallet.balance >= amountDue ? 'text-green-600' : 'text-red-500'}`}>
                             {money(wallet.balance - amountDue, currency)}
                          </span>
                      </div>
                  </div>

                  {payError && <p className="text-xs text-red-500 mb-4 text-center">{payError}</p>}

                  <div className="flex gap-3">
                      <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                      <button 
                         onClick={confirmWalletPay}
                         disabled={wallet.balance < amountDue || paying}
                         className="flex-1 py-3 bg-[#EB7313] text-white font-bold rounded-xl hover:bg-[#d6660f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center gap-2"
                      >
                         {paying && <Loader2 className="animate-spin" size={20} />}
                         {paying ? "Processing..." : "Confirm Pay"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-green-900/20 backdrop-blur-md" onClick={() => setShowSuccess(false)}></div>
              <div className="relative bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                      <Check size={40} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                  <p className="text-slate-500 mb-8">Your booking has been confirmed and ticketed.</p>
                  <button onClick={() => setShowSuccess(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                      View Ticket
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}