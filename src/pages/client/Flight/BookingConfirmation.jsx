import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import flygasal from "../../../api/flygasalService";
import { getAirlineLogo, getAirlineName, getAirportName } from "../../../utils/utils";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { AuthContext } from "../../../context/AuthContext";
import { 
  Check, Download, Printer, Wallet, CreditCard, 
  AlertCircle, Loader2, ArrowLeft, Clock, User,
  Plane, FileText, Copy, RefreshCcw, XCircle, Calendar, Luggage
} from "lucide-react";
import DepositModal from "../../../components/client/Account/DepositModal";
import apiService from "../../../api/apiService";
import useETicketPdf from "../../../hooks/useETicketPdf";
import BookingHeader from "../../../components/client/Flight/BookingHeader";
import confetti from "canvas-confetti";

/* --- Helpers --- */
const money = (n, c = "USD") => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });

const StatusChip = ({ status }) => {
    // Exact mapping from your legacy code to new UI
    const config = {
        ISSED: { bg: "bg-green-100", text: "text-green-700", label: "Ticket Issued", icon: Check },
        PAID: { bg: "bg-green-100", text: "text-green-700", label: "Paid", icon: Check },
        CHGD: { bg: "bg-green-100", text: "text-green-700", label: "Changed", icon: Check },
        
        TO_BE_PAID: { bg: "bg-amber-100", text: "text-amber-700", label: "Payment Required", icon: Clock },
        CHG_TO_BE_PAID: { bg: "bg-amber-100", text: "text-amber-700", label: "Change Unpaid", icon: Clock },
        TO_BE_RSV: { bg: "bg-amber-100", text: "text-amber-700", label: "To Be Reserved", icon: Clock },
        
        ISS_PRC: { bg: "bg-blue-100", text: "text-blue-700", label: "Issuing...", icon: Loader2 },
        CHG_PRC: { bg: "bg-blue-100", text: "text-blue-700", label: "Processing Change", icon: Loader2 },
        UNDER_REVIEW: { bg: "bg-blue-100", text: "text-blue-700", label: "Under Review", icon: Loader2 },
        
        CNCL: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled", icon: XCircle },
        RSV_FAIL: { bg: "bg-red-100", text: "text-red-700", label: "Failed", icon: XCircle },
        REFD: { bg: "bg-purple-100", text: "text-purple-700", label: "Refunded", icon: RefreshCcw },
        VOID: { bg: "bg-purple-100", text: "text-purple-700", label: "Voided", icon: RefreshCcw },
    };

    let theme = config[status] || { bg: "bg-slate-100", text: "text-slate-600", label: status || "Unknown", icon: FileText };
    if (status?.includes("PRC") && !config[status]) theme = config.ISS_PRC;

    const Icon = theme.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${theme.bg} ${theme.text}`}>
            <Icon size={14} />
            {theme.label}
        </span>
    );
};

export default function BookingConfirmation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { orderNumber } = useParams();

  // State
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bankTransfer, setBankTransfer] = useState(null);
  
  // Payment State
  const [showPayModal, setShowPayModal] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, currency: "USD", loading: false });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Timer
  const TOTAL_SECONDS = 30 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef(null);

  // PDF Hook
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { downloadETicket, isDownloadingPdf } = useETicketPdf({ brandColor: "#EB7313" });

  // --- 1. Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const init = async () => {
        try {
            setLoading(true);
            const [resBooking, resGateway] = await Promise.all([
                flygasal.getBookingDetails(orderNumber).catch(e => e), // Prevent fast-fail
                apiService.post("/payment_gateways", { api_key: "none" }).catch(() => null)
            ]);

            if (!mounted) return;

            // Handle HTTP Errors gracefully
            if (resBooking instanceof Error || resBooking?.response) {
                 const errResponse = resBooking.response?.data;
                 throw new Error(errResponse?.message || resBooking.message || "Failed to load booking details");
            }

            // FIX: flygasalService returns res.data directly, so we check .booking or .data.booking
            const actualBookingData = resBooking?.booking || resBooking?.data?.booking;

            if (actualBookingData) {
                setBookingData(actualBookingData);
                setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.href)}`);
            } else {
                const errorCode = resBooking?.code || resBooking?.errorCode;
                const errorMsg = resBooking?.message || resBooking?.errorMsg;
                throw new Error(errorMsg || `Error ${errorCode || "Unknown"}`);
            }

            if (resGateway?.data?.status === "true") {
                setBankTransfer(resGateway.data.data?.[0]);
            }

        } catch (e) {
            console.error(e);
            // Catch robust nested errors
            const errMsg = e?.response?.data?.message || e.message || "Failed to load booking details";
            if (mounted) setError(errMsg);
        } finally {
            if (mounted) setLoading(false);
        }
    };
    init();
    return () => { mounted = false; };
  }, [orderNumber]);

  // --- Logic Extraction ---
  const orderStatus = bookingData?.orderStatus;
  const payStatus = bookingData?.payStatus?.toLowerCase();
  const isPaid = payStatus === "paid";
  
  // FIX: Apply Agent Markup Logic
  const isAgent = user?.role === "agent";
  const agentMarkupPercent = isAgent ? (Number(user?.agency_markup) || 0) : 0;
  
  const solutions0 = bookingData?.solutions?.[0];
  const currency = solutions0?.currency || bookingData?.currency || "USD";
  
  // Calculate Base and Markup Amount
  const baseAmount = Number(solutions0?.buyerAmount ?? bookingData?.buyerAmount ?? 0);
  const markupAmount = +(baseAmount * (agentMarkupPercent / 100)).toFixed(2);
  const amountDue = baseAmount + markupAmount;
  
  // Safe date handling (Booking Date)
  const rawBookingDate = bookingData?.createdTime || bookingData?.booking_date || bookingData?.createdAt;
  const bookingDateDisplay = rawBookingDate ? formatDate(rawBookingDate) : "N/A";

  const terminalStatuses = ["ISSUED", "CLOSED", "CNCL", "CNCL_REIMED", "REFD", "REFD_REIMED", "VOID", "VOID_REIMED"];
  const isTerminal = terminalStatuses.includes(orderStatus);
  
  // Payment Required Logic
  const requiresPayment = !isPaid && !isTerminal && ["TO_BE_PAID", "CHG_TO_BE_PAID"].includes(orderStatus) && amountDue > 0;

  // --- Timer ---
  useEffect(() => {
    if (!requiresPayment) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [requiresPayment]);

  const formatTimer = (s) => {
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      return `${m}:${sec}`;
  };

  // --- Handlers ---

  // 1. Open Modal & Fetch Fresh Balance
  const handleWalletCheck = async () => {
      if (secondsLeft <= 0) return;
      
      setWallet(prev => ({ ...prev, loading: true }));
      setShowPayModal(true);
      
      try {
          const res = await apiService.get("/wallet/balance");
          const data = res?.data?.data || res?.data;
          const status = res?.data?.status || res?.status;

          // Handle various API response shapes
          if (status === "true" || status === 200 || data) {
              setWallet({ 
                  balance: Number(data?.balance ?? user?.wallet_balance ?? 0), 
                  currency: data?.currency || user?.currency || "USD", 
                  loading: false 
              });
          } else {
             throw new Error("Failed to fetch balance");
          }
      } catch (e) {
          // Fallback to context
          setWallet({ 
             balance: Number(user?.wallet_balance || 0), 
             currency: user?.currency || "USD", 
             loading: false 
          });
      }
  };

  const refreshBooking = async () => {
    try {
      const fresh = await flygasal.getBookingDetails(orderNumber);
      // FIX: Apply the unwrapping fix here too
      const freshData = fresh?.booking || fresh?.data?.booking;
      if (freshData) setBookingData(freshData);
    } catch (e) { console.error(e); }
  };

  const handleConfirmPayment = async () => {
      setPaying(true);
      setPayError(null);
      try {
          if (wallet.balance < amountDue) throw new Error("Insufficient wallet balance. Please top up.");

          const payRes = await flygasal.payOrderWithWallet({
              user_id: user.id,
              order_num: orderNumber,
              amount: amountDue,
              currency,
              type: "booking_payment",
              payment_gateway: "wallet_balance"
          });

          if (payRes?.data?.status !== "completed" && payRes?.data?.success !== true) {
              throw new Error(payRes?.data?.errorMsg || "Payment failed.");
          }

          const ticketRes = await flygasal.ticketing({
              orderNum: orderNumber,
              pnr: bookingData?.pnr,
              contact: { name: user.name, email: user.email, telNum: user.phone_number }
          });

          if (!ticketRes?.success) {
              throw new Error(ticketRes?.error || "Ticketing failed. Contact support.");
          }

          setShowPayModal(false);
          setShowSuccess(true);
          setBookingData(prev => ({ ...prev, payStatus: "paid", orderStatus: "ISSED" })); 
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

          setTimeout(() => {
              downloadETicket({ bookingData, qrCodeUrl, user, getAirlineLogo, getAirlineName, getAirportName });
          }, 1000);

          await refreshBooking();

      } catch (e) {
          // FIX: Detailed error extraction for the payment block
          setPayError(e?.response?.data?.message || e.message || "Payment Processing Error");
      } finally {
          setPaying(false);
      }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#EB7313] mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">Retrieving itinerary...</p>
        </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Error</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => navigate("/")} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Return Home
            </button>
        </div>
    </div>
  );

  const passengers = bookingData?.passengers || [];
  const journeys = bookingData?.journeys || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <BookingHeader 
        currentStep={3} 
        searchParams={new URLSearchParams(window.location.search)} 
        getAirportName={getAirportName}
        formatDate={formatDate}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
         
         {/* 1. Status & Timer Banner */}
         <div className={`mb-8 p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isPaid ? "bg-emerald-50 border-emerald-100" : 
            requiresPayment ? "bg-amber-50 border-amber-100" : 
            "bg-white border-slate-200"
         }`}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                    isPaid ? "bg-emerald-100 text-emerald-600" : 
                    requiresPayment ? "bg-amber-100 text-amber-600" : 
                    "bg-slate-100 text-slate-500"
                }`}>
                    {isPaid ? <Check size={24} strokeWidth={3} /> : requiresPayment ? <Clock size={24} strokeWidth={3} /> : <FileText size={24} />}
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${isPaid ? "text-emerald-900" : requiresPayment ? "text-amber-900" : "text-slate-900"}`}>
                        {isPaid ? "Booking Confirmed & Ticketed" : requiresPayment ? "Payment Required" : `Status: ${orderStatus}`}
                    </h3>
                    <p className={`text-sm mt-1 ${isPaid ? "text-emerald-700" : requiresPayment ? "text-amber-700" : "text-slate-500"}`}>
                        {isPaid 
                           ? "Your e-ticket has been issued. You can download it below." 
                           : requiresPayment 
                           ? `Please complete payment within ${formatTimer(secondsLeft)} to secure your seat.` 
                           : "Your booking status is currently updating."
                        }
                    </p>
                </div>
            </div>

            {requiresPayment && secondsLeft > 0 && (
                <div className="bg-white px-4 py-2 rounded-xl border border-amber-200 flex items-center gap-2 text-amber-700 font-mono font-bold shadow-sm">
                    <Clock size={16} />
                    <span>{formatTimer(secondsLeft)}</span>
                </div>
            )}
            {requiresPayment && secondsLeft <= 0 && (
                <div className="bg-red-100 px-4 py-2 rounded-xl text-red-700 font-bold text-sm">Expired</div>
            )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Flight Details Card (Restored Logic + New Design) */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Plane size={18} className="text-[#EB7313]" /> Itinerary
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                             {/* Booking Date - Explicitly Added */}
                             <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                <Calendar size={14} />
                                <span>{bookingData?.createdTime ? `${formatDate(bookingData.createdTime)} ${formatTime(bookingData.createdTime)}` : "—"}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PNR</span>
                                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">{bookingData.pnr || "PENDING"}</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-10">
                        {journeys?.map((journey, jIdx) => (
                            <div key={jIdx} className="space-y-8">
                                {journey?.segments?.map((seg, sIdx) => (
                                    <div key={sIdx} className="relative group">
                                        {/* Airline & Baggage Info (Restored from old version logic) */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={`/assets/img/airlines/${getAirlineLogo(seg.airline)}.png`} 
                                                    alt={seg.airline} 
                                                    className="h-6 w-auto object-contain rounded-full"
                                                    onError={(e) => e.target.src = "https://placehold.co/32x32?text=✈️"}
                                                />
                                                <div className="text-sm">
                                                    <span className="font-bold text-slate-900 mr-2">{getAirlineName(seg.airline)}</span>
                                                    <span className="font-mono text-slate-500 text-xs">{seg.airline}{seg.flightNum}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-600">
                                                <span className="bg-white px-2 py-1 rounded border border-slate-200">{seg.cabin || "Economy"}</span>
                                                <div className="flex items-center gap-1">
                                                    <Luggage size={12} /> 
                                                    <span>{seg.checkedBaggage || "Check rules"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Route Visual */}
                                        <div className="flex justify-between items-start px-2">
                                            {/* Origin */}
                                            <div className="text-left min-w-[100px]">
                                                <div className="text-2xl font-black text-slate-900">{formatDate(seg.departureDate)}</div>
                                                <div className="text-xs text-slate-500 mt-1 max-w-[120px]">{seg.departureTime}</div>
                                                <div className="text-lg font-bold text-[#EB7313]">{seg.departure}</div>
                                                <div className="text-xs text-slate-500 mt-1 max-w-[120px]">{getAirportName(seg.departure)}</div>
                                                <div className="text-xs font-medium text-slate-400 mt-1">{formatDate(seg.departureDate)}</div>
                                            </div>

                                            {/* Duration Graphic */}
                                            <div className="flex-1 px-4 sm:px-8 flex flex-col items-center mt-3">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{seg.duration}</div>
                                                <div className="w-full h-[2px] bg-slate-200 relative">
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full"></div>
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full"></div>
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F8FAFC] px-2">
                                                        {/* <Plane size={14} className="text-slate-300 rotate-90" /> */}
                                                    </div>
                                                </div>
                                                {/* Removed "Stops" as requested */}
                                            </div>

                                            {/* Destination */}
                                            <div className="text-right min-w-[100px]">
                                                <div className="text-2xl font-black text-slate-900">{formatDate(seg.arrivalDate)}</div>
                                                <div className="text-xs text-slate-500 mt-1 max-w-[120px]">{seg.arrivalTime}</div>
                                                <div className="text-lg font-bold text-[#EB7313]">{seg.arrival}</div>
                                                <div className="text-xs text-slate-500 mt-1 max-w-[120px] ml-auto">{getAirportName(seg.arrival)}</div>
                                                <div className="text-xs font-medium text-slate-400 mt-1">{formatDate(seg.arrivalDate)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Passengers (Restored Logic) */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                    <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <User size={18} className="text-[#EB7313]" /> Passengers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {passengers.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-sm">
                                    {p.firstName?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                                    <p className="text-xs text-slate-500 capitalize">{p.type || "Adult"}</p>
                                    <p className="text-xs text-slate-500 capitalize">{p.cardNum}</p>
                                    <p className="text-xs text-slate-500 capitalize">{p.ticketNum}</p>
                                </div>
                                {p.ticketNum && (
                                    <div className="ml-auto">
                                        <span className="text-[10px] font-mono bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                                            {p.ticketNum}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right Column: Summary & Actions */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Price Card */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 mb-6">Payment Summary</h4>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Base Fare</span>
                            <span className="font-mono">{money(amountDue, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Taxes & Fees</span>
                            {/* <span className="font-mono">{money(amountDue * 0.15, currency)}</span> */}
                        </div>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <div className="flex justify-between text-lg font-bold text-slate-900">
                            <span>Total</span>
                            <span>{money(amountDue, currency)}</span>
                        </div>
                    </div>

                    {/* Payment Button */}
                    {requiresPayment ? (
                        <div className="space-y-3">
                             <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                 <p className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Method</p>
                                 <div className="flex items-center justify-center gap-2 text-orange-900 font-bold">
                                     <Wallet size={18} /> Wallet Balance
                                 </div>
                             </div>
                             <button 
                                onClick={handleWalletCheck}
                                disabled={secondsLeft <= 0}
                                className="w-full py-3.5 bg-[#EB7313] hover:bg-[#d6660f] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                             >
                                Pay {money(amountDue, currency)}
                             </button>
                             {secondsLeft <= 0 && (
                                 <p className="text-xs text-red-500 text-center font-medium">Session expired. Please re-book.</p>
                             )}
                        </div>
                    ) : (
                        <div className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-center flex items-center justify-center gap-2 cursor-default">
                            <Check size={18} /> Paid
                        </div>
                    )}
                </div>

                {/* Actions Card */}
                <div className="bg-white rounded-[2rem] p-6 text-black  shadow-sm border border-slate-200 p-8">
                    <h4 className="font-bold mb-4 text-black">Actions</h4>
                    <div className="space-y-3">
                        <button 
                            onClick={() => downloadETicket({ bookingData, qrCodeUrl, user, getAirlineLogo, getAirlineName, getAirportName })}
                            // disabled={isDownloadingPdf || !isPaid}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all disabled:opacity-50"
                        >
                            <span className="text-sm font-bold flex items-center gap-2">
                               {isDownloadingPdf ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                               Download Ticket
                            </span>
                            <ArrowLeft className="rotate-180 w-4 h-4 text-slate-400" />
                        </button>

                        <button 
                            onClick={() => window.print()}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
                        >
                            <span className="text-sm font-bold flex items-center gap-2">
                               <Printer size={16} /> Print Itinerary
                            </span>
                            <ArrowLeft className="rotate-180 w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <p className="text-xs text-slate-400 mb-2">Need modifications?</p>
                        <a href="mailto:support@flygasal.com" className="text-sm font-bold text-[#EB7313] hover:text-white transition-colors">Contact Support</a>
                    </div>
                </div>

            </div>
         </div>

      </div>

      {/* --- Payment Modal --- */}
      {showPayModal && requiresPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !paying && setShowPayModal(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EB7313]">
                          <Wallet size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Confirm Payment</h3>
                      <p className="text-slate-500 text-sm mt-1">Using your wallet balance</p>
                  </div>

                  {wallet.loading ? (
                      <div className="py-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                      </div>
                  ) : (
                      <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-sm font-medium text-slate-500">Current Balance</span>
                              <span className="font-bold text-slate-900">{money(wallet.balance, wallet.currency)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center px-4">
                              <span className="text-sm font-bold text-slate-900">Payment Amount</span>
                              <span className="font-bold text-[#EB7313] text-lg">{money(amountDue, currency)}</span>
                          </div>

                          <div className="h-px bg-slate-100"></div>

                          <div className="flex justify-between items-center px-4">
                              <span className="text-sm font-medium text-slate-500">Balance After</span>
                              <span className={`font-bold ${wallet.balance >= amountDue ? 'text-green-600' : 'text-red-500'}`}>
                                  {money(wallet.balance - amountDue, currency)}
                              </span>
                          </div>

                          {wallet.balance < amountDue && (
                              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl text-center border border-red-100">
                                  Insufficient funds.
                              </div>
                          )}
                      </div>
                  )}

                  {payError && <p className="text-xs text-red-500 font-bold text-center mb-4">{payError}</p>}

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowPayModal(false)} 
                          disabled={paying}
                          className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                      >
                          Cancel
                      </button>
                      
                      {!wallet.loading && wallet.balance < amountDue ? (
                          <DepositModal 
                              user={user} 
                              bankTransfer={bankTransfer} 
                              onSuccess={() => { 
                                  setShowPayModal(false); 
                                  setTimeout(handleWalletCheck, 1500); 
                              }} 
                              trigger={
                                  <button className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                                      Top Up Now
                                  </button>
                              }
                          />
                      ) : (
                          <button 
                              onClick={handleConfirmPayment}
                              disabled={paying || wallet.loading}
                              className="flex-1 py-3.5 bg-[#EB7313] text-white font-bold rounded-xl hover:bg-[#d6660f] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                              {paying && <Loader2 className="animate-spin" size={18} />}
                              {paying ? "Processing..." : "Confirm"}
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-green-900/30 backdrop-blur-md" onClick={() => setShowSuccess(false)}></div>
              <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in-95">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
                      <Check size={48} strokeWidth={4} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">All Set!</h3>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                      Your payment was successful and your e-ticket has been issued.
                  </p>
                  <button onClick={() => setShowSuccess(false)} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg">
                      View Ticket
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}