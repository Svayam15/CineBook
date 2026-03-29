import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Ticket, Clock, MapPin, Calendar, X, QrCode } from "lucide-react";
import { formatDate } from "@/utils/formatDate.js";
import { QRCodeSVG } from "qrcode.react";

const statusColors = {
  PAID:      "bg-green-500/10 text-green-400 border-green-500/20",
  PENDING:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  FAILED:    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

// ─── Refund Policy Helper ─────────────────────────────────────────────────────
const getRefundPolicy = (showStartTime) => {
  const now = new Date();
  const showTime = new Date(showStartTime);
  const hoursRemaining = (showTime - now) / (1000 * 60 * 60);

  if (hoursRemaining < 0) return null; // show already started
  if (hoursRemaining >= 24) return { percent: 100, label: "100% refund", color: "text-green-400" };
  if (hoursRemaining >= 4)  return { percent: 50,  label: "50% refund",  color: "text-yellow-400" };
  return { percent: 0, label: "No refund (under 4hrs)", color: "text-red-400" };
};

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────
const CancelModal = ({ booking, onClose, onConfirm, cancelling }) => {
  const policy = getRefundPolicy(booking.show?.rawStartTime || booking.show?.startTime);
  const refundAmount = policy
    ? Math.round((booking.totalAmount || 0) * (policy.percent / 100) * 100) / 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-heading font-semibold text-white">Cancel Booking</span>
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-white text-sm">
            Are you sure you want to cancel your booking for{" "}
            <span className="font-semibold text-primary">
              {booking.show?.movie?.title}
            </span>?
          </p>

          {/* Refund Info */}
          <div className="bg-dark rounded-xl px-4 py-3 space-y-2">
            <p className="text-muted text-xs font-medium uppercase tracking-wide">
              Refund Policy
            </p>
            {policy ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Refund</span>
                  <span className={`text-sm font-semibold ${policy.color}`}>
                    {policy.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Amount paid</span>
                  <span className="text-white text-sm">₹{booking.totalAmount}</span>
                </div>
                {policy.percent > 0 && (
                  <div className="flex justify-between items-center border-t border-border pt-2">
                    <span className="text-white text-sm font-medium">You will get</span>
                    <span className="text-green-400 text-sm font-bold">₹{refundAmount}</span>
                  </div>
                )}
                {policy.percent === 0 && (
                  <p className="text-red-400 text-xs pt-1">
                    No refund as show starts in under 4 hours.
                  </p>
                )}
                {booking.paymentType === "CASH" && policy.percent > 0 && (
                  <p className="text-yellow-400 text-xs pt-1">
                    Cash refund — collect ₹{refundAmount} from the theatre counter.
                  </p>
                )}
              </>
            ) : (
              <p className="text-red-400 text-sm">
                Cannot cancel — show has already started.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:text-white text-sm transition"
            >
              Keep Booking
            </button>
            {policy && (
              <button
                onClick={onConfirm}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium transition disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Ticket Modal ─────────────────────────────────────────────────────────────
const TicketModal = ({ booking, onClose }) => {
  const qrValue = `CINEBOOK-${booking.id}-${booking.show?.id ?? ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" />
            <span className="font-heading font-semibold text-white">Your Ticket</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-5 space-y-4">

          {/* Movie + Status */}
          <div>
            <h3 className="font-heading text-lg font-bold text-white leading-tight">
              {booking.show?.movie?.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>
                {booking.status}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {booking.show?.showType}
              </span>
            </div>
          </div>

          {/* Divider with holes */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-dark border border-border -ml-7" />
            <div className="flex-1 border-t border-dashed border-border" />
            <div className="w-3 h-3 rounded-full bg-dark border border-border -mr-7" />
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-muted">
              <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
              <span>{booking.show?.theatre?.name}, {booking.show?.theatre?.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Clock size={13} className="shrink-0 text-primary" />
              <span>{booking.show?.startTime}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Calendar size={13} className="shrink-0 text-primary" />
              <span>Booked on {formatDate(booking.createdAt)}</span>
            </div>
          </div>

          {/* Seats */}
          <div>
            <p className="text-muted text-xs mb-2">Seats</p>
            <div className="flex flex-wrap gap-1.5">
              {booking.seats?.map((bs) => (
                <span
                  key={bs.id}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                    ${bs.seatType === "GOLDEN"
                      ? "bg-golden/10 text-golden border-golden/20"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                >
                  {bs.showSeat?.row}{bs.showSeat?.number}
                </span>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center bg-dark rounded-xl px-4 py-3">
            <span className="text-muted text-sm">Total Paid</span>
            <span className="text-white font-bold text-lg">₹{booking.totalAmount}</span>
          </div>

          {/* Divider with holes */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-dark border border-border -ml-7" />
            <div className="flex-1 border-t border-dashed border-border" />
            <div className="w-3 h-3 rounded-full bg-dark border border-border -mr-7" />
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl">
              <QRCodeSVG
                value={qrValue}
                size={160}
                bgColor="#ffffff"
                fgColor="#0D0D0D"
                level="H"
              />
            </div>
            <p className="text-muted text-xs font-mono tracking-wide text-center">
              {qrValue}
            </p>
            <p className="text-muted text-xs">Show this at the entrance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);   // ✅ booking to cancel
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings/my-bookings");
      setBookings(res.data.bookings);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings().catch(console.error);
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await api.delete(`/bookings/${cancelTarget.id}`);
      toast.success(res.data.message);
      setCancelTarget(null);
      await fetchBookings(); // ✅ refresh list //here
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setCancelling(false);
    }
  };

  // ✅ Show cancel button only if show hasn't started yet
  const canCancel = (booking) => {
    if (booking.status !== "PAID" && booking.status !== "PENDING") return false;
    const showTime = new Date(booking.show?.rawStartTime || booking.show?.startTime);
    return showTime > new Date();
  };

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-0">
      <Navbar />

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Cancel Confirm Modal */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancel}
          cancelling={cancelling}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-muted text-sm mt-1">{bookings.length} booking(s)</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={40} className="text-muted mx-auto mb-3" />
            <p className="text-muted text-lg">No bookings yet</p>
            <p className="text-muted text-sm mt-1">Book your first movie experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">

                    {/* Title + Badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-heading text-base sm:text-lg font-semibold text-white">
                        {booking.show?.movie?.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {booking.show?.showType}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5">
                      <p className="text-muted text-xs sm:text-sm flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">
                          {booking.show?.theatre?.name}, {booking.show?.theatre?.location}
                        </span>
                      </p>
                      <p className="text-muted text-xs sm:text-sm flex items-center gap-1.5">
                        <Clock size={12} className="shrink-0" />
                        {booking.show?.startTime}
                      </p>
                      <p className="text-muted text-xs sm:text-sm flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0" />
                        Booked on {formatDate(booking.createdAt)}
                      </p>
                    </div>

                    {/* Seats */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {booking.seats?.map((bs) => (
                        <span
                          key={bs.id}
                          className={`text-xs px-2 py-1 rounded-lg border
                            ${bs.seatType === "GOLDEN"
                              ? "bg-golden/10 text-golden border-golden/20"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700"
                            }`}
                        >
                          {bs.showSeat?.row}{bs.showSeat?.number}
                        </span>
                      ))}
                    </div>

                    {/* Refund note */}
                    {booking.refundAmount > 0 && (
                      <p className="text-golden text-xs mt-2">
                        Refunded: ₹{booking.refundAmount}
                      </p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="text-white font-bold text-xl">₹{booking.totalAmount}</p>
                    <p className="text-muted text-xs">{booking.paymentType}</p>
                    <p className="text-muted text-xs">#{booking.id}</p>

                    {/* View Ticket — only for PAID */}
                    {booking.status === "PAID" && (
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-medium transition mt-1"
                      >
                        <QrCode size={13} />
                        View Ticket
                      </button>
                    )}

                    {/* ✅ Cancel button — PAID or PENDING, show not started */}
                    {canCancel(booking) && (
                      <button
                        onClick={() => setCancelTarget(booking)}
                        className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition"
                      >
                        <X size={13} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;