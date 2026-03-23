import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Tv } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const SEAT_COUNTS = [120, 180, 240, 300]; // ← updated
const SHOW_TYPES = ["2D", "3D", "4D"];

const Shows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    movieId: "",
    theatreId: "",
    startTime: "",
    totalSeats: 120,
    showType: "2D",
    regularPrice: "",
    hasGoldenSeats: false,
    goldenSeats: "",
    goldenPrice: "",
  });

  const fetchData = async () => {
    try {
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get("/shows"),
        api.get("/movies"),
        api.get("/theatres"),
      ]);
      setShows(showsRes.data);
      setMovies(moviesRes.data);
      setTheatres(theatresRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData().catch(console.error); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const date = new Date(form.startTime);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(date.getTime() + istOffset);
      const startTimeIST = istDate.toISOString().replace("Z", "+05:30");

      await api.post("/shows", {
        movieId: parseInt(form.movieId),
        theatreId: parseInt(form.theatreId),
        startTime: startTimeIST,
        totalSeats: parseInt(form.totalSeats),
        showType: form.showType,
        regularPrice: parseFloat(form.regularPrice),
        hasGoldenSeats: form.hasGoldenSeats,
        goldenSeats: form.hasGoldenSeats ? parseInt(form.goldenSeats) : undefined,
        goldenPrice: form.hasGoldenSeats ? parseFloat(form.goldenPrice) : undefined,
      });
      toast.success("Show created!");
      setShowForm(false);
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this show? All bookings will be refunded.")) return;
    setCancelling(id);
    try {
      await api.delete(`/admin/shows/${id}/cancel`);
      toast.success("Show cancelled!");
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Shows</h1>
          <p className="text-muted text-sm mt-1">{shows.length} active shows</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} />
          Add Show
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-lg font-semibold text-white mb-4">Create New Show</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm text-muted mb-1.5">Movie</label>
              <select
                value={form.movieId}
                onChange={(e) => setForm({ ...form, movieId: e.target.value })}
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                <option value="">Select movie</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">Theatre</label>
              <select
                value={form.theatreId}
                onChange={(e) => setForm({ ...form, theatreId: e.target.value })}
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                <option value="">Select theatre</option>
                {theatres.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">Start Time (IST)</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">Show Type</label>
              <select
                value={form.showType}
                onChange={(e) => setForm({ ...form, showType: e.target.value })}
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                {SHOW_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">Total Seats</label>
              <select
                value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                {SEAT_COUNTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">Regular Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 200"
                value={form.regularPrice}
                onChange={(e) => setForm({ ...form, regularPrice: e.target.value })}
                required
                min="1"
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
            </div>

            {/* Golden Seats Toggle */}
            <div className="sm:col-span-2">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setForm({ ...form, hasGoldenSeats: !form.hasGoldenSeats })}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                  ${form.hasGoldenSeats ? "bg-golden border-golden" : "border-zinc-600"}`}
                >
                  {form.hasGoldenSeats && (
                    <svg className="w-3 h-3 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-muted">Has Golden Seats?</span>
              </div>
            </div>

            {form.hasGoldenSeats && (
              <>
                <div>
                  <label className="block text-sm text-muted mb-1.5">Golden Seats Count</label>
                  <input
                    type="number"
                    placeholder="Min 30"
                    value={form.goldenSeats}
                    onChange={(e) => setForm({ ...form, goldenSeats: e.target.value })}
                    required
                    min="30"
                    className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1.5">Golden Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Must be > regular price"
                    value={form.goldenPrice}
                    onChange={(e) => setForm({ ...form, goldenPrice: e.target.value })}
                    required
                    min="1"
                    className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={adding}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {adding ? <Spinner text="Creating..." /> : "Create Show"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-card border border-border text-muted hover:text-white px-6 py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shows List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div className="text-center py-16">
          <Tv size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted">No active shows</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shows.map((show) => {
            const hasStarted = new Date(show.rawStartTime) <= new Date();
            return (
              <div
                key={show.id}
                className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium">{show.movie?.title}</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{show.showType}</span>
                    {show.hasGoldenSeats && (
                      <span className="text-xs bg-golden/10 text-golden px-2 py-0.5 rounded-full">Golden</span>
                    )}
                    {hasStarted && (
                      <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                        Started
                      </span>
                    )}
                  </div>
                  <p className="text-muted text-sm mt-0.5 truncate">
                    🏛️ {show.theatre?.name} • 🕐 {show.startTime} • 💺 {show.totalSeats} seats • ₹{show.regularPrice}
                  </p>
                </div>

                {hasStarted ? (
                  <span className="text-zinc-600 text-xs shrink-0">Cannot cancel</span>
                ) : (
                  <button
                    onClick={() => handleCancel(show.id)}
                    disabled={cancelling === show.id}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50 shrink-0"
                  >
                    {cancelling === show.id ? <Spinner /> : <Trash2 size={16} />}
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default Shows;