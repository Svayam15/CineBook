import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { CheckCircle, Home, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, show, selectedSeats, totalAmount } = location.state || {};

  useEffect(() => {
    if (!bookingId) navigate("/");
  }, [bookingId, navigate]);

  const qrValue = `CINEBOOK-${bookingId}-${show?.id ?? ""}`;

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-12 text-center">

        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          Booking Confirmed! 🎉
        </h1>
        <p className="text-muted text-sm sm:text-base mb-8">
          Your tickets have been booked successfully. Check your email for confirmation.
        </p>

        {/* Booking Details */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 text-left mb-5">
          <h2 className="font-heading text-base sm:text-lg font-semibold text-white mb-4">
            Booking Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Booking ID</span>
              <span className="text-white font-medium">#{bookingId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Movie</span>
              <span className="text-white text-right">{show?.movie?.title}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Theatre</span>
              <span className="text-white text-right">{show?.theatre?.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Show Time</span>
              <span className="text-white text-right">{show?.startTime}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Seats</span>
              <span className="text-white">{selectedSeats?.length} seat(s)</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <span className="text-white font-semibold">Total Paid</span>
              <span className="text-green-400 font-bold text-lg">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* QR Code Ticket */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-6">
          <h2 className="font-heading text-base sm:text-lg font-semibold text-white mb-1">
            Your Ticket
          </h2>
          <p className="text-muted text-xs mb-5">
            Show this QR code at the entrance
          </p>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-2xl">
              <QRCodeSVG
                value={qrValue}
                size={180}
                bgColor="#ffffff"
                fgColor="#0D0D0D"
                level="H"
              />
            </div>
          </div>
          <p className="text-muted text-xs mt-4 font-mono tracking-wide">
            {qrValue}
          </p>
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