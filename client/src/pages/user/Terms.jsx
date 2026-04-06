import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "src/components/common/Navbar.jsx";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark pb-24 md:pb-0">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading text-xl font-bold text-white">Terms & Conditions</h1>
        </div>

        <div className="space-y-5 text-muted text-sm leading-relaxed">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">1. Booking Policy</h2>
            <p>All bookings made on CineBook are subject to availability. Once confirmed, a booking cannot be transferred to another show or user.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">2. Cancellation & Refunds</h2>
            <p>Cancellations made more than 24 hours before the show are eligible for a 100% refund. Cancellations between 4–24 hours receive a 50% refund. No refund is applicable within 4 hours of the show.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">3. Entry & Ticket Validity</h2>
            <p>Your QR code ticket is valid only for the booked show. Once scanned at the entrance, the ticket is marked as used and cannot be reused.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">4. Account Responsibility</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. CineBook is not liable for unauthorized access resulting from your negligence.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">5. Changes to Terms</h2>
            <p>CineBook reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;