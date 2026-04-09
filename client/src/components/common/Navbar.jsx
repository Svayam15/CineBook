import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Film, Ticket, Home, ArrowLeft, ChevronRight, Search, X,
  BookMarked, MessageSquare, HelpCircle, FileText, LogOut, MapPin
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const LOCATION = { city: "Mumbai", region: "Maharashtra" };

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
    <Icon size={18} className="text-gray-400 shrink-0" strokeWidth={1.5} />
    <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
    <ChevronRight size={15} className="text-gray-300" />
  </button>
);

// ─── StaffProfile Drawer content ───────────────────────────────────────────────────
const ProfileDrawer = ({ onClose, user, onLogout, navigate }) => {
  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-5 bg-white border-b border-gray-100">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-gray-900">Profile</h2>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="flex items-center gap-4 px-1 py-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-gray-900 font-bold text-sm leading-tight">
              {user?.name} {user?.surname}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>

        <DrawerCard>
          <DrawerRow icon={BookMarked} label="My Bookings" onClick={() => { onClose(); navigate("/my-bookings"); }} />
        </DrawerCard>

        <div className="space-y-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-1">Legal</p>
          <DrawerCard>
            <DrawerRow icon={HelpCircle} label="Terms & Conditions" onClick={() => { onClose(); navigate("/terms"); }} />
            <DrawerRow icon={FileText} label="Privacy Policy" onClick={() => { onClose(); navigate("/privacy"); }} />
          </DrawerCard>
        </div>

        <DrawerCard>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition"
          >
            <LogOut size={18} className="text-red-400 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-sm font-medium text-red-500">Logout</span>
          </button>
        </DrawerCard>
      </div>
    </>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onSearchChange, searchValue }) => {
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

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film size={15} className="text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-gray-900 tracking-tight">
              Cine<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Location — desktop only */}
          <button className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition shrink-0">
            <MapPin size={14} className="text-primary shrink-0" />
            <span className="font-medium">{LOCATION.city}:</span>
            <span className="text-gray-400">{LOCATION.region}</span>
            <ChevronRight size={13} className="text-gray-400 rotate-90" />
          </button>

          {/* Search + avatar */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search movies or theatres..."
                value={searchValue || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="bg-gray-100 text-gray-900 rounded-full pl-4 pr-8 py-2 md:py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/30 transition placeholder:text-gray-400 border-2 border-primary/50 w-44 sm:w-56 md:w-80"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button className="p-2 text-gray-500 hover:text-gray-900 transition shrink-0">
              <Search size={19} strokeWidth={1.8} />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="hidden md:flex w-9 h-9 rounded-full bg-primary/10 items-center justify-center font-bold text-sm text-primary hover:bg-primary/20 transition shrink-0"
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      {/* ✅ Drawer with smooth slide-in animation */}
      <div className={`fixed inset-0 z-40 pointer-events-none`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300
            ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setDrawerOpen(false)}
        />
        {/* Drawer panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full md:w-80 bg-gray-50 flex flex-col shadow-2xl overflow-y-auto transition-transform duration-300 ease-out
            ${drawerOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}`}
        >
          <ProfileDrawer
            user={user}
            onClose={() => setDrawerOpen(false)}
            onLogout={handleLogout}
            navigate={navigate}
          />
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
        <div className="grid grid-cols-3 h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition
              ${isActive("/") ? "text-primary" : "text-gray-400"}`}
          >
            <Home size={21} strokeWidth={isActive("/") ? 2.5 : 1.8} />
            <span>Home</span>
          </Link>
          <Link
            to="/my-bookings"
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition
              ${isActive("/my-bookings") ? "text-primary" : "text-gray-400"}`}
          >
            <Ticket size={21} strokeWidth={isActive("/my-bookings") ? 2.5 : 1.8} />
            <span>My Bookings</span>
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-xs font-medium transition text-gray-400"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
              {initials}
            </div>
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;