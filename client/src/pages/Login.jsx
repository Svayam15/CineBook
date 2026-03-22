import { useState } from "react";
import { useNavigate,useLocation, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Spinner from "../components/common/Spinner"; // ← ADD THIS
import api from "../api/axios";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ← ADD
  const { redirect } = location.state || {};
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
          redirect,
        },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

         return (
    <AuthLayout subtitle="Your ultimate movie booking experience">
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
              {loading ? <Spinner text="Sending OTP..." /> : "Continue" }
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
       </AuthLayout>
  );
};

export default Login;