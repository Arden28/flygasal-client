import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import flygasal from "../../../api/flygasalService";
import { getAirlineLogo, getAirlineName, getAirportName } from "../../../utils/utils";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { AuthContext } from "../../../context/AuthContext";
import { Check } from "lucide-react";
import jsPDF from "jspdf";
import DepositModal from "../../../components/client/Account/DepositModal";
import apiService from "../../../api/apiService";

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

/* ---------------- Skeleton ---------------- */
const Skeleton = ({ className = "" }) => <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;

const BookingConfirmation = ({
  steps = [
    { id: 1, label: "Flights selected" },
    { id: 2, label: "Details" },
    { id: 3, label: "Confirmation" },
  ],
  currentStep = 3,
  onStepClick,
  brandColor = "#0ea5e9",
  className = "",
}) => {
  const { user } = useContext(AuthContext);
  
  const onDepositSuccess = async () => {
    try {
      const res = await apiService.get?.("/wallet/balance");
      const ok = res && (res?.data?.status === "true" || res?.status === "true" || res?.data?.ok === true);
    } catch {
      // ignore; UI still fine
    }
  };

  const navigate = useNavigate();
  const { orderNumber } = useParams();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bankTransfer, setBankTransfer] = useState(null);

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

  // Celebration UI
  const [showPaySuccess, setShowPaySuccess] = useState(false);
  const [justPaidAmount, setJustPaidAmount] = useState(null);

  // Timer (30 minutes) – shown only if payment is required
  const TOTAL_SECONDS = 30 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef(null);

  const invoiceRef = useRef(null);
  const formRef = useRef(null);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const progressPercent = Math.max(0, (secondsLeft / TOTAL_SECONDS) * 100);

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
    if (formRef.current) formRef.current.action = `payment/${gatewayValue}`;
    setSelectedGateway(gatewayValue);
    setShowGatewaySelection(false);
    setSearchTerm("");
  };


  /* ---------------- Fetch gateways (for DepositModal trigger) --------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.post("/payment_gateways", { api_key: "none" });
        const ok = res?.data?.status === "true" || res?.status === "true";
        if (ok) {
          const first = Array.isArray(res?.data?.data) ? res.data.data[0] : null;
          if (!cancelled) setBankTransfer(first || null);
        }
      } catch (e) {
        // Non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const orderStatus = bookingData?.orderStatus;
  const payStatus = (bookingData?.payStatus || "").toLowerCase();
  const isPaid = payStatus === "paid";

  const terminalStatuses = new Set([
    "ISSUED", "CLOSED", "CNCL", "CNCL_REIMED",
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
      if (orderStatus === "ISSUED") {
        return (
          <div className="alert alert-success rounded-4 mb-3">
            ✅ Ticket issued. You can download/print your receipt below.
          </div>
        );
      }
      if (orderStatus === "CLOSED") {
        return <div className="alert alert-secondary rounded-4 mb-3">Order closed.</div>;
      }
      if (orderStatus?.startsWith("CNCL")) {
        return <div className="alert alert-danger rounded-4 mb-3">This order is cancelled. No payment required.</div>;
      }
      if (orderStatus?.startsWith("REFD") || orderStatus?.startsWith("VOID")) {
        return <div className="alert alert-info rounded-4 mb-3">This order is voided/refunded. No payment required.</div>;
      }
    }

    if (isPaid) {
      return (
        <div className="alert alert-success rounded-4 mb-3">
          💳 Payment received. We’ll take it from here.
        </div>
      );
    }

    if (orderStatus === "RSV_FAIL") {
      return (
        <div className="alert alert-danger rounded-4 mb-3 d-flex justify-content-between align-items-center">
          <div>Reservation failed. Please search for new flights.</div>
          <button className="btn btn-danger" onClick={() => navigate("/flight/availability")}>
            Search again
          </button>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="alert alert-warning rounded-4 mb-3">
          ⏳ Your order is being processed ({statusDisplay(orderStatus).text}). No action is required right now.
        </div>
      );
    }

    if (requiresPayment) {
      return (
        <div className="alert alert-warning rounded-4 mb-3">
          ⚠️ Payment required to continue. Please complete payment before the timer expires.
        </div>
      );
    }

    return null;
  };

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (!showTimer) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showTimer]);

  // ---------- PDF helpers: clean & elegant ----------
  const toDataURL = (url) =>
    new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          const c = document.createElement("canvas");
          c.width = this.naturalWidth || this.width;
          c.height = this.naturalHeight || this.height;
          const ctx = c.getContext("2d");
          ctx.drawImage(this, 0, 0);
          resolve(c.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const hexToRGB = (hex) => {
    const h = (hex || "").replace("#", "");
    if (h.length !== 6) return [0, 0, 0];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  const sectionTitle = (doc, x, y, title, rgb) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...rgb.text);
    doc.text(title.toUpperCase(), x, y);
    // light underline
    doc.setDrawColor(...rgb.line);
    doc.line(x, y + 1.5, x + 180, y + 1.5);
    return y + 6;
  };

  const overline = (doc, x, y, text, rgb) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(text.toUpperCase(), x, y);
    return y + 3.5;
  };

  const chip = (doc, x, y, label, opts = {}) => {
    const padX = 2.8, padY = 1.8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const w = doc.getTextWidth(label) + padX * 2;
    const h = 6.5;
    const { fill = [248, 250, 252], stroke = [226, 232, 240], text = [15, 23, 42], r = 2 } = opts;
    if (doc.roundedRect) {
      doc.setFillColor(...fill);
      doc.setDrawColor(...stroke);
      doc.roundedRect(x, y - h + 1.5, w, h, r, r, "FD");
    } else {
      doc.setFillColor(...fill);
      doc.setDrawColor(...stroke);
      doc.rect(x, y - h + 1.5, w, h, "FD");
    }
    doc.setTextColor(...text);
    doc.text(label, x + padX, y - 2);
    return x + w;
  };

  const kvGrid = (doc, x, y, width, pairs, columns, rgb) => {
    const colW = width / columns;
    const lh = 6;
    let row = 0;
    pairs.forEach((kv, i) => {
      const col = i % columns;
      if (col === 0 && i > 0) row++;
      const cx = x + col * colW;
      const cy = y + row * lh * 2;

      // label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(String(kv.label).toUpperCase(), cx, cy);

      // value
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...rgb.text);
      const wrapped = doc.splitTextToSize(kv.value ?? "—", colW);
      doc.text(wrapped, cx, cy + 4.5);
    });
    const totalRows = Math.ceil(pairs.length / columns);
    return y + totalRows * lh * 2 + 4;
  };

  // Flexible, clean table with zebra rows and per-column alignment
  const drawTable = (doc, startX, startY, tableW, headers, rows, colWidths, rgb, opt = {}) => {
    const headerH = opt.headerH ?? 8;
    const rowHMin = opt.rowH ?? 8;
    const margin = opt.margin ?? 14;
    const zebra = opt.zebra ?? true;
    const aligns = opt.aligns || headers.map(() => "left"); // 'left' | 'right' | 'center'

    const pageH = doc.internal.pageSize.getHeight();
    const ensurePage = (needed) => {
      if (startY + needed > pageH - margin) {
        doc.addPage();
        startY = margin;
      }
    };

    // Header
    ensurePage(headerH + 2);
    doc.setDrawColor(...rgb.line);
    doc.setFillColor(248, 250, 252); // wash
    doc.rect(startX, startY, tableW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    let x = startX;
    headers.forEach((h, i) => {
      const cellW = colWidths[i];
      const tx = x + (aligns[i] === "right" ? cellW - 2 : aligns[i] === "center" ? cellW / 2 : 2);
      const align = aligns[i] === "right" ? "right" : aligns[i] === "center" ? "center" : "left";
      doc.text(String(h).toUpperCase(), tx, startY + headerH - 2.5, { align });
      x += cellW;
    });
    startY += headerH;
    doc.line(startX, startY, startX + tableW, startY);

    // Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...rgb.text);

    rows.forEach((r, rowIdx) => {
      // wrap & compute row height
      const wrapped = r.map((cell, i) => doc.splitTextToSize(cell == null ? "—" : String(cell), colWidths[i] - 4));
      const lines = Math.max(...wrapped.map((w) => w.length));
      const rowH = Math.max(rowHMin, lines * 5.2 + 3);

      ensurePage(rowH + 2);

      // zebra fill
      if (zebra && rowIdx % 2 === 0) {
        doc.setFillColor(250, 250, 251);
        doc.rect(startX, startY, tableW, rowH, "F");
      }

      // cells
      let cx = startX;
      wrapped.forEach((w, i) => {
        const align = aligns[i] === "right" ? "right" : aligns[i] === "center" ? "center" : "left";
        const tx = cx + (align === "right" ? colWidths[i] - 2 : align === "center" ? colWidths[i] / 2 : 2);
        doc.text(w, tx, startY + 5, { align });
        cx += colWidths[i];
      });

      // row separator
      startY += rowH;
      doc.setDrawColor(...rgb.line);
      doc.line(startX, startY, startX + tableW, startY);
    });

    return startY;
  };

  const amountBox = (doc, x, y, w, h, title, value, rgb) => {
    // box
    doc.setDrawColor(...rgb.line);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, w, h, "F");

    // title (overline)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(title.toUpperCase(), x + 5, y + 6);

    // value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...rgb.text);
    doc.text(value, x + w - 5, y + h - 6, { align: "right" });
  };

  const addFooter = (doc, rgb, generatedNote) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      if (generatedNote) doc.text(generatedNote, 14, h - 8);
      doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 8, { align: "right" });
    }
  };

/* ---------------- PDF: premium e-ticket (cinema-ticket style) ---------------- */
const handleDownloadPdf = async () => {
  if (!bookingData) return;

  // ---------- tiny utils ----------
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const hexToRGB = (hex) => {
    const h = String(hex || "").replace("#", "");
    const s = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    if (s.length !== 6) return [15, 23, 42];
    return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
  };

  // Downscale to PNG and paint a white background first to kill black alpha halos.
  const toScaledPNG = (url, maxW = 260, maxH = 120) =>
    new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          const rW = this.naturalWidth || this.width;
          const rH = this.naturalHeight || this.height;
          const scale = Math.min(maxW / rW, maxH / rH, 1);
          const w = Math.max(1, Math.round(rW * scale));
          const h = Math.max(1, Math.round(rH * scale));
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const ctx = c.getContext("2d");
          // paint white to avoid black zones when alpha exists
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(this, 0, 0, w, h);
          resolve(c.toDataURL("image/png"));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  // crisp perforation
  const dashed = (doc, x1, y1, x2, y2, dash = 1.7, gap = 1.7) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const n = Math.floor(len / (dash + gap));
    const ux = dx / len, uy = dy / len;
    for (let i = 0; i < n; i++) {
      const sx = x1 + (dash + gap) * i * ux;
      const sy = y1 + (dash + gap) * i * uy;
      doc.line(sx, sy, sx + dash * ux, sy + dash * uy);
    }
  };

  const money = (n, c = "USD") =>
    (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });

  // ---------- theme & data ----------
  const brandCSS =
    (typeof getComputedStyle === "function" &&
      getComputedStyle(document.documentElement).getPropertyValue("--brand")) ||
    brandColor || "#0ea5e9";

  const rgb = {
    brand: hexToRGB(String(brandCSS).trim()),
    text: hexToRGB("#0f172a"),
    sub: hexToRGB("#475569"),
    line: hexToRGB("#e2e8f0"),
    wash: hexToRGB("#f8fafc"),
    wash2: hexToRGB("#f1f5f9"),
  };

  const solutions0 = bookingData?.solutions?.[0];
  const currency = solutions0?.currency || bookingData?.currency || "USD";
  const amountDue = Number(solutions0?.buyerAmount ?? bookingData?.buyerAmount ?? 0);
  const passengers = bookingData?.passengers || [];
  const journeys = bookingData?.journeys || [];
  const orderRef = bookingData?.orderNum || bookingData?.order_num || "—";
  const pnr = bookingData?.pnr || "—";
  const createdStr = bookingData?.createdTime
    ? `${formatDate(bookingData.createdTime)} ${formatTime(bookingData.createdTime)}`
    : "—";

  setIsDownloadingPdf(true);
  try {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
    const M = 12;
    const W = page.w - M * 2;

    // assets as PNG (downscaled, white-backed) to avoid black alpha zones
    const logo = await toScaledPNG("/assets/img/logo/flygasal.png", 320, 120);
    const qrPng = await toScaledPNG(qrCodeUrl, 220, 220);

    // ---------- header ----------
    let y = M;

    if (logo) {
      // rounded logo plate for a premium look
      doc.setFillColor(...rgb.wash);
      doc.setDrawColor(...rgb.line);
      doc.roundedRect(M, y, 42, 16, 3, 3, "FD");
      doc.addImage(logo, "PNG", M + 3, y + 2.5, 36, 11);
    }

    doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
    doc.setFontSize(16);
    doc.text("E-TICKET / ITINERARY RECEIPT", M, y + 22);

    // order + pnr chips (no QR hovering)
    const chip = (txt, x) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      const padX = 3.2, padY = 1.6, r = 2.2;
      const w = doc.getTextWidth(txt) + padX * 2;
      doc.setFillColor(...rgb.wash);
      doc.setDrawColor(...rgb.line);
      doc.roundedRect(x, y + 2, w, 7.8, r, r, "FD");
      doc.setTextColor(...rgb.text);
      doc.text(txt, x + padX, y + 7.7);
      return x + w + 3;
    };
    let cx = page.w - M - 90;
    cx = chip(`ORDER: ${orderRef}`, cx);
    chip(`PNR: ${pnr}`, cx);

    // header accent
    doc.setDrawColor(...rgb.brand);
    doc.setLineWidth(0.9);
    doc.line(M, y + 26, page.w - M, y + 26);
    doc.setLineWidth(0.2);
    y += 32;

    // ---------- passenger & fare summary (spaced) ----------
    const ensure = (need) => {
      if (y + need > page.h - M) { doc.addPage(); y = M; }
    };

    // passengers plate
    ensure(18);
    doc.setFillColor(...rgb.wash);
    doc.setDrawColor(...rgb.line);
    doc.roundedRect(M, y, W * 0.6 - 3, 16, 3, 3, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
    doc.text("Passenger(s)", M + 4, y + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...rgb.text);
    const paxNames = passengers.length
      ? passengers.map(p => [p?.firstName, p?.lastName].filter(Boolean).join(" ")).join(" • ")
      : "—";
    doc.text(paxNames, M + 4, y + 11.6);

    // fare box
    doc.setDrawColor(...rgb.line);
    doc.setFillColor(...rgb.wash2);
    doc.roundedRect(M + W * 0.6 + 3, y, W * 0.4 - 3, 16, 3, 3, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(71,85,105);
    const paid = (bookingData?.payStatus || "").toLowerCase() === "paid";
    doc.text((paid ? "Total Paid" : "Amount Due").toUpperCase(), M + W * 0.6 + 7, y + 6);
    doc.setFontSize(13); doc.setTextColor(...rgb.text);
    doc.text(money(amountDue, currency), M + W - 7, y + 12.5, { align: "right" });
    y += 22;

    // contact / meta (extra spacing)
    ensure(20);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
    doc.text("Contact & Issue Info", M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71,85,105);
    const cLines = [
      user?.name || "—",
      user?.email || "—",
      user?.phone_number || "—",
      `Issued: ${createdStr}`,
    ];
    doc.text(cLines, M, y + 4.8);
    y += 20;

    // ---------- flight tickets (cinema-ticket look) ----------
    const ticketGap = 8;
    const drawNotch = (x, y, r = 2.8) => {
      // Side notches to evoke the torn-perforation cinema ticket
      doc.setFillColor(255,255,255);
      doc.circle(x, y, r, "F");
    };

    const drawBarcode = (x, y, w = 30, h = 10, seed = 11) => {
      doc.setDrawColor(15, 23, 42);
      doc.setFillColor(15, 23, 42);
      const bars = 40, step = w / bars;
      for (let i = 0; i < bars; i++) {
        const thick = ((i * seed) % 9) > 4 ? 1.05 : 0.55;
        const bx = x + i * step + (step - thick) / 2;
        doc.rect(bx, y, thick, h, "F");
      }
    };

    const drawFlightTicket = async (segment) => {
      const stubW = 34;      // right stub width
      const tH = 56;         // total height
      ensure(tH + 6);

      // background card
      doc.setDrawColor(...rgb.line);
      doc.setFillColor(255,255,255);
      doc.roundedRect(M, y, W, tH, 4, 4, "S");

      // header strip
      doc.setFillColor(...rgb.wash);
      doc.rect(M, y, W - stubW, 12, "F");

      // rounded logo “chip” (no black edges, white-backed PNG already)
      const airlineLogo = await toScaledPNG(`/assets/img/airlines/${getAirlineLogo(segment?.airline)}.png`, 100, 60);
      doc.setDrawColor(...rgb.line);
      doc.setFillColor(255,255,255);
      doc.roundedRect(M + 4, y + 2.5, 17, 7, 2.5, 2.5, "FD");
      if (airlineLogo) doc.addImage(airlineLogo, "PNG", M + 4.6, y + 3, 15.8, 6);

      // airline + flight code
      const alName = getAirlineName(segment?.airline) || segment?.airline || "—";
      const flightCode = `${segment?.type || ""} ${segment?.flightNum || ""}`.trim();
      doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
      doc.setFontSize(10.2);
      doc.text(alName, M + 24, y + 8);
      doc.setTextColor(...rgb.brand); doc.setFontSize(9.6);
      doc.text(flightCode || "—", M + 24 + doc.getTextWidth(alName) + 5, y + 8);

      // perforation between body and stub
      doc.setDrawColor(203,213,225);
      dashed(doc, M + W - stubW, y + 4, M + W - stubW, y + tH - 4, 1.6, 1.7);

      // body (left)
      const bodyX = M + 8, bodyW = W - stubW - 16, bodyY = y + 16;

      // times/airports
      const depDate = formatDate(segment?.departureDate);
      const depTime = segment?.departureTime || "—";
      const depCode = segment?.departure || "—";
      const depAirport = getAirportName(depCode) || depCode;

      const arrDate = formatDate(segment?.arrivalDate);
      const arrTime = segment?.arrivalTime || "—";
      const arrCode = segment?.arrival || "—";
      const arrAirport = getAirportName(arrCode) || arrCode;

      // left time/city
      doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
      doc.setFontSize(13);
      doc.text(depTime, bodyX, bodyY + 6);
      doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
      doc.text(`${depDate} • ${depAirport}`, bodyX, bodyY + 11);

      // right time/city
      doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
      doc.setFontSize(13);
      doc.text(arrTime, bodyX + bodyW, bodyY + 6, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
      doc.text(`${arrDate} • ${arrAirport}`, bodyX + bodyW, bodyY + 11, { align: "right" });

      // improved timeline
      const lineY = bodyY + 16;
      const leftPad = 32, rightPad = 32;
      const x1 = bodyX + leftPad, x2 = bodyX + bodyW - rightPad;
      // light base
      doc.setDrawColor(221, 227, 235);
      doc.setLineWidth(1.1);
      doc.line(x1, lineY, x2, lineY);
      doc.setLineWidth(0.2);
      // endpoints
      doc.setFillColor(...rgb.brand);
      doc.circle(x1, lineY, 1.9, "F");
      doc.circle(x2, lineY, 1.9, "F");
      // plane marker
      const mid = (x1 + x2) / 2;
      doc.setFillColor(...rgb.brand);
      doc.circle(mid, lineY, 1.4, "F");
      // duration bubble
      if (segment?.duration) {
        const label = segment.duration;
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255,255,255);
        const w = doc.getTextWidth(label) + 4.5;
        doc.setFillColor(...rgb.brand);
        doc.roundedRect(mid - w / 2, lineY + 2.6, w, 5.6, 2, 2, "F");
        doc.text(label, mid, lineY + 6.9, { align: "center" });
      }

      // extras row
      const extras = [
        segment?.cabinBaggage ? `Cabin: ${segment.cabinBaggage}` : null,
        segment?.checkedBaggage ? `Baggage: ${segment.checkedBaggage}` : null,
      ].filter(Boolean).join("   •   ");
      if (extras) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
        doc.text(extras, bodyX, bodyY + 24.5);
      }

      // pax + ticket (primary passenger)
      const pax = passengers[0];
      const paxName = pax ? [pax.firstName, pax.lastName].filter(Boolean).join(" ") : "—";
      const ticketNum = pax?.ticketNum || "—";
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(71,85,105);
      doc.text("Passenger", bodyX, bodyY + 31.5);
      doc.text("Ticket", bodyX + bodyW, bodyY + 31.5, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.4); doc.setTextColor(...rgb.text);
      doc.text(paxName, bodyX, bodyY + 36.6);
      doc.text(ticketNum, bodyX + bodyW, bodyY + 36.6, { align: "right" });

      // stub (right): QR + barcode + codes
      const stubX = M + W - stubW, stubY = y, stubH = tH;
      // wash fill
      doc.setFillColor(...rgb.wash2);
      doc.rect(stubX, stubY, stubW, stubH, "F");

      // place QR **inside stub** (never overlapping chips/PNR)
      if (qrPng) doc.addImage(qrPng, "PNG", stubX + 4, stubY + 5, stubW - 8, stubW - 8);

      // IATA codes
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.6); doc.setTextColor(...rgb.text);
      doc.text(depCode, stubX + stubW / 2, stubY + stubW + 6, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); doc.setTextColor(71,85,105);
      doc.text("to", stubX + stubW / 2, stubY + stubW + 10, { align: "center" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.6); doc.setTextColor(...rgb.text);
      doc.text(arrCode, stubX + stubW / 2, stubY + stubW + 14, { align: "center" });

      // barcode at bottom of stub
      drawBarcode(stubX + 3.5, stubY + stubH - 14, stubW - 7, 10, 13);

      // side notches (cinema feel)
      drawNotch(M, y + 6);
      drawNotch(M, y + tH - 6);
      drawNotch(M + W, y + 6);
      drawNotch(M + W, y + tH - 6);

      // advance
      y += tH + ticketGap;
    };

    for (const j of journeys) {
      for (const seg of (j?.segments || [])) {
        await drawFlightTicket(seg);
      }
    }

    // ---------- legal / footer ----------
    const terms =
      "This e-ticket must be presented with a valid ID at check-in. Baggage allowances and fare rules vary by airline and fare class. For changes or refunds, contact support with your Order Reference and PNR.";
    const wrap = (t, w) => doc.splitTextToSize(t, w);

    const ensureText = (txt, width) => {
      const h = wrap(txt, width).length * 4.2 + 8;
      if (y + h > page.h - M) { doc.addPage(); y = M; }
      return h;
    };

    doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(100,116,139);
    const hTerms = ensureText(terms, W);
    doc.text(wrap(terms, W), M, y + 4);
    y += hTerms;

    const now = new Date();
    const gen = `Generated ${now.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
    })}`;
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100,116,139);
      doc.text(gen, M, h - 7);
      doc.text(`Page ${i} of ${pages}`, w - M, h - 7, { align: "right" });
    }

    doc.save(`e-ticket-${orderRef || bookingData?.bookingId || "booking"}.pdf`);
  } catch (e) {
    // optional: console.error("PDF error:", e);
  } finally {
    setIsDownloadingPdf(false);
  }
};


  /* ---------------- Wallet flow ---------------- */

  // subtle confetti / chime helpers (loaded on demand)
  const fireConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } }), 250);
    } catch (_) { /* ignore */ }
  };
  const playSuccessChime = () => {
    try {
      const audio = new Audio("/assets/sfx/success.mp3"); // add this file if you want sound
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (_) {}
  };

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

      const criteria = {
        user_id: user.id,
        order_num: orderNumber,
        amount: solutions0?.buyerAmount,
        currency: solutions0?.currency ?? "USD",
        type: "booking_payment",
        payment_gateway: "wallet_balance",
      };

      const resp = await flygasal.payOrderWithWallet(criteria);
      const ok = resp?.data?.status === "completed" || resp?.data?.success === true;
      if (!ok) {
        throw new Error(resp?.data?.errorMsg || "Payment failed. Please try again.");
      }

      const ticketCriteria = {
        orderNum: orderNumber,
        pnr: bookingData?.pnr,
        contact: {
          name: user.name,
          email: user.email,
          telNum: user.phone_number ?? null,
        }
      };
      const response = await flygasal.ticketing(ticketCriteria);
      console.info('Ticketing: ', response);
      const okay = response?.success === true;
      
      if (!okay) {
        throw new Error(response?.error || "Ticketing failed. Please try again.");
      }


      // Optimistic UI: mark paid immediately
      setBookingData((prev) => (prev ? { ...prev, payStatus: "paid" } : prev));

      // Success effects
      setShowPayModal(false);
      setJustPaidAmount(money(amountDue, currency));
      setShowPaySuccess(true);
      fireConfetti();
      playSuccessChime();
      if (navigator?.vibrate) navigator.vibrate(60);

      // Auto-generate receipt shortly after
      setTimeout(() => {
        try { handleDownloadPdf(); } catch (_) {}
      }, 600);

      // Confirm with canonical backend state
      await refreshBooking();
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
        <div className="mb-3 rounded-4 p-3 border">
          <div className="d-flex align-items-center justify-content-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-1.5 w-100 mt-2" />
        </div>

        <Skeleton className="h-10 w-100 mb-3 rounded-3" />

        <div className="p-3 rounded-4 border">
          <div className="border rounded-4 p-3 mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-4"><Skeleton className="h-10 w-100 rounded" /></div>
              <div className="col-6"><Skeleton className="h-16 w-100 rounded" /></div>
              <div className="col-2"><Skeleton className="h-20 w-20 rounded" /></div>
            </div>
          </div>

          <div className="border rounded-4 p-3 mb-3">
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
        <div className="alert alert-danger rounded-4" role="alert">
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

  const total = steps.length;
  const step = Math.min(Math.max(currentStep, 1), total);

  // Progress percentage (step index based)
  const progressPct = total > 1 ? ((step - 1) / (total - 1)) * 100 : 0;

  return (
    <>
      {/* Minimal table styling */}
      <style>{`
        .minimalist-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .minimalist-table thead th {
          font-size: 12px;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: #475569;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 12px;
          white-space: nowrap;
        }
        .minimalist-table tbody td {
          padding: 12px;
          border-bottom: 1px solid #eef2f7;
          color: #0f172a;
          vertical-align: top;
        }
        .minimalist-table tbody tr:last-child td { border-bottom: 0; }
        .minimalist-table .num { text-align: center; width: 56px; color: #64748b; }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          font-weight: 600; color: #0f172a; margin: 0;
          padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 12px;
          background: #ffffff;
        }
        .section-title small { text-transform: uppercase; letter-spacing: .06em; color: #475569; }
        .soft-card { border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }
        .soft-row { border: 1px solid #e2e8f0; border-radius: 12px; }
        .soft-pill { border: 1px solid #e2e8f0; border-radius: 9999px; padding: 2px 8px; font-weight: 600; font-size: 12px; }
        .btn-plain { border: 1px solid #e2e8f0; background: #fff; }
        .btn-plain:hover { background: #f8fafc; }
      `}</style>

      <div className="min-h-screen bg-[#F6F6F7]">
        {/* ===== Header ===== */}
        <header
          className={[
            "w-full bg-white text-slate-900 border-b border-slate-200",
            className,
          ].join(" ")}
          role="banner"
          style={{ "--brand": brandColor }}
        >
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200">
            <div className="mx-auto max-w-6xl px-2 sm:px-4 py-2">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                <div className="flex justify-center sm:justify-start w-full sm:w-auto">
                  <Link
                    to="/">
                    <img src="/assets/img/logo/flygasal.png" alt="Fly Gasal" className="h-8 sm:h-10 object-contain" />
                  </Link>
                </div>
                <ol className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar" aria-label="Booking steps">
                  {steps.map((s) => {
                    const isActive = s.id === step;
                    const isDone = s.id < step;
                    const Node = onStepClick ? "button" : "div";
                    const base =
                      "group flex items-center gap-2 min-w-0 rounded-2xl transition px-1 py-0 sm:px-3.5 sm:py-2.5 focus:outline-none ring-offset-2 focus:ring-2 hover:bg-[#FAFAFA] cursor-pointer";
                    const tone = isDone
                      ? "border-slate-300 bg-slate-100 focus:ring-[color:var(--brand)]"
                      : isActive
                      ? "border-[color:var(--brand)] bg-white focus:ring-[color:var(--brand)]"
                      : "border-slate-200 bg-white focus:ring-[color:var(--brand)]";
                    return (
                      <li key={s.id} className="min-w-0">
                        <Node
                          type={onStepClick ? "button" : undefined}
                          onClick={onStepClick ? () => onStepClick(s.id) : undefined}
                          className={`${base} ${tone}`}
                          aria-current={isActive ? "step" : undefined}
                          title={s.label}
                          style={{ borderWidth: 1 }}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold shrink-0",
                              isDone
                                ? "bg-[color:var(--brand)] border-[color:var(--brand)] text-white"
                                : isActive
                                ? "bg-white border-[color:var(--brand)] text-slate-900"
                                : "bg-white border-slate-300 text-slate-600",
                            ].join(" ")}
                          >
                            {isDone ? <Check className="h-4 w-4" aria-hidden /> : s.id}
                          </span>
                          <span className={["truncate font-medium", "text-xs sm:text-sm", isActive ? "text-slate-900" : isDone ? "text-slate-700" : "text-slate-600"].join(" ")}>
                            <span className="sm:hidden">{s.label.length > 14 ? s.label.slice(0, 14) + "…" : s.label}</span>
                            <span className="hidden sm:inline">{s.label}</span>
                          </span>
                        </Node>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>

          {/* Full-width progress bar */}
          <div className="w-full">
            <div className="relative h-1.5 w-full bg-slate-200">
              <div
                className="absolute left-0 top-0 h-1.5 rounded-r-full transition-[width] duration-500"
                style={{ width: `${progressPct}%`, background: "var(--brand)" }}
                aria-hidden
              />
            </div>
            <div className="mx-auto max-w-6xl px-4 py-1.5 flex items-center justify-content-between">
              <span className="text-[11px] text-slate-600">Step {step} of {total}</span>
              <span className="text-[11px] text-slate-600">{Math.round(progressPct)}%</span>
            </div>
          </div>
        </header>

        {/* ===== Main Content ===== */}
        <div className="container pt-5 pb-5" style={{ maxWidth: 800 }}>
          {/* Status-aware banner */}
          {renderStatusBanner()}

          {/* Timer (only when required) */}
          {showTimer && (
            <>
              <div className="mb-3 rounded-4 border">
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
                <div id="expired" className="alert alert-warning text-center rounded-4">
                  ⏰ Payment time expired! Please select your flights again.
                </div>
              )}
            </>
          )}

          {/* Back */}
          <button className="btn btn-primary bg-[#0ea5e9] py-3 rounded-4 mb-3 w-100 no_print" onClick={() => navigate("/")}>
            Back to Home
          </button>

          {/* Invoice Card */}
          <div className="p-3 mx-auto rounded-4 soft-card" id="invoice" ref={invoiceRef}>
            {/* Header */}
            <div className="border p-3 mb-3 rounded-4">
              <div className="row align-items-center g-2">
                <div className="col-sm-4 d-flex align-items-center justify-content-center">
                  <PlaceholderImg src="/assets/img/logo/flygasal.png" alt="Logo" className="logo px-1 rounded" style={{ maxWidth: 140 }} />
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

            {/* Payment section */}
            {requiresPayment ? (
              <form
                ref={formRef}
                action={`payment/${selectedGateway}`}
                method="post"
                className="p-4 rounded-4 border"
              >
                <h4 className="h5 fw-semibold mb-3 text-gray-800">Pay With</h4>

                {!showGatewaySelection ? (
                  <div
                    className="d-flex align-items-center gap-2 p-2 justify-content-between border rounded-3 cursor-pointer"
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
                        className="w-100 p-3 border rounded-3 focus:outline-none"
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
                              className={`d-flex flex-column align-items-center justify-content-center p-3 border rounded-3 cursor-pointer ${
                                selectedGateway === g.value
                                  ? "bg-primary-subtle border-primary"
                                  : "bg-white"
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
                      className="btn btn-success w-100 py-3 px-4"
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
              <div className="p-4 rounded-4 border bg-success-subtle">
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
                <p className="section-title mb-2 mt-2"><small>Booking</small></p>
                <div className="table-responsive">
                  <table className="minimalist-table mb-3">
                    <thead>
                      <tr>
                        <th className="text-center">Booking Reference</th>
                        <th className="text-center">PNR</th>
                        <th className="text-center">Booking Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center">{bookingData?.orderNum || bookingData?.order_num || "—"}</td>
                        <td className="text-center">{bookingData?.pnr || "—"}</td>
                        <td className="text-center">
                          {bookingData?.createdTime ? `${formatDate(bookingData.createdTime)} ${formatTime(bookingData.createdTime)}` : "—"}
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
                <p className="section-title mb-2"><small>Travellers</small></p>
                <div className="table-responsive">
                  <table className="minimalist-table mb-3">
                    <thead>
                      <tr>
                        <th className="num">No</th>
                        {/* <th className="text-center">Sr</th> */}
                        <th className="text-start">Name</th>
                        <th className="text-center">Passport No.</th>
                        <th className="text-center">Passport Expiry</th>
                        <th className="text-center">DOB</th>
                        {/* <th className="text-center">PNR</th> */}
                        <th className="text-center">Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((t, idx) => (
                        <tr key={`${t?.cardNum || t?.ticketNum || idx}-${idx}`}>
                          <td className="num">{idx + 1}</td>
                          {/* <td className="text-center">{t?.salutation || "—"}</td> */}
                          <td className="text-start">
                            <div className="fw-semibold">{t?.firstName} {t?.lastName}</div>
                            {t?.email ? <small className="d-block text-muted">{t.email}</small> : null}
                            {t?.phone ? <small className="d-block text-muted">{t.phone}</small> : null}
                          </td>
                          <td className="text-center">{t?.cardNum || "—"}</td>
                          <td className="text-center">{t?.cardExpiredDate || "—"}</td>
                          <td className="text-center">{t?.birthday || "—"}</td>
                          {/* <td className="text-center">{t?.pnr || "N/A"}</td> */}
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
                <p className="section-title mb-2"><small>Flights</small></p>

                {journeys.map((flight, fi) => (
                  <div key={`j-${fi}`} className="mb-3">
                    {flight?.segments?.map((segment, si) => (
                      <div key={`j-${fi}-s-${si}`} className="mb-3">
                        <div className="soft-row">
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
                              <div className="p-2 lh-sm mt-1 d-flex align-items-center flex-wrap gap-2">
                                <small className="mb-0 d-block">{getAirlineName(segment?.airline)}</small>
                                <small className="mb-0 d-inline-block">
                                  <strong className="soft-pill mx-1">
                                    {segment?.type} {segment?.flightNum}
                                  </strong>
                                </small>
                              </div>
                            </div>
                            <div className="col-md-3 col-9">
                              <div className="p-2 lh-sm">
                                <small className="mb-0 d-block"><strong>Cabin Baggage: {segment?.cabinBaggage || "—"}</strong></small>
                                <small className="d-block mb-0">Baggage: {segment?.checkedBaggage || "—"}</small>
                              </div>
                            </div>
                            <div className="col-md-1 col-3 d-flex align-items-center justify-content-end pe-2">
                              <i className="bi bi-luggage" style={{ fontSize: 20, color: "#393e4b" }} aria-hidden="true"></i>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative p-3 bg-gray-50 border-start border-end border-bottom rounded-bottom">
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
                <p className="mb-2 fw-semibold">Fare Details</p>
                <div className="table-responsive">
                  <table className="minimalist-table mb-3">
                    <thead>
                      <tr>
                        <th className="text-start">Tax</th>
                        <th className="text-end">% 0</th>
                      </tr>
                      <tr>
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
                  className="btn btn-plain no_print w-100 d-flex align-items-center justify-content-center p-3"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <>
                      <svg className="me-2" width="18" height="18" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
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
                  className="btn btn-plain gap-2 no_print w-100 d-flex align-items-center justify-content-center p-3"
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
                  <button type="submit" className="btn btn-plain no_print w-100 d-flex align-items-center justify-content-center p-3">
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
                <div className="bg-white rounded-4 overflow-hidden border">
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
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#depositModal"
                      >
                        Top Up Wallet
                      </button>
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

          {/* Payment Success Overlay */}
          {showPaySuccess && (
            <div className="fixed inset-0 z-50 d-flex align-items-center justify-content-center" role="dialog" aria-modal="true">
              <div
                className="position-absolute top-0 start-0 end-0 bottom-0"
                style={{ background: "rgba(0,0,0,.5)" }}
                onClick={() => setShowPaySuccess(false)}
              />
              <div className="position-relative z-10 bg-white rounded-4 p-4 border" style={{ width: "min(520px, 92vw)" }}>
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 rounded-circle border border-success-subtle d-flex align-items-center justify-content-center"
                    style={{ width: 80, height: 80, background: "#ecfdf5" }}
                  >
                    <i className="bi bi-check2-circle text-success" style={{ fontSize: 36 }} aria-hidden="true"></i>
                  </div>
                  <h5 className="fw-bold mb-1">Payment Successful</h5>
                  <p className="text-muted mb-3">
                    We’ve received your payment {justPaidAmount ? <strong>({justPaidAmount})</strong> : null}. We’ll take it from here.
                  </p>
                  <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                    <button className="btn btn-success" onClick={() => { try { handleDownloadPdf(); } catch (_) {} }}>
                      <i className="bi bi-download me-2"></i> Download Receipt
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => setShowPaySuccess(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal mount */}
        <DepositModal
          user={user}
          bankTransfer={bankTransfer}
          onSuccess={onDepositSuccess}
        />
      </div>
    </>
  );
};

export default BookingConfirmation;
