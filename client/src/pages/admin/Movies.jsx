import { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({ title: "", duration: "" });
  const [editMovie, setEditMovie] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", duration: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMovies = async () => {
    try {
      const res = await axios.get("/movies");
      setMovies(res.data);
    } catch {
      setError("Failed to fetch movies");
    }
  };

  useEffect(() => { fetchMovies() }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      setLoading(true);
      await axios.post("/movies", {
        title: form.title,
        duration: parseInt(form.duration),
      });
      setSuccess("Movie created successfully");
      setForm({ title: "", duration: "" });
      await fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create movie");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      setLoading(true);
      await axios.put(`/movies/${editMovie.id}`, {
        title: editForm.title || undefined,
        duration: editForm.duration ? parseInt(editForm.duration) : undefined,
      });
      setSuccess("Movie updated successfully");
      setEditMovie(null);
      await fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update movie");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Soft delete this movie?")) return;
    setError(""); setSuccess("");
    try {
      await axios.delete(`/movies/${id}`);
      setSuccess("Movie deleted");
      await fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete movie");
    }
  };

  const handleRestore = async (id) => {
    setError(""); setSuccess("");
    try {
      await axios.patch(`/movies/${id}/restore`);
      setSuccess("Movie restored");
      await fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restore movie");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Movies</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}
      {success && <p className="text-green-500 mb-3">{success}</p>}

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-8 flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="border rounded px-3 py-2 w-48"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Movie title"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (mins)</label>
          <input
            className="border rounded px-3 py-2 w-36"
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="e.g. 150"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creating..." : "Create Movie"}
        </button>
      </form>

      {/* Edit Modal */}
      {editMovie && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-lg font-bold mb-4">Edit Movie — {editMovie.title}</h2>
            <form onSubmit={handleEdit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder={editMovie.title}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                  placeholder={editMovie.duration}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditMovie(null)} className="bg-gray-200 px-4 py-2 rounded flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movies Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{movie.id}</td>
                <td className="px-4 py-3 font-medium">{movie.title}</td>
                <td className="px-4 py-3">{movie.duration} mins</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${movie.isDeleted ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {movie.isDeleted ? "Deleted" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  {!movie.isDeleted && (
                    <button
                      onClick={() => { setEditMovie(movie); setEditForm({ title: movie.title, duration: movie.duration }); }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                  )}
                  {!movie.isDeleted ? (
                    <button onClick={() => handleDelete(movie.id)} className="text-red-500 hover:underline text-xs">
                      Delete
                    </button>
                  ) : (
                    <button onClick={() => handleRestore(movie.id)} className="text-green-600 hover:underline text-xs">
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}