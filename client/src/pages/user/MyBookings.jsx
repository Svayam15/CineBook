import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Ticket, Clock, MapPin, Calendar } from "lucide-react";
import { formatDate } from "@/utils/formatDate.js";

const statusColors = {
  PAID: "bg-green-500/10 text-green-400 border-green-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  FAILED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchBookings().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-heading text-lg font-semibold text-white">
                        {booking.show?.movie?.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {booking.show?.showType}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-muted text-sm flex items-center gap-1.5">
                        <MapPin size={13} />
                        {booking.show?.theatre?.name}, {booking.show?.theatre?.location}
                      </p>
                      <p className="text-muted text-sm flex items-center gap-1.5">
                        <Clock size={13} />
                        {booking.show?.startTime}
                      </p>
                      <p className="text-muted text-sm flex items-center gap-1.5">
                        <Calendar size={13} />
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
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-xl">₹{booking.totalAmount}</p>
                    <p className="text-muted text-xs mt-1">{booking.paymentType}</p>
                    <p className="text-muted text-xs">#{booking.id}</p>
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