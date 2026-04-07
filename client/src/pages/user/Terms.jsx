import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 pb-24 md:pb-10">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Terms & Conditions</h1>
      </div>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {[
          ["1. Booking Policy", "All bookings made on CineBook are subject to availability. Once confirmed, a booking cannot be transferred to another show or user."],
          ["2. Cancellation & Refunds", "Cancellations made more than 24 hours before the show are eligible for a 100% refund. Cancellations between 4–24 hours receive a 50% refund. No refund is applicable within 4 hours of the show."],
          ["3. Entry & Ticket Validity", "Your QR code ticket is valid only for the booked show. Once scanned at the entrance, the ticket is marked as used and cannot be reused."],
          ["4. Account Responsibility", "You are responsible for maintaining the confidentiality of your account credentials. CineBook is not liable for unauthorized access resulting from your negligence."],
          ["5. Changes to Terms", "CineBook reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms."],
        ].map(([title, text]) => (
          <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1.5">
            <h2 className="text-gray-900 font-semibold text-sm">{title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terms;