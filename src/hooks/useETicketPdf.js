import { useState } from "react";
import jsPDF from "jspdf";
import { formatDate, formatTime } from "../utils/dateFormatter";

const hexToRGB = (hex) => {
  const h = String(hex || "").replace("#", "");
  const s = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  if (s.length !== 6) return [15, 23, 42];
  return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
};

const money = (n, c = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });

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
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(this, 0, 0, w, h);
        resolve(c.toDataURL("image/png"));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

export default function useETicketPdf({ brandColor = "#0ea5e9" } = {}) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const downloadETicket = async ({ bookingData, qrCodeUrl, user, getAirlineLogo, getAirlineName, getAirportName }) => {
    if (!bookingData) return;
    setIsDownloadingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
      const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
      const M = 12, W = page.w - M * 2;
      let y = M;

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
      const paid = (bookingData?.payStatus || "").toLowerCase() === "paid";

      const logo = await toScaledPNG("/assets/img/logo/flygasal.png", 320, 120);
      const qrPng = await toScaledPNG(qrCodeUrl, 220, 220);

      // Header
      if (logo) {
        doc.setFillColor(...rgb.wash);
        doc.setDrawColor(...rgb.line);
        doc.roundedRect(M, y, 46, 18, 3, 3, "FD");
        doc.addImage(logo, "PNG", M + 4, y + 3.2, 38, 11.5);
      }
      const rightX = page.w - M - 100;
      doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
      doc.setFontSize(18);
      doc.text("E-TICKET", rightX, y + 7);
      const chip = (txt, x, y0) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        const padX = 3.4, r = 2.2;
        const w = doc.getTextWidth(txt) + padX * 2;
        doc.setFillColor(...rgb.wash);
        doc.setDrawColor(...rgb.line);
        doc.roundedRect(x, y0, w, 7.8, r, r, "FD");
        doc.setTextColor(...rgb.text);
        doc.text(txt, x + padX, y0 + 5.7);
        return x + w + 4;
      };
      let cx = rightX;
      cx = chip(`ORDER: ${orderRef}`, cx, y + 10.5);
      chip(`PNR: ${pnr}`, cx, y + 10.5);
      if (qrPng) doc.addImage(qrPng, "PNG", page.w - M - 22, y + 1.5, 22, 22);
      doc.setDrawColor(...rgb.brand);
      doc.setLineWidth(0.9);
      doc.line(M, y + 24.5, page.w - M, y + 24.5);
      doc.setLineWidth(0.2);
      y += 32;

      const ensure = (need) => { if (y + need > page.h - M) { doc.addPage(); y = M; } };

      // Passengers + Amount
      ensure(20);
      doc.setFillColor(...rgb.wash);
      doc.setDrawColor(...rgb.line);
      doc.roundedRect(M, y, W * 0.6 - 3, 18, 3, 3, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
      doc.text("Passenger(s)", M + 4, y + 6);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      const paxNames = passengers.length
        ? passengers.map(p => [p?.firstName, p?.lastName].filter(Boolean).join(" ")).join(" • ")
        : "—";
      doc.text(paxNames, M + 4, y + 12.3);

      doc.setDrawColor(...rgb.line);
      doc.setFillColor(...rgb.wash2);
      doc.roundedRect(M + W * 0.6 + 3, y, W * 0.4 - 3, 18, 3, 3, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(71,85,105);
      doc.text((paid ? "Total Paid" : "Amount Due").toUpperCase(), M + W * 0.6 + 7, y + 6);
      doc.setFontSize(13); doc.setTextColor(...rgb.text);
      doc.text(money(amountDue, currency), M + W - 7, y + 12.6, { align: "right" });
      y += 24;

      // Contact Info
      ensure(26);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
      doc.text("Contact Info", M, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71,85,105);
      const c1 = [`Name: ${user?.name || "—"}`, `Email: ${user?.email || "—"}`, `Phone: ${user?.phone_number || "—"}`];
      const c2 = [`Issued: ${createdStr}`, `Support: support@flygasal.com`, `Ref: ${orderRef} / ${pnr}`];
      const colW = W / 2 - 6;
      const c1Wrapped = doc.splitTextToSize(c1.join("\n"), colW);
      const c2Wrapped = doc.splitTextToSize(c2.join("\n"), colW);
      doc.text(c1Wrapped, M, y + 5);
      doc.text(c2Wrapped, M + colW + 12, y + 5);
      y += Math.max(c1Wrapped.length, c2Wrapped.length) * 4.6 + 10;

      // Segments (minimal)
      const drawBarcode = (x, y, w = 30, h = 9, seed = 11) => {
        doc.setDrawColor(15, 23, 42);
        doc.setFillColor(15, 23, 42);
        const bars = 38, step = w / bars;
        for (let i = 0; i < bars; i++) {
          const thick = ((i * seed) % 9) > 4 ? 1.05 : 0.55;
          const bx = x + i * step + (step - thick) / 2;
          doc.rect(bx, y, thick, h, "F");
        }
      };

      for (const j of (journeys || [])) {
        for (const seg of (j?.segments || [])) {
          const tH = 54, stubW = 34;
          ensure(tH + 6);
          doc.setDrawColor(...rgb.line);
          doc.setFillColor(255,255,255);
          doc.roundedRect(M, y, W, tH, 4, 4, "S");

          // airline strip
          doc.setFillColor(...rgb.wash);
          doc.rect(M, y, W - stubW, 12, "F");
          const alName = getAirlineName(seg?.airline) || seg?.airline || "—";
          const flightCode = `${seg?.type || ""} ${seg?.flightNum || ""}`.trim();
          doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
          doc.setFontSize(10.2);
          doc.text(alName, M + 18, y + 7.5);
          doc.setTextColor(...rgb.brand); doc.setFontSize(9.6);
          doc.text(flightCode || "—", M + 18 + doc.getTextWidth(alName) + 5, y + 7.5);

          // perforation
          doc.setDrawColor(203,213,225);
          const perfX = M + W - stubW;
          const dash = (x1, y1, x2, y2, d = 1.6, g = 1.6) => {
            const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
            const n = Math.floor(len / (d + g));
            const ux = dx / len, uy = dy / len;
            for (let i = 0; i < n; i++) {
              const sx = x1 + (d + g) * i * ux;
              const sy = y1 + (d + g) * i * uy;
              doc.line(sx, sy, sx + d * ux, sy + d * uy);
            }
          };
          dash(perfX, y + 4, perfX, y + tH - 4);

          // staggered info
          const bodyX = M + 10, bodyW = W - stubW - 20, topY = y + 16;
          const depDate = formatDate(seg?.departureDate);
          const depTime = seg?.departureTime || "—";
          const depCode = seg?.departure || "—";
          const depAirport = getAirportName(depCode) || depCode;

          doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
          doc.setFontSize(13); doc.text(depTime, bodyX, topY + 6);
          doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
          doc.text(`${depDate} • ${depAirport}`, bodyX, topY + 11);

          const arrDate = formatDate(seg?.arrivalDate);
          const arrTime = seg?.arrivalTime || "—";
          const arrCode = seg?.arrival || "—";
          const arrAirport = getAirportName(arrCode) || arrCode;
          const arrY = topY + 14.5;

          doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
          doc.setFontSize(13); doc.text(arrTime, bodyX + bodyW, arrY + 6, { align: "right" });
          doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
          doc.text(`${arrDate} • ${arrAirport}`, bodyX + bodyW, arrY + 11, { align: "right" });

          // extras
          const extrasY = topY + 28;
          const extras = [
            seg?.cabinBaggage ? `Cabin: ${seg.cabinBaggage}` : null,
            seg?.checkedBaggage ? `Baggage: ${seg.checkedBaggage}` : null,
          ].filter(Boolean).join("   •   ");
          if (extras) {
            doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
            doc.text(extras, bodyX, extrasY);
          }

          const pax = passengers[0];
          const paxName = pax ? [pax.firstName, pax.lastName].filter(Boolean).join(" ") : "—";
          const ticketNum = pax?.ticketNum || "—";
          doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(71,85,105);
          doc.text("Passenger", bodyX, extrasY + 6.5);
          doc.text("Ticket", bodyX + bodyW, extrasY + 6.5, { align: "right" });
          doc.setFont("helvetica", "normal"); doc.setFontSize(10.2); doc.setTextColor(...rgb.text);
          doc.text(paxName, bodyX, extrasY + 11.6);
          doc.text(ticketNum, bodyX + bodyW, extrasY + 11.6, { align: "right" });

          // stub with barcode
          const stubX = perfX, stubY = y, stubH = tH;
          doc.setFillColor(...rgb.wash2); doc.rect(stubX, stubY, stubW, stubH, "F");
          doc.setFont("helvetica", "bold"); doc.setFontSize(9.6); doc.setTextColor(...rgb.text);
          doc.text(depCode, stubX + stubW / 2, stubY + 9, { align: "center" });
          doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); doc.setTextColor(71,85,105);
          doc.text("to", stubX + stubW / 2, stubY + 13, { align: "center" });
          doc.setFont("helvetica", "bold"); doc.setFontSize(9.6); doc.setTextColor(...rgb.text);
          doc.text(arrCode, stubX + stubW / 2, stubY + 17, { align: "center" });
          drawBarcode(stubX + 3.5, stubY + stubH - 13, stubW - 7, 9, 13);

          y += tH + 10;
        }
      }

      // Fare (simple)
      if (solutions0) {
        ensure(20);
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
        doc.text("Fare Details", M, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.6);
        doc.text(`Total: ${money(solutions0?.buyerAmount, solutions0?.currency)}`, M, y + 6.8);
        y += 16;
      }

      // Terms + footer
      const terms =
        "This e-ticket must be presented with a valid ID at check-in. Baggage allowances and fare rules vary by airline and fare class. For changes or refunds, contact support with your Order Reference and PNR.";
      const wrap = (t, w) => doc.splitTextToSize(t, w);
      const blockH = wrap(terms, W).length * 4.2 + 8;
      ensure(blockH);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(100,116,139);
      doc.text(wrap(terms, W), M, y + 4);

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
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return { downloadETicket, isDownloadingPdf };
}
