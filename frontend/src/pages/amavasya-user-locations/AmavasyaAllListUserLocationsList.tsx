// src/pages/AmavasyaAllListUserLocationsList.tsx
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

import api from "@/lib/api";
import { toast } from "sonner";
import { AmavasyaUserLocation as AULType } from "@/types/models";

/* ---------------------------------
   HELPERS
----------------------------------*/
function extractItems(resp: any): any[] {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return [];
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  return [];
}

const resolveName = (val: any, fallback = "Unknown") => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name ?? val.userName ?? fallback;
  return fallback;
};

/* ---------------------------------
   COMPONENT
----------------------------------*/
export default function AmavasyaAllListUserLocationsList() {
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [rows, setRows] = useState<AULType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // ✅ FIRST LOAD = 10
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------- FETCH ---------- */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await api.get("/amavasyaUserLocation", {
        params: {
          page,
          limit,
          q: search || undefined,
        },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = extractItems(resp);
      const totalItems =
        typeof payload?.total === "number" ? payload.total : items.length;

      setRows(
        items.map((i: any) => ({
          ...i,
          id: i.id ?? i._id,
        }))
      );
      setTotal(totalItems);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load records"
      );
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* ---------- DELETE ---------- */
  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const prev = rows;
    setRows((cur) => cur.filter((r) => r.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/amavasyaUserLocation/${deleteId}`);
      toast.success("Assignment deleted");
      await fetchList(); // sync totals
    } catch (err: any) {
      setRows(prev);
      toast.error(
        err?.response?.data?.message ?? err?.message ?? "Delete failed"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- COLUMNS ---------- */
  const columns: Column<AULType>[] = useMemo(
    () => [
      {
        key: "userId",
        header: "User",
        render: (item) => {
          const name = resolveName(item.userId, "User");
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">{name}</span>
            </div>
          );
        },
      },
      {
        key: "amavasyaId",
        header: "Amavasya",
        render: (item) => {
          const a = item.amavasyaId;
          const label =
            typeof a === "object"
              ? `${a.month ?? ""} ${a.year ?? ""}`.trim()
              : resolveName(a);
          return (
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              {label}
            </div>
          );
        },
      },
      {
        key: "locationId",
        header: "Location",
        render: (item) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {resolveName(item.locationId)}
          </div>
        ),
      },
      {
        key: "isActive",
        header: "Status",
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
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/amavasyaUserLocation/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/amavasyaUserLocation/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
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

  /* ---------- UI ---------- */
  return (
    <div className="page-enter">
      <PageHeader
        title="User Locations"
        description="Manage amavasya user location assignments"
        actions={
          <Button onClick={() => navigate("/amavasyaUserLocation/create")}>
            <Plus className="h-4 w-4" />
            Add Assignment
          </Button>
        }
      />

      {/* SEARCH + LIMIT */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search..."
          className="input"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
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
        data={rows}
        loading={loading}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        onSortChange={() => {}}
        onRowClick={(item) => navigate(`/amavasyaUserLocation/${item.id}`)}
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      {/* ✅ BOTTOM PAGINATION */}
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

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
