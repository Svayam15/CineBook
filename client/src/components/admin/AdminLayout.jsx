import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Film, Theater, Tv, BookOpen, Users, LayoutDashboard,
  LogOut, Ticket, ScanLine, ArrowLeft, ChevronRight,
  HelpCircle, FileText, Shield, UserCircle
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const navItems = [
  { path: "/admin",                label: "Dashboard",      icon: LayoutDashboard, exact: true },
  { path: "/admin/movies",         label: "Movies",         icon: Film },
  { path: "/admin/theatres",       label: "Theatres",       icon: Theater },
  { path: "/admin/shows",          label: "Shows",          icon: Tv },
  { path: "/admin/bookings",       label: "Bookings",       icon: BookOpen },
  { path: "/admin/users",          label: "Users",          icon: Users },
  { path: "/admin/window-booking", label: "Window Booking", icon: Ticket },
  { path: "/admin/scanner",        label: "Scanner",        icon: ScanLine },
];

// Trimmed list for mobile tab bar — 4 key items + StaffProfile
const mobileNavItems = [
  { path: "/admin",           label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/movies",    label: "Movies",    icon: Film },
  { path: "/admin/theatres",  label: "Theatres",  icon: Theater },
  { path: "/admin/shows",     label: "Shows",     icon: Tv },
  { path: "/admin/profile",   label: "StaffProfile",   icon: UserCircle },
];

// ─── Drawer sub-components ────────────────────────────────────────────────────
const DrawerCard = ({ children }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-100">
    {children}
  </div>
);

const DrawerRow = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition"
  >
    <Icon
      size={18}
      className={danger ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"}
      strokeWidth={1.5}
    />
    <span className={`flex-1 text-sm font-medium ${danger ? "text-red-500" : "text-gray-800"}`}>
      {label}
    </span>
    {!danger && <ChevronRight size={15} className="text-gray-300" />}
  </button>
);

// ─── Admin StaffProfile Drawer (desktop only) ─────────────────────────────────────
const AdminProfileDrawer = ({ user, onClose, onLogout, navigate }) => {
  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-5 bg-white border-b border-gray-100">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-gray-900">Admin Profile</h2>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 px-1 py-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-bold text-sm leading-tight">
                {user?.name} {user?.surname}
              </p>
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                <Shield size={9} />
                Admin
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Quick nav links */}
        <DrawerCard>
          {navItems.slice(0, 4).map(({ path, label, icon: Icon }) => (
            <DrawerRow
              key={path}
              icon={Icon}
              label={label}
              onClick={() => { onClose(); navigate(path); }}
            />
          ))}
        </DrawerCard>

        {/* Legal */}
        <div className="space-y-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-1">Legal</p>
          <DrawerCard>
            <DrawerRow icon={HelpCircle} label="Terms & Conditions" onClick={() => { onClose(); navigate("/terms"); }} />
            <DrawerRow icon={FileText}   label="Privacy Policy"     onClick={() => { onClose(); navigate("/privacy"); }} />
          </DrawerCard>
        </div>

        {/* Logout */}
        <DrawerCard>
          <DrawerRow icon={LogOut} label="Logout" onClick={onLogout} danger />
        </DrawerCard>
      </div>
    </>
  );
};

// ─── AdminLayout ──────────────────────────────────────────────────────────────
const AdminLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setDrawerOpen(false);
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Sticky header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-6">

          {/* Logo */}
          <NavLink to="/admin" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film size={15} className="text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-gray-900 tracking-tight">
              Cine<span className="text-primary">Book</span>
            </span>
          </NavLink>

          {/* Admin badge — desktop */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              <Shield size={11} strokeWidth={2} />
              Admin Console
            </span>
          </div>

          <div className="flex-1" />

          {/* Avatar — desktop only, opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="hidden md:flex w-9 h-9 rounded-full bg-primary/10 items-center justify-center font-bold text-sm text-primary hover:bg-primary/20 transition shrink-0"
          >
            {initials}
          </button>

          {/* Mobile: badge only (profile is in tab bar) */}
          <div className="flex md:hidden items-center">
            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <Shield size={9} strokeWidth={2} />
              Admin
            </span>
          </div>

        </div>
      </header>

      {/* ── StaffProfile Drawer — desktop only ── */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300
            ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-80 bg-gray-50 flex flex-col shadow-2xl overflow-y-auto transition-transform duration-300 ease-out
            ${drawerOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}`}
        >
          <AdminProfileDrawer
            user={user}
            onClose={() => setDrawerOpen(false)}
            onLogout={handleLogout}
            navigate={navigate}
          />
        </div>
      </div>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1">

        {/* Desktop sidebar — full navItems */}
        <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 p-4 flex-col gap-1 sticky top-16 h-[calc(100vh-64px)]">
          {navItems.map(({ path, label, icon: Icon, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                ${isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </aside>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar — mobileNavItems only ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex items-center justify-around">
          {mobileNavItems.map(({ path, label, icon: Icon, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all
                ${isActive ? "text-primary" : "text-gray-400"}`
              }
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium leading-tight text-center">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
};

export default AdminLayout;