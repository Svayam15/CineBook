import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Film, Ticket, Home, ArrowLeft, ChevronRight,
  BookMarked, MessageSquare, HelpCircle, FileText, LogOut,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

// ─── Shared subcomponents — defined OUTSIDE to avoid static-components error ──

const DrawerCard = ({ children }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-100">
    {children}
  </div>
);

const DrawerRow = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition"
  >
    <Icon size={18} className="text-gray-500 shrink-0" strokeWidth={1.5} />
    <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
    <ChevronRight size={16} className="text-gray-400" />
  </button>
);

// ─── Profile Drawer ───────────────────────────────────────────────────────────
const ProfileDrawer = ({ onClose, user, onLogout, navigate }) => {
  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <>
      {/* Backdrop with blur — exactly like District */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-gray-100 z-50 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 bg-white border-b border-gray-200">
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold text-gray-900">Profile</h2>
        </div>

        <div className="flex flex-col gap-5 px-4 py-6">

          {/* Avatar + name */}
          <div className="flex items-center gap-4 px-1">
            <div className="w-16 h-16 rounded-full bg-violet-200 flex items-center justify-center text-violet-600 font-bold text-2xl shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-gray-900 font-bold text-base leading-tight">
                {user?.name} {user?.surname}
              </p>
              <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Bookings */}
          <DrawerCard>
            <DrawerRow
              icon={BookMarked}
              label="View all bookings"
              onClick={() => { onClose(); navigate("/my-bookings"); }}
            />
          </DrawerCard>

          {/* Support */}
          <div className="space-y-2">
            <p className="text-gray-900 text-sm font-bold px-1">Support</p>
            <DrawerCard>
              <DrawerRow
                icon={MessageSquare}
                label="Chat with us"
                onClick={() => { onClose(); navigate("/support"); }}
              />
            </DrawerCard>
          </div>

          {/* More */}
          <div className="space-y-2">
            <p className="text-gray-900 text-sm font-bold px-1">More</p>
            <DrawerCard>
              <DrawerRow
                icon={HelpCircle}
                label="Terms & Conditions"
                onClick={() => { onClose(); navigate("/terms"); }}
              />
              <DrawerRow
                icon={FileText}
                label="Privacy Policy"
                onClick={() => { onClose(); navigate("/privacy"); }}
              />
            </DrawerCard>
          </div>

          {/* Logout */}
          <DrawerCard>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition"
            >
              <LogOut size={18} className="text-gray-500 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-sm font-medium text-gray-800">Logout</span>
            </button>
          </DrawerCard>

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

  const pathname = location.pathname;
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Top Bar ── */}
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

          {/* Avatar — opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center font-bold text-sm text-violet-600 hover:bg-violet-300 transition"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Profile Drawer */}
      {drawerOpen && (
        <ProfileDrawer
          user={user}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
          navigate={navigate}
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
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]
              ${isActive("/profile") ? "bg-violet-600 text-white" : "bg-violet-200 text-violet-600"}`}>
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