/// <reference types="vite/client" />
import { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Ticket, X, Printer, Download, MapPin, Clock } from "lucide-react";
import jsPDF from "jspdf";
import Spinner from "../../components/common/Spinner";
import { QRCodeSVG } from "qrcode.react";

// ─── Generate professional ticket HTML ───────────────────────────────────────
const generateTicketHTML = ({ booking, show, qrSvgString, forPDF = false }) => {
  const seats = booking.seats || [];
  const regularSeats = seats.filter(s => s.type !== "GOLDEN");
  const goldenSeats = seats.filter(s => s.type === "GOLDEN");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>CineBook Ticket — #${booking.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', Arial, sans-serif;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .tw { width: 420px; }

    /* Header */
    .th {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border-radius: 20px 20px 0 0;
      padding: 28px 32px 24px;
      position: relative;
      overflow: hidden;
    }
    .th::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 160px;
      border-radius: 50%;
      background: rgba(124, 58, 237, 0.15);
    }
    .th::after {
      content: '';
      position: absolute;
      bottom: -20px; left: 20px;
      width: 100px; height: 100px;
      border-radius: 50%;
      background: rgba(124, 58, 237, 0.08);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .brand-icon {
      width: 32px; height: 32px;
      background: #7c3aed;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .brand-name { font-size: 18px; font-weight: 700; color: #fff; }
    .brand-name span { color: #a78bfa; }
    .movie-title {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
    }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; position: relative; z-index: 1; }
    .badge { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
    .bp { background: rgba(124,58,237,0.3); border: 1px solid rgba(124,58,237,0.5); color: #c4b5fd; }
    .bo { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
    .bU  { background: rgba(34,197,94,0.2);  border: 1px solid rgba(34,197,94,0.4);  color: #86efac; }
    .bUA { background: rgba(234,179,8,0.2);  border: 1px solid rgba(234,179,8,0.4);  color: #fde047; }
    .bA  { background: rgba(239,68,68,0.2);  border: 1px solid rgba(239,68,68,0.4);  color: #fca5a5; }

    /* Tear line */
    .tear { background: #f0f0f0; height: 28px; position: relative; display: flex; align-items: center; }
    .tc { width: 28px; height: 28px; background: #f0f0f0; border-radius: 50%; position: absolute; z-index: 2; }
    .tcl { left: -14px; }
    .tcr { right: -14px; }
    .td { flex: 1; border-top: 2px dashed #d1d5db; margin: 0 20px; }

    /* Body */
    .tb { background: #ffffff; padding: 24px 32px; }
    .ig { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .ii { display: flex; flex-direction: column; gap: 3px; }
    .il { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; color: #9ca3af; text-transform: uppercase; }
    .iv { font-size: 13px; font-weight: 600; color: #111827; }
    .divider { border: none; border-top: 1px dashed #e5e7eb; margin: 16px 0; }
    .sl { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; color: #9ca3af; text-transform: uppercase; margin-bottom: 10px; }
    .sg { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .sc { padding: 5px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1.5px solid #d1d5db; color: #374151; background: #f9fafb; }
    .scg { background: #fffbeb; border-color: #d97706; color: #92400e; }
    .tr-row { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; }
    .tl { font-size: 13px; color: #6b7280; font-weight: 500; }
    .ta { font-size: 22px; font-weight: 700; color: #111827; }
    .pt { font-size: 11px; color: #9ca3af; font-weight: 500; }

    /* QR section */
    .qs { background: #ffffff; border-radius: 0 0 20px 20px; padding: 24px 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .qb { padding: 14px; background: white; border: 2px solid #e5e7eb; border-radius: 16px; display: inline-block; }
    .qt { font-family: 'Courier New', monospace; font-size: 10px; color: #9ca3af; letter-spacing: 0.5px; text-align: center; }
    .br { font-size: 12px; color: #6b7280; text-align: center; }
    .fn { font-size: 11px; color: #9ca3af; text-align: center; margin-top: 4px; }

    @media print {
      body { background: white; padding: 0; }
      .tw { width: 100%; max-width: 420px; margin: 0 auto; }
    }
    ${forPDF ? "@page { size: A5 portrait; margin: 10mm; }" : ""}
  </style>
</head>
<body>
<div class="tw">

  <!-- Header -->
  <div class="th">
    <div class="brand">
      <div class="brand-icon">🎬</div>
      <div class="brand-name">Cine<span>Book</span></div>
    </div>
    <div class="movie-title">${show?.movie?.title || "Movie"}</div>
    <div class="badges">
      <span class="badge bp">${show?.showType || "2D"}</span>
      ${show?.movie?.language ? `<span class="badge bo">${show.movie.language}</span>` : ""}
      ${show?.movie?.rating ? `<span class="badge b${show.movie.rating}">${show.movie.rating}</span>` : ""}
    </div>
  </div>

  <!-- Tear line 1 -->
  <div class="tear">
    <div class="tc tcl"></div>
    <div class="td"></div>
    <div class="tc tcr"></div>
  </div>

  <!-- Body -->
  <div class="tb">
    <div class="ig">
      <div class="ii" style="grid-column: 1 / -1;">
        <div class="il">Theatre</div>
        <div class="iv">${show?.theatre?.name || "—"}</div>
      </div>
      <div class="ii" style="grid-column: 1 / -1;">
        <div class="il">Location</div>
        <div class="iv">${show?.theatre?.location || "—"}</div>
      </div>
      <div class="ii">
        <div class="il">Show Time</div>
        <div class="iv">${show?.startTime || "—"}</div>
      </div>
      <div class="ii">
        <div class="il">Booking ID</div>
        <div class="iv">#${booking.id}</div>
      </div>
      <div class="ii">
        <div class="il">Payment</div>
        <div class="iv">${booking.paymentType}</div>
      </div>
      <div class="ii">
        <div class="il">Total Seats</div>
        <div class="iv">${seats.length} seat${seats.length !== 1 ? "s" : ""}</div>
      </div>
    </div>

    <hr class="divider" />

    <div class="sl">Your Seats</div>
    <div class="sg">
      ${regularSeats.map(s => `<div class="sc">${s.row}${s.number}</div>`).join("")}
      ${goldenSeats.map(s => `<div class="sc scg">${s.row}${s.number} ✦</div>`).join("")}
    </div>

    <hr class="divider" />

    <div class="tr-row">
      <div>
        <div class="tl">Total Paid</div>
        <div class="pt">${booking.paymentType} Payment</div>
      </div>
      <div class="ta">₹${booking.totalAmount}</div>
    </div>
  </div>

  <!-- Tear line 2 -->
  <div class="tear">
    <div class="tc tcl"></div>
    <div class="td"></div>
    <div class="tc tcr"></div>
  </div>

  <!-- QR section -->
  <div class="qs">
    <div class="br">Show this QR at the entrance</div>
    <div class="qb">${qrSvgString}</div>
    <div class="qt">CINEBOOK-${booking.id}-${booking.showId}</div>
    <div class="fn">Booking #${booking.id} · Valid for one entry only · CineBook</div>
  </div>

</div>
</body>
</html>`;
};

// ─── QR Modal ─────────────────────────────────────────────────────────────────
const QRModal = ({ booking, show, onClose }) => {
  const qrRef = useRef(null);
  const qrValue = `CINEBOOK-${booking.id}-${booking.showId}`;

// ✅ Convert QR SVG → PNG dataURL via canvas
const getQRPngDataUrl = () => {
  return new Promise((resolve, reject) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return reject("No SVG found");

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 200, 200);
      ctx.drawImage(img, 0, 0, 200, 200);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(svgUrl); reject("Image load failed"); };
    img.src = svgUrl;
  });
};

// ✅ Direct PDF download using jsPDF text API + QR as PNG
const handleDownloadPDF = async () => {
  toast.loading("Generating PDF...", { id: "pdf" });
  try {
    const qrPng = await getQRPngDataUrl();
    const seats = booking.seats || [];
    const regularSeats = seats.filter(s => s.type !== "GOLDEN");
    const goldenSeats = seats.filter(s => s.type === "GOLDEN");
    const allSeatLabels = [
      ...regularSeats.map(s => `${s.row}${s.number}`),
      ...goldenSeats.map(s => `${s.row}${s.number} ✦`),
    ].join("   ");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const W = 148; // A5 width mm

    // ── Dark header background
    pdf.setFillColor(15, 52, 96);
    pdf.rect(0, 0, W, 52, "F");

    // ── CineBook brand
    pdf.setFontSize(9);
    pdf.setTextColor(167, 139, 250);
    pdf.setFont("helvetica", "bold");
    pdf.text("CineBook", 12, 12);

    // ── Movie title
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    const titleLines = pdf.splitTextToSize(show?.movie?.title || "Movie", W - 24);
    pdf.text(titleLines, 12, 24);

    // ── Badges row
    let bx = 12;
    const by = 43;
    const badgeData = [
      { text: show?.showType || "2D", bg: [124, 58, 237] },
      ...(show?.movie?.language ? [{ text: show.movie.language, bg: [80, 80, 100] }] : []),
      ...(show?.movie?.rating ? [{ text: show.movie.rating, bg: [80, 80, 100] }] : []),
    ];
    pdf.setFontSize(7);
    badgeData.forEach(({ text, bg }) => {
      const tw = pdf.getTextWidth(text) + 6;
      pdf.setFillColor(...bg);
      pdf.roundedRect(bx, by - 4, tw, 6, 1.5, 1.5, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.text(text, bx + 3, by);
      bx += tw + 4;
    });

    // ── Dashed separator
    let y = 58;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(12, y, W - 12, y);
    pdf.setLineDashPattern([], 0);
    y += 8;

    // ── Info rows helper
    const infoRow = (label, value, yPos) => {
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "bold");
      pdf.text(label.toUpperCase(), 12, yPos);
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(value), 12, yPos + 5);
    };

    infoRow("Theatre", show?.theatre?.name || "—", y);
    y += 12;
    infoRow("Location", show?.theatre?.location || "—", y);
    y += 12;

    // Two column row
    infoRow("Show Time", show?.startTime || "—", y);
    infoRow("Booking ID", `#${booking.id}`, y);
    // shift second col
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont("helvetica", "bold");
    pdf.text("BOOKING ID", W / 2, y);
    pdf.setFontSize(9);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont("helvetica", "bold");
    pdf.text(`#${booking.id}`, W / 2, y + 5);
    y += 12;

    infoRow("Payment", booking.paymentType, y);
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont("helvetica", "bold");
    pdf.text("TOTAL SEATS", W / 2, y);
    pdf.setFontSize(9);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${seats.length} seat${seats.length !== 1 ? "s" : ""}`, W / 2, y + 5);
    y += 14;

    // ── Dashed separator
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(12, y, W - 12, y);
    pdf.setLineDashPattern([], 0);
    y += 7;

    // ── Seats label
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont("helvetica", "bold");
    pdf.text("YOUR SEATS", 12, y);
    y += 5;

    // ── Seat chips
    let sx = 12;
    [...regularSeats, ...goldenSeats].forEach((s, i) => {
      const isGolden = s.type === "GOLDEN";
      const label = `${s.row}${s.number}${isGolden ? " ✦" : ""}`;
      pdf.setFontSize(8);
      const tw = pdf.getTextWidth(label) + 8;
      if (sx + tw > W - 12) { sx = 12; y += 10; }
      if (isGolden) {
        pdf.setFillColor(255, 251, 235);
        pdf.setDrawColor(217, 119, 6);
        pdf.setTextColor(146, 64, 14);
      } else {
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(209, 213, 219);
        pdf.setTextColor(55, 65, 81);
      }
      pdf.roundedRect(sx, y - 3, tw, 8, 1.5, 1.5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.text(label, sx + 4, y + 2.5);
      sx += tw + 4;
    });
    y += 14;

    // ── Dashed separator
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(12, y, W - 12, y);
    pdf.setLineDashPattern([], 0);
    y += 7;

    // ── Total amount box
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(12, y, W - 24, 14, 2, 2, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont("helvetica", "normal");
    pdf.text("Total Paid", 18, y + 6);
    pdf.setFontSize(7);
    pdf.text(`${booking.paymentType} Payment`, 18, y + 11);
    pdf.setFontSize(16);
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Rs.${booking.totalAmount}`, W - 14, y + 9.5, { align: "right" });
    y += 20;

    // ── Dashed separator
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(12, y, W - 12, y);
    pdf.setLineDashPattern([], 0);
    y += 8;

    // ── QR code centered
    const qrSize = 44;
    const qrX = (W - qrSize) / 2;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(qrX - 4, y - 2, qrSize + 8, qrSize + 8, 3, 3, "FD");
    pdf.addImage(qrPng, "PNG", qrX, y, qrSize, qrSize);
    y += qrSize + 10;

    // ── QR value
    pdf.setFontSize(6.5);
    pdf.setTextColor(156, 163, 175);
    pdf.setFont("courier", "normal");
    pdf.text(qrValue, W / 2, y, { align: "center" });
    y += 6;

    // ── Footer note
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Booking #${booking.id} · Valid for one entry only · CineBook`, W / 2, y, { align: "center" });

    // ── Save
    pdf.save(`CineBook-Ticket-${booking.id}.pdf`);
    toast.success("Ticket downloaded!", { id: "pdf" });
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate PDF", { id: "pdf" });
  }
};

// ✅ Print — still uses the HTML window approach (perfect for printing)
const openPrintWindow = () => {
  const svg = qrRef.current?.querySelector("svg");
  if (!svg) { toast.error("QR not ready. Try again."); return; }
  const clone = svg.cloneNode(true);
  clone.setAttribute("width", "180");
  clone.setAttribute("height", "180");
  const qrSvgString = clone.outerHTML;
  const html = generateTicketHTML({ booking, show, qrSvgString, forPDF: false });
  const w = window.open("", "_blank");
  if (!w) { toast.error("Popup blocked. Please allow popups."); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 800);
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm md:max-w-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" />
            <span className="font-heading font-semibold text-gray-900">Booking Confirmed!</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left — ticket details */}
            <div className="p-5 space-y-4 md:border-r md:border-gray-100">
              <div>
                <h3 className="font-heading text-lg font-bold text-gray-900">{show?.movie?.title}</h3>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {show?.showType}
                  </span>
                  {show?.movie?.language && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {show.movie.language}
                    </span>
                  )}
                  {show?.movie?.rating && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {show.movie.rating}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span>{show?.theatre?.name}, {show?.theatre?.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={13} className="text-primary shrink-0" />
                  <span>{show?.startTime}</span>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-2 font-medium">Seats</p>
                <div className="flex flex-wrap gap-1.5">
                  {(booking.seats || []).map((seat, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                        ${seat.type === "GOLDEN"
                          ? "bg-yellow-500/10 text-yellow-700 border-yellow-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                    >
                      {seat.row}{seat.number} {seat.type === "GOLDEN" ? "✦" : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-border" />

              <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-gray-500 text-sm">Total Paid</span>
                <span className="text-gray-900 font-bold text-lg">₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Payment</span>
                <span className="text-gray-700 font-medium">{booking.paymentType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Booking ID</span>
                <span className="text-gray-700 font-mono font-medium">#{booking.id}</span>
              </div>
            </div>

            {/* Right — QR */}
            <div className="p-5 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
              <div className="border-t border-dashed border-gray-200 w-full md:hidden" />
              <p className="text-gray-400 text-xs text-center">Show this QR at the entrance</p>
              <div className="bg-white p-4 rounded-2xl" ref={qrRef}>
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0D0D0D"
                  level="H"
                />
              </div>
              <p className="text-gray-400 text-xs font-mono tracking-wide text-center break-all">
                {qrValue}
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 w-full text-center">
                <p className="text-primary text-xs font-medium">Booking #{booking.id}</p>
                <p className="text-gray-400 text-xs mt-0.5">{booking.paymentType} Payment</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-5 pt-0 flex flex-col gap-2">
            <button
  onClick={handleDownloadPDF}
  className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-semibold py-3 rounded-xl transition text-sm"
>
  <Download size={16} />
  Download Ticket PDF
</button>

            <button
              onClick={onClose}
              className="w-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 py-2.5 rounded-xl text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const WindowBooking = () => {
  const [shows, setShows] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentType, setPaymentType] = useState("CASH");
  const [loadingShows, setLoadingShows] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const res = await api.get("/shows");
        setShows(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingShows(false);
      }
    };
    fetchShows().catch(console.error);
  }, []);

  // ✅ SSE — real-time seat updates with auto-retry
  useEffect(() => {
    if (!selectedShow) return;
    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) return;

    let eventSource = null;
    let retryTimeout = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      eventSource = new EventSource(
        `${apiBase}/shows/${selectedShow.id}/seat-updates`,
        { withCredentials: false }
      );
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "connected") return;
          setSeats((prev) =>
            prev.map((seat) =>
              seat.id === data.seatId ? { ...seat, status: data.status } : seat
            )
          );
          if (data.status === "LOCKED" || data.status === "BOOKED") {
            setSelectedSeats((prev) => prev.filter((id) => id !== data.seatId));
          }
        } catch { /* ignore */ }
      };
      eventSource.onerror = () => {
        eventSource.close();
        if (!destroyed) retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      destroyed = true;
      clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
    };
  }, [selectedShow]);

  const handleShowSelect = async (show) => {
    if (new Date(show.rawStartTime) <= new Date()) return;
    setSelectedShow(show);
    setSelectedSeats([]);
    setLoadingSeats(true);
    try {
      const res = await api.get(`/shows/${show.id}/seats`);
      setSeats(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingSeats(false);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelectedSeats((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id]
    );
  };

  const handleBook = async () => {
    if (!selectedShow || selectedSeats.length === 0) {
      toast.error("Select a show and at least one seat");
      return;
    }
    if (new Date(selectedShow.rawStartTime) <= new Date()) {
      toast.error("Show has already started. Booking is not allowed.");
      return;
    }

    setBooking(true);
    try {
      const res = await api.post("/admin/bookings", {
        showId: selectedShow.id,
        seatIds: selectedSeats,
        paymentType,
      });

      toast.success("Booking queued!");
      const jobId = res.data.jobId;
      let attempts = 0;
      const maxAttempts = 60;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await api.get(`/bookings/status-rest/${jobId}`);
          const { status, booking: bookingData, reason } = statusRes.data;

          if (status === "success" && bookingData) {
            clearInterval(pollInterval);
            toast.success("Booking confirmed! 🎉");

            // ✅ Fetch full booking details to get seat info for ticket
            try {
              const bookingRes = await api.get(`/admin/bookings?search=${bookingData.id}`);
              const fullBooking = bookingRes.data.bookings?.find(
                (b) => b.id === bookingData.id
              );
              setConfirmedBooking({
                id: bookingData.id,
                showId: selectedShow.id,
                totalAmount: bookingData.totalAmount,
                paymentType,
                seats: fullBooking?.seats?.map((bs) => ({
                  row: bs.showSeat?.row,
                  number: bs.showSeat?.number,
                  type: bs.seatType,
                })) || [],
              });
            } catch {
              // Fallback with basic info
              setConfirmedBooking({
                id: bookingData.id,
                showId: selectedShow.id,
                totalAmount: bookingData.totalAmount,
                paymentType,
                seats: [],
              });
            }

            setSelectedSeats([]);

            // Refresh seat map
            try {
              const seatsRes = await api.get(`/shows/${selectedShow.id}/seats`);
              setSeats(seatsRes.data);
            } catch { /* ignore */ }

            setBooking(false);
          } else if (status === "failed") {
            clearInterval(pollInterval);
            toast.error(reason || "Booking failed");
            setBooking(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            toast.error("Booking timed out. Please try again.");
            setBooking(false);
          }
        } catch (err) {
          clearInterval(pollInterval);
          toast.error(err.message);
          setBooking(false);
        }
      }, 1000);
    } catch (err) {
      toast.error(err.message);
      setBooking(false);
    }
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return sum;
    return sum + (seat.type === "GOLDEN"
      ? selectedShow?.goldenPrice || 0
      : selectedShow?.regularPrice || 0);
  }, 0);

  return (
    <AdminLayout>
      {/* ✅ QR + Professional Ticket Modal */}
      {confirmedBooking && (
        <QRModal
          booking={confirmedBooking}
          show={selectedShow}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Window Booking</h1>
        <p className="text-muted text-sm mt-1">Book tickets for walk-in customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Show Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-gray-900 font-semibold mb-3">Select Show</h2>
          {loadingShows ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {shows.map((show) => {
                const hasStarted = new Date(show.rawStartTime) <= new Date();
                return (
                  <div
                    key={show.id}
                    onClick={() => handleShowSelect(show)}
                    className={`bg-white border rounded-xl px-4 py-3 transition shadow-sm
                      ${hasStarted
                        ? "border-gray-100 opacity-40 cursor-not-allowed"
                        : selectedShow?.id === show.id
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-gray-100 hover:border-gray-300 cursor-pointer"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 text-sm font-medium">{show.movie?.title}</p>
                      {hasStarted && (
                        <span className="text-xs text-red-500 font-medium">Started</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {show.theatre?.name} • {show.showType} • {show.startTime}
                    </p>
                    <p className="text-primary text-xs mt-0.5">₹{show.regularPrice} regular</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Seat Selection */}
        <div className="lg:col-span-2">
          {!selectedShow ? (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="text-center">
                <Ticket size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">Select a show to see seats</p>
              </div>
            </div>
          ) : loadingSeats ? (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl">
              <Spinner text="Loading seats..." />
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">

              <div className="w-full bg-primary/10 border border-primary/20 rounded-lg py-2 text-center text-primary text-xs font-medium mb-6">
                🎬 SCREEN
              </div>

              <div className="space-y-2 mb-6 flex flex-col items-center">
                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-4">{row}</span>
                    <div className="flex gap-1 md:gap-1.5">
                      {rowSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          disabled={seat.status !== "AVAILABLE"}
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium transition
                            ${seat.status === "BOOKED"
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : seat.status === "LOCKED"
                              ? "bg-red-50 text-red-400 border border-red-200 cursor-not-allowed"
                              : selectedSeats.includes(seat.id)
                              ? "bg-primary text-white"
                              : seat.type === "GOLDEN"
                              ? "bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100"
                              : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-gray-50 border border-gray-200 inline-block" />Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-primary inline-block" />Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-yellow-50 border border-yellow-200 inline-block" />Golden
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-gray-200 inline-block" />Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-red-50 border border-red-200 inline-block" />Locked
                </span>
              </div>

              {selectedSeats.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-500 text-sm">{selectedSeats.length} seat(s) selected</p>
                    <p className="text-gray-900 font-bold">₹{totalAmount}</p>
                  </div>

                  <div className="flex gap-3 mb-4">
                    {["CASH", "CARD"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPaymentType(type)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition border
                          ${paymentType === type
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:text-gray-900"}`}
                      >
                        {type === "CASH" ? "💵 Cash" : "💳 Card"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                  >
                    {booking ? <Spinner text="Processing..." /> : `Confirm Booking — ₹${totalAmount}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default WindowBooking;