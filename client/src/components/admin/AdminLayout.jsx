import { NavLink, useNavigate } from "react-router-dom";
import { Film, Theater, Tv, BookOpen, Users, LayoutDashboard, LogOut, Ticket, ScanLine } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/movies", label: "Movies", icon: Film },
  { path: "/admin/theatres", label: "Theatres", icon: Theater },
  { path: "/admin/shows", label: "Shows", icon: Tv },
  { path: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/window-booking", label: "Window Booking", icon: Ticket },
  { path: "/admin/scanner", label: "Scanner", icon: ScanLine }, // ✅ NEW
];

const AdminLayout = ({ children }) => {
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
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Film className="text-primary" size={22} />
          <span className="font-heading text-lg md:text-xl font-bold text-gray-900">
            Cine<span className="text-primary">Book</span>
            <span className="text-gray-500 text-xs md:text-sm font-normal ml-2">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs md:text-sm text-gray-500 hidden sm:block">
            👋 {user?.name} {user?.surname}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-red-500 transition"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 p-4 flex-col gap-1 sticky top-16 h-[calc(100vh-64px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                  ${isActive ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all
                  ${isActive ? "text-primary" : "text-gray-400"}`
                }
              >
                <Icon size={20} />
                <span className="text-[9px] font-medium leading-tight text-center">
                  {item.label === "Window Booking" ? "Window" : item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;