import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Users as UsersIcon, Trash2, ChevronLeft, ChevronRight, Plus, X, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Spinner from "../../components/common/Spinner";

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ user, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="font-heading font-semibold text-gray-900">Delete User?</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
          <X size={18} />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-muted text-sm">
          Are you sure you want to delete{" "}
          <span className="text-gray-900 font-semibold">"{user.name} {user.surname}"</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 text-sm transition"
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

// ─── Create Staff Modal ───────────────────────────────────────────────────────
const CreateStaffModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "", surname: "", username: "", email: "", password: "",
  });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrors({});
    try {
      await api.post("/admin/staff", form);
      toast.success("Staff account created!");
      onCreated();
      onClose();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        toast.error(err?.response?.data?.message || "Failed to create staff");
      }
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

          {/* Name + Surname */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">First Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Rahul"
                className={`bg-gray-50 border text-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-1 transition text-sm placeholder:text-gray-400
                  ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
              />
              {errors.name && <p className="text-red-400 text-xs">⚠️ {errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Last Name</label>
              <input
                type="text"
                name="surname"
                value={form.surname}
                onChange={handleChange}
                required
                placeholder="Sharma"
                className={`bg-gray-50 border text-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-1 transition text-sm placeholder:text-gray-400
                  ${errors.surname ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
              />
              {errors.surname && <p className="text-red-400 text-xs">⚠️ {errors.surname}</p>}
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="rahul_staff"
              className={`bg-gray-50 border text-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-1 transition text-sm placeholder:text-gray-400
                ${errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
            />
            {errors.username && <p className="text-red-400 text-xs">⚠️ {errors.username}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="rahul@cinebook.com"
              className={`bg-gray-50 border text-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-1 transition text-sm placeholder:text-gray-400
                ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
            />
            {errors.email && <p className="text-red-400 text-xs">⚠️ {errors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Min 8 chars with uppercase, number & symbol"
                className={`w-full bg-gray-50 border text-gray-900 rounded-xl px-3 py-2 pr-10 outline-none focus:ring-1 transition text-sm placeholder:text-gray-400
                  ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-primary focus:ring-primary"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password
              ? <p className="text-red-400 text-xs">⚠️ {errors.password}</p>
              : <p className="text-xs text-muted mt-0.5">8-16 chars with uppercase, lowercase, number & special character</p>
            }
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
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success("User deleted!");
      setDeleteTarget(null);
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
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={!!deleting}
        />
      )}

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
                    onClick={() => setDeleteTarget(user)}
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