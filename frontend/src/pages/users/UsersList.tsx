// src/pages/UsersList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, MoreVertical, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/lib/api";
import { User } from "@/types/models";

function extractItems(resp: any): any[] {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) {
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  // single object -> wrap
  if (typeof d === "object") return [d];
  return [];
}

export default function UsersList() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // pagination / search
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  // delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/user", {
        params: { page, limit, q: search || undefined },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = Array.isArray(payload?.items) ? payload.items : extractItems(resp);
      const totalItems = typeof payload?.total === "number" ? payload.total : payload?.totalItems ?? items.length;

      // normalize id
      const normalized = items.map((u: any) => ({ ...u, id: u.id ?? u._id }));

      setUsers(normalized);
      setTotal(Number(totalItems));
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const prev = users;
    setUsers((cur) => cur.filter((u) => u.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/user/${deleteId}`);
      toast.success("User deleted successfully");
      // optionally refetch to sync totals
      await fetchUsers();
    } catch (err: any) {
      setUsers(prev); // rollback
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to delete user";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    const prev = users;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    // optimistic update
    setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));

    try {
      // PATCH is more appropriate for partial updates; change if your API expects PUT
      await api.patch(`/user/${userId}`, { isActive: !target.isActive });
      toast.success(`User ${!target.isActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      // rollback
      setUsers(prev);
      console.error("Failed to toggle user active", err);
      toast.error(err?.response?.data?.message ?? "Failed to update user status");
    }
  };

  const getRoleName = (roleVal: any) => {
    // roleVal might be id string or populated object
    if (!roleVal) return "Unknown";
    if (typeof roleVal === "string") return roleVal;
    if (typeof roleVal === "object") return roleVal.name ?? roleVal.roleName ?? "Unknown";
    return "Unknown";
  };

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: "userName",
        header: "User",
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
              {String(item.userName).charAt(0) || "U"}
            </div>
            <div>
              <p className="font-medium">{item.userName}</p>
              <p className="text-xs text-muted-foreground">{item.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "roleId",
        header: "Role",
        sortable: true,
        render: (item) => (
          <StatusBadge variant="primary" showDot={false}>
            {getRoleName(item.roleId)}
          </StatusBadge>
        ),
      },
      {
        key: "mobileNumber",
        header: "Mobile",
        render: (item) => <span className="text-muted-foreground">{item.mobileNumber || "-"}</span>,
      },
      {
        key: "isActive",
        header: "Status",
        sortable: true,
        render: (item) => (
          <StatusBadge variant={item.isActive ? "active" : "inactive"}>
            {item.isActive ? "Active" : "Inactive"}
          </StatusBadge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "w-20",
        render: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/users/${item.id}/edit`)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/users/${item.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActive(item.id)}>
                {item.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="page-enter">
      <PageHeader
        title="Users"
        description="Manage system users and their access"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users" },
        ]}
        actions={
          <Button onClick={() => navigate("/users/create")}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          className="input"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="input w-20">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        onSortChange={() => {}}
        searchPlaceholder="Search users..."
        onRowClick={(item) => navigate(`/users/${item.id}`)}
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* simple pagination controls */}
      {total > limit && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</div>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
