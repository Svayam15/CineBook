import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Tv, Pencil, CalendarClock, X, Check } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const SEAT_COUNTS = [120, 180, 240, 300];
const STATUS_TABS = ["ALL", "UPCOMING", "ONGOING", "COMPLETED"];

const statusBadge = (status) => {
  switch (status) {
    case "UPCOMING":  return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "ONGOING":   return "bg-green-500/10 text-green-400 border border-green-500/20";
    case "COMPLETED": return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    default:          return "";
  }
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition">Cancel</button>
        <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition ${confirmClass}`}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

// ─── Update Modal ─────────────────────────────────────────────────────────────
const UpdateModal = ({ show, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    showType: show.showType,
    regularPrice: String(show.regularPrice),
    goldenPrice: show.goldenPrice ? String(show.goldenPrice) : "",
  });

  // Available formats from the movie
  const availableFormats = show.movie?.formats || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Edit Show</h3>
          <button onClick={onClose} className="text-muted hover:text-white transition"><X size={18} /></button>
        </div>
        <p className="text-muted text-xs mb-4 bg-dark border border-border rounded-xl px-4 py-2.5">
          Only show type and prices can be edited. The show must have no bookings.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Show Type</label>
            <select
              value={form.showType}
              onChange={(e) => setForm({ ...form, showType: e.target.value })}
              className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            >
              {availableFormats.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Regular Price (₹)</label>
            <input
              type="number" min="1"
              value={form.regularPrice}
              onChange={(e) => setForm({ ...form, regularPrice: e.target.value })}
              className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            />
          </div>
          {show.hasGoldenSeats && (
            <div>
              <label className="block text-sm text-muted mb-1.5">Golden Price (₹)</label>
              <input
                type="number" min="1"
                value={form.goldenPrice}
                onChange={(e) => setForm({ ...form, goldenPrice: e.target.value })}
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition">Cancel</button>
          <button
            onClick={() => onSave(show.id, {
              showType: form.showType,
              regularPrice: parseFloat(form.regularPrice),
              ...(show.hasGoldenSeats && form.goldenPrice ? { goldenPrice: parseFloat(form.goldenPrice) } : {}),
            })}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? <Spinner /> : <Check size={14} />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
const RescheduleModal = ({ show, onSave, onClose, saving }) => {
  const [startTime, setStartTime] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Reschedule Show</h3>
          <button onClick={onClose} className="text-muted hover:text-white transition"><X size={18} /></button>
        </div>
        <p className="text-muted text-xs mb-4 bg-dark border border-border rounded-xl px-4 py-2.5">
          All paid booking holders will be notified by email automatically.
        </p>
        <div>
          <label className="block text-sm text-muted mb-1.5">New Start Time (IST)</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition">Cancel</button>
          <button
            onClick={() => {
              if (!startTime) return toast.error("Please select a new start time");
              const date = new Date(startTime);
              const istOffset = 5.5 * 60 * 60 * 1000;
              const startTimeIST = new Date(date.getTime() + istOffset).toISOString().replace("Z", "+05:30");
              onSave(show.id, startTimeIST);
            }}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? <Spinner /> : <CalendarClock size={14} />} Reschedule
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Show Row ─────────────────────────────────────────────────────────────────
const ShowRow = ({ show, onEdit, onReschedule, onCancel, cancelling }) => {
  const canEdit = show.status === "UPCOMING";

  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-medium">{show.movie?.title}</p>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{show.showType}</span>
          <span className="text-xs bg-golden/10 text-golden px-2 py-0.5 rounded-full">{show.language}</span>
          {show.hasGoldenSeats && (
            <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">Golden</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(show.status)}`}>
            {show.status}
          </span>
          {!show.isActive && (
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Cancelled</span>
          )}
        </div>
        <p className="text-muted text-sm mt-1 truncate">
          {show.theatre?.name} &nbsp;·&nbsp; {show.startTime} &nbsp;·&nbsp; {show.totalSeats} seats &nbsp;·&nbsp; ₹{show.regularPrice}
          {show.hasGoldenSeats && ` · ₹${show.goldenPrice} golden`}
        </p>
      </div>

      {canEdit && show.isActive ? (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onEdit(show)} className="flex items-center gap-1.5 text-muted hover:text-white border border-border px-3 py-1.5 rounded-xl text-sm transition">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={() => onReschedule(show)} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 border border-blue-400/20 px-3 py-1.5 rounded-xl text-sm transition">
            <CalendarClock size={13} /> Reschedule
          </button>
          <button
            onClick={() => onCancel(show)}
            disabled={cancelling === show.id}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-400/10 px-3 py-1.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {cancelling === show.id ? <Spinner /> : <Trash2 size={13} />} Cancel
          </button>
        </div>
      ) : (
        <span className="text-zinc-600 text-xs shrink-0">
          {!show.isActive ? "Cancelled" : "No actions"}
        </span>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Shows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [reschedulingShow, setReschedulingShow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [form, setForm] = useState({
    movieId: "", theatreId: "", startTime: "",
    totalSeats: 120, showType: "", language: "", regularPrice: "",
    hasGoldenSeats: false, goldenSeats: "", goldenPrice: "",
  });

  // ✅ Derived — available formats/languages from selected movie
  const selectedMovie = movies.find((m) => m.id === parseInt(form.movieId));
  const availableFormats = selectedMovie?.formats || [];
  const availableLanguages = selectedMovie?.languages || [];

  // ✅ Auto-select first format and language when movie changes
  const handleMovieChange = (movieId) => {
    const movie = movies.find((m) => m.id === parseInt(movieId));
    setForm((f) => ({
      ...f,
      movieId,
      showType: movie?.formats?.[0] || "",
      language: movie?.languages?.[0] || "",
    }));
  };

  const fetchData = async () => {
    try {
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get("/shows/admin/all?limit=1000"),
        api.get("/movies"),
        api.get("/theatres"),
      ]);
      setShows(showsRes.data.shows);
      setMovies(moviesRes.data.filter((m) => !m.isDeleted));
      setTheatres(theatresRes.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData().catch(console.error); }, []);

  const toIST = (localDatetimeStr) => {
    const date = new Date(localDatetimeStr);
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + istOffset).toISOString().replace("Z", "+05:30");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.showType) return toast.error("Select a show type");
    if (!form.language) return toast.error("Select a language");
    setAdding(true);
    try {
      await api.post("/shows", {
        movieId: parseInt(form.movieId),
        theatreId: parseInt(form.theatreId),
        startTime: toIST(form.startTime),
        totalSeats: parseInt(form.totalSeats),
        showType: form.showType,
        language: form.language,
        regularPrice: parseFloat(form.regularPrice),
        hasGoldenSeats: form.hasGoldenSeats,
        goldenSeats: form.hasGoldenSeats ? parseInt(form.goldenSeats) : undefined,
        goldenPrice: form.hasGoldenSeats ? parseFloat(form.goldenPrice) : undefined,
      });
      toast.success("Show created!");
      setShowForm(false);
      setForm({ movieId: "", theatreId: "", startTime: "", totalSeats: 120, showType: "", language: "", regularPrice: "", hasGoldenSeats: false, goldenSeats: "", goldenPrice: "" });
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/shows/${id}`, data);
      toast.success("Show updated!");
      setEditingShow(null);
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async (id, startTimeIST) => {
    setSaving(true);
    try {
      await api.patch(`/shows/${id}/reschedule`, { startTime: startTimeIST });
      toast.success("Show rescheduled! Users notified.");
      setReschedulingShow(null);
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirm = async () => {
    const show = confirmModal.show;
    setConfirmModal(null);
    setCancelling(show.id);
    try {
      await api.delete(`/shows/${show.id}`);
      toast.success("Show cancelled. Bookings refunded.");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setCancelling(null);
    }
  };

  const filteredShows = activeTab === "ALL" ? shows : shows.filter((s) => s.status === activeTab);
  const countByStatus = (tab) => tab === "ALL" ? shows.length : shows.filter((s) => s.status === tab).length;

  return (
    <AdminLayout>
      {confirmModal && (
        <ConfirmModal
          title="Cancel Show?"
          message={`Cancel "${confirmModal.show.movie?.title}"? All bookings will be refunded and users notified.`}
          confirmLabel="Cancel Show"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={handleCancelConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {editingShow && (
        <UpdateModal show={editingShow} onSave={handleUpdate} onClose={() => setEditingShow(null)} saving={saving} />
      )}
      {reschedulingShow && (
        <RescheduleModal show={reschedulingShow} onSave={handleReschedule} onClose={() => setReschedulingShow(null)} saving={saving} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Shows</h1>
          <p className="text-muted text-sm mt-1">{shows.length} total shows</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Close" : "Add Show"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-base font-semibold text-white mb-4">Create New Show</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Movie */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Movie</label>
              <select
                value={form.movieId}
                onChange={(e) => handleMovieChange(e.target.value)}
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                <option value="">Select movie</option>
                {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>

            {/* Theatre */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Theatre</label>
              <select
                value={form.theatreId}
                onChange={(e) => setForm({ ...form, theatreId: e.target.value })}
                required
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                <option value="">Select theatre</option>
                {theatres.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.location}</option>)}
              </select>
            </div>

            {/* Start Time */}
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

            {/* Show Type — auto from movie formats */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Show Type
                {selectedMovie && <span className="text-muted/60 text-xs ml-1">(from movie formats)</span>}
              </label>
              <select
                value={form.showType}
                onChange={(e) => setForm({ ...form, showType: e.target.value })}
                required
                disabled={availableFormats.length === 0}
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm disabled:opacity-50"
              >
                {availableFormats.length === 0
                  ? <option value="">Select a movie first</option>
                  : availableFormats.map((f) => <option key={f} value={f}>{f}</option>)
                }
              </select>
            </div>

            {/* Language — auto from movie languages */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Language
                {selectedMovie && <span className="text-muted/60 text-xs ml-1">(from movie languages)</span>}
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                required
                disabled={availableLanguages.length === 0}
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm disabled:opacity-50"
              >
                {availableLanguages.length === 0
                  ? <option value="">Select a movie first</option>
                  : availableLanguages.map((l) => <option key={l} value={l}>{l}</option>)
                }
              </select>
            </div>

            {/* Total Seats */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Total Seats</label>
              <select
                value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              >
                {SEAT_COUNTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Regular Price */}
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
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.hasGoldenSeats ? "bg-yellow-400 border-yellow-400" : "border-zinc-600"}`}>
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
                    type="number" placeholder="Min 30" value={form.goldenSeats}
                    onChange={(e) => setForm({ ...form, goldenSeats: e.target.value })}
                    required min="30"
                    className="w-full bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1.5">Golden Price (₹)</label>
                  <input
                    type="number" placeholder="Must be > regular price" value={form.goldenPrice}
                    onChange={(e) => setForm({ ...form, goldenPrice: e.target.value })}
                    required min="1"
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

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${activeTab === tab ? "bg-primary text-white" : "bg-card border border-border text-muted hover:text-white"}`}
          >
            {tab === "ALL" ? `All (${shows.length})` : `${tab} (${countByStatus(tab)})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="text-center py-16">
          <Tv size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">No {activeTab !== "ALL" ? activeTab.toLowerCase() : ""} shows</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredShows.map((show) => (
            <ShowRow
              key={show.id}
              show={show}
              onEdit={setEditingShow}
              onReschedule={setReschedulingShow}
              onCancel={(s) => setConfirmModal({ show: s })}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default Shows;