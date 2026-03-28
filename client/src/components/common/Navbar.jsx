import { Link, useNavigate, useLocation } from "react-router-dom";
import { Film, Ticket, LogOut, User, Home } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Film className="text-primary" size={22} />
            <span className="font-heading text-lg sm:text-xl font-bold text-white">
              Cine<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm transition
                ${isActive("/") ? "bg-primary/10 text-primary font-medium" : "text-muted hover:text-white"}`}
            >
              Home
            </Link>
            <Link
              to="/my-bookings"
              className={`px-4 py-2 rounded-xl text-sm transition flex items-center gap-1.5
                ${isActive("/my-bookings") ? "bg-primary/10 text-primary font-medium" : "text-muted hover:text-white"}`}
            >
              <Ticket size={15} />
              My Bookings
            </Link>
          </nav>

          {/* User + Logout (top bar, all screen sizes) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <User size={15} />
              <span className="hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-red-400 transition"
            >
              <LogOut size={15} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="grid grid-cols-2 h-16 divide-x divide-border">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-1 text-xs transition
              ${isActive("/") ? "text-primary" : "text-muted"}`}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>
          <Link
            to="/my-bookings"
            className={`flex flex-col items-center justify-center gap-1 text-xs transition
              ${isActive("/my-bookings") ? "text-primary" : "text-muted"}`}
          >
            <Ticket size={20} />
            <span>My Bookings</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;