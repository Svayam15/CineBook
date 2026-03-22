import { NavLink, useNavigate } from "react-router-dom";
import { Film, Theater, Tv, BookOpen, Users, LayoutDashboard, LogOut, Ticket } from "lucide-react";
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
    <div className="min-h-screen bg-dark flex flex-col">

      {/* Top Navbar */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Film className="text-primary" size={24} />
          <span className="font-heading text-xl font-bold text-white">
            Cine<span className="text-primary">Book</span>
            <span className="text-muted text-sm font-normal ml-2">Admin</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            👋 {user?.name} {user?.surname}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted hover:text-red-400 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="w-56 bg-card border-r border-border p-4 flex flex-col gap-1 sticky top-16 h-[calc(100vh-64px)]">
          {navItems.map((item) => {
              const Icon = item.icon;
              return (
  <NavLink
    key={item.path}
    to={item.path}
    end={item.exact}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
      ${isActive
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted hover:bg-white/5 hover:text-white"
      }`
    }
  >
    <Icon size={18} />
    {item.label}
  </NavLink> );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;