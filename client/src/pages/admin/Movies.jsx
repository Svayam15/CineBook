import { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Film, Pencil, RotateCcw, X, Check, Clock, Upload, ImageIcon } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const RATINGS = ["U", "UA", "A", "S"];
const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali", "Punjabi", "Other"];
const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Biography", "Documentary", "Other"];

const RATING_COLORS = {
  U: "bg-green-500/20 text-green-400 border-green-500/30",
  UA: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  A: "bg-red-500/20 text-red-400 border-red-500/30",
  S: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

// ─── Poster Upload Component ──────────────────────────────────────────────────
const PosterUpload = ({ value, onChange }) => {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Only JPG, PNG and WebP allowed");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be under 5MB");
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        setPreview(data.secure_url);
        onChange(data.secure_url);
        toast.success("Poster uploaded!");
      } else {
        toast.error("Upload failed. Try again.");
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-muted font-medium">Movie Poster *</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden
          ${preview ? "border-primary/40" : "border-border hover:border-primary/50"}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Poster" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition rounded-2xl">
              <Upload size={20} className="text-white mb-1" />
              <span className="text-white text-xs">Change poster</span>
            </div>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner />
            <span className="text-muted text-xs">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            <ImageIcon size={28} />
            <span className="text-sm">Click to upload poster</span>
            <span className="text-xs">JPG, PNG, WebP — max 5MB</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};

// ─── Movie Form ───────────────────────────────────────────────────────────────
const MovieForm = ({ initial, onSubmit, onCancel, submitting }) => {
  const [form, setForm] = useState({
    title: initial?.title || "",
    duration: initial?.duration ? String(initial.duration) : "",
    posterUrl: initial?.posterUrl || "",
    language: initial?.language || "",
    rating: initial?.rating || "",
    genre: initial?.genre || "",
    description: initial?.description || "",
    releaseDate: initial?.releaseDate ? new Date(initial.releaseDate).toISOString().split("T")[0] : "",
    director: initial?.director || "",
    cast: initial?.cast || "",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.posterUrl) return toast.error("Please upload a poster");
    onSubmit({
      ...form,
      duration: parseInt(form.duration),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Poster */}
      <PosterUpload value={form.posterUrl} onChange={(url) => set("posterUrl", url)} />

      {/* Title + Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="e.g. Dhurandhaar"
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Duration (mins) *</label>
          <input
            type="number"
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
            required
            min="1"
            max="600"
            placeholder="e.g. 148"
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
          />
        </div>
      </div>

      {/* Language + Rating + Genre */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Language *</label>
          <select
            value={form.language}
            onChange={(e) => set("language", e.target.value)}
            required
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
          >
            <option value="">Select language</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Rating *</label>
          <select
            value={form.rating}
            onChange={(e) => set("rating", e.target.value)}
            required
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
          >
            <option value="">Select rating</option>
            <option value="U">U — Universal</option>
            <option value="UA">UA — Parental Guidance</option>
            <option value="A">A — Adults Only</option>
            <option value="S">S — Special</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Genre *</label>
          <select
            value={form.genre}
            onChange={(e) => set("genre", e.target.value)}
            required
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
          >
            <option value="">Select genre</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Release Date */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted font-medium">Release Date *</label>
        <input
          type="date"
          value={form.releaseDate}
          onChange={(e) => set("releaseDate", e.target.value)}
          required
          className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted font-medium">Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
          rows={3}
          placeholder="Movie synopsis..."
          className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted resize-none"
        />
      </div>

      {/* Director + Cast (optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Director <span className="text-muted/60">(optional)</span></label>
          <input
            type="text"
            value={form.director}
            onChange={(e) => set("director", e.target.value)}
            placeholder="e.g. SS Rajamouli"
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Cast <span className="text-muted/60">(optional)</span></label>
          <input
            type="text"
            value={form.cast}
            onChange={(e) => set("cast", e.target.value)}
            placeholder="e.g. Prabhas, Deepika"
            className="bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-muted"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
        >
          {submitting ? <Spinner text="Saving..." /> : <><Check size={14} /> {initial ? "Save Changes" : "Add Movie"}</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 border border-border text-muted hover:text-white px-5 py-2.5 rounded-xl text-sm transition"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition">
          Cancel
        </button>
        <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition ${confirmClass}`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Movie Card ───────────────────────────────────────────────────────────────
const MovieCard = ({ movie, onEdit, onDelete, onRestore, deleting, restoring }) => {
  const isDeleted = movie.isDeleted;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isDeleted ? "bg-dark/40 border-border/40 opacity-60" : "bg-card border-border hover:border-border/80"}`}>
      <div className="flex gap-4 p-4">
        {/* Poster */}
        <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-dark border border-border">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film size={20} className="text-muted" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold truncate text-sm ${isDeleted ? "text-muted line-through" : "text-white"}`}>
              {movie.title}
            </p>
            {isDeleted && (
              <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
                Deleted
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {movie.rating && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RATING_COLORS[movie.rating] || "bg-zinc-800 text-zinc-400"}`}>
                {movie.rating}
              </span>
            )}
            {movie.language && (
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                {movie.language}
              </span>
            )}
            {movie.genre && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {movie.genre}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-muted text-xs">
              <Clock size={10} /> {movie.duration} mins
            </span>
            <span className="text-muted text-xs">
              {movie.shows?.length ?? 0} show{movie.shows?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {isDeleted ? (
          <button
            onClick={() => onRestore(movie.id)}
            disabled={restoring === movie.id}
            className="flex items-center gap-1.5 text-green-400 hover:text-green-300 border border-green-400/20 hover:border-green-400/40 px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
          >
            {restoring === movie.id ? <Spinner /> : <RotateCcw size={12} />}
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={() => onEdit(movie)}
              className="flex items-center gap-1.5 text-muted hover:text-white border border-border hover:border-border/60 px-3 py-1.5 rounded-xl text-xs transition"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => onDelete(movie)}
              disabled={deleting === movie.id}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-400/10 hover:border-red-400/30 px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
            >
              {deleting === movie.id ? <Spinner /> : <Trash2 size={12} />}
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
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

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

  useEffect(() => { fetchMovies().catch(console.error); }, []);

  const handleAdd = async (data) => {
    setSubmitting(true);
    try {
      await api.post("/movies", data);
      toast.success("Movie added!");
      setShowForm(false);
      await fetchMovies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add movie");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data) => {
    setSubmitting(true);
    try {
      await api.put(`/movies/${editingMovie.id}`, data);
      toast.success("Movie updated!");
      setEditingMovie(null);
      await fetchMovies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update movie");
    } finally {
      setSubmitting(false);
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
            {active.length} active{deleted.length > 0 && ` · ${deleted.length} deleted`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deleted.length > 0 && (
            <button
              onClick={() => setShowDeleted((v) => !v)}
              className={`text-sm px-4 py-2 rounded-xl border transition ${showDeleted ? "border-primary text-primary bg-primary/10" : "border-border text-muted hover:text-white"}`}
            >
              {showDeleted ? "Hide deleted" : `Show deleted (${deleted.length})`}
            </button>
          )}
          <button
            onClick={() => { setShowForm((v) => !v); setEditingMovie(null); }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Add Movie"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && !editingMovie && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-base font-semibold text-white mb-4">New Movie</h2>
          <MovieForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitting={submitting} />
        </div>
      )}

      {/* Edit Form */}
      {editingMovie && (
        <div className="bg-card border border-primary/30 rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-base font-semibold text-white mb-4">Edit — {editingMovie.title}</h2>
          <MovieForm
            initial={editingMovie}
            onSubmit={handleEdit}
            onCancel={() => setEditingMovie(null)}
            submitting={submitting}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <Film size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">No movies yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onEdit={(m) => { setEditingMovie(m); setShowForm(false); window.scrollTo(0, 0); }}
              onDelete={(m) => setConfirmModal({ movie: m })}
              onRestore={handleRestore}
              deleting={deleting}
              restoring={restoring}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default Movies;