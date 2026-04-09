import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import AuthLayout from "../components/auth/AuthLayout";
import Spinner from "../components/common/Spinner";
import toast from "react-hot-toast";

const OTPVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();

const { email, type, stayLoggedIn, redirect, isAdmin } = location.state || {}; // ← add isAdmin

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate("/login");
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only numbers
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(paste)) {
      const newOtp = paste.split("");
      while (newOtp.length < 6) newOtp.push("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const getEndpoint = () => {
  if (type === "SIGNUP") return isAdmin ? "/auth/verify-admin-signup" : "/auth/verify-signup"; // ← fix
  if (type === "LOGIN") return "/auth/verify-login";
  if (type === "FORGOT_PASSWORD") return null;
  return "/auth/verify-login";
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    // For forgot password — just redirect to reset password page with otp
  if (type === "FORGOT_PASSWORD") {
    navigate("/reset-password", {
      state: { email, otp: otpString },
    });
    return;
  }

    setLoading(true);
    try {
      const res = await api.post(getEndpoint(), {
        email,
        otp: otpString,
        stayLoggedIn: stayLoggedIn || false,
      });

      setUser(res.data.user);
      toast.success(res.data.message);

      // Redirect based on role
      if (res.data.user.role === "ADMIN") {
        navigate("/admin");
      }

      else if (redirect) {
  navigate(redirect); // ← redirect back to show
}

      else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email, type });
      toast.success("OTP resent!");
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  const titles = {
    SIGNUP: "Verify your email",
    LOGIN: "Enter login OTP",
    FORGOT_PASSWORD: "Enter reset OTP",
  };

    return (
    <AuthLayout subtitle="">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              {titles[type] || "Verify OTP"}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              We sent a 6-digit OTP to
            </p>
            <p className="text-gray-900 text-sm font-medium">{email}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP inputs */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-12 text-center text-xl font-bold bg-gray-50 border-2 rounded-xl text-gray-900 outline-none transition
                    ${digit ? "border-primary" : "border-gray-200"}
                    focus:border-primary focus:ring-1 focus:ring-primary`}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-sm"
            >
                {loading ? <Spinner text="Verifying..." /> : "Verify OTP →"}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-5">
            {countdown > 0 ? (
              <p className="text-muted text-sm">
                Resend OTP in <span className="text-primary font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:text-purple-400 text-sm font-medium transition disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            )}
          </div>

          {/* Back */}
          <div className="text-center mt-4">
            <Link to="/login" className="text-gray-500 text-sm hover:text-gray-900 transition">
              ← Back to login
            </Link>
          </div>
        </AuthLayout>
  );
};

export default OTPVerify;