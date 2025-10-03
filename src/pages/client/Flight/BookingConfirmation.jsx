import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import flygasal from "../../../api/flygasalService";
import { getAirlineLogo, getAirlineName, getAirportName } from "../../../utils/utils";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { AuthContext } from "../../../context/AuthContext";
import { Check } from "lucide-react";
import jsPDF from "jspdf";

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

const PlaceholderImg = ({
  alt = "",
  className = "",
  style = {},
  src,
  fallback = "/assets/img/airlines/placeholder.png",
}) => (
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
    case "ISSUED": return { className: base + "text-bg-success", text: "Ticket Issued" };
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

  const terminalStatuses = new Set(["ISSUED", "CLOSED", "CNCL", "CNCL_REIMED", "REFD", "REFD_REIMED", "VOID", "VOID_REIMED"]);
  const processingStatuses = new Set(["ISS_PRC", "CHG_PRC", "REFD_PRC", "VOID_PRC", "UNDER_REVIEW", "HOLD", "TO_BE_RSV"]);
  const payRequiredStatuses = new Set(["TO_BE_PAID", "CHG_TO_BE_PAID"]);

  const isTerminal = terminalStatuses.has(orderStatus);
  const isProcessing = processingStatuses.has(orderStatus);
  const requiresPayment = payRequiredStatuses.has(orderStatus) && !isPaid && amountDue > 0;

  // Timer is shown only if payment is actually required
  const showTimer = requiresPayment;

  // Calm, status-aware banner
  const renderStatusBanner = () => {
    if (isTerminal) {
      if (orderStatus === "ISSUED") {
        return (
          <div className="border rounded-3 p-3 mb-3 bg-success-subtle text-success">
            ✅ Ticket issued. You can download your receipt below.
          </div>
        );
      }
      if (orderStatus === "CLOSED") {
        return <div className="border rounded-3 p-3 mb-3 bg-secondary-subtle text-secondary">Order closed.</div>;
      }
      if (orderStatus?.startsWith("CNCL")) {
        return <div className="border rounded-3 p-3 mb-3 bg-danger-subtle text-danger">This order is cancelled.</div>;
      }
      if (orderStatus?.startsWith("REFD") || orderStatus?.startsWith("VOID")) {
        return <div className="border rounded-3 p-3 mb-3 bg-info-subtle text-info">This order is voided/refunded.</div>;
      }
    }

    if (isPaid) {
      return (
        <div className="border rounded-3 p-3 mb-3 bg-success-subtle text-success">
          💳 Payment received. We’ll take it from here.
        </div>
      );
    }

    if (orderStatus === "RSV_FAIL") {
      return (
        <div className="border rounded-3 p-3 mb-3 bg-danger-subtle text-danger d-flex flex-wrap align-items-center justify-content-between">
          <span>Reservation failed. Please search for new flights.</span>
          <button className="btn btn-danger mt-2 mt-sm-0" onClick={() => navigate("/flight/availability")}>
            Search again
          </button>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="border rounded-3 p-3 mb-3 bg-warning-subtle text-warning">
          ⏳ Your order is being processed ({statusDisplay(orderStatus).text}). No action required.
        </div>
      );
    }

    if (requiresPayment) {
      return (
        <div className="border rounded-3 p-3 mb-3 bg-warning-subtle text-warning">
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

  // ---------- PDF helpers ---------- //
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
    doc.setDrawColor(...rgb.line);
    doc.line(x, y + 1.5, x + 180, y + 1.5);
    return y + 6;
  };

  const overline = (doc, x, y, text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
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
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(String(kv.label).toUpperCase(), cx, cy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...rgb.text);
      const wrapped = doc.splitTextToSize(kv.value ?? "—", colW);
      doc.text(wrapped, cx, cy + 4.5);
    });
    const totalRows = Math.ceil(pairs.length / columns);
    return y + totalRows * lh * 2 + 4;
  };

  const drawTable = (doc, startX, startY, tableW, headers, rows, colWidths, rgb, opt = {}) => {
    const headerH = opt.headerH ?? 8;
    const rowHMin = opt.rowH ?? 8;
    const margin = opt.margin ?? 14;
    const zebra = opt.zebra ?? true;
    const aligns = opt.aligns || headers.map(() => "left");

    const pageH = doc.internal.pageSize.getHeight();
    const ensurePage = (needed) => {
      if (startY + needed > pageH - margin) {
        doc.addPage();
        startY = margin;
      }
    };

    ensurePage(headerH + 2);
    doc.setDrawColor(...rgb.line);
    doc.setFillColor(248, 250, 252);
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

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...rgb.text);

    rows.forEach((r, rowIdx) => {
      const wrapped = r.map((cell, i) => doc.splitTextToSize(cell == null ? "—" : String(cell), colWidths[i] - 4));
      const lines = Math.max(...wrapped.map((w) => w.length));
      const rowH = Math.max(rowHMin, lines * 5.2 + 3);

      ensurePage(rowH + 2);

      if (zebra && rowIdx % 2 === 0) {
        doc.setFillColor(250, 250, 251);
        doc.rect(startX, startY, tableW, rowH, "F");
      }

      let cx = startX;
      wrapped.forEach((w, i) => {
        const align = aligns[i] === "right" ? "right" : aligns[i] === "center" ? "center" : "left";
        const tx = cx + (align === "right" ? colWidths[i] - 2 : align === "center" ? colWidths[i] / 2 : 2);
        doc.text(w, tx, startY + 5, { align });
        cx += colWidths[i];
      });

      startY += rowH;
      doc.setDrawColor(...rgb.line);
      doc.line(startX, startY, startX + tableW, startY);
    });

    return startY;
  };

  const amountBox = (doc, x, y, w, h, title, value, rgb) => {
    doc.setDrawColor(...rgb.line);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, w, h, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(title.toUpperCase(), x + 5, y + 6);

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
      doc.setTextColor(100, 116, 139);
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      if (generatedNote) doc.text(generatedNote, 14, h - 8);
      doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 8, { align: "right" });
    }
  };

  /* ---------------- PDF ---------------- */
  const handleDownloadPdf = async () => {
    if (!bookingData) return;
    try {
      setIsDownloadingPdf(true);

      const brand =
        (typeof getComputedStyle === "function" &&
          getComputedStyle(document.documentElement).getPropertyValue("--brand")) ||
        (typeof brandColor === "string" ? brandColor : "#0ea5e9");

      const rgb = {
        text: hexToRGB("#0f172a"),
        muted: hexToRGB("#475569"),
        line: hexToRGB("#e5e7eb"),
        wash: hexToRGB("#f8fafc"),
        brand: hexToRGB((brand || "#0ea5e9").trim()),
      };

      const doc = new jsPDF("p", "mm", "a4");
      const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
      const M = 14;
      const W = page.w - M * 2;

      let y = M;

      // Assets
      const logoUrl = "/assets/img/logo/flygasal.png";
      const logo = await toDataURL(logoUrl);
      const qr = await toDataURL(qrCodeUrl);

      // Header
      if (logo) doc.addImage(logo, "PNG", M, y, 36, 13);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...rgb.text);
      doc.text("Booking Confirmation", M, y + 17);

      const rightX = page.w - M;
      const topRightY = y + 3;

      const payTxt = (bookingData?.payStatus || "—").toUpperCase();
      const statusTxt = (statusDisplay(bookingData?.orderStatus || "").text || "—").toUpperCase();

      let cx = rightX - 80;
      cx = chip(doc, cx, topRightY + 7, `PAYMENT: ${payTxt}`, {
        fill: [241, 245, 249], stroke: rgb.line, text: rgb.text,
      }) + 3;
      chip(doc, cx, topRightY + 7, `STATUS: ${statusTxt}`, {
        fill: [241, 245, 249], stroke: rgb.line, text: rgb.text,
      });

      if (qr) doc.addImage(qr, "PNG", rightX - 22, topRightY + 10, 22, 22);

      const amountLabel = requiresPayment ? "Amount Due" : "Total";
      const amountValue = amount != null ? `${money(amountDue, currency)}` : "—";
      amountBox(doc, rightX - 60, topRightY + 35, 60, 22, amountLabel, amountValue, rgb);

      // Accent rule
      doc.setDrawColor(...rgb.brand);
      doc.setLineWidth(0.8);
      doc.line(M, y + 24, page.w - M, y + 24);
      doc.setLineWidth(0.2);
      y += 32;

      // Booking info
      y = overline(doc, M, y, "Booking");
      y = sectionTitle(doc, M, y, "Details", rgb);
      const bookingPairs = [
        { label: "Booking ID", value: bookingData?.bookingId || "—" },
        { label: "Booking Reference", value: bookingData?.orderNum || bookingData?.order_num || "—" },
        { label: "Order Reference", value: bookingData?.refOrderNum || "—" },
        { label: "PNR", value: bookingData?.pnr || "—" },
        {
          label: "Booking Date",
          value: bookingData?.createdTime
            ? `${formatDate(bookingData.createdTime)} ${formatTime(bookingData.createdTime)}`
            : "—",
        },
      ];
      y = kvGrid(doc, M, y, W, bookingPairs, 2, rgb);
      y += 2;

      // Travellers
      const passengers = bookingData?.passengers || [];
      if (passengers.length) {
        y = overline(doc, M, y, "Section");
        y = sectionTitle(doc, M, y, "Travellers", rgb);

        const headers = ["No", "Sr", "Name", "Passport", "Issue–Expiry", "DOB", "PNR", "Ticket"];
        const rows = passengers.map((p, i) => [
          String(i + 1),
          p?.salutation || "—",
          [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "—",
          p?.cardNum || "—",
          `${p?.passportIssue || "—"} — ${p?.cardExpiredDate || "—"}`,
          p?.birthday || "—",
          p?.pnr || "—",
          p?.ticketNum || "—",
        ]);

        const colWidths = [10, 12, 42, 28, 36, 22, 18, 22];
        const scale = W / colWidths.reduce((a, b) => a + b, 0);
        const scaled = colWidths.map((w) => w * scale);
        const aligns = ["center", "center", "left", "left", "left", "center", "center", "center"];

        y = drawTable(doc, M, y, W, headers, rows, scaled, rgb, { margin: M, aligns, zebra: true, rowH: 9 });
        y += 2;
      }

      // Flights
      const journeys = bookingData?.journeys || [];
      if (journeys.length) {
        y = overline(doc, M, y, "Section");
        y = sectionTitle(doc, M, y, "Flights", rgb);

        const headers = ["Flight", "From", "To", "Details"];
        const rows = [];
        journeys.forEach((j) => {
          (j?.segments || []).forEach((s) => {
            const airline = getAirlineName(s?.airline) || s?.airline || "—";
            const code = `${s?.type || ""} ${s?.flightNum || ""}`.trim();
            const from = `${formatDate(s?.departureDate || "")} ${s?.departureTime || ""}\n${getAirportName(s?.departure) || s?.departure || "—"}`;
            const to = `${formatDate(s?.arrivalDate || "")} ${s?.arrivalTime || ""}\n${getAirportName(s?.arrival) || s?.arrival || "—"}`;
            const details = [
              s?.duration ? `Duration: ${s.duration}` : null,
              s?.cabinBaggage ? `Cabin: ${s.cabinBaggage}` : null,
              s?.checkedBaggage ? `Baggage: ${s.checkedBaggage}` : null,
            ].filter(Boolean).join("\n");
            rows.push([`${airline}\n${code}`, from, to, details || "—"]);
          });
        });

        const colWidths = [40, 50, 50, 40];
        const scale = W / colWidths.reduce((a, b) => a + b, 0);
        const scaled = colWidths.map((w) => w * scale);
        const aligns = ["left", "left", "left", "left"];

        y = drawTable(doc, M, y, W, headers, rows, scaled, rgb, { margin: M, aligns, zebra: true, rowH: 10 });
        y += 2;
      }

      // Fare
      if (solutions0) {
        y = overline(doc, M, y, "Section");
        y = sectionTitle(doc, M, y, "Fare Details", rgb);

        const headers = ["Item", "Value"];
        const rows = [
          ["Tax", "% 0"],
          ["Total", money(solutions0?.buyerAmount, solutions0?.currency)],
        ];
        const colWidths = [W * 0.6, W * 0.4];
        const aligns = ["left", "right"];

        y = drawTable(doc, M, y, W, headers, rows, colWidths, rgb, { margin: M, aligns, zebra: false, rowH: 9 });
        y += 2;
      }

      // Note
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const note =
        "This document serves as a booking confirmation. For changes, refunds, or cancellations, please contact support with your Booking Reference.";
      const wrappedNote = doc.splitTextToSize(note, W);
      const remaining = page.h - M - y;
      const needed = wrappedNote.length * 4.2 + 6;
      if (needed > remaining) {
        doc.addPage();
        y = M;
      }
      doc.text(wrappedNote, M, y + 4);

      const now = new Date();
      const generatedNote = `Generated ${now.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      addFooter(doc, rgb, generatedNote);

      doc.save(`invoice-${bookingData?.orderNum || bookingData?.bookingId || "booking"}.pdf`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /* ---------------- Wallet flow ---------------- */
  const fireConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } }), 250);
    } catch (_) {}
  };
  const playSuccessChime = () => {
    try {
      const audio = new Audio("/assets/sfx/success.mp3");
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
      if (!ok) throw new Error(resp?.data?.errorMsg || "Payment failed. Please try again.");

      const ticketCriteria = {
        orderNum: orderNumber,
        pnr: bookingData?.pnr,
        contact: { name: user.name, email: user.email, telNum: user.phone_number ?? null },
      };
      const response = await flygasal.ticketing(ticketCriteria);
      const okay = response?.success === true;
      if (!okay) throw new Error(response?.error || "Ticketing failed. Please try again.");

      setBookingData((prev) => (prev ? { ...prev, payStatus: "paid" } : prev));

      setShowPayModal(false);
      setJustPaidAmount(money(amountDue, currency));
      setShowPaySuccess(true);
      fireConfetti();
      playSuccessChime();
      if (navigator?.vibrate) navigator.vibrate(60);

      setTimeout(() => {
        try {
          handleDownloadPdf();
        } catch (_) {}
      }, 600);

      await refreshBooking();
    } catch (err) {
      console.error("Wallet payment error:", err);
      setPayError(err?.message || "We couldn’t complete your payment.");
    } finally {
      setPaying(false);
    }
  };

  /* ---------------- Loading / Error ---------------- */
  if (loading) {
    return (
      <div className="container pt-5 pb-5" style={{ maxWidth: 800, marginTop: 10 }}>
        <div className="mb-3 rounded-3 p-3 border">
          <div className="d-flex align-items-center justify-content-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-1.5 w-100 mt-2" />
        </div>

        <Skeleton className="h-10 w-100 mb-3 rounded-3" />

        <div className="p-3 rounded-3 border">
          <div className="border rounded-3 p-3 mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-4"><Skeleton className="h-10 w-100 rounded" /></div>
              <div className="col-6"><Skeleton className="h-16 w-100 rounded" /></div>
              <div className="col-2"><Skeleton className="h-20 w-20 rounded" /></div>
            </div>
          </div>
          <div className="border rounded-3 p-3 mb-3">
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
        <div className="border rounded-3 p-3 mb-3 bg-danger-subtle text-danger">
          <strong className="d-block mb-1">We hit a snag</strong>
          <span>{error}</span>
        </div>
        <button className="btn btn-primary mt-2" onClick={() => navigate("/")}>
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
  const progressPct = total > 1 ? ((step - 1) / (total - 1)) * 100 : 0;

  return (
    <>
      {/* Minimal local styling (clean, no shadows) */}
      <style>{`
        .minimalist-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .minimalist-table thead th {
          font-size: 12px; letter-spacing: .04em; text-transform: uppercase; color: #475569;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 12px; white-space: nowrap;
        }
        .minimalist-table tbody td {
          padding: 12px; border-bottom: 1px solid #eef2f7; color: #0f172a; vertical-align: top;
        }
        .minimalist-table tbody tr:last-child td { border-bottom: 0; }
        .minimalist-table .num { text-align: center; width: 56px; color: #64748b; }
        .section-title {
          display: flex; align-items: center; gap: 8px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;
          padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;
        }
        .soft-card { border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }
        .soft-row { border: 1px solid #e2e8f0; border-radius: 12px; }
        .soft-pill { border: 1px solid #e2e8f0; border-radius: 9999px; padding: 2px 8px; font-weight: 600; font-size: 12px; }
        .btn-plain { border: 1px solid #e2e8f0; background: #fff; }
        .btn-plain:hover { background: #f8fafc; }
        .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-vh-100 bg-light">
        {/* ===== Header ===== */}
        <header
          className={["w-100 bg-white text-slate-900 border-bottom border-slate-200", className].join(" ")}
          role="banner"
          style={{ "--brand": brandColor }}
        >
          <div className="sticky top-0 z-40 bg-white">
            <div className="mx-auto" style={{ maxWidth: 1120 }}>
              <div className="px-3 py-2 d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
                <Link to="/" className="d-inline-flex align-items-center">
                  <img src="/assets/img/logo/flygasal.png" alt="Fly Gasal" className="img-fluid" style={{ height: 40 }} />
                </Link>

                {/* Steps */}
                <ol className="d-flex align-items-center gap-2 overflow-auto no-scrollbar m-0 py-1" aria-label="Booking steps">
                  {steps.map((s) => {
                    const isActive = s.id === step;
                    const isDone = s.id < step;
                    const Node = onStepClick ? "button" : "div";
                    const base =
                      "d-flex align-items-center gap-2 rounded-pill px-2 py-1 border";
                    const tone = isDone
                      ? "border-secondary bg-light"
                      : isActive
                      ? "border-primary bg-white"
                      : "border-secondary bg-white";
                    return (
                      <li key={s.id} className="list-unstyled">
                        <Node
                          type={onStepClick ? "button" : undefined}
                          onClick={onStepClick ? () => onStepClick(s.id) : undefined}
                          className={`${base} ${tone}`}
                          aria-current={isActive ? "step" : undefined}
                          title={s.label}
                        >
                          <span
                            className={[
                              "d-inline-flex justify-content-center align-items-center rounded-circle border fw-semibold",
                              isDone ? "bg-primary border-primary text-white" : isActive ? "bg-white border-primary" : "bg-white border-secondary text-secondary",
                            ].join(" ")}
                            style={{ width: 28, height: 28, fontSize: 12 }}
                          >
                            {isDone ? <Check size={14} aria-hidden /> : s.id}
                          </span>
                          <span className={["text-truncate", isActive ? "text-dark fw-semibold" : "text-secondary"].join(" ")} style={{ maxWidth: 140 }}>
                            {s.label}
                          </span>
                        </Node>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* Thin progress line */}
            <div className="w-100">
              <div className="position-relative" style={{ height: 6, background: "#e2e8f0" }}>
                <div
                  className="position-absolute top-0 start-0 h-100"
                  style={{ width: `${progressPct}%`, background: "var(--brand)" }}
                  aria-hidden="true"
                />
              </div>
              <div className="mx-auto d-flex justify-content-between px-3 py-1" style={{ maxWidth: 1120 }}>
                <small className="text-secondary">Step {step} of {total}</small>
                <small className="text-secondary">{Math.round(progressPct)}%</small>
              </div>
            </div>
          </div>
        </header>

        {/* ===== Main Content ===== */}
        <div className="container py-4" style={{ maxWidth: 880 }}>
          {renderStatusBanner()}

          {/* Timer (only when required) */}
          {showTimer && (
            <>
              <div className="mb-3 rounded-3 border">
                <div className="p-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <span aria-hidden>⏱</span>
                      <span className="fw-semibold">Payment Time</span>
                    </div>
                    <div className="fw-bold" aria-live="polite">
                      {minutes}:{secs}
                    </div>
                  </div>
                  <div className="mt-2" style={{ height: 4, background: "#e2e8f0" }} aria-hidden="true">
                    <div style={{ width: `${progressPercent}%`, height: 4, background: brandColor }} />
                  </div>
                </div>
              </div>

              {secondsLeft <= 0 && (
                <div className="border rounded-3 p-3 mb-3 bg-warning-subtle text-warning text-center">
                  Payment time expired. Please search again.
                </div>
              )}
            </>
          )}

          {/* Back */}
          <button className="btn btn-outline-primary w-100 mb-3" onClick={() => navigate("/")}>
            Back to Home
          </button>

          {/* Invoice Card */}
          <div className="p-3 mx-auto rounded-3 soft-card" id="invoice" ref={invoiceRef}>
            {/* Header Row */}
            <div className="border p-3 mb-3 rounded-3">
              <div className="row align-items-center g-2">
                <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                  <PlaceholderImg src="/assets/img/logo/flygasal.png" alt="Logo" className="px-1 rounded" style={{ maxWidth: 140 }} />
                </div>
                <div className="col-12 col-sm-6 d-flex flex-wrap justify-content-sm-end gap-3">
                  <div className="text-start">
                    <p className="mb-1">
                      <strong>Payment:</strong>{" "}
                      <span className={isPaid ? "text-success fw-semibold" : "text-danger fw-semibold"}>
                        {bookingData?.payStatus || "—"}
                      </span>
                    </p>
                    <p className="mb-1">
                      <strong>Status:</strong>{" "}
                      <span className={bookingStatusClassName}>{bookingStatusText}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {qrCodeUrl ? (
                      <PlaceholderImg
                        src={qrCodeUrl}
                        alt={`QR for order ${orderNumber}`}
                        style={{ width: 80, height: 80 }}
                        fallback="/assets/img/qr-fallback.png"
                      />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center rounded border" style={{ width: 80, height: 80, color: "#64748b" }}>
                        QR
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
                className="p-3 rounded-3 border"
              >
                <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-3 mb-3">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h4 className="h6 m-0">Payment Method</h4>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowGatewaySelection((v) => !v)}
                        aria-expanded={showGatewaySelection}
                        aria-controls="gatewayList"
                      >
                        {showGatewaySelection ? "Close" : "Change"}
                      </button>
                    </div>

                    {!showGatewaySelection ? (
                      <div
                        className="d-flex align-items-center gap-2 p-2 border rounded-3"
                        onClick={() => setShowGatewaySelection(true)}
                        role="button"
                        title="Change payment method"
                      >
                        {currentGateway?.icon}
                        <span className="fw-medium">{displayGatewayName}</span>
                      </div>
                    ) : (
                      <div id="gatewayList" className="mt-2">
                        <div className="mb-2">
                          <input
                            type="text"
                            placeholder="Search gateways…"
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search payment gateways"
                          />
                        </div>
                        <div className="row g-2">
                          {filteredGateways.length ? (
                            filteredGateways.map((g) => (
                              <div className="col-12 col-sm-6 col-lg-4" key={g.value}>
                                <button
                                  type="button"
                                  className={`w-100 d-flex flex-column align-items-center justify-content-center p-3 border rounded-3 ${selectedGateway === g.value ? "border-primary bg-light" : "bg-white"}`}
                                  onClick={() => updateFormAction(g.value)}
                                  aria-pressed={selectedGateway === g.value}
                                >
                                  {g.icon}
                                  <span className="mt-2 fw-medium">{g.name}</span>
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted small m-0">No gateways match “{searchTerm}”.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-end w-100 w-md-auto">
                    <div className="small text-secondary">Amount</div>
                    <div className="fs-4 fw-bold">{money(amountDue, currency)}</div>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    type="button"
                    onClick={handleProceedPayment}
                    className="btn btn-primary py-2"
                    disabled={!requiresPayment || secondsLeft <= 0}
                    title={!requiresPayment ? "Payment not required" : (secondsLeft <= 0 ? "Payment window expired" : "Proceed to payment")}
                  >
                    Proceed to Payment
                  </button>
                </div>

                <input type="hidden" name="payload" value="SAMPLE_PAYLOAD_DATA" />
              </form>
            ) : (
              <div className="p-3 rounded-3 border bg-success-subtle text-success">
                {isPaid
                  ? "Payment not required — already paid."
                  : isTerminal
                  ? "Payment not required for this status."
                  : isProcessing
                  ? "No payment required while the order is processing."
                  : "No payment required."}
              </div>
            )}

            {/* Booking Info */}
            {bookingData && (
              <>
                <p className="section-title"><span>Booking</span></p>
                <div className="table-responsive">
                  <table className="minimalist-table mb-3">
                    <thead>
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
                <p className="section-title"><span>Travellers</span></p>
                <div className="table-responsive">
                  <table className="minimalist-table mb-3">
                    <thead>
                      <tr>
                        <th className="num">No</th>
                        <th className="text-center">Sr</th>
                        <th className="text-start">Name</th>
                        <th className="text-center">Passport No.</th>
                        <th className="text-center">Passport Issue – Expiry</th>
                        <th className="text-center">DOB</th>
                        <th className="text-center">PNR</th>
                        <th className="text-center">Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((t, idx) => (
                        <tr key={`${t?.cardNum || t?.ticketNum || idx}-${idx}`}>
                          <td className="num">{idx + 1}</td>
                          <td className="text-center">{t?.salutation || "—"}</td>
                          <td className="text-start">
                            <div className="fw-semibold">{t?.firstName} {t?.lastName}</div>
                            {t?.email ? <small className="d-block text-muted">{t.email}</small> : null}
                            {t?.phone ? <small className="d-block text-muted">{t.phone}</small> : null}
                          </td>
                          <td className="text-center">{t?.cardNum || "—"}</td>
                          <td className="text-center">{t?.passportIssue || "—"} — {t?.cardExpiredDate || "—"}</td>
                          <td className="text-center">{t?.birthday || "—"}</td>
                          <td className="text-center">{t?.pnr || "—"}</td>
                          <td className="text-center">{t?.ticketNum || "—"}</td>
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
                <p className="section-title"><span>Flights</span></p>

                {journeys.map((flight, fi) => (
                  <div key={`j-${fi}`} className="mb-3">
                    {flight?.segments?.map((segment, si) => (
                      <div key={`j-${fi}-s-${si}`} className="mb-3">
                        <div className="soft-row">
                          <div className="row g-2 p-2 align-items-center">
                            <div className="col-3 col-md-1 d-flex align-items-center">
                              <PlaceholderImg
                                style={{ width: 50 }}
                                src={getAirlineLogo(segment?.airline)}
                                className="px-2"
                                alt={getAirlineName(segment?.airline)}
                              />
                            </div>
                            <div className="col-9 col-md-7">
                              <div className="p-2 lh-sm mt-1 d-flex align-items-center flex-wrap gap-2">
                                <small className="mb-0">{getAirlineName(segment?.airline)}</small>
                                <small className="mb-0">
                                  <strong className="soft-pill mx-1">
                                    {segment?.type} {segment?.flightNum}
                                  </strong>
                                </small>
                              </div>
                            </div>
                            <div className="col-md-4 col-12">
                              <div className="p-2 lh-sm">
                                <small className="d-block mb-1"><strong>Cabin baggage:</strong> {segment?.cabinBaggage || "—"}</small>
                                <small className="d-block"><strong>Checked baggage:</strong> {segment?.checkedBaggage || "—"}</small>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="p-3 border-start border-end border-bottom rounded-bottom">
                          <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-md-between position-relative">
                            {/* Departure */}
                            <div className="text-center text-md-start p-2">
                              <div className="fw-bold">{formatDate(segment?.departureDate)}</div>
                              <div className="fw-semibold">{segment?.departureTime}</div>
                              <small className="text-muted">
                                Depart • <span className="fw-semibold">{getAirportName(segment?.departure)}</span>
                              </small>
                            </div>

                            {/* Line + duration (desktop) */}
                            <div className="d-none d-md-flex flex-column align-items-center justify-content-center position-relative flex-fill">
                              <div className="position-absolute top-50 start-0 end-0" style={{ height: 2, background: "#e5e7eb" }} />
                              <div className="position-relative bg-white rounded-circle p-1 border" aria-hidden="true">
                                ✈️
                              </div>
                              {segment?.duration ? (
                                <small className="position-absolute top-50 translate-middle-y mt-4 text-muted">
                                  {segment.duration}
                                </small>
                              ) : null}
                            </div>

                            {/* Arrival */}
                            <div className="text-center text-md-end p-2">
                              <div className="fw-bold">{formatDate(segment?.arrivalDate)}</div>
                              <div className="fw-semibold">{segment?.arrivalTime}</div>
                              <small className="text-muted">
                                Arrive • <span className="fw-semibold">{getAirportName(segment?.arrival)}</span>
                              </small>
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
                <p className="fw-semibold mb-2">Fare Details</p>
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
            <div className="row g-2 mb-2">
              <div className="col-12 col-md-4">
                <button
                  className="btn btn-plain w-100 d-flex align-items-center justify-content-center py-2"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2" aria-hidden="true"></i> Download PDF
                    </>
                  )}
                </button>
              </div>

              <div className="col-12 col-md-4">
                <a
                  className="btn btn-plain w-100 d-flex align-items-center justify-content-center py-2"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Your booking confirmation: ${typeof window !== "undefined" ? window.location.href : ""}`
                  )}`}
                >
                  <i className="bi bi-whatsapp me-2" aria-hidden="true"></i>
                  Share via WhatsApp
                </a>
              </div>

              <div className="col-12 col-md-4">
                <button
                  type="button"
                  className="btn btn-plain w-100 d-flex align-items-center justify-content-center py-2"
                  onClick={() => alert("Please contact support to request cancellation.")}
                >
                  <i className="bi bi-x-lg me-2" aria-hidden="true"></i>
                  Request Cancellation
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Payment Modal */}
          {showPayModal && requiresPayment && (
            <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
              <div
                className="position-absolute top-0 start-0 end-0 bottom-0"
                style={{ background: "rgba(0,0,0,0.4)" }}
                onClick={() => !paying && setShowPayModal(false)}
                aria-hidden="true"
              />
              <div className="position-relative bg-white rounded-3 border p-0" style={{ width: "min(96vw, 480px)" }}>
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 fw-semibold">Confirm Wallet Payment</h5>
                  <button className="btn btn-sm btn-light" onClick={() => setShowPayModal(false)} disabled={paying} aria-label="Close">✕</button>
                </div>

                <div className="p-3">
                  {payError && <div className="border rounded-3 p-2 mb-3 bg-danger-subtle text-danger">{payError}</div>}

                  <div className="rounded-3 border p-3 mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Wallet balance</span>
                      <strong>{wallet.loading ? "Loading…" : money(wallet.balance, wallet.currency || currency)}</strong>
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
                    <div className="border rounded-3 p-2 bg-warning-subtle text-warning">
                      Payment window expired. Please search again.
                    </div>
                  )}
                  {!wallet.loading && wallet.balance < amountDue && (
                    <div className="border rounded-3 p-2 bg-warning-subtle text-warning">
                      Insufficient funds. Please top up first.
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
                      className="btn btn-primary"
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
          )}

          {/* Payment Success Overlay */}
          {showPaySuccess && (
            <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
              <div
                className="position-absolute top-0 start-0 end-0 bottom-0"
                style={{ background: "rgba(0,0,0,.5)" }}
                onClick={() => setShowPaySuccess(false)}
                aria-hidden="true"
              />
              <div className="position-relative bg-white rounded-3 p-4 border" style={{ width: "min(520px, 92vw)" }}>
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center border border-success-subtle"
                    style={{ width: 80, height: 80, background: "#ecfdf5" }}
                  >
                    <span aria-hidden style={{ fontSize: 32 }}>✅</span>
                  </div>
                  <h5 className="fw-bold mb-1">Payment Successful</h5>
                  <p className="text-muted mb-3">
                    We’ve received your payment {justPaidAmount ? <strong>({justPaidAmount})</strong> : null}.
                  </p>
                  <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                    <button className="btn btn-primary" onClick={() => { try { handleDownloadPdf(); } catch (_) {} }}>
                      <i className="bi bi-download me-2" aria-hidden="true"></i> Download Receipt
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
      </div>
    </>
  );
};

export default BookingConfirmation;
