import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 pb-24 md:pb-10">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Privacy Policy</h1>
      </div>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {[
          ["1. Information We Collect", "We collect your name, email address, and username when you create an account. Booking details including show, seats, and payment type are stored to provide our services."],
          ["2. How We Use Your Data", "Your data is used solely to process bookings, send confirmation emails, and provide customer support. We do not sell your data to third parties."],
          ["3. Cookies & Sessions", "CineBook uses HTTP-only cookies to manage authentication sessions securely. These cookies are never accessible via JavaScript and expire automatically."],
          ["4. Payment Security", "All card payments are processed securely through Stripe. CineBook does not store any card details on its servers."],
          ["5. Data Retention", "Your account and booking data is retained as long as your account is active. You may contact us to request deletion of your data at any time."],
          ["6. Contact", "For any privacy-related concerns, reach out to us at support@svayam.dev"],
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

export default Privacy;