import { useNavigate } from "react-router-dom";
import {
  ChevronRight, LogOut,
  HelpCircle, FileText, Shield,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import StaffLayout from "../staff/StaffLayout"; // adjust path

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

const StaffProfile = () => {
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
    <StaffLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Avatar + name + staff badge */}
        <div className="flex items-center gap-4 px-1 py-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-900 font-bold text-lg leading-tight">
                {user?.name} {user?.surname}
              </p>
              <span className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <Shield size={9} strokeWidth={2} />
                Staff
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>

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
    </StaffLayout>
  );
};

export default StaffProfile;