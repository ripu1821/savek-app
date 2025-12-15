import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Moon,
  User,
  ClipboardList
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import api from "@/lib/api";
import { toast } from "sonner";

// ---- Extractor for API payload
function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items[0] ?? null;
  return d.items?.[0] ?? d;
}

export default function AmavasyaUserLocationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const resp = await api.get(`/amavasyaUserLocation/${id}`);
        const payload = extractPayload(resp);

        if (!payload) {
          setError("Record not found");
          return;
        }

        // normalize id
        setRecord({
          ...payload,
          id: payload._id ?? payload.id,
        });
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "Failed to load record"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="Loading..." />
        <div className="py-10 text-center text-muted-foreground">
          Loading details...
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="page-enter">
        <PageHeader title="Not Found" />
        <div className="py-10 text-center text-destructive">{error}</div>
      </div>
    );
  }

  const amavasya = record.amavasyaId ?? {};
  const user = record.userId ?? {};
  const location = record.locationId ?? {};

  return (
    <div className="page-enter">
      <PageHeader
        title="User Location Assignment"
        description="View detailed assignment"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "User Locations", href: "/amavasyaUserLocation" },
          { label: "Details" },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/amavasyaUserLocation")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button onClick={() => navigate(`/amavasyaUserLocation/${record.id}/edit`)}>
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT SIDE */}
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Assignment Details</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            {/* Amavasya */}
            <div className="mb-6">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-primary" />
                Amavasya
              </h3>
              <div className="rounded-xl bg-muted/30 p-4 space-y-1">
                <p className="font-semibold">{amavasya.month} {amavasya.year}</p>
                <p className="text-sm text-muted-foreground">
                  {amavasya.startDate
                    ? new Date(amavasya.startDate).toDateString()
                    : "-"}{" "}
                  →{" "}
                  {amavasya.endDate
                    ? new Date(amavasya.endDate).toDateString()
                    : "-"}
                </p>

                <p className="text-sm text-muted-foreground">
                  Time: {amavasya.startTime ?? "--"} to {amavasya.endTime ?? "--"}
                </p>

                <StatusBadge variant={amavasya.isActive ? "active" : "inactive"}>
                  {amavasya.isActive ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
            </div>

            {/* User */}
            <div className="mb-6">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" />
                User
              </h3>
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="font-semibold">{user.userName ?? "Unknown User"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </h3>
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="font-semibold">{location.name}</p>
              </div>
            </div>

            {/* NOTE */}
            {record.note && (
              <div className="mb-6">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Note
                </h3>
                <div className="rounded-xl bg-muted/30 p-4">
                  <p className="text-sm">{record.note}</p>
                </div>
              </div>
            )}

            {/* STATUS */}
            <div className="mt-3">
              <h3 className="font-medium mb-2">Status</h3>
              <StatusBadge variant={record.isActive ? "active" : "inactive"}>
                {record.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* RIGHT SIDE: METADATA */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle>Metadata</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            <div className="space-y-4">
              {/* Created At */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm font-medium">
                    {record.createdAt
                      ? new Date(record.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Updated At */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="text-sm font-medium">
                    {record.updatedAt
                      ? new Date(record.updatedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
