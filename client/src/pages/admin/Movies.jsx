  import { useEffect, useState, useRef } from "react";
  import AdminLayout from "../../components/admin/AdminLayout";
  import api from "../../api/axios";
  import toast from "react-hot-toast";
  import { Plus, Trash2, Film, Pencil, RotateCcw, X, Check, Clock, Upload, ImageIcon } from "lucide-react";
  import Spinner from "../../components/common/Spinner";

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const RATINGS = ["U", "UA", "A", "S"];
  const RATING_LABELS = { U: "U — Universal", UA: "UA — Parental Guidance", A: "A — Adults Only", S: "S — Special" };
  const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali", "Punjabi"];
  const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Biography", "Documentary"];
  const FORMATS = ["2D", "3D", "4D"];

  const RATING_COLORS = {
    U: "bg-green-100 text-green-700 border-green-200",
    UA: "bg-yellow-100 text-yellow-700 border-yellow-200",
    A: "bg-red-100 text-red-700 border-red-200",
    S: "bg-blue-100 text-blue-700 border-blue-200",
  };

  // ─── Multi Select Chips ───────────────────────────────────────────────────────
  const ChipSelect = ({ label, options, selected, onChange, max, required }) => {
    const toggle = (opt) => {
      if (selected.includes(opt)) {
        onChange(selected.filter((s) => s !== opt));
      } else {
        if (max && selected.length >= max) {
          toast.error(`Maximum ${max} selections allowed`);
          return;
        }
        onChange([...selected, opt]);
      }
    };

    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted font-medium">
          {label} {required && <span className="text-red-400">*</span>}
          {max && <span className="text-muted/60 text-xs ml-1">(max {max})</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition
                ${selected.includes(opt)
                  ? "bg-primary border-primary text-white"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-primary/50 hover:text-gray-900"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <p className="text-muted text-xs">Selected: {selected.join(", ")}</p>
        )}
      </div>
    );
  };

  // ─── Poster Upload ────────────────────────────────────────────────────────────
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
        <label className="text-sm text-muted font-medium">Movie Poster <span className="text-red-400">*</span></label>
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden
            ${preview ? "border-primary/40" : "border-gray-200 hover:border-primary/50"}`}
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
      languages: initial?.languages || [],
      formats: initial?.formats || [],
      rating: initial?.rating || "",
      genres: initial?.genres || [],
      description: initial?.description || "",
      releaseDate: initial?.releaseDate ? new Date(initial.releaseDate).toISOString().split("T")[0] : "",
      director: initial?.director || "",
      cast: initial?.cast || "",
    });

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = (e) => {
  e.preventDefault();
  if (!form.posterUrl) return toast.error("Please upload a poster");
  if (!/[a-zA-Z]/.test(form.title))
    return toast.error("Title must contain at least one letter");
  const dur = Number(form.duration);
  if (!Number.isInteger(dur) || dur <= 0)
    return toast.error("Duration must be a whole number (e.g. 148)");

  // AFTER the duration check, BEFORE languages check — add:
const namePattern = /^[a-zA-Z]+(\s[a-zA-Z]+)*(,\s[a-zA-Z]+(\s[a-zA-Z]+)*)*$/;

if (!form.director.trim())
  return toast.error("Director is required");
if (!namePattern.test(form.director.trim()))
  return toast.error("Director: only letter, commas, one space between name and after each comma allowed");

if (!form.cast.trim())
  return toast.error("Cast is required");
if (!namePattern.test(form.cast.trim()))
  return toast.error("Cast: only letters, commas, one space between name and after each comma allowed");

  if (form.languages.length === 0) return toast.error("Select at least one language");
  if (form.genres.length === 0) return toast.error("Select at least one genre");
  if (form.formats.length === 0) return toast.error("Select at least one format (2D/3D/4D)");
  onSubmit({ ...form, duration: dur });
};

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Poster */}
        <PosterUpload value={form.posterUrl} onChange={(url) => set("posterUrl", url)} />

        {/* Title + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="e.g. Dhurandhaar"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Duration (mins) <span className="text-red-400">*</span></label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              required
              min="1"
              max="600"
              step="1"
              placeholder="e.g. 148"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Formats — chip select */}
        <ChipSelect
          label="Available Formats"
          options={FORMATS}
          selected={form.formats}
          onChange={(v) => set("formats", v)}
          required
        />

        {/* Languages — chip select */}
        <ChipSelect
          label="Languages"
          options={LANGUAGES}
          selected={form.languages}
          onChange={(v) => set("languages", v)}
          required
        />

        {/* Genres — chip select, max 4 */}
        <ChipSelect
          label="Genres"
          options={GENRES}
          selected={form.genres}
          onChange={(v) => set("genres", v)}
          max={4}
          required
        />

        {/* Rating + Release Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Rating <span className="text-red-400">*</span></label>
            <select
              value={form.rating}
              onChange={(e) => set("rating", e.target.value)}
              required
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            >
              <option value="">Select rating</option>
              {RATINGS.map((r) => (
                <option key={r} value={r}>{RATING_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Release Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => set("releaseDate", e.target.value)}
              required
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted font-medium">Description <span className="text-red-400">*</span></label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
            rows={3}
            placeholder="Movie synopsis..."
            className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Director + Cast */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Director <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.director}
              onChange={(e) => set("director", e.target.value)}
              placeholder="e.g. SS Rajamouli"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Cast <span className="text-red-400"></span>*</label>
            <input
              type="text"
              value={form.cast}
              onChange={(e) => set("cast", e.target.value)}
              placeholder="e.g. Prabhas, Deepika Padukone"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm placeholder:text-gray-400"
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
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:text-gray-900 px-5 py-2.5 rounded-xl text-sm transition"
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
      <div className="bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-gray-900 font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 text-sm transition">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );

  // ─── Movie Card ───────────────────────────────────────────────────────────────
  const MovieCard = ({ movie, onEdit, onDelete, onRestore, deleting, restoring }) => {
    const isDeleted = movie.isDeleted;

    return (
      <div className={`border rounded-2xl overflow-hidden transition-all ${isDeleted ? "bg-gray-50/80 border-gray-200/40 opacity-60" : "bg-white border-gray-100"}`}>
        <div className="flex gap-4 p-4">
          <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film size={20} className="text-muted" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className={`font-semibold text-sm truncate ${isDeleted ? "text-muted line-through" : "text-gray-900"}`}>
                {movie.title}
              </p>
              {isDeleted && (
                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">Deleted</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {movie.rating && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RATING_COLORS[movie.rating] || "bg-gray-100 text-gray-600"}`}>
                  {movie.rating}
                </span>
              )}
              {movie.formats?.map((f) => (
                <span key={f} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f}</span>
              ))}
              {movie.genres?.slice(0, 2).map((g) => (
                <span key={g} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {movie.languages?.map((l) => (
                <span key={l} className="text-xs bg-golden/10 text-golden px-2 py-0.5 rounded-full">{l}</span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-muted text-xs">
                <Clock size={10} /> {movie.duration} mins
              </span>
              <span className="text-muted text-xs">
                {movie.shows?.length ?? 0} show{movie.shows?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          {isDeleted ? (
            <button
              onClick={() => onRestore(movie.id)}
              disabled={restoring === movie.id}
              className="flex items-center gap-1.5 text-green-400 hover:text-green-300 border border-green-400/20 px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
            >
              {restoring === movie.id ? <Spinner /> : <RotateCcw size={12} />} Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => onEdit(movie)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl text-xs transition"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => onDelete(movie)}
                disabled={deleting === movie.id}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-400/10 px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
              >
                {deleting === movie.id ? <Spinner /> : <Trash2 size={12} />} Delete
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

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900">Movies</h1>
            <p className="text-muted text-sm mt-1">
              {active.length} active{deleted.length > 0 && ` · ${deleted.length} deleted`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {deleted.length > 0 && (
              <button
                onClick={() => setShowDeleted((v) => !v)}
                className={`text-sm px-4 py-2 rounded-xl border transition ${showDeleted ? "border-primary text-primary bg-primary/10" : "border-gray-200 text-gray-600 hover:text-gray-900"}`}
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

        {showForm && !editingMovie && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
            <h2 className="font-heading text-base font-semibold text-gray-900 mb-4">New Movie</h2>
            <MovieForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitting={submitting} />
          </div>
        )}

        {editingMovie && (
          <div className="bg-white border border-primary/30 rounded-2xl p-5 mb-6">
            <h2 className="font-heading text-base font-semibold text-gray-900 mb-4">Edit — {editingMovie.title}</h2>
            <MovieForm
              initial={editingMovie}
              onSubmit={handleEdit}
              onCancel={() => setEditingMovie(null)}
              submitting={submitting}
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl h-36 animate-pulse" />
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