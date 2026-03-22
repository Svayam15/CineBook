import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message);
      navigate("/verify-otp", {
        state: { email, type: "FORGOT_PASSWORD" },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

    return (
    <AuthLayout subtitle="">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h2 className="font-heading text-xl font-semibold text-white">
              Forgot Password?
            </h2>
            <p className="text-muted text-sm mt-2">
              Enter your email and we'll send you an OTP to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition placeholder-zinc-700 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-sm"
            >
              {loading ? "Sending OTP..." : "Send OTP →"}
            </button>
          </form>

          <div className="text-center mt-5">
            <Link to="/login" className="text-muted text-sm hover:text-white transition">
              ← Back to login
            </Link>
          </div>
        </AuthLayout>
  );
};

export default ForgotPassword;