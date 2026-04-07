import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark pb-24 md:pb-10">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-base font-bold text-white">Privacy Policy</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">1. Information We Collect</h2>
          <p className="text-muted text-sm leading-relaxed">We collect your name, email address, and username when you create an account. Booking details including show, seats, and payment type are stored to provide our services.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">2. How We Use Your Data</h2>
          <p className="text-muted text-sm leading-relaxed">Your data is used solely to process bookings, send confirmation emails, and provide customer support. We do not sell your data to third parties.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">3. Cookies & Sessions</h2>
          <p className="text-muted text-sm leading-relaxed">CineBook uses HTTP-only cookies to manage authentication sessions securely. These cookies are never accessible via JavaScript and expire automatically.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">4. Payment Security</h2>
          <p className="text-muted text-sm leading-relaxed">All card payments are processed securely through Stripe. CineBook does not store any card details on its servers.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">5. Data Retention</h2>
          <p className="text-muted text-sm leading-relaxed">Your account and booking data is retained as long as your account is active. You may contact us to request deletion of your data at any time.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-semibold text-sm">6. Contact</h2>
          <p className="text-muted text-sm leading-relaxed">For any privacy-related concerns, reach out to us at <span className="text-primary">support@svayam.dev</span>.</p>
        </div>

      </div>
    </div>
  );
};

export default Privacy;