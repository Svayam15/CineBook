import { useNavigate } from "react-router-dom";
import { LogOut, HelpCircle, FileText, Shield } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import StaffLayout from "./StaffLayout"; // adjust path if needed

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-100">
    {children}
  </div>
);

const Row = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
  >
    <Icon
      size={18}
      className={danger ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"}
      strokeWidth={1.5}
    />
    <span className={`flex-1 text-sm font-medium ${danger ? "text-red-500" : "text-gray-800"}`}>
      {label}
    </span>
  </button>
);

const StaffProfile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const initials = user ? `${user.name?.[0] ?? ""}`.toUpperCase() : "?";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <StaffLayout>
      {/* Fix 3: animate-in on mount */}
      <div
        className="max-w-xl mx-auto space-y-5 py-2 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ animation: "profileIn 0.25s ease-out both" }}
      >
        <style>{`
          @keyframes profileIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 px-1 py-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-900 font-bold text-lg leading-tight">
                {user?.name} {user?.surname}
              </p>
              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                <Shield size={9} />
                Staff
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-2">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-1">Legal</p>
          <Card>
            <Row icon={HelpCircle} label="Terms & Conditions" onClick={() => navigate("/terms")} />
            <Row icon={FileText}   label="Privacy Policy"     onClick={() => navigate("/privacy")} />
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