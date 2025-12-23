// src/pages/AmavasyaUserLocationsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, MapPin, Moon, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import api from "@/lib/api";

export default function AmavasyaUserLocationsList() {
  const navigate = useNavigate();

  // user-wise data
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/amavasyaUserLocation/userWise");
      setData(resp?.data?.data?.items || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load records"
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // =========================
  // TABLE COLUMNS (USER-WISE)
  // =========================
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
              <p className="text-xs text-muted-foreground">{item.user.email}</p>
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
          <span className="font-semibold">{item.assignments.length}</span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "w-32",
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

      <DataTable columns={columns} data={data} loading={loading} />

      {error && <div className="mt-3 text-destructive">{error}</div>}
    </div>
  );
}
