// src/pages/LocationsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, MapPin } from "lucide-react";
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
import { toast } from "sonner";
import api from "@/lib/api";
import { Location } from "@/types/models";

function extractItems(resp: any): any[] {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) {
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.data)) return d.data;
  // single object -> wrap
  if (typeof d === "object") return [d];
  return [];
}

export default function LocationsList() {
  const navigate = useNavigate();

  // data + ui
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // pagination / search
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  // delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/location", {
        params: { page, limit, q: search || undefined },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = Array.isArray(payload?.items) ? payload.items : extractItems(resp);
      const totalItems = typeof payload?.total === "number" ? payload.total : items.length;

      const normalized: Location[] = items.map((it: any) => ({ ...it, id: it.id ?? it._id }));
      setLocations(normalized);
      setTotal(totalItems);
    } catch (err: any) {
      console.error("Failed to fetch locations", err);
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load locations");
      setLocations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setDeleting(true);

    // optimistic UI
    const prev = locations;
    setLocations((cur) => cur.filter((l) => l.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/location/${deleteId}`);
      toast.success("Location deleted successfully");
      // refetch to keep totals in sync
      await fetchLocations();
    } catch (err: any) {
      setLocations(prev); // rollback
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to delete location";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Location>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-primary-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="font-medium">{item.name}</span>
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
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/locations/${item.id}`);
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
                navigate(`/locations/${item.id}/edit`);
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
        title="Locations"
        description="Manage all locations in the system"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Locations" },
        ]}
        actions={
          <Button onClick={() => navigate("/locations/create")}>
            <Plus className="h-4 w-4" />
            Add Location
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
          placeholder="Search locations..."
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
        data={locations}
        loading={loading}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        onSortChange={() => {}}
        searchPlaceholder="Search locations..."
        onRowClick={(item) => navigate(`/locations/${item.id}`)}
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
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
