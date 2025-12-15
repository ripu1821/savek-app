// src/pages/UserDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Edit,
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Shield,
  User,
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

type RoleShape = { id?: string; _id?: string; name?: string } | string | null;
type UserShape = any;

function extractPayload(resp: any) {
  // Support multiple shapes: { data: { items: [...] } }, { data: {...} }, direct array, etc.
  const d = resp?.data?.data ?? resp?.data;
  if (!d) {
    if (Array.isArray(resp?.data)) return resp.data[0] ?? null;
    return null;
  }
  if (Array.isArray(d.items)) return d.items.length ? d.items[0] : null;
  if (Array.isArray(d)) return d.length ? d[0] : null;
  return d;
}

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<UserShape | null>(null);
  const [role, setRole] = useState<RoleShape>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) {
        setError("No user id provided");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get(`/user/${id}`);
        const payload = extractPayload(resp) ?? resp?.data ?? null;
        if (!payload) {
          setError("User not found");
          setUser(null);
          return;
        }

        // Normalize user id
        const normalizedUser = {
          ...payload,
          id: payload.id ?? payload._id ?? id,
        };

        // Role might be populated or just an id
        let roleValue: RoleShape = null;
        if (normalizedUser.roleId) {
          if (typeof normalizedUser.roleId === "string") {
            // try to fetch role detail (optional)
            try {
              const rResp = await api.get(`/role/${normalizedUser.roleId}`);
              const rPayload = extractPayload(rResp) ?? rResp?.data ?? null;
              roleValue = rPayload
                ? { ...rPayload, id: rPayload.id ?? rPayload._id }
                : normalizedUser.roleId;
            } catch {
              roleValue = normalizedUser.roleId; // fallback to id
            }
          } else if (typeof normalizedUser.roleId === "object") {
            roleValue = normalizedUser.roleId;
            roleValue = {
              ...roleValue,
              id: (roleValue as any).id ?? (roleValue as any)._id,
            };
          }
        } else if (normalizedUser.role) {
          // some apis return role under `role`
          roleValue = normalizedUser.role;
        }

        if (mounted) {
          setUser(normalizedUser);
          setRole(roleValue);
        }
      } catch (err: any) {
        console.error("Failed to load user", err);
        if (mounted) {
          setError(
            err?.response?.data?.message ??
              err?.message ??
              "Failed to load user"
          );
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="Loading user..." />
        <div className="py-12 text-center text-muted-foreground">
          Loading user details…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter">
        <PageHeader
          title="User Not Found"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Users", href: "/users" },
            { label: "Not Found" },
          ]}
        />
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => navigate("/users")}>Back to Users</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  // try refetch
                  toast("Refetching...");
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

  if (!user) {
    return (
      <div className="page-enter">
        <PageHeader
          title="User Not Found"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Users", href: "/users" },
            { label: "Not Found" },
          ]}
        />
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              The requested user could not be found.
            </p>
            <Button className="mt-4" onClick={() => navigate("/users")}>
              Back to Users
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  const roleName =
    typeof role === "string"
      ? role
      : role && (role as any).name
      ? (role as any).name
      : "Unknown";

  return (
    <div className="page-enter">
      <PageHeader
        title={user.userName ?? user.name ?? "User"}
        description="View user details"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users", href: "/users" },
          { label: user.userName ?? user.name ?? "User" },
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/users")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => navigate(`/users/${user.id}/edit`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>User Information</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-col items-center gap-4 pb-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-3xl font-bold text-primary-foreground shadow-lg">
                {String(user.userName ?? user.name ?? "").charAt(0) || "U"}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {user.userName ?? user.name}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <StatusBadge variant={user.isActive ? "active" : "inactive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                  <StatusBadge variant="primary" showDot={false}>
                    {roleName}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="font-medium">{user.mobileNumber || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium">{roleName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {user.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
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
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
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
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString("en-US", {
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
