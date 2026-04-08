import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { CheckCircle } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-12 text-center">

        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Booking Confirmed! 🎉
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          Your tickets have been booked successfully. Check your email for confirmation.
        </p>

        {/* Booking Details */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 text-left mb-5">
          <h2 className="font-heading text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Booking Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Booking ID</span>
              <span className="text-gray-900 font-medium">#{bookingId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Movie</span>
              <span className="text-gray-900 text-right">{show?.movie?.title}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Theatre</span>
              <span className="text-gray-900 text-right">{show?.theatre?.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Show Time</span>
              <span className="text-gray-900 text-right">{show?.startTime}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Seats</span>
              <span className="text-gray-900">{selectedSeats?.length} seat(s)</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-gray-100 pt-3">
              <span className="text-gray-900 font-semibold">Total Paid</span>
              <span className="text-green-600 font-bold text-lg">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* QR Code Ticket */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 mb-6">
          <h2 className="font-heading text-base sm:text-lg font-semibold text-gray-900 mb-1">
            Your Ticket
          </h2>
          <p className="text-gray-500 text-xs mb-5">
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
          <p className="text-gray-400 text-xs mt-4 font-mono tracking-wide">
            {qrValue}
          </p>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirm;