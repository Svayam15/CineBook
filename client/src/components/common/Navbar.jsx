import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Film, Ticket, LogOut, Home, User,
  FileText, Shield, ArrowLeft, ChevronRight,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

// ─── Profile Drawer (desktop only) ───────────────────────────────────────────
const ProfileDrawer = ({ onClose, user, onLogout }) => {
  const navigate = useNavigate();

  const initials = user
    ? `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase()
    : "?";

  const Row = ({ icon: Icon, label, to, onClick, danger }) => {
    const handleClick = () => {
      if (danger && onClick) return onClick();
      if (to) { onClose(); navigate(to); }
      if (onClick) onClick();
    };
    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-4 px-5 py-4 transition text-left
          ${danger ? "hover:bg-red-500/5" : "hover:bg-white/3"}`}
      >
        <Icon size={17} className={danger ? "text-red-400" : "text-muted"} />
        <span className={`flex-1 text-sm font-medium ${danger ? "text-red-400" : "text-white"}`}>
          {label}
        </span>
        {!danger && <ChevronRight size={15} className="text-muted" />}
      </button>
    );
  };

  const CardGroup = ({ children }) => (
    <div className="bg-dark border border-border rounded-2xl overflow-hidden divide-y divide-border mx-5">
      {children}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-slide-in-right overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border shrink-0">
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-heading text-base font-bold text-white">Profile</h2>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 px-5 py-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">
              {user?.name} {user?.surname}
            </p>
            <p className="text-muted text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 pb-8">

          {/* Bookings */}
          <CardGroup>
            <Row icon={Ticket} label="View all bookings" to="/my-bookings" />
          </CardGroup>

          {/* More */}
          <div>
            <p className="text-white text-xs font-semibold px-5 mb-2 uppercase tracking-wide">More</p>
            <CardGroup>
              <Row icon={FileText} label="Terms & Conditions" to="/terms" />
              <Row icon={Shield} label="Privacy Policy" to="/privacy" />
            </CardGroup>
          </div>

          {/* Logout */}
          <CardGroup>
            <Row icon={LogOut} label="Logout" onClick={onLogout} danger />
          </CardGroup>
        </div>
      </div>
    </>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setDrawerOpen(false);
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const isActive = (path) => location.pathname === path;

  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <>
      {/* ── Desktop/Mobile Top Bar ── */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Film className="text-primary" size={22} />
            <span className="font-heading text-lg sm:text-xl font-bold text-white">
              Cine<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Desktop center nav */}
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
              <Ticket size={15} /> My Bookings
            </Link>
          </nav>

          {/* Avatar — opens drawer on desktop, goes to /profile on mobile */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-white hover:opacity-90 transition"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Desktop drawer */}
      {drawerOpen && (
        <ProfileDrawer
          user={user}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border">
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
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center gap-1 text-xs transition
              ${isActive("/profile") ? "text-primary" : "text-muted"}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white
              ${isActive("/profile") ? "bg-primary" : "bg-primary/70"}`}>
              {initials}
            </div>
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;