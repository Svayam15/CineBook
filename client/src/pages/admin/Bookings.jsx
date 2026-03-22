import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const statusColors = {
  PAID: "bg-green-500/10 text-green-400",
  PENDING: "bg-yellow-500/10 text-yellow-400",
  CANCELLED: "bg-red-500/10 text-red-400",
  FAILED: "bg-zinc-500/10 text-zinc-400",
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/bookings?page=${p}&limit=10`);
      setBookings(res.data.bookings);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(page); }, [page]);

  const handleCancel = async (bookingId) => {
    if (!confirm("Cancel this booking and refund the user?")) return;
    setCancelling(bookingId);
    try {
      await api.delete(`/admin/bookings/${bookingId}`);
      toast.success("Booking cancelled!");
      fetchBookings(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-white">Bookings</h1>
        <p className="text-muted text-sm mt-1">{pagination.total || 0} total bookings</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-white font-medium">#{booking.id} — {booking.user?.name} {booking.user?.surname}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                    <span className="text-xs bg-card border border-border text-muted px-2 py-0.5 rounded-full">
                      {booking.paymentType}
                    </span>
                  </div>
                  <p className="text-muted text-sm mt-1">
                    🎬 {booking.show?.movie?.title} • 🏛️ {booking.show?.theatre?.name} • 💺 {booking.seats?.length} seats • ₹{booking.totalAmount}
                  </p>
                </div>
                {booking.status === "PAID" && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelling === booking.id}
                    className="text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50 ml-4 shrink-0"
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
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 bg-card border border-border rounded-xl text-muted hover:text-white transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(page + 1)}
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