// src/pages/RolesList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, Shield, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { Role } from "@/types/models";

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

export default function RolesList() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination/search
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  // delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/role", {
        params: { page, limit, name: search || undefined },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = Array.isArray(payload?.items)
        ? payload.items
        : extractItems(resp);
      const totalItems =
        typeof payload?.total === "number"
          ? payload.total
          : payload?.totalItems ?? items.length;

      const normalized = items.map((r: any) => ({ ...r, id: r.id ?? r._id }));
      setRoles(normalized);
      setTotal(Number(totalItems));
    } catch (err: any) {
      console.error("Failed to fetch roles", err);
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load roles"
      );
      setRoles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const prev = roles;
    setRoles((cur) => cur.filter((r) => r.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/role/${deleteId}`);
      toast.success("Role deleted successfully");
      // refetch to keep totals & data consistent
      await fetchRoles();
    } catch (err: any) {
      setRoles(prev); // rollback
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Failed to delete role";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const gridItems = useMemo(() => roles, [roles]);

  return (
    <div className="page-enter">
      <PageHeader
        title="Roles"
        description="Manage user roles and permissions"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Roles" }]}
        actions={
          <Button onClick={() => navigate("/roles/create")}>
            <Plus className="h-4 w-4" />
            Add Role
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
          placeholder="Search roles..."
          className="input"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="input w-20"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading roles...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">{error}</div>
      ) : gridItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No roles found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((role, index) => {
            const permissionCount = Array.isArray(role.permissions)
              ? role.permissions.length
              : typeof role.permissionCount === "number"
              ? role.permissionCount
              : 0;

            return (
              <GlassCard
                key={role.id}
                variant="elevated"
                className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/roles/${role.id}`)}
              >
                <GlassCardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {role.description || "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge
                        variant={role.isActive ? "active" : "inactive"}
                      >
                        {role.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                      {role.isSystemLogin && (
                        <StatusBadge variant="primary" showDot={false}>
                          <Lock className="mr-1 h-3 w-3" />
                          System
                        </StatusBadge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-sm text-muted-foreground">
                      {permissionCount} permission
                      {permissionCount !== 1 ? "s" : ""} available
                    </span>
                    <div className="flex gap-1 opacity-100 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/roles/${role.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/roles/${role.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(role.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
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

      {/* simple pagination */}
      {total > limit && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </div>
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
