import { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function Theatres() {
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState({ name: "", location: "" });
  const [editTheatre, setEditTheatre] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTheatres = async () => {
    try {
      const res = await axios.get("/theatres");
      setTheatres(res.data);
    } catch {
      setError("Failed to fetch theatres");
    }
  };

  useEffect(() => { fetchTheatres(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      setLoading(true);
      await axios.post("/theatres", form);
      setSuccess("Theatre created successfully");
      setForm({ name: "", location: "" });
      await fetchTheatres();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create theatre");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      setLoading(true);
      await axios.put(`/theatres/${editTheatre.id}`, {
        name: editForm.name || undefined,
        location: editForm.location || undefined,
      });
      setSuccess("Theatre updated successfully");
      setEditTheatre(null);
      await fetchTheatres();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update theatre");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this theatre? This cannot be undone.")) return;
    setError(""); setSuccess("");
    try {
      await axios.delete(`/theatres/${id}`);
      setSuccess("Theatre deleted");
      await fetchTheatres();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete theatre");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Theatres</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}
      {success && <p className="text-green-500 mb-3">{success}</p>}

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-8 flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="border rounded px-3 py-2 w-48"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Theatre name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            className="border rounded px-3 py-2 w-48"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="City, Area"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creating..." : "Create Theatre"}
        </button>
      </form>

      {/* Edit Modal */}
      {editTheatre && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-lg font-bold mb-4">Edit Theatre — {editTheatre.name}</h2>
            <form onSubmit={handleEdit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder={editTheatre.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder={editTheatre.location}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditTheatre(null)} className="bg-gray-200 px-4 py-2 rounded flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theatres Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {theatres.map((theatre) => (
              <tr key={theatre.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{theatre.id}</td>
                <td className="px-4 py-3 font-medium">{theatre.name}</td>
                <td className="px-4 py-3">{theatre.location}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => { setEditTheatre(theatre); setEditForm({ name: theatre.name, location: theatre.location }); }}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(theatre.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}