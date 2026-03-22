import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Users as UsersIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

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

  useEffect(() => { fetchUsers(page); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted!");
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-white">Users</h1>
        <p className="text-muted text-sm mt-1">{pagination.total || 0} total users</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-16 animate-pulse" />
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
              <div key={user.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{user.name} {user.surname}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-zinc-500/10 text-zinc-400"}`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-muted text-sm">@{user.username} • {user.email}</p>
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-muted text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 bg-card border border-border rounded-xl text-muted hover:text-white transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 bg-card border border-border rounded-xl text-muted hover:text-white transition disabled:opacity-50"
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