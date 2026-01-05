// src/pages/ActivitiesList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageSizeSelect } from "@/components/ui/page-size-select";
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

type Activity = {
  id: string;
  name: string;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;
  // any other fields...
};

export default function ActivitiesList() {
  const navigate = useNavigate();

  // data + paging
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // ui state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // build query string and fetcher
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // adapt query keys to your backend (q/name/page/limit)
      const resp = await api.get("/activity", {
        params: {
          page,
          limit,
          sortBy,
          sortOrder,
        },
      });

      // handle unified response shape:
      // expect: resp.data = { success, status, message, data: { items: [...], total, page, limit, ... } }
      const payload = resp?.data?.data;
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
        ? payload
        : [];
      const totalItems =
        typeof payload?.total === "number" ? payload.total : items.length;

      setActivities(items);
      setTotal(totalItems);
    } catch (err: any) {
      console.error("Failed to fetch activities", err);
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load activities"
      );
      setActivities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // delete handler
  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setDeleting(true);

    // optimistic UI: remove from list immediately
    const prev = activities;
    setActivities((cur) => cur.filter((a) => a.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/activity/${deleteId}`);
      toast.success("Activity deleted successfully");
      // refetch totals / pages to keep consistent
      // if you prefer not to refetch, you can update total--. I'll refetch to be safe.
      await fetchActivities();
    } catch (err: any) {
      // rollback
      setActivities(prev);
      toast.error(err?.response?.data?.message ?? "Failed to delete activity");
    } finally {
      setDeleting(false);
    }
  };

  // table columns
  const columns: Column<Activity>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (item) => <span className="font-medium">{item.name}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (item) => (
          <StatusBadge
            variant={item.status === "Active" ? "active" : "inactive"}
          >
            {item.status ?? "—"}
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
                navigate(`/activities/${item.id}`);
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
                navigate(`/activities/${item.id}/edit`);
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

  // DataTable props: adapt these to your DataTable implementation
  return (
    <div className="page-enter">
      <PageHeader
        title="Activities"
        description="Manage all activities in the system"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Activities" },
        ]}
        actions={
          <Button onClick={() => navigate("/activities/create")}>
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        }
      />

      <div className="mb-4 flex items-center justify-end gap-2">
        <PageSizeSelect
          value={limit}
          onChange={(value) => {
            setLimit(value);
            setPage(1);
          }}
          options={[5, 10, 20, 50]}
        />
      </div>

      <DataTable
        columns={columns}
        data={activities}
        loading={loading}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        onSortChange={(col, order) => {
          // adapt if your DataTable provides sorting callbacks; using keys
          setSortBy(col ?? "createdAt");
          setSortOrder(order === "asc" ? "asc" : "desc");
        }}
        searchPlaceholder="Search activities..."
        onRowClick={(item) => navigate(`/activities/${item.id}`)}
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity? This action cannot
              be undone.
            </AlertDialogDescription>
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
    </div>
  );
}
