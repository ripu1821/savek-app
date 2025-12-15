// src/pages/ActivityDetail.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, ArrowLeft, Calendar, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import api from "@/lib/api";

type Activity = {
  id: string;
  name: string;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;
  updatedAt?: string;
  // any other fields...
};

export default function ActivityDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async (activityId?: string) => {
    if (!activityId) return;
    setLoading(true);
    setError(null);
    try {
      // Adjust endpoint if your API uses /activities/:id or different path
      const resp = await api.get(`/activity/${activityId}`);
      // unified shape: resp.data = { success, status, message, data: { items?, ... } }
      const payload = resp?.data?.data;

      // payload might be object or array or paginated - handle defensively
      let act: any = null;
      if (payload == null) {
        // fallback: maybe resp.data contains the object directly
        act = resp?.data ?? null;
      } else if (Array.isArray(payload)) {
        // array (unexpected) — pick first
        act = payload[0] ?? null;
      } else if (payload.item) {
        act = payload.item;
      } else if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
        act = payload.items[0] ?? null;
      } else {
        // payload could be the object itself
        act = payload;
      }

      setActivity(act ? { ...act, id: act.id ?? act._id } : null);
    } catch (err: any) {
      console.error("Failed to load activity", err);
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load activity");
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity(id);
  }, [id, fetchActivity]);

  // Loading state
  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Activities", href: "/activities" },
            { label: "Loading" },
          ]}
        />
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading activity...</p>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-enter">
        <PageHeader
          title="Activity Error"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Activities", href: "/activities" },
            { label: "Error" },
          ]}
        />
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => fetchActivity(id)}>Retry</Button>
              <Button variant="ghost" onClick={() => navigate("/activities")}>
                Back to Activities
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // Not found
  if (!activity) {
    return (
      <div className="page-enter">
        <PageHeader
          title="Activity Not Found"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Activities", href: "/activities" },
            { label: "Not Found" },
          ]}
        />
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-muted-foreground">The requested activity could not be found.</p>
            <Button className="mt-4" onClick={() => navigate("/activities")}>
              Back to Activities
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // Rendered when activity exists
  return (
    <div className="page-enter">
      <PageHeader
        title={activity.name}
        description="View activity details"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Activities", href: "/activities" },
          { label: activity.name },
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/activities")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => navigate(`/activities/${activity.id}/edit`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Activity Information</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{activity.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge variant={activity.status === "Active" ? "active" : "inactive"}>
                  {activity.status}
                </StatusBadge>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle>Metadata</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm font-medium">
                    {activity.createdAt
                      ? new Date(activity.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="text-sm font-medium">
                    {activity.updatedAt
                      ? new Date(activity.updatedAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
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
