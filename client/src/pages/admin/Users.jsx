import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Users as UsersIcon, Trash2, ChevronLeft, ChevronRight, Plus, X, ShieldCheck } from "lucide-react";
import Spinner from "../../components/common/Spinner";

// ─── Create Staff Modal ───────────────────────────────────────────────────────
const CreateStaffModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "", surname: "", username: "", email: "", password: "",
  });
  const [creating, setCreating] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/admin/staff", form);
      toast.success("Staff account created!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create staff");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <span className="font-heading font-semibold text-gray-900">Create Staff Account</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <p className="text-muted text-xs">
            Staff accounts can only access the ticket scanner. They cannot manage movies, shows or bookings.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">First Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="Rahul"
                className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 outline-none focus:border-primary text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Last Name</label>
              <input
                type="text"
                value={form.surname}
                onChange={(e) => set("surname", e.target.value)}
                required
                placeholder="Sharma"
                className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 outline-none focus:border-primary text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              required
              placeholder="rahul_staff"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 outline-none focus:border-primary text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              placeholder="rahul@cinebook.com"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 outline-none focus:border-primary text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              placeholder="Min 6 characters"
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 outline-none focus:border-primary text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {creating ? <Spinner text="Creating..." /> : "Create Staff Account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showCreateStaff, setShowCreateStaff] = useState(false);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${p}&limit=10`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page).catch(console.error); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted!");
      await fetchUsers(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const roleBadge = (role) => {
    const map = {
      ADMIN: "bg-primary/10 text-primary border border-primary/20",
      STAFF: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
      USER: "bg-gray-100 text-gray-600 border border-gray-200",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${map[role] || map.USER}`}>
        {role}
      </span>
    );
  };

  return (
    <AdminLayout>
      {showCreateStaff && (
        <CreateStaffModal
          onClose={() => setShowCreateStaff(false)}
          onCreated={() => fetchUsers(page)}
        />
      )}

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-muted text-sm mt-1">{pagination.total || 0} total users</p>
        </div>
        {/* ✅ Create Staff button */}
        <button
          onClick={() => setShowCreateStaff(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} />
          Create Staff
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <UsersIcon size={40} className="text-muted mx-auto mb-3" />
          <p className="text-muted">No users found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-gray-900 font-medium">{user.name} {user.surname}</p>
                    {roleBadge(user.role)}
                  </div>
                  <p className="text-muted text-sm">@{user.username} · {user.email}</p>
                </div>
                {user.role !== "ADMIN" && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting === user.id}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50"
                  >
                    {deleting === user.id ? <Spinner /> : <Trash2 size={16} />}
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-muted text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Users;