import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import flygasal from "../../api/flygasalService";
import { getAirlineLogo, getAirlineName, getAirportName } from "../../utils/utils";
import { formatDate, formatTime } from "../../utils/dateFormatter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AuthContext } from "../../context/AuthContext";

/* ---------------- Payment Gateways ---------------- */
const paymentGateways = [
  {
    value: "wallet",
    name: "Wallet Balance",
    icon: <img src="/assets/img/gateways/wallet_balance.png" style={{ height: 40 }} alt="Wallet Balance" />,
  },
  {
    value: "pay_later",
    name: "Pay Later",
    icon: <img src="/assets/img/gateways/pay_later.png" style={{ height: 40 }} alt="Pay Later" />,
  },
];

/* ---------------- Tiny helpers ---------------- */
const money = (n, c = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });

const PlaceholderImg = ({ alt = "", className = "", style = {}, src, fallback = "https://placehold.co/80x80?text=Img" }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    style={style}
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = fallback;
    }}
  />
);

/* ---------------- Status chip ---------------- */
const statusDisplay = (status) => {
  let base = "badge rounded-pill fw-semibold ";
  let text = status || "—";
  switch (status) {
    case "ISS_PRC": return { className: base + "text-bg-primary", text: "Ticket is Issuing" };
    case "CHG_PRC": return { className: base + "text-bg-primary", text: "Change Order Processing" };
    case "REFD_PRC": return { className: base + "text-bg-primary", text: "Refund Processing" };
    case "VOID_PRC": return { className: base + "text-bg-primary", text: "Voiding Ticket" };
    case "TO_BE_PAID": return { className: base + "text-bg-warning", text: "To be Paid" };
    case "ISSED": return { className: base + "text-bg-success", text: "Ticket Issued" };
    case "TO_BE_RSV": return { className: base + "text-bg-warning", text: "To be Reserved" };
    case "UNDER_REVIEW": return { className: base + "text-bg-warning", text: "Under Review" };
    case "HOLD": return { className: base + "text-bg-warning", text: "Order on Hold" };
    case "RSV_FAIL": return { className: base + "text-bg-danger", text: "Reservation Failed" };
    case "CLOSED": return { className: base + "text-bg-secondary", text: "Closed" };
    case "CNCL": return { className: base + "text-bg-danger", text: "Cancelled" };
    case "CNCL_TO_BE_REIM": return { className: base + "text-bg-primary", text: "Cancel • Reimbursing" };
    case "CNCL_REIMED": return { className: base + "text-bg-success", text: "Cancelled • Reimbursed" };
    case "CHG_RQ": return { className: base + "text-bg-primary", text: "Change Requested" };
    case "CHG_TO_BE_PAID": return { className: base + "text-bg-warning", text: "Change • To be Paid" };
    case "CHG_REJ": return { className: base + "text-bg-danger", text: "Change Rejected" };
    case "CHGD": return { className: base + "text-bg-success", text: "Changed" };
    case "REDF_RQ": return { className: base + "text-bg-primary", text: "Refund Under Review" };
    case "REFD_REJ": return { className: base + "text-bg-danger", text: "Refund Rejected" };
    case "REFD_TO_BE_REIM": return { className: base + "text-bg-primary", text: "Refund • To be Reimbursed" };
    case "REFD_REIMED": return { className: base + "text-bg-success", text: "Refunded • Reimbursed" };
    case "REFD": return { className: base + "text-bg-success", text: "Refunded" };
    case "VOID_REJ": return { className: base + "text-bg-danger", text: "Void Rejected" };
    case "VOID_TO_BE_REIM": return { className: base + "text-bg-primary", text: "Void • To be Reimbursed" };
    case "VOID_REIMED": return { className: base + "text-bg-success", text: "Voided • Reimbursed" };
    case "VOID": return { className: base + "text-bg-success", text: "Voided" };
    default: return { className: base + "text-bg-light text-dark", text };
  }
};

/* ---------------- Skeletons (soft; keep design) ---------------- */
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-100 rounded ${className}`} />
);

const ConfirmationSuccessPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { orderNumber } = useParams();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedGateway, setSelectedGateway] = useState("wallet");
  const [showGatewaySelection, setShowGatewaySelection] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Wallet modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, currency: "USD", loading: false });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  // Timer (30 minutes) – shown only if payment is required
  const TOTAL_SECONDS = 30 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef();

  const invoiceRef = useRef(null);
  const formRef = useRef(null);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const progressPercent = (secondsLeft / TOTAL_SECONDS) * 100;

  const filteredGateways = useMemo(
    () => paymentGateways.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );
  const currentGateway = useMemo(
    () => paymentGateways.find((g) => g.value === selectedGateway),
    [selectedGateway]
  );
  const displayGatewayName = currentGateway ? currentGateway.name : "Select Payment Method";

  const updateFormAction = (gatewayValue) => {
    if (formRef.current) {
      formRef.current.action = `payment/${gatewayValue}`;
    }
    setSelectedGateway(gatewayValue);
    setShowGatewaySelection(false);
    setSearchTerm("");
  };

  /* ---------------- Fetch booking ---------------- */
  useEffect(() => {
    let mounted = true;
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await flygasal.getBookingDetails(orderNumber);
        const booking = response?.data?.booking;
        const { errorCode, errorMsg } = response?.data || {};

        if (!mounted) return;

        if (errorCode) {
          if (errorCode === "B037") setError("Order does not exist.");
          else if (errorCode === "B048") setError("Invalid buyer.");
          else setError(errorMsg || "Failed to load booking details.");
          setBookingData(null);
        } else {
          setBookingData(booking || null);
          updateFormAction(selectedGateway);
          if (orderNumber && typeof window !== "undefined") {
            setQrCodeUrl(
              `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.href)}`
            );
          }
        }
      } catch (err) {
        console.error("Error loading confirmation:", err);
        if (mounted) {
          setError("An unexpected error occurred. Please try again later.");
          setBookingData(null);
        }
      } finally {
        mounted && setLoading(false);
      }
    };
    fetchBookingData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  /* ---------------- Derive payment/timer behavior from status ---------------- */
  const solutions0 = bookingData?.solutions?.[0];
  const currency = solutions0?.currency || bookingData?.currency || "USD";
  const amount = solutions0?.buyerAmount ?? bookingData?.buyerAmount;
  const amountDue = Number(amount || 0);

  const orderStatus = bookingData?.orderStatus;                // e.g. TO_BE_PAID, ISSED, CNCL, ...
  const payStatus = (bookingData?.payStatus || "").toLowerCase(); // e.g. unpaid, paid
  const isPaid = payStatus === "paid";

  const terminalStatuses = new Set([
    "ISSED", "CLOSED", "CNCL", "CNCL_REIMED",
    "REFD", "REFD_REIMED", "VOID", "VOID_REIMED"
  ]);
  const processingStatuses = new Set([
    "ISS_PRC", "CHG_PRC", "REFD_PRC", "VOID_PRC",
    "UNDER_REVIEW", "HOLD", "TO_BE_RSV"
  ]);
  const payRequiredStatuses = new Set(["TO_BE_PAID", "CHG_TO_BE_PAID"]);

  const isTerminal = terminalStatuses.has(orderStatus);
  const isProcessing = processingStatuses.has(orderStatus);
  const requiresPayment = payRequiredStatuses.has(orderStatus) && !isPaid && amountDue > 0;

  // Timer is shown only if payment is actually required
  const showTimer = requiresPayment;

  // Friendly header helper
  const renderStatusBanner = () => {
    if (isTerminal) {
      if (orderStatus === "ISSED") {
        return (
          <div className="alert alert-success rounded-4 shadow-sm mb-3">
            ✅ Ticket issued. You can download/print your receipt below.
          </div>
        );
      }
      if (orderStatus === "CLOSED") {
        return <div className="alert alert-secondary rounded-4 shadow-sm mb-3">Order closed.</div>;
      }
      if (orderStatus?.startsWith("CNCL")) {
        return <div className="alert alert-danger rounded-4 shadow-sm mb-3">This order is cancelled. No payment required.</div>;
      }
      if (orderStatus?.startsWith("REFD") || orderStatus?.startsWith("VOID")) {
        return <div className="alert alert-info rounded-4 shadow-sm mb-3">This order is voided/refunded. No payment required.</div>;
      }
    }

    if (isPaid) {
      return (
        <div className="alert alert-success rounded-4 shadow-sm mb-3">
          💳 Payment received. We’ll take it from here.
        </div>
      );
    }

    if (orderStatus === "RSV_FAIL") {
      return (
        <div className="alert alert-danger rounded-4 shadow-sm mb-3 d-flex justify-content-between align-items-center">
          <div>Reservation failed. Please search for new flights.</div>
          <button className="btn btn-danger" onClick={() => navigate("/flight/availability")}>
            Search again
          </button>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="alert alert-warning rounded-4 shadow-sm mb-3">
          ⏳ Your order is being processed ({statusDisplay(orderStatus).text}). No action is required right now.
        </div>
      );
    }

    if (requiresPayment) {
      return (
        <div className="alert alert-warning rounded-4 shadow-sm mb-3">
          ⚠️ Payment required to continue. Please complete payment before the timer expires.
        </div>
      );
    }

    return null;
  };

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (!showTimer) return; // don’t run timer if not needed
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
  }, [showTimer]);

  /* ---------------- PDF ---------------- */
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const input = invoiceRef.current;

      // Ensure images are loaded before capture
      const imgs = Array.from(input.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
        )
      );

      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`invoice-${orderNumber}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /* ---------------- Wallet flow ---------------- */
  const fetchWalletBalance = () => {
    setPayError(null);
    setWallet((w) => ({ ...w, loading: true }));
    const balance = user?.wallet_balance || 0; // swap with API if needed
    const cur = bookingData?.currency || currency || "USD";
    setWallet({ balance, currency: cur, loading: false });
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!requiresPayment || secondsLeft <= 0) return;

    if (selectedGateway === "wallet") {
      await fetchWalletBalance();
      setShowPayModal(true);
    } else {
      formRef.current?.submit();
    }
  };

  const refreshBooking = async () => {
    try {
      const fresh = await flygasal.getBookingDetails(orderNumber);
      setBookingData(fresh?.data?.booking || bookingData);
    } catch (e) {
      console.error("Refresh booking failed:", e);
    }
  };

  const handleConfirmWalletPayment = async () => {
    if (!requiresPayment || secondsLeft <= 0) return;
    setPayError(null);
    setPaying(true);
    try {
      const amountCurrency = currency;

      if (wallet.currency && wallet.currency !== amountCurrency) {
        throw new Error(`Wallet currency (${wallet.currency}) differs from charge currency (${amountCurrency}).`);
      }
      if (wallet.balance < amountDue) {
        throw new Error("Insufficient wallet balance.");
      }

      // Adjust to your backend
      const resp = await flygasal.payOrderWithWallet({ orderNumber });
      const ok = resp?.data?.status === "paid" || resp?.data?.success === true;

      if (!ok) {
        throw new Error(resp?.data?.errorMsg || "Payment failed. Please try again.");
      }

      await refreshBooking();
      setShowPayModal(false);
    } catch (err) {
      console.error("Wallet payment error:", err);
      setPayError(err?.message || "We couldn’t complete your payment.");
    } finally {
      setPaying(false);
    }
  };

  /* ---------------- Error & Loading ---------------- */
  if (loading) {
    return (
      <div className="container pt-5 pb-5" style={{ maxWidth: 800, marginTop: 10 }}>
        {/* Timer skeleton */}
        <div className="card border-0 shadow-sm mb-3 rounded-4 p-3">
          <div className="d-flex align-items-center justify-content-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-1.5 w-100 mt-2" />
        </div>

        <Skeleton className="h-10 w-100 mb-3 rounded-3" />

        <div className="card p-3 rounded-4 shadow-sm">
          <div className="border rounded-4 p-3 mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-4"><Skeleton className="h-10 w-100 rounded" /></div>
              <div className="col-6"><Skeleton className="h-16 w-100 rounded" /></div>
              <div className="col-2"><Skeleton className="h-20 w-20 rounded" /></div>
            </div>
          </div>

          <div className="border border-blue-100 rounded-4 p-3 mb-3">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-10 w-100 mb-2 rounded-3" />
            <div className="row g-2">
              <div className="col"><Skeleton className="h-12 w-100 rounded-3" /></div>
              <div className="col"><Skeleton className="h-12 w-100 rounded-3" /></div>
              <div className="col"><Skeleton className="h-12 w-100 rounded-3" /></div>
            </div>
          </div>

          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-28 w-100 mb-3 rounded-3" />

          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-36 w-100 mb-3 rounded-3" />

          <div className="row g-2">
            <div className="col"><Skeleton className="h-12 w-100 rounded-3" /></div>
            <div className="col"><Skeleton className="h-12 w-100 rounded-3" /></div>
            <div className="col"><Skeleton className="h-12 w-100 rounded-3" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container pt-5 pb-5 text-center" style={{ marginTop: "70px" }}>
        <div className="alert alert-danger shadow-sm rounded-4" role="alert">
          <strong className="d-block mb-1">We hit a snag</strong>
          <span>{error}</span>
        </div>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  /* ---------------- Render ---------------- */
  const passengers = bookingData?.passengers || [];
  const journeys = bookingData?.journeys || [];
  const { className: bookingStatusClassName, text: bookingStatusText } = statusDisplay(orderStatus);

  return (
    <div className="container pt-5 pb-5" style={{ maxWidth: 800 }}>
      {/* Status-aware banner */}
      {renderStatusBanner()}

      {/* Timer (only when actually required) */}
      {showTimer && (
        <>
          <div className="card border-primary shadow-sm mb-3 rounded-4">
            <div className="card-body p-2">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-alarm" style={{ color: "#0d6efd" }} aria-hidden="true"></i>
                  <span className="text-primary fw-bold">Payment Time</span>
                </div>
                <div id="timer" className="fw-bold fs-5 text-primary" aria-live="polite">
                  {minutes}:{secs}
                </div>
              </div>
              <div className="progress mt-1" style={{ height: 4 }} aria-hidden="true">
                <div className="progress-bar bg-primary" id="timer-progress" role="progressbar" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {secondsLeft <= 0 && (
            <div id="expired" className="alert alert-warning text-center rounded-4 shadow-sm">
              ⏰ Payment time expired! Please select your flights again.
            </div>
          )}
        </>
      )}

      {/* Back */}
      <button className="btn btn-primary mb-3 w-100 no_print" onClick={() => navigate("/")}>
        Back to Home
      </button>

      {/* Invoice Card */}
      <div className="card p-3 mx-auto rounded-4 shadow-sm" id="invoice" ref={invoiceRef}>
        {/* Header */}
        <div className="border p-3 mb-3 rounded-4">
          <div className="row align-items-center g-2">
            <div className="col-sm-4 d-flex align-items-center justify-content-center">
              <PlaceholderImg
                src="/assets/img/logo/flygasal.png"
                alt="Logo"
                className="logo px-1 rounded"
                style={{ maxWidth: 140 }}
              />
            </div>
            <div className="col-sm-8 d-flex justify-content-end gap-3">
              <div className="text-start">
                <p className="mb-1">
                  <strong>Payment Status:</strong>{" "}
                  <span className={isPaid ? "text-success fw-semibold" : "text-danger fw-semibold"}>
                    {bookingData?.payStatus || "—"}
                  </span>
                </p>
                <p className="mb-1">
                  <strong>Booking Status:</strong> <span className={bookingStatusClassName}>{bookingStatusText}</span>
                </p>
                <p className="mb-1"><strong>Phone:</strong> +254 700 000 000</p>
                <p className="mb-0"><strong>Email:</strong> example@email.com</p>
              </div>
              <div id="InvoiceQR" className="flex-shrink-0 d-flex align-items-center">
                {qrCodeUrl ? (
                  <PlaceholderImg
                    src={qrCodeUrl}
                    alt={`QR for order ${orderNumber}`}
                    style={{ width: 80, height: 80 }}
                    fallback="https://placehold.co/80x80/cccccc/000000?text=QR"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 d-flex align-items-center justify-content-center text-xs text-gray-500 rounded">
                    QR…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment section: either actionable or an info card */}
        {requiresPayment ? (
          <form
            ref={formRef}
            action={`payment/${selectedGateway}`}
            method="post"
            className="border border-blue-200 p-4 rounded-lg mb-4"
          >
            <h4 className="text-xl fw-semibold mb-3 text-gray-800">Pay With</h4>

            {!showGatewaySelection ? (
              <div
                className="d-flex align-items-center gap-2 p-2 justify-content-between border border-gray-300 rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-blue-300"
                onClick={() => setShowGatewaySelection(true)}
                role="button"
                aria-haspopup="listbox"
                aria-expanded="false"
                title="Change payment method"
              >
                {currentGateway?.icon}
                <span className="fs-5 fw-medium text-gray-800">{displayGatewayName}</span>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search payment gateways..."
                    className="w-100 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search payment gateways"
                  />
                </div>

                <div className="row g-3 mb-2" role="listbox">
                  {filteredGateways.length ? (
                    filteredGateways.map((g) => (
                      <div className="col-12 col-sm-6 col-lg-4" key={g.value}>
                        <div
                          className={`d-flex flex-column align-items-center justify-content-center p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedGateway === g.value
                              ? "bg-primary-subtle border-primary shadow-sm"
                              : "bg-white border-gray-200 hover:border-primary"
                          }`}
                          onClick={() => updateFormAction(g.value)}
                          role="option"
                          aria-selected={selectedGateway === g.value}
                        >
                          {g.icon}
                          <span className="mt-2 fw-medium text-gray-800">{g.name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-600">No gateways match “{searchTerm}”.</p>
                  )}
                </div>
              </>
            )}

            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mt-3">
              <div className="order-2 order-md-1 fs-4 fw-bold text-gray-800 text-center text-md-start">
                <small className="fw-normal fs-6 text-gray-600 me-1">{currency}</small>
                <span>{amount ?? "N/A"}</span>
              </div>
              <div className="order-1 order-md-2 w-100 w-md-auto">
                <button
                  type="button"
                  onClick={handleProceedPayment}
                  className="btn btn-success w-100 py-3 px-4 shadow-sm"
                  disabled={!requiresPayment || secondsLeft <= 0}
                  title={!requiresPayment ? "Payment not required" : (secondsLeft <= 0 ? "Payment window expired" : "Proceed to payment")}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
            <input type="hidden" name="payload" value="SAMPLE_PAYLOAD_DATA" />
          </form>
        ) : (
          <div className="border border-success-subtle p-4 rounded-lg mb-4 bg-success-subtle">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-patch-check-fill text-success"></i>
              <div className="fw-semibold">
                {isPaid
                  ? "Payment not required — already paid."
                  : isTerminal
                  ? "Payment not required for this status."
                  : isProcessing
                  ? "No payment required while the order is processing."
                  : "No payment required."}
              </div>
            </div>
          </div>
        )}

        {/* Booking Info */}
        {bookingData && (
          <>
            <p className="border mb-0 p-2 px-3">
              <strong className="text-uppercase">
                <small>Booking</small>
              </strong>
            </p>
            <div className="table-responsive">
              <table className="table table-bordered mb-3">
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
                    <td className="text-center">{bookingData?.bookingId || "—"}</td>
                    <td className="text-center">{bookingData?.orderNum || bookingData?.order_num || "—"}</td>
                    <td className="text-center">{bookingData?.refOrderNum || "—"}</td>
                    <td className="text-center">{bookingData?.pnr || "—"}</td>
                    <td className="text-center">
                      {bookingData?.createdTime ? formatDate(bookingData.createdTime) + " " + formatTime(bookingData.createdTime) : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Travellers */}
        {passengers?.length > 0 && (
          <>
            <p className="border mb-0 p-2 px-3">
              <strong className="text-uppercase">
                <small>Travellers</small>
              </strong>
            </p>
            <div className="table-responsive">
              <table className="table table-bordered mb-3">
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
                  {passengers.map((t, idx) => (
                    <tr key={`${t?.cardNum || t?.ticketNum || idx}-${idx}`}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="text-center">{t?.salutation || "—"}</td>
                      <td className="text-center">
                        {t?.firstName} {t?.lastName}
                        {t?.email ? <small className="d-block fw-light">{t.email}</small> : null}
                        {t?.phone ? <small className="d-block fw-light">{t.phone}</small> : null}
                      </td>
                      <td className="text-center">{t?.cardNum || "—"}</td>
                      <td className="text-center">
                        {t?.passportIssue || "—"} — {t?.cardExpiredDate || "—"}
                      </td>
                      <td className="text-center">{t?.birthday || "—"}</td>
                      <td className="text-center">{t?.pnr || "N/A"}</td>
                      <td className="text-center">{t?.ticketNum || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Flights */}
        {journeys?.length > 0 && (
          <>
            <p className="border mb-0 p-2 px-3">
              <strong className="text-uppercase">
                <small>Flights</small>
              </strong>
            </p>

            {journeys.map((flight, fi) => (
              <div key={`j-${fi}`} className="mb-3">
                {flight?.segments?.map((segment, si) => (
                  <div key={`j-${fi}-s-${si}`} className="mb-3">
                    <div className="border rounded-top">
                      <div className="row g-1 p-2 align-items-center">
                        <div className="col-3 col-md-1 d-flex align-items-center">
                          <PlaceholderImg
                            style={{ width: 50 }}
                            src={`/assets/img/airlines/${getAirlineLogo(segment?.airline)}.png`}
                            className="px-2"
                            alt={getAirlineName(segment?.airline)}
                            fallback="/assets/img/airlines/placeholder.png"
                          />
                        </div>
                        <div className="col-9 col-md-7">
                          <div className="p-2 flex gap-2 lh-sm mt-1">
                            <small className="mb-0 d-block">{getAirlineName(segment?.airline)}</small>
                            <small className="mb-0 d-inline-block">
                              <strong className="border p-2 rounded mx-1">
                                {segment?.type} {segment?.flightNum}
                              </strong>
                            </small>
                          </div>
                        </div>
                        <div className="col-md-3 col-9">
                          <div className="p-2 lh-sm">
                            <small className="mb-0 d-block">
                              <strong>Cabin Baggage: {segment?.cabinBaggage || "—"}</strong>
                            </small>
                            <small className="d-block mb-0">Baggage: {segment?.checkedBaggage || "—"}</small>
                          </div>
                        </div>
                        <div className="col-md-1 col-3 d-flex align-items-center justify-content-end pe-2">
                          <i className="bi bi-luggage" style={{ fontSize: 20, color: "#393e4b" }} aria-hidden="true"></i>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative p-3 bg-gray-50 border-x border-bottom rounded-bottom">
                      <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-md-between position-relative">
                        {/* Mobile vertical line */}
                        <div className="d-md-none position-absolute top-0 bottom-0 start-50 translate-middle-x" style={{ width: 1, background: "#e5e7eb" }} />
                        <div className="d-md-none position-absolute top-50 start-50 translate-middle rounded-circle bg-white p-1 border" style={{ zIndex: 1 }}>
                          <i className="bi bi-airplane" style={{ fontSize: 14 }} aria-hidden="true"></i>
                        </div>

                        {/* Departure */}
                        <div className="text-center text-md-start md:w-33 p-2">
                          <div className="fs-6 fw-bold">{formatDate(segment?.departureDate)}</div>
                          <div className="fw-semibold text-gray-800">{segment?.departureTime}</div>
                          <p className="text-muted small mb-0">
                            Depart from <span className="fw-bold">{getAirportName(segment?.departure)}</span>
                          </p>
                        </div>

                        {/* Desktop line */}
                        <div className="d-none d-md-flex flex-column align-items-center justify-content-center position-relative flex-fill">
                          <div className="position-absolute top-50 start-0 end-0" style={{ height: 2, background: "#e5e7eb" }} />
                          <div className="position-relative bg-white rounded-circle p-1 border">
                            <i className="bi bi-airplane" style={{ fontSize: 14 }} aria-hidden="true"></i>
                          </div>
                          {segment?.duration ? (
                            <small className="position-absolute top-50 translate-middle-y mt-4 text-muted">
                              {segment.duration}
                            </small>
                          ) : null}
                        </div>

                        {/* Arrival */}
                        <div className="text-center text-md-end md:w-33 p-2">
                          <div className="fs-6 fw-bold">{formatDate(segment?.arrivalDate)}</div>
                          <div className="fw-semibold text-gray-800">{segment?.arrivalTime}</div>
                          <p className="text-muted small mb-0">
                            Arrive at <span className="fw-bold">{getAirportName(segment?.arrival)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Fare Summary */}
        {solutions0 && (
          <>
            <p className="mb-2"><strong>Fare Details</strong></p>
            <div className="table-responsive">
              <table className="table table-bordered mb-3">
                <thead>
                  <tr>
                    <th className="text-start">Tax</th>
                    <th className="text-end">% 0</th>
                  </tr>
                  <tr className="bg-light">
                    <th className="text-start"><strong>Total</strong></th>
                    <th className="text-end"><strong>{money(solutions0?.buyerAmount, solutions0?.currency)}</strong></th>
                  </tr>
                </thead>
              </table>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="row g-2 options mb-2">
          <div className="col">
            <button
              className="btn border no_print w-100 d-flex align-items-center justify-content-center p-3"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="animate-spin me-2" width="18" height="18" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  Downloading…
                </>
              ) : (
                <>
                  <i className="bi bi-download me-2"></i> Download as PDF
                </>
              )}
            </button>
          </div>

          <div className="col">
            <a
              id="whatsappBtn"
              className="btn border gap-2 no_print w-100 d-flex align-items-center justify-content-center p-3"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Your booking confirmation: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
              title="Send to WhatsApp"
            >
              <i className="bi bi-whatsapp"></i>
              <span>Send to WhatsApp</span>
            </a>
          </div>

          <div className="col">
            <form
              id="cancelForm"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Please contact support to request cancellation.");
              }}
            >
              <button type="submit" className="btn border no_print w-100 d-flex align-items-center justify-content-center p-3">
                <i className="bi bi-x-lg me-2"></i>
                <span>Request for Cancellation</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Wallet Payment Modal */}
      {showPayModal && requiresPayment && (
        <div className="fixed inset-0 z-50 d-flex align-items-center justify-content-center" role="dialog" aria-modal="true" aria-labelledby="walletModalTitle">
          {/* Backdrop */}
          <div
            className="position-absolute top-0 start-0 end-0 bottom-0"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => !paying && setShowPayModal(false)}
          />

          {/* Modal card */}
          <div className="position-relative z-10 w-100" style={{ maxWidth: 480 }}>
            <div className="bg-white rounded-4 shadow-lg overflow-hidden">
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                <h5 id="walletModalTitle" className="mb-0 fw-semibold">Confirm Wallet Payment</h5>
                <button className="btn btn-sm btn-light" onClick={() => setShowPayModal(false)} disabled={paying} aria-label="Close">✕</button>
              </div>

              <div className="p-4">
                {payError && <div className="alert alert-danger py-2 mb-3">{payError}</div>}

                <div className="rounded-3 border p-3 mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Wallet balance</span>
                    <strong>
                      {wallet.loading ? "Loading…" : money(wallet.balance, wallet.currency || currency)}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <span className="text-muted">Amount due</span>
                    <strong>{money(amountDue, currency)}</strong>
                  </div>
                  <hr className="my-3" />
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Remaining balance</span>
                    <strong>
                      {wallet.loading ? "—" : money((wallet.balance || 0) - amountDue, wallet.currency || currency)}
                    </strong>
                  </div>
                </div>

                {secondsLeft <= 0 && (
                  <div className="alert alert-warning py-2">
                    Payment window expired. Please select your flight again.
                  </div>
                )}
                {!wallet.loading && wallet.balance < amountDue && (
                  <div className="alert alert-warning py-2">
                    Insufficient funds. Please top up your wallet first.
                  </div>
                )}
              </div>

              <div className="p-3 border-top d-flex gap-2 justify-content-end">
                {(!wallet.loading && wallet.balance < amountDue) ? (
                  <a href="/wallet/top-up" className="btn btn-outline-primary">
                    Top Up Wallet
                  </a>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={handleConfirmWalletPayment}
                    disabled={wallet.loading || paying || secondsLeft <= 0}
                  >
                    {paying ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Processing…
                      </>
                    ) : (
                      "Confirm Payment"
                    )}
                  </button>
                )}

                <button className="btn btn-light" onClick={() => setShowPayModal(false)} disabled={paying}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmationSuccessPage;
