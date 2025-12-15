// src/pages/PermissionsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { Permission } from "@/types/models";

function extractItems(resp: any): any[] {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return [];
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  return d ? [d] : [];
}

export default function PermissionsList() {
  const navigate = useNavigate();

  // main data state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination + search
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // fetch permissions
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await api.get("/permission", {
        params: { page, limit, name: search || undefined },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = extractItems(resp);
      const totalItems = payload?.totalItems ?? payload?.total ?? items.length;

      const normalized = items.map((i: any) => ({
        ...i,
        id: i.id ?? i._id,
      }));

      setPermissions(normalized);
      setTotal(Number(totalItems));
    } catch (err: any) {
      console.error("Failed to load permissions", err);
      setError(err?.response?.data?.message ?? "Failed to load permissions");
      setPermissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // delete permission
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const previous = permissions;
    setPermissions((p) => p.filter((item) => item.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/permission/${deleteId}`);
      toast.success("Permission deleted successfully");
      fetchPermissions();
    } catch (err: any) {
      console.error("Delete failed", err);
      setPermissions(previous);
      toast.error(
        err?.response?.data?.message ?? "Failed to delete permission"
      );
    } finally {
      setDeleting(false);
    }
  };

  // DataTable columns
  const columns: Column<Permission>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-primary-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.name.toLowerCase().replace(/\s+/g, "-")}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "description",
        header: "Description",
        render: (item) => (
          <span className="text-muted-foreground line-clamp-1">
            {item.description || "-"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (item) => (
          <StatusBadge
            variant={item.status === "Active" ? "active" : "inactive"}
          >
            {item.status}
          </StatusBadge>
        ),
      },
      {
        key: "createdAt",
        header: "Created At",
        sortable: true,
        render: (item) => (
          <span className="text-muted-foreground">
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "w-32",
        render: (item) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/permissions/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/permissions/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="page-enter">
      <PageHeader
        title="Permissions"
        description="Manage system permissions"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Permissions" },
        ]}
        actions={
          <Button onClick={() => navigate("/permissions/create")}>
            <Plus className="h-4 w-4" />
            Add Permission
          </Button>
        }
      />

      {/* Search + Limit */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search permissions..."
          className="input"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="input w-20"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={permissions}
        loading={loading}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        onSortChange={() => {}}
        searchPlaceholder="Search permissions..."
        onRowClick={(item) => navigate(`/permissions/${item.id}`)}
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogDescription>
            Are you sure you want to delete this permission? This action cannot
            be undone.
          </AlertDialogDescription>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * limit >= total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
