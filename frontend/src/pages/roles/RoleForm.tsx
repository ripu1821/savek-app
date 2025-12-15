// src/pages/RoleForm.tsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { RoleFormData } from "@/types/models";

type PermissionItem = { id: string; _id?: string; name: string; description?: string };

function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items.length ? d.items[0] : null;
  if (Array.isArray(d)) return d.length ? d[0] : null;
  return d;
}

function mapServerErrors(serverData: any): Partial<Record<keyof RoleFormData, string>> {
  const out: Partial<Record<keyof RoleFormData, string>> = {};
  if (!serverData) return out;
  const maybe = serverData.errors ?? serverData;
  if (typeof maybe !== "object") return out;
  for (const k of Object.keys(maybe)) {
    const v = maybe[k];
    if (Array.isArray(v)) out[k as keyof RoleFormData] = v.join(" ");
    else if (typeof v === "string") out[k as keyof RoleFormData] = v;
    else if (v && typeof v.message === "string") out[k as keyof RoleFormData] = v.message;
  }
  return out;
}

export default function RoleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    isActive: true,
    isSystemLogin: false,
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionsList, setPermissionsList] = useState<PermissionItem[]>([]);

  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // load permissions for checkbox list
  const loadPermissions = useCallback(async () => {
    try {
      const resp = await api.get("/permission", { params: { limit: 1000 } });
      const payload = resp?.data?.data ?? resp?.data ?? [];
      const items: PermissionItem[] = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      const normalized = items.map((p: any) => ({ ...p, id: p.id ?? p._id }));
      setPermissionsList(normalized);
    } catch (err) {
      // ignore gracefully — UI will still show nothing
      console.warn("Failed to load permissions", err);
      setPermissionsList([]);
    }
  }, []);

  // load role when editing
  const loadRole = useCallback(
    async (roleId: string) => {
      if (!roleId) return;
      setLoading(true);
      setGeneralError(null);
      try {
        const resp = await api.get(`/role/${roleId}`);
        const payload = extractPayload(resp) ?? resp?.data ?? null;
        if (!payload) {
          setGeneralError("Role not found");
          return;
        }
        setFormData({
          name: payload.name ?? "",
          description: payload.description ?? "",
          isActive: typeof payload.isActive === "boolean" ? payload.isActive : Boolean(payload.active),
          isSystemLogin: typeof payload.isSystemLogin === "boolean" ? payload.isSystemLogin : Boolean(payload.systemLogin ?? payload.is_system_login),
        });

        // populate selectedPermissions depending on shape (array of ids or populated objects)
        let perms: string[] = [];
        if (Array.isArray(payload.permissions)) {
          // could be array of ids or objects
          perms = payload.permissions.map((p: any) => (typeof p === "string" ? p : p.id ?? p._id ?? p.permissionId ?? ""));
        } else if (Array.isArray(payload.permissionIds)) {
          perms = payload.permissionIds.map((p: any) => String(p));
        }
        setSelectedPermissions(perms.filter(Boolean));
      } catch (err: any) {
        console.error("Failed to load role", err);
        setGeneralError(err?.response?.data?.message ?? err?.message ?? "Failed to load role");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPermissions();
    if (isEdit && id) {
      loadRole(id);
    }
  }, [isEdit, id, loadPermissions, loadRole]);

  // validation
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RoleFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]
    );
  };

  // submit create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        isActive: formData.isActive,
        isSystemLogin: formData.isSystemLogin,
        permissionIds: selectedPermissions, // backend field name may vary
      };

      if (isEdit && id) {
        await api.put(`/role/${id}`, payload);
        toast.success("Role updated successfully");
      } else {
        await api.post("/role", payload);
        toast.success("Role created successfully");
      }

      navigate("/roles");
    } catch (err: any) {
      console.error("Save error", err);
      const serverData = err?.response?.data ?? null;
      if (serverData) {
        const fieldErrors = mapServerErrors(serverData);
        if (Object.keys(fieldErrors).length) setErrors((p) => ({ ...p, ...fieldErrors }));
        setGeneralError(serverData?.message ?? serverData?.error ?? err?.message ?? "Failed to save role");
      } else {
        setGeneralError(err?.message ?? "Failed to save role");
      }
      toast.error(serverData?.message ?? err?.message ?? "Failed to save role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Role" : "Create Role"}
        description={isEdit ? "Update role details" : "Add a new role to the system"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Roles", href: "/roles" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/roles")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Role Details</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {generalError && <div className="rounded-md bg-destructive/10 p-2 text-destructive">{generalError}</div>}

                <FloatingInput
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />

                <FloatingTextarea
                  label="Description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                  <div>
                    <Label htmlFor="isActive" className="font-medium">Active Status</Label>
                    <p className="text-sm text-muted-foreground">Role is available for assignment</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: Boolean(checked) })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                  <div>
                    <Label htmlFor="isSystemLogin" className="font-medium">System Login</Label>
                    <p className="text-sm text-muted-foreground">Users can access system admin panel</p>
                  </div>
                  <Switch
                    id="isSystemLogin"
                    checked={formData.isSystemLogin}
                    onCheckedChange={(checked) => setFormData({ ...formData, isSystemLogin: Boolean(checked) })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/roles")} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    <Save className="h-4 w-4" />
                    {isEdit ? "Update Role" : "Create Role"}
                  </Button>
                </div>
              </form>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle>Permissions</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {permissionsList.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">No permissions available</div>
              ) : (
                permissionsList.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`permission-${permission.id}`} className="text-sm font-medium cursor-pointer">
                        {permission.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
