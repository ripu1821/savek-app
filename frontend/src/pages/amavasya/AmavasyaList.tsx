// src/pages/AmavasyaList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Moon,
  Calendar,
  Clock,
  ArrowLeft,
} from "lucide-react";
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
import { Amavasya } from "@/types/models";

/** defensive extractor for list responses */
function extractItems(resp: any): any[] {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) {
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.data)) return d.data;
  // single object -> wrap in array
  if (typeof d === "object") return [d];
  return [];
}

/** try to pick total from common places */
function extractTotal(resp: any, fallbackLength = 0): number {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return fallbackLength;
  if (typeof d.total === "number") return d.total;
  if (typeof d.count === "number") return d.count;
  if (Array.isArray(d.items)) return d.items.length;
  if (Array.isArray(d)) return d.length;
  if (Array.isArray(d.data)) return d.data.length;
  return fallbackLength;
}

/** normalize a time input to "HH:mm" (best-effort) */
function normalizeTimeString(input: any): string {
  if (!input && input !== 0) return "";
  if (input instanceof Date) {
    const hh = String(input.getHours()).padStart(2, "0");
    const mm = String(input.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (typeof input === "string") {
    const hhmm = input.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
    const iso = /^\d{4}-\d{2}-\d{2}T/;
    if (iso.test(input)) {
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
    }
  }
  return String(input);
}

export default function AmavasyaList() {
  const navigate = useNavigate();

  const [amavasyaList, setAmavasyaList] = useState<Amavasya[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // NEW: selected item + modal open state
  const [selectedItem, setSelectedItem] = useState<Amavasya | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/amavasya", {
        params: {
          page,
          limit,
          q: search || undefined,
        },
      });

      const items = extractItems(resp);
      const normalized: Amavasya[] = items.map((it: any) => ({
        ...it,
        id: String(it.id ?? it._id ?? ""),
      }));

      setAmavasyaList(normalized);
      const totalItems = extractTotal(resp, normalized.length);
      setTotal(totalItems);
    } catch (err: any) {
      console.error("Failed to fetch amavasya list", err);
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load amavasya"
      );
      setAmavasyaList([]);
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

    const previous = amavasyaList;
    setAmavasyaList((cur) => cur.filter((a) => a.id !== deleteId));
    setDeleteId(null);

    try {
      await api.delete(`/amavasya/${deleteId}`);
      toast.success("Amavasya deleted successfully");
      // keep UI in sync by refetching totals / pages
      await fetchList();
    } catch (err: any) {
      // rollback
      setAmavasyaList(previous);
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to delete amavasya";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // NEW: open modal for item. we already have item from list so just setSelectedItem.
  // If you want to fetch fresh details when opening the modal, uncomment the fetch section.
  const openDetailModal = async (item: Amavasya) => {
    setSelectedItem(null);
    // if you want to re-fetch fresh detail from server, uncomment:
    // setDetailLoading(true);
    // try {
    //   const resp = await api.get(`/amavasya/${item.id}`);
    //   const payload = resp?.data?.data ?? resp?.data;
    //   const normalized = { ...payload, id: String(payload.id ?? payload._id ?? item.id) };
    //   setSelectedItem(normalized);
    // } catch (err) {
    //   console.warn("Failed to fetch amavasya detail", err);
    //   setSelectedItem(item); // fallback to existing item
    // } finally {
    //   setDetailLoading(false);
    // }
    // using list item to avoid extra request:
    setSelectedItem(item);
  };

  const closeModal = () => setSelectedItem(null);

  const gridItems = useMemo(() => amavasyaList, [amavasyaList]);

  return (
    <div className="page-enter">
      <PageHeader
        title="Amavasya"
        description="Manage amavasya dates and timings"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Amavasya" }]}
        actions={
          <Button onClick={() => navigate("/amavasya/create")}>
            <Plus className="h-4 w-4" />
            Add Amavasya
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
          placeholder="Search amavasya..."
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
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading amavasya...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">{error}</div>
      ) : gridItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No amavasya records found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((item, index) => (
            <GlassCard
              key={item.id}
              variant="elevated"
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/amavasya/${item.id}`)}
            >
              <GlassCardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-primary-foreground shadow-lg">
                      <Moon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{item.month}</h3>
                      <p className="text-2xl font-bold text-primary">
                        {item.year}
                      </p>
                    </div>
                  </div>
                  <StatusBadge variant={item.isActive ? "active" : "inactive"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-medium">
                      {item.startDate
                        ? new Date(item.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                      {item.startTime &&
                        ` at ${normalizeTimeString(item.startTime)}`}
                    </span>
                  </div>
                  {item.endDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-medium">
                        {new Date(item.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {item.endTime &&
                          ` at ${normalizeTimeString(item.endTime)}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 border-t border-border/50 pt-4 opacity-100 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/amavasya/${item.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      // log + pass the item to the edit page so form can prefill via location.state
                      console.log("Edit clicked", { id: item.id, item });
                      navigate(`/amavasya/${item.id}/edit`, {
                        state: { item },
                      });
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
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Amavasya</AlertDialogTitle>
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

      {/* ---------------------------
          INLINE DETAIL MODAL
          --------------------------- */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-3xl">
            <div className="rounded-2xl bg-white/5 ring-1 ring-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedItem.month} {selectedItem.year}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Amavasya details
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={closeModal}>
                    <ArrowLeft className="h-4 w-4" />
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      closeModal();
                      navigate(`/amavasya/${selectedItem.id}/edit`, {
                        state: { item: selectedItem },
                      });
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Start</p>
                    <p className="font-medium">
                      {selectedItem.startDate
                        ? new Date(selectedItem.startDate).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )
                        : "—"}
                      {selectedItem.startTime
                        ? ` at ${normalizeTimeString(selectedItem.startTime)}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End</p>
                    <p className="font-medium">
                      {selectedItem.endDate
                        ? new Date(selectedItem.endDate).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )
                        : "—"}
                      {selectedItem.endTime
                        ? ` at ${normalizeTimeString(selectedItem.endTime)}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Start Time</p>
                    <p className="font-medium">
                      {selectedItem.startTime
                        ? normalizeTimeString(selectedItem.startTime)
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End Time</p>
                    <p className="font-medium">
                      {selectedItem.endTime
                        ? normalizeTimeString(selectedItem.endTime)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-right">
                <StatusBadge
                  variant={selectedItem.isActive ? "active" : "inactive"}
                >
                  {selectedItem.isActive ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
