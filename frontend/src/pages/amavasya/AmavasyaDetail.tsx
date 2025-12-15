// src/pages/AmavasyaDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Edit,
  ArrowLeft,
  Calendar,
  Clock,
  Moon,
} from "lucide-react";
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
import { toast } from "sonner";

// --------- Helpers ----------
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items[0] ?? null;
  if (Array.isArray(d)) return d[0] ?? null;
  return d;
}

function normalizeMonth(m: any) {
  if (!m) return "";
  const t = String(m).trim().toLowerCase();
  return MONTHS.find((x) => x.toLowerCase() === t) || m;
}

function normalizeTime(t: any) {
  if (!t) return "";
  if (t.includes("T")) {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }
  return t;
}

// -------------------------------------------------------------

export default function AmavasyaDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return setError("No id provided");

      setLoading(true);

      try {
        const resp = await api.get(`/amavasya/${id}`);
        let payload = extractPayload(resp);

        if (!payload) return setError("Not found");

        const normalized = {
          ...payload,
          id: payload._id ?? payload.id ?? id,
          month: normalizeMonth(payload.month),
          startTime: normalizeTime(payload.startTime),
          endTime: normalizeTime(payload.endTime),
        };

        if (mounted) setItem(normalized);
      } catch (error: any) {
        setError(error?.response?.data?.message ?? "Failed to load amavasya");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // ---------------- Loading ----------------
  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="Loading Amavasya..." />
        <div className="py-12 text-center text-muted-foreground">
          Loading details…
        </div>
      </div>
    );
  }

  // ---------------- Error ----------------
  if (error || !item) {
    return (
      <div className="page-enter">
        <PageHeader
          title="Amavasya Not Found"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Amavasya", href: "/amavasya" },
            { label: "Not Found" },
          ]}
        />

        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-destructive">{error ?? "Not found"}</p>

            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => navigate("/amavasya")}>Back</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  toast("Retrying…");
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UI (same layout as UserDetail)
  // -------------------------------------------------------------
  return (
    <div className="page-enter">
      <PageHeader
        title={`${item.month} ${item.year}`}
        description="View Amavasya details"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Amavasya", href: "/amavasya" },
          { label: `${item.month} ${item.year}` },
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/amavasya")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => navigate(`/amavasya/${item.id}/edit`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* ---------------- Left Card ---------------- */}
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Amavasya Information</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 pb-6 sm:flex-row">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg">
                <Moon className="h-10 w-10" />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {item.month} {item.year}
                </h2>
                <StatusBadge variant={item.isActive ? "active" : "inactive"}>
                  {item.isActive ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
            </div>

            {/* Info Grid (Exactly like User card grid) */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Start Date */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(item.startDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {item.startTime ? ` at ${item.startTime}` : ""}
                  </p>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                    {item.endTime ? ` at ${item.endTime}` : ""}
                  </p>
                </div>
              </div>

              {/* Start Time */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Time</p>
                  <p className="font-medium">{item.startTime || "—"}</p>
                </div>
              </div>

              {/* End Time */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Time</p>
                  <p className="font-medium">{item.endTime || "—"}</p>
                </div>
              </div>

            </div>
          </GlassCardContent>
        </GlassCard>

        {/* ---------------- Right Metadata Card ---------------- */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle>Metadata</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            <div className="space-y-4">

              {/* Created At */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Updated At */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="font-medium">
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
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
