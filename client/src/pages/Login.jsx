import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Film } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    stayLoggedIn: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        identifier: formData.identifier,
        password: formData.password,
      });

      toast.success(res.data.message);

      navigate("/verify-otp", {
        state: {
          email: res.data.email,
          type: "LOGIN",
          stayLoggedIn: formData.stayLoggedIn,
        },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Film className="text-primary" size={36} />
            <h1 className="font-heading text-4xl font-bold text-white tracking-tight">
              Cine<span className="text-primary">Book</span>
            </h1>
          </div>
          <p className="text-muted text-sm">Your ultimate movie booking experience</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
          <h2 className="font-heading text-xl font-semibold text-white mb-6">
            Welcome back! Please login.

          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Identifier */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your email or username"
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition placeholder-zinc-700 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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

            {/* Stay logged in + Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => setFormData({ ...formData, stayLoggedIn: !formData.stayLoggedIn })}>
  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
    ${formData.stayLoggedIn
      ? "bg-primary border-primary"
      : "border-zinc-600 group-hover:border-primary"
    }`}
  >
    {formData.stayLoggedIn && (
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
  <span className="text-sm text-muted group-hover:text-white transition">Stay logged in</span>
</div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-purple-400 transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Signup link */}
          <p className="text-center text-muted text-sm">
            New to CineBook?{" "}
            <Link
              to="/signup"
              className="text-primary hover:text-purple-400 font-medium transition"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-6">
          © 2026 CineBook. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;