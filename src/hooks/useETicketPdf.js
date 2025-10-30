import { useState } from "react";
import jsPDF from "jspdf";
import { formatDate, formatTime } from "../utils/dateFormatter";

/* ---------------- utils ---------------- */
const hexToRGB = (hex) => {
  const h = String(hex || "").replace("#", "");
  const s = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  if (s.length !== 6) return [15, 23, 42];
  return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
};

const money = (n, c = "USD") =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });

/** Renders an image onto a white canvas to strip alpha (prevents black boxes in PDFs). */
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

/** Circular crop + white background for airline logos (oversampled for sharpness). */
const toCirclePNG = (url, diameter = 12, oversample = 3) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      try {
        const d = diameter * oversample;
        const c = document.createElement("canvas");
        c.width = d; c.height = d;
        const ctx = c.getContext("2d");
        // white base
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, d, d);
        // circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(d/2, d/2, d/2, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();
        // cover-fit
        const rW = this.naturalWidth || this.width;
        const rH = this.naturalHeight || this.height;
        const scale = Math.max(d / rW, d / rH);
        const w = rW * scale;
        const h = rH * scale;
        ctx.drawImage(this, (d - w)/2, (d - h)/2, w, h);
        ctx.restore();
        resolve(c.toDataURL("image/png"));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

/* -------------- hook -------------- */
export default function useETicketPdf({ brandColor = "#0ea5e9" } = {}) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const downloadETicket = async ({
    bookingData, qrCodeUrl, user,
    getAirlineLogo, getAirlineName, getAirportName
  }) => {
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
      const paid = (bookingData?.payStatus || "").toLowerCase() === "paid" ;

      // assets
      const logo = await toScaledPNG("/assets/img/logo/flygasal.png", 320, 120);
      const qrPng = await toScaledPNG(qrCodeUrl, 220, 220);

      /* ---------- Header ---------- */
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

      /* ---------- Passenger(s) + Amount (non-flex; safer height) ---------- */
      {
        const leftW = W * 0.6 - 3;
        const rightW = W * 0.4 - 3;

        const paxNamesArr = passengers.length
          ? passengers.map(p => [p?.firstName, p?.lastName].filter(Boolean).join(" ")).filter(Boolean)
          : ["—"];
        const paxText = paxNamesArr.join(" • ");
        const paxWrapped = doc.splitTextToSize(paxText, leftW - 8);
        // slightly larger line height + padding to prevent overflow at pax > 2
        const lh = 4.8;
        const leftRectH = Math.max(20, 12 + paxWrapped.length * lh);

        ensure(leftRectH + 6);

        // Left box
        doc.setFillColor(...rgb.wash);
        doc.setDrawColor(...rgb.line);
        doc.roundedRect(M, y, leftW, leftRectH, 3, 3, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
        doc.text("Passenger(s)", M + 4, y + 6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...rgb.text);
        doc.text(paxWrapped, M + 4, y + 12.3);

        // Right box
        // doc.setDrawColor(...rgb.line);
        // doc.setFillColor(...rgb.wash2);
        // doc.roundedRect(M + leftW + 6, y, rightW, leftRectH, 3, 3, "FD");
        // doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(71,85,105);
        // doc.text((paid ? "Total Paid" : "Amount Due").toUpperCase(), M + leftW + 10, y + 6);
        // doc.setFontSize(13); doc.setTextColor(...rgb.text);
        // doc.text(money(amountDue, currency), M + W - 7, y + 12.6, { align: "right" });

        y += leftRectH + 8;
      }

      /* ---------- Contact Info ---------- */
      {
        const need = 26;
        ensure(need);
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
      }

      /* ---------- Measure helper (y-sensitive) ---------- */
      const measureSegmentAt = (seg, yStart) => {
        const stubW = 34;
        const bodyX = M + 10;
        const bodyW = W - stubW - 20;
        const topY  = yStart + 16;

        const depDate = formatDate(seg?.departureDate);
        const depTime = seg?.departureTime || "—";
        const depCode = seg?.departure || "—";
        const depAirport = getAirportName?.(depCode) || depCode;
        const depLine = `${depDate} • ${depAirport}`;
        const depWrap = doc.splitTextToSize(depLine, bodyW * 0.6);

        const arrDate = formatDate(seg?.arrivalDate);
        const arrTime = seg?.arrivalTime || "—";
        const arrCode = seg?.arrival || "—";
        const arrAirport = getAirportName?.(arrCode) || arrCode;
        const arrLine = `${arrDate} • ${arrAirport}`;
        const arrWrap = doc.splitTextToSize(arrLine, bodyW * 0.6);

        const extras = [
          seg?.cabinBaggage ? `Cabin: ${seg.cabinBaggage}` : null,
          seg?.checkedBaggage ? `Baggage: ${seg.checkedBaggage}` : null,
        ].filter(Boolean).join("   •   ");
        const extrasWrap = extras ? doc.splitTextToSize(extras, bodyW) : [];

        const depBlockBottom = topY + 11 + depWrap.length * 4.6;
        const arrY           = topY + 14.5;
        const arrBlockBottom = arrY + 11 + arrWrap.length * 4.6;
        const mainBottom     = Math.max(depBlockBottom, arrBlockBottom);

        const extrasY = mainBottom + (extrasWrap.length ? 3.5 : 0);
        const afterExtras = extrasY + (extrasWrap.length ? extrasWrap.length * 4.6 + 2 : 0);

        const labelsY = afterExtras + 6.5;
        const valuesY = labelsY + 5.1 + 6.5;

        const contentBottom = Math.max(valuesY, afterExtras);
        const tH = Math.max(54, (contentBottom - yStart) + 10);

        return { tH, dims: { bodyX, bodyW, topY, arrY, extrasY, labelsY, valuesY, stubW } };
      };

      // Section title helper
      const sectionHeader = (title) => {
        const h = 10;
        const pad = 3;
        ensure(h + 6);
        doc.setFillColor(...rgb.wash);
        doc.setDrawColor(...rgb.line);
        doc.roundedRect(M, y, W, h, 3, 3, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
        doc.text(title, M + pad, y + h - 3.2);
        y += h + 4;
      };

      /* ---------- Per-Passenger Flight Sections (two-pass safe draw) ---------- */
      for (let pIndex = 0; pIndex < passengers.length; pIndex++) {
        const pax = passengers[pIndex];
        const paxName = [pax?.firstName, pax?.lastName].filter(Boolean).join(" ") || `Passenger ${pIndex + 1}`;
        const ticketNum = pax?.ticketNum || "—";

        sectionHeader(`${paxName} — Ticket: ${ticketNum}`);

        for (const j of (journeys || [])) {
          for (const seg of (j?.segments || [])) {
            // PASS 1: measure at current y
            const { tH } = measureSegmentAt(seg, y);
            ensure(tH + 6);
            // PASS 2: re-measure at (possibly new) y
            const { tH: finalTH, dims } = measureSegmentAt(seg, y);

            const { bodyX, bodyW, topY, arrY, extrasY, labelsY, valuesY, stubW } = dims;

            // card container
            doc.setDrawColor(...rgb.line);
            doc.setFillColor(255,255,255);
            doc.roundedRect(M, y, W, finalTH, 4, 4, "S");

            // header strip
            doc.setFillColor(...rgb.wash);
            doc.rect(M, y, W - stubW, 12, "F");

            // circular airline logo
            const circleLogo = await toCirclePNG(
              `/assets/img/airlines/${getAirlineLogo?.(seg?.airline)}.png`,
              12,
              3
            );
            doc.setDrawColor(...rgb.line);
            doc.setFillColor(255,255,255);
            doc.circle(M + 9, y + 6, 5.8, "FD");
            if (circleLogo) {
              doc.addImage(circleLogo, "PNG", M + 4.5, y + 1.1, 9, 9);
            }

            // airline + flight code
            const alName = (getAirlineName?.(seg?.airline) || seg?.airline || "—").trim();
            const flightCode = `${seg?.type || ""} ${seg?.flightNum || ""}`.trim();
            doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
            doc.setFontSize(10.2);
            doc.text(alName, M + 18, y + 7.4);
            doc.setTextColor(...rgb.brand); doc.setFontSize(9.2);
            const nameW = doc.getTextWidth(alName);
            doc.text(flightCode || "—", M + 18 + nameW + 4, y + 7.4);

            // perforation
            const perfX = M + W - stubW;
            doc.setDrawColor(203,213,225);
            const dash = (x1, y1, x2, y2, d = 1.6, g = 1.6) => {
              const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
              if (len <= 0) return;
              const ux = dx / len, uy = dy / len;
              let t = 0;
              while (t + d <= len) {
                const sx = x1 + t * ux, sy = y1 + t * uy;
                const ex = sx + d * ux, ey = sy + d * uy;
                doc.line(sx, sy, ex, ey);
                t += d + g;
              }
            };
            dash(perfX, y + 4, perfX, y + finalTH - 4);

            // departure block
            const depDate = formatDate(seg?.departureDate);
            const depTime = seg?.departureTime || "—";
            const depCode = seg?.departure || "—";
            const depAirport = getAirportName?.(depCode) || depCode;
            const depLine = `${depDate} • ${depAirport}`;
            const depWrap = doc.splitTextToSize(depLine, bodyW * 0.6);

            doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
            doc.setFontSize(13);
            doc.text(depTime, bodyX, topY + 6);
            doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
            doc.text(depWrap, bodyX, topY + 11);

            // arrival block (right)
            const arrDate = formatDate(seg?.arrivalDate);
            const arrTime = seg?.arrivalTime || "—";
            const arrCode = seg?.arrival || "—";
            const arrAirport = getAirportName?.(arrCode) || arrCode;
            const arrLine = `${arrDate} • ${arrAirport}`;
            const arrWrap = doc.splitTextToSize(arrLine, bodyW * 0.6);

            doc.setFont("helvetica", "bold"); doc.setTextColor(...rgb.text);
            doc.setFontSize(13);
            doc.text(arrTime, bodyX + bodyW, arrY + 6, { align: "right" });
            doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
            let yy = arrY + 11;
            arrWrap.forEach((line) => {
              doc.text(line, bodyX + bodyW, yy, { align: "right" });
              yy += 4.6;
            });

            // extras
            const extras = [
              seg?.cabinBaggage ? `Cabin: ${seg.cabinBaggage}` : null,
              seg?.checkedBaggage ? `Baggage: ${seg.checkedBaggage}` : null,
            ].filter(Boolean).join("   •   ");
            const extrasWrap = extras ? doc.splitTextToSize(extras, bodyW) : [];
            if (extrasWrap.length) {
              doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); doc.setTextColor(...rgb.sub);
              yy = extrasY;
              extrasWrap.forEach((line) => {
                doc.text(line, bodyX, yy);
                yy += 4.6;
              });
            }

            // passenger / ticket lines (THIS PASSENGER)
            doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(71,85,105);
            doc.text("Passenger", bodyX, labelsY);
            doc.text("Ticket", bodyX + bodyW, labelsY, { align: "right" });

            doc.setFont("helvetica", "normal"); doc.setFontSize(10.2); doc.setTextColor(...rgb.text);
            doc.text(paxName, bodyX, valuesY);
            doc.text(ticketNum, bodyX + bodyW, valuesY, { align: "right" });

            // stub
            const stubX = perfX, stubY = y, stubH = finalTH;
            doc.setFillColor(...rgb.wash2);
            doc.rect(stubX, stubY, stubW, stubH, "F");

            doc.setFont("helvetica", "bold"); doc.setFontSize(9.6); doc.setTextColor(...rgb.text);
            doc.text(depCode, stubX + stubW / 2, stubY + 9, { align: "center" });
            doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); doc.setTextColor(71,85,105);
            doc.text("to",   stubX + stubW / 2, stubY + 13, { align: "center" });
            doc.setFont("helvetica", "bold"); doc.setFontSize(9.6); doc.setTextColor(...rgb.text);
            doc.text(arrCode, stubX + stubW / 2, stubY + 17, { align: "center" });

            doc.setDrawColor(226, 232, 240);
            dash(stubX + 3, stubY + stubH - 6, stubX + stubW - 3, stubY + stubH - 6, 1.2, 1.4);

            // advance cursor
            y += finalTH + 10;
          }
        }
      }

      /* ---------- Fare ---------- */
      // if (solutions0) {
      //   const need = 20;
      //   ensure(need);
      //   doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...rgb.text);
      //   doc.text("Fare Details", M, y);
      //   doc.setFont("helvetica", "normal"); doc.setFontSize(9.6);
      //   doc.text(`Total: ${money(solutions0?.buyerAmount, solutions0?.currency)}`, M, y + 6.8);
      //   y += 16;
      // }

      /* ---------- Terms + footer ---------- */
      const terms =
        "This e-ticket must be presented with a valid ID at check-in. Baggage allowances and fare rules vary by airline and fare class. For changes or refunds, contact support with your Order Reference and PNR.";
      const wrap = (t, w) => doc.splitTextToSize(t, w);
      const need = wrap(terms, W).length * 4.2 + 8;
      ensure(need);
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
