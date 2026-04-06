import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Film, Ticket, LogOut, Home, User, ChevronDown } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Get initials for avatar
  const initials = user
    ? `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase()
    : "?";

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

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 group"
            >
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm group-hover:bg-primary/30 transition">
                {initials}
              </div>
              <ChevronDown
                size={14}
                className={`text-muted transition-transform duration-200 hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">

                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {user?.name} {user?.surname}
                      </p>
                      <p className="text-muted text-xs truncate">@{user?.username}</p>
                    </div>
                  </div>
                </div>

                {/* Role badge */}
                <div className="px-4 py-2 border-b border-border">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {user?.role}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="grid grid-cols-3 h-16">
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

          {/* Profile tab on mobile — opens dropdown */}
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 text-xs transition
              ${dropdownOpen ? "text-primary" : "text-muted"}`}
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[10px]">
              {initials}
            </div>
            <span>Profile</span>
          </button>
        </div>

        {/* Mobile dropdown — slides up from bottom tab bar */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute bottom-16 right-0 left-0 mx-4 mb-1 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {user?.name} {user?.surname}
                </p>
                <p className="text-muted text-xs truncate">@{user?.username}</p>
              </div>
            </div>

            {/* Role */}
            <div className="px-4 py-2 border-b border-border">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {user?.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => { setDropdownOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;