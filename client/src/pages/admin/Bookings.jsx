import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { BookOpen, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

const statusColors = {
  PAID:      "bg-green-500/10 text-green-400 border border-green-500/20",
  PENDING:   "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border border-red-500/20",
  FAILED:    "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};

const paymentColors = {
  CARD: "bg-primary/10 text-primary border border-primary/20",
  CASH: "bg-golden/10 text-golden border border-golden/20",
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ booking, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <h3 className="text-white font-semibold text-lg mb-2">Cancel Booking?</h3>
      <p className="text-muted text-sm mb-1">
        Booking <span className="text-white">#{booking.id}</span> — {booking.user?.name} {booking.user?.surname}
      </p>
      <p className="text-muted text-sm mb-6">
        {booking.paymentType === "CARD"
          ? `₹${booking.totalAmount} will be refunded to their card.`
          : `₹${booking.totalAmount} cash refund — handle manually.`}
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition">
          Go Back
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition">
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
  const [userIdFilter, setUserIdFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");

  const fetchBookings = useCallback (async (p = 1, uid = appliedFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (uid) params.append("userId", uid);
      const res = await api.get(`/admin/bookings?${params}`);
      setBookings(res.data.bookings);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  },  [appliedFilter]);

  useEffect(() => { fetchBookings(page).catch(console.error); }, [page, fetchBookings]);

  const applyFilter = () => {
    if (userIdFilter && isNaN(parseInt(userIdFilter))) {
      return toast.error("User ID must be a number");
    }
    setAppliedFilter(userIdFilter);
    setPage(1);
    fetchBookings(1, userIdFilter).catch(console.error);
  };

  const clearFilter = () => {
    setUserIdFilter("");
    setAppliedFilter("");
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
      await fetchBookings(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <AdminLayout>
      {confirmModal && (
        <ConfirmModal
          booking={confirmModal}
          onConfirm={handleCancelConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Bookings</h1>
          <p className="text-muted text-sm mt-1">
            {pagination.total || 0} {appliedFilter ? `bookings for user #${appliedFilter}` : "total bookings"}
          </p>
        </div>
      </div>

      {/* User ID Filter */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="number"
            placeholder="Filter by User ID..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            className="w-full bg-dark border border-border text-white rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
          />
        </div>
        <button
          onClick={applyFilter}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          Filter
        </button>
        {appliedFilter && (
          <button
            onClick={clearFilter}
            className="flex items-center gap-1.5 border border-border text-muted hover:text-white px-4 py-2.5 rounded-xl text-sm transition"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">
            {appliedFilter ? `No bookings found for user #${appliedFilter}` : "No bookings found"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">
                      #{booking.id} — {booking.user?.name} {booking.user?.surname}
                    </p>
                    <span className="text-muted text-xs">@{booking.user?.username}</span>
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
                    <p className="text-golden text-xs mt-0.5">
                      Refunded: ₹{booking.refundAmount}
                    </p>
                  )}
                </div>

                {booking.status === "PAID" && (
                  <button
                    onClick={() => setConfirmModal(booking)}
                    disabled={cancelling === booking.id}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-400/10 hover:border-red-400/30 px-3 py-1.5 rounded-xl text-sm transition disabled:opacity-50 shrink-0"
                  >
                    {cancelling === booking.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-muted text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 bg-card border border-border rounded-xl text-muted hover:text-white transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 bg-card border border-border rounded-xl text-muted hover:text-white transition disabled:opacity-50"
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