import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp: otpFromState } = location.state || {};

  // ← ADD THIS
useEffect(() => {
  if (!email || !otpFromState) navigate("/login");
}, [email, otpFromState, navigate]);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        otp: otpFromState,
        newPassword: formData.newPassword,
      });
      toast.success(res.data.message);
      navigate("/login");
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
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="font-heading text-xl font-semibold text-white">
              Reset Password
            </h2>
            <p className="text-muted text-sm mt-1">for {email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">


            {/* New Password */}
            <div>
              <label className="block text-sm text-muted mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className="w-full bg-dark border border-border text-white rounded-xl px-4 py-3 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition placeholder-zinc-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  className="w-full bg-dark border border-border text-white rounded-xl px-4 py-3 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition placeholder-zinc-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted mt-1.5">
                8-16 chars with uppercase, lowercase, number & special character
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-sm"
            >
              {loading ? "Resetting..." : "Reset Password →"}
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

export default ResetPassword;