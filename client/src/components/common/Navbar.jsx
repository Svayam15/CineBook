import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Film, Ticket, LogOut, Home, User, Settings } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const isActive = (path) => location.pathname === path;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user
    ? `${user.name?.[0] ?? ""}`.toUpperCase()
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

          {/* Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-white hover:opacity-90 transition"
            >
              {initials}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">

                {/* User info header */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-white text-sm font-semibold truncate">
                    {user?.name} {user?.surname}
                  </p>
                  <p className="text-muted text-xs truncate mt-0.5">@{user?.username}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/my-bookings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition"
                  >
                    <Ticket size={15} />
                    My Bookings
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition"
                  >
                    <User size={15} />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition"
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
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
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 text-xs transition
              ${dropdownOpen ? "text-primary" : "text-muted"}`}
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[10px]">
              {initials}
            </div>
            <span>Profile</span>
          </button>
        </div>

        {/* Mobile dropdown — pops up above tab bar */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute bottom-16 right-2 w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-semibold truncate">
                {user?.name} {user?.surname}
              </p>
              <p className="text-muted text-xs truncate mt-0.5">@{user?.username}</p>
            </div>

            <div className="py-1">
              <Link
                to="/my-bookings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition"
              >
                <Ticket size={15} />
                My Bookings
              </Link>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition"
              >
                <User size={15} />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition"
              >
                <Settings size={15} />
                Settings
              </Link>
            </div>

            <div className="border-t border-border py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;