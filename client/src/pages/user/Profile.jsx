import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, LogOut,
  BookMarked, HelpCircle, FileText,
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
      className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition"
    >
      <Icon
        size={18}
        className={`${danger ? "text-red-400" : "text-gray-500"} shrink-0`}
        strokeWidth={1.5}
      />
      <span className={`flex-1 text-sm font-medium ${danger ? "text-red-500" : "text-gray-800"}`}>
        {label}
      </span>
      {!danger && <ChevronRight size={16} className="text-gray-400" />}
    </button>
  );
};

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-100">
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

  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-gray-100 pb-24">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Profile</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Avatar + name */}
        <div className="flex items-center gap-4 px-1 py-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-gray-900 font-bold text-lg leading-tight">
              {user?.name} {user?.surname}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Bookings */}
        <Card>
          <Row icon={BookMarked} label="View all bookings" to="/my-bookings" />
        </Card>

        {/* Legal */}
        <div className="space-y-2">
          <p className="text-gray-900 text-sm font-bold px-1">Legal</p>
          <Card>
            <Row icon={HelpCircle} label="Terms & Conditions" to="/terms" />
            <Row icon={FileText}   label="Privacy Policy"     to="/privacy" />
          </Card>
        </div>

        {/* Logout */}
        <Card>
          <Row icon={LogOut} label="Logout" onClick={handleLogout} danger />
        </Card>

      </div>
    </div>
  );
};

export default Profile;