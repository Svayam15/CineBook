import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Film } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", duration: "" });

  const fetchMovies = async () => {
    try {
      const res = await api.get("/movies");
      setMovies(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovies().catch(console.error); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/movies", { title: form.title, duration: parseInt(form.duration) });
      toast.success("Movie added!");
      setForm({ title: "", duration: "" });
      setShowForm(false);
      await fetchMovies();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel all shows for this movie? This will refund all bookings.")) return;
    setCancelling(id);
    try {
      await api.delete(`/admin/movies/${id}/cancel`);
      toast.success("Movie cancelled!");
      await fetchMovies();
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
          <h1 className="font-heading text-2xl font-bold text-white">Movies</h1>
          <p className="text-muted text-sm mt-1">{movies.length} movies total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} />
          Add Movie
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-lg font-semibold text-white mb-4">Add New Movie</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Movie title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="flex-1 bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            />
            <input
              type="number"
              placeholder="Duration (mins)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              required
              min="1"
              className="w-40 bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {adding ? <Spinner text="Adding..." /> : "Add Movie"}
            </button>
          </form>
        </div>
      )}

      {/* Movies List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16">
          <Film size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted">No movies yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {movies.map((movie) => (
            <div key={movie.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{movie.title}</p>
                <p className="text-muted text-sm">{movie.duration} mins • {movie.shows?.length || 0} shows</p>
              </div>
              <button
                onClick={() => handleCancel(movie.id)}
                disabled={cancelling === movie.id}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50"
              >
                {cancelling === movie.id ? <Spinner /> : <Trash2 size={16} />}
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default Movies;