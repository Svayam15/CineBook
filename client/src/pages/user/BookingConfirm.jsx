import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { CheckCircle, Home, Ticket } from "lucide-react";

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, show, selectedSeats, totalAmount } = location.state || {};

  useEffect(() => {
    if (!bookingId) navigate("/");
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="max-w-lg mx-auto px-6 py-12 text-center">

        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Booking Confirmed! 🎉
        </h1>
        <p className="text-muted mb-8">
          Your tickets have been booked successfully. Check your email for confirmation.
        </p>

        {/* Booking Details */}
        <div className="bg-card border border-border rounded-2xl p-6 text-left mb-8">
          <h2 className="font-heading text-lg font-semibold text-white mb-4">Booking Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Booking ID</span>
              <span className="text-white font-medium">#{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Movie</span>
              <span className="text-white">{show?.movie?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Theatre</span>
              <span className="text-white">{show?.theatre?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Show Time</span>
              <span className="text-white">{show?.startTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Seats</span>
              <span className="text-white">{selectedSeats?.length} seat(s)</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-white font-semibold">Total Paid</span>
              <span className="text-green-400 font-bold text-lg">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 bg-card border border-border text-muted hover:text-white py-3 rounded-xl text-sm transition"
          >
            <Home size={16} />
            Home
          </Link>
          <Link
            to="/my-bookings"
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-sm font-medium transition"
          >
            <Ticket size={16} />
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;