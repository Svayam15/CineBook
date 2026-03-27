import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Film, Pencil, RotateCcw, X, Check, Clock } from "lucide-react";
import Spinner from "../../components/common/Spinner";

// ─── Confirmation Modal ───────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition ${confirmClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Inline Edit Row ──────────────────────────────────────────────────────────
const EditRow = ({ movie, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({ title: movie.title, duration: String(movie.duration) });

  return (
    <div className="bg-card border border-primary/40 rounded-2xl px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="flex-1 bg-dark border border-border text-white rounded-xl px-4 py-2 outline-none focus:border-primary text-sm"
        placeholder="Movie title"
      />
      <input
        type="number"
        value={form.duration}
        onChange={(e) => setForm({ ...form, duration: e.target.value })}
        className="w-36 bg-dark border border-border text-white rounded-xl px-4 py-2 outline-none focus:border-primary text-sm"
        placeholder="Duration (mins)"
        min="1"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(movie.id, { title: form.title, duration: parseInt(form.duration) })}
          disabled={saving}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
        >
          {saving ? <Spinner /> : <Check size={14} />}
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 border border-border text-muted hover:text-white px-4 py-2 rounded-xl text-sm transition"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Movie Row ────────────────────────────────────────────────────────────────
const MovieRow = ({ movie, onEdit, onDelete, onRestore, deleting, restoring }) => {
  const isDeleted = movie.isDeleted;

  return (
    <div
      className={`border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 transition-all ${
        isDeleted
          ? "bg-dark/40 border-border/40 opacity-60"
          : "bg-card border-border hover:border-border/80"
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDeleted ? "bg-dark" : "bg-primary/10"
          }`}
        >
          <Film size={16} className={isDeleted ? "text-muted" : "text-primary"} />
        </div>
        <div className="min-w-0">
          <p className={`font-medium truncate ${isDeleted ? "text-muted line-through" : "text-white"}`}>
            {movie.title}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-muted text-xs">
              <Clock size={11} />
              {movie.duration} mins
            </span>
            <span className="text-muted text-xs">
              {movie.shows?.length ?? 0} show{movie.shows?.length !== 1 ? "s" : ""}
            </span>
            {isDeleted && (
              <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                Deleted
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isDeleted ? (
          <button
            onClick={() => onRestore(movie.id)}
            disabled={restoring === movie.id}
            className="flex items-center gap-1.5 text-green-400 hover:text-green-300 border border-green-400/20 hover:border-green-400/40 px-3 py-1.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {restoring === movie.id ? <Spinner /> : <RotateCcw size={14} />}
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={() => onEdit(movie)}
              className="flex items-center gap-1.5 text-muted hover:text-white border border-border hover:border-border/60 px-3 py-1.5 rounded-xl text-sm transition"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={() => onDelete(movie)}
              disabled={deleting === movie.id}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-400/10 hover:border-red-400/30 px-3 py-1.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {deleting === movie.id ? <Spinner /> : <Trash2 size={14} />}
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", duration: "" });
  const [adding, setAdding] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { movie }

  const fetchMovies = async () => {
    try {
      const res = await api.get("/movies");
      setMovies(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch movies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies().catch(console.error);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const dur = parseInt(form.duration);
    if (!form.title.trim()) return toast.error("Title is required");
    if (!dur || dur <= 0) return toast.error("Duration must be greater than 0");
    if (dur > 600) return toast.error("Duration cannot exceed 600 minutes");

    setAdding(true);
    try {
      await api.post("/movies", { title: form.title.trim(), duration: dur });
      toast.success("Movie added!");
      setForm({ title: "", duration: "" });
      setShowForm(false);
      await fetchMovies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add movie");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/movies/${id}`, data);
      toast.success("Movie updated!");
      setEditingMovie(null);
      await fetchMovies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update movie");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const movie = confirmModal.movie;
    setConfirmModal(null);
    setDeleting(movie.id);
    try {
      await api.delete(`/movies/${movie.id}`);
      toast.success("Movie deleted");
      await fetchMovies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete movie");
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (id) => {
    setRestoring(id);
    try {
      await api.patch(`/movies/${id}/restore`);
      toast.success("Movie restored!");
      await fetchMovies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to restore movie");
    } finally {
      setRestoring(null);
    }
  };

  const active = movies.filter((m) => !m.isDeleted);
  const deleted = movies.filter((m) => m.isDeleted);
  const displayed = showDeleted ? movies : active;

  return (
    <AdminLayout>
      {confirmModal && (
        <ConfirmModal
          title="Delete Movie?"
          message={`"${confirmModal.movie.title}" will be soft-deleted. You can restore it later.`}
          confirmLabel="Delete"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Movies</h1>
          <p className="text-muted text-sm mt-1">
            {active.length} active
            {deleted.length > 0 && ` · ${deleted.length} deleted`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deleted.length > 0 && (
            <button
              onClick={() => setShowDeleted((v) => !v)}
              className={`text-sm px-4 py-2 rounded-xl border transition ${
                showDeleted
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted hover:text-white"
              }`}
            >
              {showDeleted ? "Hide deleted" : `Show deleted (${deleted.length})`}
            </button>
          )}
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setEditingMovie(null);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Add Movie"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-base font-semibold text-white mb-4">New Movie</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Movie title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="flex-1 bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
            />
            <input
              type="number"
              placeholder="Duration (mins)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              required
              min="1"
              max="600"
              className="w-44 bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {adding ? <Spinner text="Adding..." /> : "Add Movie"}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-[68px] animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <Film size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">No movies yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((movie) =>
            editingMovie?.id === movie.id ? (
              <EditRow
                key={movie.id}
                movie={movie}
                onSave={handleSaveEdit}
                onCancel={() => setEditingMovie(null)}
                saving={saving}
              />
            ) : (
              <MovieRow
                key={movie.id}
                movie={movie}
                onEdit={(m) => {
                  setEditingMovie(m);
                  setShowForm(false);
                }}
                onDelete={(m) => setConfirmModal({ movie: m })}
                onRestore={handleRestore}
                deleting={deleting}
                restoring={restoring}
              />
            )
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default Movies;