import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "src/components/common/Navbar.jsx";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark pb-24 md:pb-0">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading text-xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-5 text-muted text-sm leading-relaxed">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">1. Information We Collect</h2>
            <p>We collect your name, email address, and username when you create an account. Booking details including show, seats, and payment type are stored to provide our services.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">2. How We Use Your Data</h2>
            <p>Your data is used solely to process bookings, send confirmation emails, and provide customer support. We do not sell your data to third parties.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">3. Cookies & Sessions</h2>
            <p>CineBook uses HTTP-only cookies to manage authentication sessions securely. These cookies are never accessible via JavaScript and expire automatically.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">4. Payment Security</h2>
            <p>All card payments are processed securely through Stripe. CineBook does not store any card details on its servers.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">5. Data Retention</h2>
            <p>Your account and booking data is retained as long as your account is active. You may contact us to request deletion of your data at any time.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold">6. Contact</h2>
            <p>For any privacy-related concerns, reach out to us at <span className="text-primary">support@svayam.dev</span>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;