import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark pb-24 md:pb-10">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-base font-bold text-white">Terms & Conditions</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">1. Booking Policy</h2>
          <p className="text-muted text-sm leading-relaxed">All bookings made on CineBook are subject to availability. Once confirmed, a booking cannot be transferred to another show or user.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">2. Cancellation & Refunds</h2>
          <p className="text-muted text-sm leading-relaxed">Cancellations made more than 24 hours before the show are eligible for a 100% refund. Cancellations between 4–24 hours receive a 50% refund. No refund is applicable within 4 hours of the show.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">3. Entry & Ticket Validity</h2>
          <p className="text-muted text-sm leading-relaxed">Your QR code ticket is valid only for the booked show. Once scanned at the entrance, the ticket is marked as used and cannot be reused.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">4. Account Responsibility</h2>
          <p className="text-muted text-sm leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials. CineBook is not liable for unauthorized access resulting from your negligence.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">5. Changes to Terms</h2>
          <p className="text-muted text-sm leading-relaxed">CineBook reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </div>

      </div>
    </div>
  );
};

export default Terms;