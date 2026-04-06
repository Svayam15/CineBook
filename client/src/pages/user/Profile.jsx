import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, LogOut,
  Ticket, FileText, Shield,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const Row = ({ icon: Icon, label, to, onClick, danger }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick();
    if (to) navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-4 px-4 py-4 transition text-left
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
  <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
    {children}
  </div>
);

const Profile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const initials = user
    ? `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-dark pb-24">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-muted hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-base font-bold text-white">Profile</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Avatar + name */}
        <div className="flex items-center gap-4 px-1 py-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">
              {user?.name} {user?.surname}
            </p>
            <p className="text-muted text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Bookings */}
        <CardGroup>
          <Row icon={Ticket} label="View all bookings" to="/my-bookings" />
        </CardGroup>

        {/* More */}
        <div className="space-y-2">
          <p className="text-muted text-xs font-semibold px-1 uppercase tracking-wide">More</p>
          <CardGroup>
            <Row icon={FileText} label="Terms & Conditions" to="/terms" />
            <Row icon={Shield} label="Privacy Policy" to="/privacy" />
          </CardGroup>
        </div>

        {/* Logout */}
        <CardGroup>
          <Row icon={LogOut} label="Logout" onClick={handleLogout} danger />
        </CardGroup>

      </div>
    </div>
  );
};

export default Profile;