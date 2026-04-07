import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  BookOpen, ChevronLeft, ChevronRight, Search, X,
  CheckCircle2, Clock, Ticket, MapPin, Calendar,
  QrCode, Printer, Download,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const statusColors = {
  PAID:      "bg-green-100 text-green-700 border border-green-200",
  PENDING:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
  CANCELLED: "bg-red-100 text-red-700 border border-red-200",
  FAILED:    "bg-gray-100 text-gray-600 border border-gray-200",
};

const paymentColors = {
  CARD: "bg-primary/10 text-primary border border-primary/20",
  CASH: "bg-yellow-100 text-yellow-700 border border-yellow-200",
};

const formatIST = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatISTShort = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ─── Ticket Modal ─────────────────────────────────────────────────────────────
const TicketModal = ({ booking, onClose }) => {
  const ticketRef = useRef();
  const qrRef = useRef();
  const qrValue = `CINEBOOK-${booking.id}-${booking.show?.id ?? ""}`;

  const handlePrint = () => {
    const qrSvg = qrRef.current?.querySelector("svg")?.outerHTML || "";
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="en">
        <head>
          <title>CineBook Ticket — Booking #${booking.id}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: #fff; display: flex; justify-content: center; padding: 40px; }
            .ticket { border: 2px dashed #333; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%; }
            .title { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
            .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
            .label { color: #888; }
            .value { font-weight: 600; color: #111; }
            .seats { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
            .seat { border: 1px solid #333; border-radius: 8px; padding: 4px 10px; font-size: 12px; font-weight: bold; }
            .seat.golden { border-color: #b8860b; color: #b8860b; }
            .total { font-size: 20px; font-weight: bold; text-align: center; margin: 12px 0; }
            .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 16px; }
            .qr-code { font-size: 10px; color: #999; font-family: monospace; }
            .footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="title">${booking.show?.movie?.title || "Movie"}</div>
            <div class="subtitle">${booking.show?.showType || ""} · ${booking.show?.language || ""}</div>
            <div class="divider"></div>
            <div class="row"><span class="label">User</span><span class="value">${booking.user?.name || ""} ${booking.user?.surname || ""}</span></div>
            <div class="row"><span class="label">Theatre</span><span class="value">${booking.show?.theatre?.name || ""}</span></div>
            <div class="row"><span class="label">Location</span><span class="value">${booking.show?.theatre?.location || ""}</span></div>
            <div class="row"><span class="label">Show Time</span><span class="value">${formatIST(booking.show?.startTime)}</span></div>
            <div class="row"><span class="label">Payment</span><span class="value">${booking.paymentType}</span></div>
            <div class="divider"></div>
            <div class="label" style="font-size:12px;margin-bottom:8px;">SEATS</div>
            <div class="seats">
              ${(booking.seats || []).map(bs => `<span class="seat ${bs.seatType === "GOLDEN" ? "golden" : ""}">${bs.showSeat?.row}${bs.showSeat?.number}</span>`).join("")}
            </div>
            <div class="divider"></div>
            <div class="total">₹${booking.totalAmount}</div>
            <div class="divider"></div>
            <div class="qr-wrap">
              ${qrSvg}
              <div class="qr-code">${qrValue}</div>
              <div class="footer">Booking #${booking.id} · Show this at the entrance</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      toast.loading("Generating PDF...", { id: "pdf" });
      const svgEl = qrRef.current?.querySelector("svg");
      let qrDataUrl = null;

      if (svgEl) {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        qrDataUrl = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.width || 180;
            c.height = img.height || 180;
            c.getContext("2d").drawImage(img, 0, 0);
            resolve(c.toDataURL("image/png"));
            URL.revokeObjectURL(svgUrl);
          };
          img.src = svgUrl;
        });
      }

      if (qrDataUrl && qrRef.current) {
        const existingSvg = qrRef.current.querySelector("svg");
        const tempImg = document.createElement("img");
        tempImg.src = qrDataUrl;
        tempImg.width = 180;
        tempImg.height = 180;
        existingSvg.replaceWith(tempImg);

        const canvas = await html2canvas(ticketRef.current, {
          backgroundColor: "#0D0D0D",
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        tempImg.replaceWith(existingSvg);

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [canvas.width / 2, canvas.height / 2],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`CineBook-Ticket-${booking.id}.pdf`);
        toast.success("Ticket downloaded!", { id: "pdf" });
      } else {
        throw new Error("QR not ready");
      }
    } catch {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm md:max-w-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" />
            <div>
              <span className="font-heading font-semibold text-gray-900">Ticket</span>
              <span className="text-gray-500 text-xs ml-2">
                {booking.user?.name} {booking.user?.surname}
                <span className="text-gray-400 ml-1">@{booking.user?.username}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body — no scrollbar, horizontal on desktop */}
        <div ref={ticketRef} className="grid grid-cols-1 md:grid-cols-2 gap-0">

          {/* Left — ticket info */}
          <div className="p-5 space-y-4 md:border-r md:border-gray-100">
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900 leading-tight">
                {booking.show?.movie?.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>
                  {booking.status}
                </span>
                {booking.isUsed && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    USED
                  </span>
                )}
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {booking.show?.showType}
                </span>
                {booking.show?.language && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {booking.show.language}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200" />

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-muted">
                <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
                <span>{booking.show?.theatre?.name}, {booking.show?.theatre?.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Clock size={13} className="shrink-0 text-primary" />
                <span>{formatIST(booking.show?.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Calendar size={13} className="shrink-0 text-primary" />
                <span>Booked on {formatIST(booking.createdAt)}</span>
              </div>
            </div>

            <div>
              <p className="text-muted text-xs mb-2">Seats</p>
              <div className="flex flex-wrap gap-1.5">
                {(booking.seats || []).map((bs, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                      ${bs.seatType === "GOLDEN"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                  >
                    {bs.showSeat?.row}{bs.showSeat?.number}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200" />

            <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-gray-500 text-sm">Total Paid</span>
              <span className="text-gray-900 font-bold text-lg">₹{booking.totalAmount}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Payment</span>
              <span className="text-gray-900">{booking.paymentType}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Booking ID</span>
              <span className="text-gray-900 font-mono">#{booking.id}</span>
            </div>

            {booking.isUsed && booking.usedAt && (
              <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-gray-600 text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  Used at {formatIST(booking.usedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Right — QR */}
          <div className="p-5 flex flex-col items-center justify-center gap-4 bg-gray-50">
            <div className="border-t border-dashed border-gray-200 w-full md:hidden" />
            <p className="text-muted text-xs text-center">Show this QR at the entrance</p>
            <div className="bg-white p-4 rounded-2xl" ref={qrRef}>
              <QRCodeSVG
                value={qrValue}
                size={180}
                bgColor="#ffffff"
                fgColor="#0D0D0D"
                level="H"
              />
            </div>
            <p className="text-muted text-xs font-mono tracking-wide text-center break-all">
              {qrValue}
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 w-full text-center">
              <p className="text-primary text-xs font-medium">Booking #{booking.id}</p>
              <p className="text-muted text-xs mt-0.5">{booking.paymentType} Payment</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 pt-2 flex flex-col gap-2 border-t border-gray-100">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-semibold py-3 rounded-xl transition text-sm"
          >
            <Download size={16} />
            Download Ticket PDF
          </button>
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-card border border-gray-200 text-gray-500 hover:text-gray-900 font-semibold py-3 rounded-xl transition text-sm"
          >
            <Printer size={16} />
            Print Ticket
          </button>
          <button
            onClick={onClose}
            className="w-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 py-2.5 rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────
const ConfirmModal = ({ booking, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <h3 className="text-gray-900 font-semibold text-lg mb-2">Cancel Booking?</h3>
      <p className="text-gray-500 text-sm mb-1">
        Booking <span className="text-gray-900">#{booking.id}</span> — {booking.user?.name} {booking.user?.surname}
      </p>
      <p className="text-muted text-sm mb-6">
        {booking.paymentType === "CARD"
          ? `₹${booking.totalAmount} will be refunded to their card.`
          : `₹${booking.totalAmount} cash refund — handle manually.`}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 text-sm transition"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
        >
          Cancel Booking
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [cancelling, setCancelling] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const fetchBookings = useCallback(async (p = 1, search = appliedSearch) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (search) params.append("search", search);
      const res = await api.get(`/admin/bookings?${params}`);
      setBookings(res.data.bookings);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => { fetchBookings(page).catch(console.error); }, [page, fetchBookings]);

  const applySearch = () => {
    setAppliedSearch(searchInput);
    setPage(1);
    fetchBookings(1, searchInput).catch(console.error);
  };

  const clearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
    fetchBookings(1, "").catch(console.error);
  };

  const handleCancelConfirm = async () => {
    const booking = confirmModal;
    setConfirmModal(null);
    setCancelling(booking.id);
    try {
      await api.delete(`/admin/bookings/${booking.id}`);
      toast.success("Booking cancelled!");
      await fetchBookings(page).catch(console.error);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <AdminLayout>
      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Cancel Modal */}
      {confirmModal && (
        <ConfirmModal
          booking={confirmModal}
          onConfirm={handleCancelConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-muted text-sm mt-1">
            {pagination.total || 0}{" "}
            {appliedSearch ? `result(s) for "${appliedSearch}"` : "total bookings"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by booking ID, user ID, @username, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
          />
        </div>
        <button
          onClick={applySearch}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          Search
        </button>
        {appliedSearch && (
          <button
            onClick={clearSearch}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:text-gray-900 px-4 py-2.5 rounded-xl text-sm transition"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <p className="text-muted text-xs mb-5">
        Tip: Use a number for booking/user ID, <span className="text-primary">@username</span> for username, or type an email address.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">
            {appliedSearch ? `No bookings found for "${appliedSearch}"` : "No bookings found"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map((booking) => {
              const showStarted = new Date() >= new Date(booking.show?.startTime);
              return (
                <div
                  key={booking.id}
                  className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-900 font-medium text-sm">
                        #{booking.id} — {booking.user?.name} {booking.user?.surname}
                      </p>
                      <span className="text-muted text-xs">
                        @{booking.user?.username} · ID: {booking.user?.id}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${paymentColors[booking.paymentType]}`}>
                        {booking.paymentType}
                      </span>
                    </div>

                    <p className="text-muted text-xs sm:text-sm mt-1 truncate">
                      {booking.show?.movie?.title} &nbsp;·&nbsp;
                      {booking.show?.theatre?.name} &nbsp;·&nbsp;
                      {booking.seats?.length} seat{booking.seats?.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
                      ₹{booking.totalAmount ?? "—"}
                    </p>

                    {booking.refundAmount > 0 && (
                      <p className="text-yellow-400 text-xs mt-0.5">
                        Refunded: ₹{booking.refundAmount}
                      </p>
                    )}

                    {/* Ticket used status */}
                    {booking.status === "PAID" && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {booking.isUsed ? (
                          <>
                            <CheckCircle2 size={12} className="text-green-400" />
                            <span className="text-green-400 text-xs">
                              Ticket used · {formatISTShort(booking.usedAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} className="text-muted" />
                            <span className="text-muted text-xs">Ticket not yet scanned</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {/* View Ticket — only for PAID */}
                    {booking.status === "PAID" && (
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-medium transition"
                      >
                        <QrCode size={13} />
                        View Ticket
                      </button>
                    )}

                    {/* Cancel — only for PAID and show not started */}
                    {booking.status === "PAID" && !showStarted && (
                      <button
                        onClick={() => setConfirmModal(booking)}
                        disabled={cancelling === booking.id}
                        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-400/10 hover:border-red-400/30 px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
                      >
                        {cancelling === booking.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}

                    {booking.status === "PAID" && showStarted && (
                      <span className="text-gray-400 text-xs border border-gray-200 px-3 py-1.5 rounded-xl opacity-50">
                        Show started
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-muted text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Bookings;