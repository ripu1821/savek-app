// src/pages/AmavasyaUserLocationsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, MapPin, Moon } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import api from "@/lib/api";

/* ---------------------------------
   COMPONENT
----------------------------------*/
export default function AmavasyaUserLocationsList() {
  const navigate = useNavigate();

  // data
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination (SAME AS UsersList)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // ✅ FIRST LOAD = 10
  const [total, setTotal] = useState(0);

  /* ---------------------------------
     FETCH
  ----------------------------------*/
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await api.get("/amavasyaUserLocation/userWise", {
        params: { page, limit },
      });

      const payload = resp?.data?.data ?? resp?.data;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const totalItems =
        typeof payload?.total === "number"
          ? payload.total
          : items.length;

      setRows(items);
      setTotal(totalItems);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load records"
      );
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* ---------------------------------
     COLUMNS
  ----------------------------------*/
  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: "user",
        header: "User",
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
              {item.user.userName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{item.user.userName}</p>
              <p className="text-xs text-muted-foreground">
                {item.user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "latestAmavasya",
        header: "Latest Amavasya",
        render: (item) => (
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <span>
              {item.latestAmavasya.month} {item.latestAmavasya.year}
            </span>
          </div>
        ),
      },
      {
        key: "latestLocation",
        header: "Location",
        render: (item) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{item.latestLocation.name}</span>
          </div>
        ),
      },
      {
        key: "assignments",
        header: "Total Visits",
        render: (item) => (
          <span className="font-semibold">
            {item.assignments.length}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "w-24",
        render: (item) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              navigate(`/amavasyaUserLocation/user/${item.user._id}`)
            }
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [navigate]
  );

  /* ---------------------------------
     UI
  ----------------------------------*/
  return (
    <div className="page-enter">
      <PageHeader
        title="User Locations"
        description="User-wise amavasya assignments"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "User Locations" },
        ]}
        actions={
          <Button onClick={() => navigate("/amavasyaUserLocation")}>
            <Plus className="h-4 w-4" />
            Amavasya User Location Management
          </Button>
        }
      />

      {/* 🔥 ROWS SELECTOR (LIKE UsersList) */}
      <div className="mb-4 flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1); // ✅ reset page
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
      />

      {error && <div className="mt-3 text-destructive">{error}</div>}

      {/* 🔥 BOTTOM PAGINATION (SAME AS UsersList) */}
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
