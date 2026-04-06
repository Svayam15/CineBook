import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Building2, X } from "lucide-react";
import Spinner from "../../components/common/Spinner";

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ theatre, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <span className="font-heading font-semibold text-white">Delete Theatre?</span>
        <button onClick={onClose} className="text-muted hover:text-white transition">
          <X size={18} />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-muted text-sm">
          Are you sure you want to delete{" "}
          <span className="text-white font-semibold">"{theatre.name}"</span>?
          This will also delete all associated shows.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:text-white text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium transition disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Theatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // ✅ replaces window.confirm
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });

  const fetchTheatres = async () => {
    try {
      const res = await api.get("/theatres");
      setTheatres(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTheatres().catch(console.error); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/theatres", form);
      toast.success("Theatre added!");
      setForm({ name: "", location: "" });
      setShowForm(false);
      await fetchTheatres();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await api.delete(`/theatres/${deleteTarget.id}`);
      toast.success("Theatre deleted!");
      setDeleteTarget(null);
      await fetchTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>

      {/* ✅ Custom delete modal */}
      {deleteTarget && (
        <DeleteModal
          theatre={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={!!deleting}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Theatres</h1>
          <p className="text-muted text-sm mt-1">{theatres.length} theatres total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} />
          Add Theatre
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-lg font-semibold text-white mb-4">Add New Theatre</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Theatre name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="flex-1 bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            />
            <input
              type="text"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
              className="flex-1 bg-dark border border-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {adding ? <Spinner text="Adding..." /> : "Add Theatre"}
            </button>
          </form>
        </div>
      )}

      {/* Theatres List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : theatres.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted">No theatres yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {theatres.map((theatre) => (
            <div key={theatre.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{theatre.name}</p>
                <p className="text-muted text-sm">📍 {theatre.location}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(theatre)}
                disabled={deleting === theatre.id}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50"
              >
                {deleting === theatre.id ? <Spinner /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default Theatres;