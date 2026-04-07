import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Ticket, Clock, MapPin, Calendar, X, QrCode, CreditCard, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate.js";
import { QRCodeSVG } from "qrcode.react";

const statusColors = {
  PAID:      "bg-green-100 text-green-700 border-green-200",
  PENDING:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  FAILED:    "bg-gray-100 text-gray-600 border-gray-200",
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

const getRefundPolicy = (showStartTime, bookingStatus) => {
  if (bookingStatus === "PENDING") {
    return { percent: 0, label: "No payment made", color: "text-zinc-400", isPending: true };
  }

  const now = new Date();
  const showTime = new Date(showStartTime);
  const hoursRemaining = (showTime - now) / (1000 * 60 * 60);

  if (hoursRemaining < 0) return null;
  if (hoursRemaining >= 24) return { percent: 100, label: "100% refund", color: "text-green-400" };
  if (hoursRemaining >= 4)  return { percent: 50,  label: "50% refund",  color: "text-yellow-400" };
  return { percent: 0, label: "No refund (under 4hrs)", color: "text-red-400" };
};

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────
const CancelModal = ({ booking, onClose, onConfirm, cancelling }) => {
  const policy = getRefundPolicy(
    booking.show?.rawStartTime || booking.show?.startTime,
    booking.status
  );
  const refundAmount = policy?.isPending
    ? 0
    : policy
    ? Math.round((booking.totalAmount || 0) * (policy.percent / 100) * 100) / 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-heading font-semibold text-gray-900">Cancel Booking</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-gray-900 text-sm">
            Are you sure you want to cancel your booking for{" "}
            <span className="font-semibold text-primary">
              {booking.show?.movie?.title}
            </span>?
          </p>

          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
              Refund Policy
            </p>

            {policy?.isPending ? (
              <p className="text-gray-500 text-sm">
                No payment was made — nothing to refund. Seats will be released.
              </p>
            ) : policy ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Refund</span>
                  <span className={`text-sm font-semibold ${policy.color}`}>
                    {policy.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Amount paid</span>
                  <span className="text-gray-900 text-sm">₹{booking.totalAmount}</span>
                </div>
                {policy.percent > 0 && (
                  <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                    <span className="text-gray-900 text-sm font-medium">You will get</span>
                    <span className="text-green-600 text-sm font-bold">₹{refundAmount}</span>
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

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 text-sm transition"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm md:max-w-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" />
            <span className="font-heading font-semibold text-gray-900">Your Ticket</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          {/* ✅ Two column on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left column — ticket info */}
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
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-500">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
                  <span>{booking.show?.theatre?.name}, {booking.show?.theatre?.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={13} className="shrink-0 text-primary" />
                  <span>{formatIST(booking.show?.rawStartTime || booking.show?.startTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={13} className="shrink-0 text-primary" />
                  <span>Booked on {formatDate(booking.createdAt)}</span>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-2">Seats</p>
                <div className="flex flex-wrap gap-1.5">
                  {booking.seats?.map((bs) => (
                    <span
                      key={bs.id}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                        ${bs.seatType === "GOLDEN"
                          ? "bg-golden/10 text-golden border-golden/20"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                    >
                      {bs.showSeat?.row}{bs.showSeat?.number}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-gray-500 text-sm">Total Paid</span>
                <span className="text-gray-900 font-bold text-lg">₹{booking.totalAmount}</span>
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

            {/* Right column — QR code */}
            <div className="p-5 flex flex-col items-center justify-center gap-4 bg-gray-50">
              <div className="border-t border-dashed border-gray-200 w-full md:hidden" />
              <p className="text-gray-500 text-xs text-center">Show this QR at the entrance</p>
              <div className="bg-white p-4 rounded-2xl">
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
                <p className="text-gray-500 text-xs mt-0.5">{booking.paymentType} Payment</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
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
      await fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setCancelling(false);
    }
  };

  const canPayNow = (booking) => {
    if (booking.status !== "PENDING") return false;
    const showTime = new Date(booking.show?.rawStartTime || booking.show?.startTime);
    return showTime > new Date();
  };

  // ✅ Cannot cancel if isUsed
  const canCancel = (booking) => {
    if (booking.isUsed) return false;
    if (booking.status !== "PAID" && booking.status !== "PENDING") return false;
    const showTime = new Date(booking.show?.rawStartTime || booking.show?.startTime);
    return showTime > new Date();
  };

  const handlePayNow = (booking) => {
    navigate("/payment", {
      state: {
        isRepay: true,
        bookingId: booking.id,
        showId: booking.showId,
        selectedSeats: booking.seats,
        totalAmount: booking.totalAmount,
        show: booking.show,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar />

      {selectedTicket && (
        <TicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

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
          <h1 className="font-heading text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">{bookings.length} booking(s)</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No bookings yet</p>
            <p className="text-gray-400 text-sm mt-1">Book your first movie experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-heading text-base sm:text-lg font-semibold text-gray-900">
                        {booking.show?.movie?.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      {/* ✅ USED badge on card */}
                      {booking.isUsed && (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          USED
                        </span>
                      )}
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {booking.show?.showType}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">
                          {booking.show?.theatre?.name}, {booking.show?.theatre?.location}
                        </span>
                      </p>
                      <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5">
                        <Clock size={12} className="shrink-0" />
                        {formatIST(booking.show?.rawStartTime || booking.show?.startTime)}
                      </p>
                      <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0" />
                        Booked on {formatDate(booking.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {booking.seats?.map((bs) => (
                        <span
                          key={bs.id}
                          className={`text-xs px-2 py-1 rounded-lg border
                            ${bs.seatType === "GOLDEN"
                              ? "bg-golden/10 text-golden border-golden/20"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                        >
                          {bs.showSeat?.row}{bs.showSeat?.number}
                        </span>
                      ))}
                    </div>

                    {booking.refundAmount > 0 && (
                      <p className="text-golden text-xs mt-2">
                        Refunded: ₹{booking.refundAmount}
                      </p>
                    )}

                    {/* ✅ Used at info on card */}
                    {booking.isUsed && booking.usedAt && (
                      <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Used at {formatIST(booking.usedAt)}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="text-gray-900 font-bold text-xl">₹{booking.totalAmount}</p>
                    <p className="text-gray-500 text-xs">{booking.paymentType}</p>
                    <p className="text-gray-400 text-xs">#{booking.id}</p>

                    {booking.status === "PAID" && (
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-medium transition mt-1"
                      >
                        <QrCode size={13} />
                        View Ticket
                      </button>
                    )}

                    {canPayNow(booking) && (
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition"
                      >
                        <CreditCard size={13} />
                        Pay Now
                      </button>
                    )}

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