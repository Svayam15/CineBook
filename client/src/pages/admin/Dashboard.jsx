import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { Film, Building2, Tv, BookOpen, Users, IndianRupee } from "lucide-react";

const StatCard = ({ icon, label, value, color }) => {
  const Icon = icon;
  return (
  <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-muted text-sm">{label}</p>
      <p className="text-white text-2xl font-bold font-heading">{value}</p>
    </div>
  </div>
);
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    movies: 0,
    theatres: 0,
    shows: 0,
    bookings: 0,
    users: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [movies, theatres, shows, bookings, users] = await Promise.all([
          api.get("/movies"),
          api.get("/theatres"),
          api.get("/shows"),
          api.get("/admin/bookings?limit=1000"),
          api.get("/admin/users?limit=1000"),
        ]);

        const totalRevenue = bookings.data.bookings
          .filter((b) => b.status === "PAID")
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        setStats({
          movies: movies.data.length,
          theatres: theatres.data.length,
          shows: shows.data.length,
          bookings: bookings.data.pagination.total,
          users: users.data.pagination.total,
          revenue: totalRevenue,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats().catch(console.error);
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Welcome to CineBook Admin Panel</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Film} label="Total Movies" value={stats.movies} color="bg-purple-600" />
          <StatCard icon={Building2} label="Total Theatres" value={stats.theatres} color="bg-blue-600" />
          <StatCard icon={Tv} label="Active Shows" value={stats.shows} color="bg-green-600" />
          <StatCard icon={BookOpen} label="Total Bookings" value={stats.bookings} color="bg-orange-600" />
          <StatCard icon={Users} label="Total Users" value={stats.users} color="bg-pink-600" />
          <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} color="bg-golden" />
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;