// src/pages/AmavasyaUserLocationsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, MapPin, Moon, User } from "lucide-react";
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
import { AmavasyaUserLocation as AULType } from "@/types/models";

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

// resolve display name whether backend returned populated object or id
const resolveName = (
  val: any,
  fallback = "Unknown",
  fieldForObjectName = "name"
) => {
  if (!val && val !== 0) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.name ?? val.userName ?? val.label ?? val.title ?? fallback;
  }
  return String(val);
};

export default function AmavasyaUserLocationsList() {
  const navigate = useNavigate();

  // data + UI state
  const [locations, setLocations] = useState<AULType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // paging / search
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  // delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/amavasyaUserLocation", {
        params: { page, limit, q: search || undefined },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = Array.isArray(payload?.items)
        ? payload.items
        : extractItems(resp);
      const totalItems =
        typeof payload?.total === "number" ? payload.total : items.length;

      // normalize id keys (support _id)
      const normalized = items.map((it: any) => ({
        ...it,
        id: it.id ?? it._id,
      }));
      setLocations(normalized);
      setTotal(totalItems);
    } catch (err: any) {
      console.error("Failed to fetch amavasya user locations", err);
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load records"
      );
      setLocations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const prev = locations;
    setLocations((cur) => cur.filter((l) => l.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/amavasyaUserLocation/${deleteId}`);
      toast.success("User location deleted successfully");
      // refetch to keep totals in sync
      await fetchList();
    } catch (err: any) {
      setLocations(prev); // rollback
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to delete assignment";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<AULType>[] = useMemo(
    () => [
      {
        key: "userId",
        header: "User",
        sortable: true,
        render: (item) => {
          // item.userId could be id string or populated object
          const userName =
            typeof item.userId === "object"
              ? resolveName(item.userId, "Unknown", "userName")
              : item.userName ?? item.userId ?? "Unknown";
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
                {String(userName).charAt(0) || <User className="h-4 w-4" />}
              </div>
              <span className="font-medium">{userName}</span>
            </div>
          );
        },
      },
      {
        key: "amavasyaId",
        header: "Amavasya",
        sortable: true,
        render: (item) => {
          // item.amavasyaId could be object with month/year or id
          const a = item.amavasyaId;
          let label = "Unknown";
          if (typeof a === "object") {
            label = `${a.month ?? a.monthName ?? "?"} ${a.year ?? ""}`.trim();
          } else {
            label = item.amavasyaName ?? String(a ?? "Unknown");
          }
          return (
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <span>{label}</span>
            </div>
          );
        },
      },
      {
        key: "locationId",
        header: "Location",
        sortable: true,
        render: (item) => {
          const locName =
            typeof item.locationId === "object"
              ? resolveName(item.locationId, "Unknown")
              : item.locationName ?? item.locationId ?? "Unknown";
          return (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{locName}</span>
            </div>
          );
        },
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
        className: "w-32",
        render: (item) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/amavasyaUserLocation/${item.id}`);
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
                navigate(`/amavasyaUserLocation/${item.id}/edit`);
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

  const gridData = useMemo(() => locations, [locations]);

  return (
    <div className="page-enter">
      <PageHeader
        title="User Locations"
        description="Manage user location assignments for amavasya"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "User Locations" },
        ]}
        actions={
          <Button onClick={() => navigate("/amavasyaUserLocation/create")}>
            <Plus className="h-4 w-4" />
            Add Assignment
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
          placeholder="Search user locations..."
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

      <DataTable
        columns={columns}
        data={gridData}
        loading={loading}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        onSortChange={() => {}}
        searchPlaceholder="Search user locations..."
        onRowClick={(item) => navigate(`/amavasyaUserLocation/${item.id}`)}
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Location</AlertDialogTitle>
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
