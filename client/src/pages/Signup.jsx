import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Film } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await api.post("/auth/signup", formData);
      toast.success(res.data.message);
      navigate("/verify-otp", {
        state: { email: formData.email, type: "SIGNUP" },
      });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors); // ← show field errors
      } else {
        toast.error(err.message);
      }
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
          <p className="text-muted text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
          <h2 className="font-heading text-xl font-semibold text-white mb-6">
            Join CineBook 🎬
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name + Surname */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted mb-1.5">First Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className={`w-full bg-dark border text-white rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder-zinc-700 text-sm
                    ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"}`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">⚠️ {errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className={`w-full bg-dark border text-white rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder-zinc-700 text-sm
                    ${errors.surname ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"}`}
                />
                {errors.surname && <p className="text-red-400 text-xs mt-1">⚠️ {errors.surname}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="john_doe"
                required
                className={`w-full bg-dark border text-white rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder-zinc-700 text-sm
                  ${errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"}`}
              />
              {errors.username && <p className="text-red-400 text-xs mt-1">⚠️ {errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className={`w-full bg-dark border text-white rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder-zinc-700 text-sm
                  ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">⚠️ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars with uppercase, number & symbol"
                  required
                  className={`w-full bg-dark border text-white rounded-xl px-4 py-3 pr-12 outline-none focus:ring-1 transition placeholder-zinc-700 text-sm
                    ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password
                ? <p className="text-red-400 text-xs mt-1">⚠️ {errors.password}</p>
                : <p className="text-xs text-muted mt-1.5">8-16 chars with uppercase, lowercase, number & special character</p>
              }
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
                "Create Account →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login link */}
          <p className="text-center text-muted text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-purple-400 font-medium transition">
              Login
            </Link>
          </p>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          © 2026 CineBook. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;