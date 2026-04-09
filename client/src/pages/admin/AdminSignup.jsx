import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Spinner from "../../components/common/Spinner";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    adminSecret: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await api.post("/auth/admin-signup", formData);
      toast.success(res.data.message);
      navigate("/verify-otp", {
        state: { email: formData.email, type: "SIGNUP", isAdmin: true },
      });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Admin Registration">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <ShieldCheck size={16} className="text-primary" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-gray-900">
          Create Admin Account
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name + Surname */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">First Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John"
              required
              className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder:text-gray-400 text-sm
                ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">⚠️ {errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Last Name</label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              placeholder="Doe"
              required
              className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder:text-gray-400 text-sm
                ${errors.surname ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
            />
            {errors.surname && <p className="text-red-400 text-xs mt-1">⚠️ {errors.surname}</p>}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="admin_john"
            required
            className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder:text-gray-400 text-sm
              ${errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
          />
          {errors.username && <p className="text-red-400 text-xs mt-1">⚠️ {errors.username}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
            required
            className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-1 transition placeholder:text-gray-400 text-sm
              ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">⚠️ {errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 chars with uppercase, number & symbol"
              required
              className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-1 transition placeholder:text-gray-400 text-sm
                ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password
            ? <p className="text-red-400 text-xs mt-1">⚠️ {errors.password}</p>
            : <p className="text-xs text-muted mt-1.5">8-16 chars with uppercase, lowercase, number & special character</p>
          }
        </div>

        {/* Admin Secret */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">
            Admin Secret Key
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              name="adminSecret"
              value={formData.adminSecret}
              onChange={handleChange}
              placeholder="Enter admin secret key"
              required
              className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-1 transition placeholder:text-gray-400 text-sm
                ${errors.adminSecret ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.adminSecret && <p className="text-red-400 text-xs mt-1">⚠️ {errors.adminSecret}</p>}
          <p className="text-xs text-muted mt-1.5">Contact the system owner to get the admin secret key</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
        >
          {loading ? <Spinner text="Sending OTP..." /> : "Create Admin Account →"}
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
    </AuthLayout>
  );
};

export default AdminSignup;