import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import {
  Film, Building2, Tv, BookOpen, Users, IndianRupee,
  Clock, CheckCircle, CalendarCheck, TrendingUp,
} from "lucide-react";

const StatCard = ({ icon, label, value, color, textColor }) => {
  const Icon = icon;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className={textColor || "text-white"} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs sm:text-sm truncate">{label}</p>
        <p className="text-gray-900 text-xl sm:text-2xl font-bold font-heading leading-tight">{value}</p>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="text-muted text-xs font-semibold uppercase tracking-widest mb-3 mt-6">{children}</p>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Welcome to CineBook Admin Panel</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <p className="text-muted text-sm">Failed to load stats.</p>
      ) : (
        <>
          {/* ── Today ── */}
          <SectionLabel>Today</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={CalendarCheck}
              label="Bookings Today"
              value={fmt(stats.todayBookings)}
              color="bg-primary/20 border border-primary/30"
              textColor="text-primary"
            />
            <StatCard
              icon={TrendingUp}
              label="Revenue Today"
              value={`₹${fmt(stats.todayRevenue)}`}
              color="bg-golden/20 border border-golden/30"
              textColor="text-golden"
            />
          </div>

          {/* ── Overall ── */}
          <SectionLabel>Overall</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={fmt(stats.totalUsers)}
              color="bg-primary/20 border border-primary/30"
              textColor="text-primary"
            />
            <StatCard
              icon={BookOpen}
              label="Total Bookings"
              value={fmt(stats.totalBookings)}
              color="bg-golden/20 border border-golden/30"
              textColor="text-golden"
            />
            <StatCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${fmt(stats.totalRevenue)}`}
              color="bg-golden/20 border border-golden/30"
              textColor="text-golden"
            />
            <StatCard
              icon={Film}
              label="Total Movies"
              value={fmt(stats.totalMovies)}
              color="bg-primary/20 border border-primary/30"
              textColor="text-primary"
            />
            <StatCard
              icon={Building2}
              label="Total Theatres"
              value={fmt(stats.totalTheatres)}
              color="bg-primary/10 border border-primary/20"
              textColor="text-primary"
            />
          </div>

          {/* ── Shows ── */}
          <SectionLabel>Shows</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Tv}
              label="Upcoming"
              value={fmt(stats.upcomingShows)}
              color="bg-primary/20 border border-primary/30"
              textColor="text-primary"
            />
            <StatCard
              icon={Clock}
              label="Ongoing"
              value={fmt(stats.ongoingShows)}
              color="bg-golden/20 border border-golden/30"
              textColor="text-golden"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={fmt(stats.completedShows)}
              color="bg-gray-100 border border-gray-200"
              textColor="text-gray-500"
            />
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;