import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Lock,
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

function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items[0] ?? null;
  if (Array.isArray(d)) return d[0] ?? null;
  return d;
}

export default function RoleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const resp = await api.get(`/role/${id}`);
        const payload = extractPayload(resp);

        if (!payload) {
          setError("Role not found");
          return;
        }

        setRole({
          ...payload,
          id: payload.id ?? payload._id,
        });
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "Failed to load role"
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
        <PageHeader title="Loading role..." />
        <div className="py-12 text-center text-muted-foreground">
          Loading role details…
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="page-enter">
        <PageHeader
          title="Role Not Found"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Roles", href: "/roles" },
            { label: "Not Found" },
          ]}
        />
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button className="mt-4" onClick={() => navigate("/roles")}>
              Back to Roles
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  const permissionList =
    Array.isArray(role.permissions) ? role.permissions : [];

  return (
    <div className="page-enter">
      <PageHeader
        title={role.name}
        description="View role details"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Roles", href: "/roles" },
          { label: role.name },
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/roles")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button onClick={() => navigate(`/roles/${role.id}/edit`)}>
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: MAIN DETAILS */}
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Role Information</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            <div className="flex flex-col items-center gap-4 pb-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-3xl font-bold text-primary-foreground shadow-lg">
                <Shield className="h-10 w-10" />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">{role.name}</h2>

                <p className="text-muted-foreground">
                  {role.description || "No description"}
                </p>

                <div className="mt-3 flex justify-center sm:justify-start gap-3">
                  <StatusBadge variant={role.isActive ? "active" : "inactive"}>
                    {role.isActive ? "Active" : "Inactive"}
                  </StatusBadge>

                  {role.isSystemLogin && (
                    <StatusBadge variant="primary" showDot={false}>
                      <Lock className="h-3 w-3 mr-1" />
                      System Login
                    </StatusBadge>
                  )}
                </div>
              </div>
            </div>

            {/* PERMISSIONS */}
            <div className="mt-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Permissions
              </h3>

              {permissionList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No permissions assigned
                </p>
              ) : (
                <div className="grid gap-3">
                  {permissionList.map((p: any) => (
                    <div
                      key={p.id ?? p._id}
                      className="rounded-xl bg-muted/30 p-3"
                    >
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* RIGHT: METADATA */}
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
                  <p className="text-sm font-medium">
                    {role.createdAt
                      ? new Date(role.createdAt).toLocaleDateString()
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
                  <p className="text-sm font-medium">
                    {role.updatedAt
                      ? new Date(role.updatedAt).toLocaleDateString()
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
