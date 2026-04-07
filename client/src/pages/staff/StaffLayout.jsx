import { useNavigate } from "react-router-dom";
import { Film, LogOut, ScanLine } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const StaffLayout = ({ children }) => {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Film className="text-primary" size={20} />
          <span className="font-heading text-lg font-bold text-gray-900">
            Cine<span className="text-primary">Book</span>
            <span className="text-yellow-600 text-xs font-normal ml-2">Staff</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ScanLine size={13} className="text-primary" />
            <span className="hidden sm:block">Scanner Mode</span>
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">
            👋 {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default StaffLayout;