// src/pages/PermissionForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { PermissionFormData } from "@/types/models";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items.length ? d.items[0] : null;
  if (Array.isArray(d)) return d.length ? d[0] : null;
  return d;
}

function mapServerErrorsToFields(
  serverData: any
): Partial<Record<keyof PermissionFormData, string>> {
  const out: Partial<Record<keyof PermissionFormData, string>> = {};
  if (!serverData) return out;

  const maybe = serverData.errors ?? serverData;
  if (typeof maybe !== "object") return out;

  for (const k of Object.keys(maybe)) {
    const v = maybe[k];
    if (Array.isArray(v)) out[k as keyof PermissionFormData] = v.join(" ");
    else if (typeof v === "string") out[k as keyof PermissionFormData] = v;
    else if (v && typeof v.message === "string")
      out[k as keyof PermissionFormData] = v.message;
  }
  return out;
}

export default function PermissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PermissionFormData>({
    name: "",
    description: "",
    status: "Active",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof PermissionFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadPermission = useCallback(async (permId: string) => {
    if (!permId) return;
    setLoading(true);
    setGeneralError(null);
    try {
      const resp = await api.get(`/permission/${permId}`);
      const payload = extractPayload(resp) ?? resp?.data ?? null;
      if (!payload) {
        setGeneralError("Permission not found");
        return;
      }
      setFormData({
        name: payload.name ?? "",
        description: payload.description ?? "",
        status: payload.status ?? "Active",
      });
    } catch (err: any) {
      console.error("Failed to load permission", err);
      setGeneralError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load permission"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) loadPermission(id);
  }, [isEdit, id, loadPermission]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PermissionFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    // optional: more validation rules
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const permissionCode = formData.name.toLowerCase().replace(/\s+/g, "-");

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
        status: formData.status,
      };

      if (isEdit && id) {
        await api.put(`/permission/${id}`, payload);
        toast.success("Permission updated successfully");
      } else {
        await api.post("/permission", payload);
        toast.success("Permission created successfully");
      }

      navigate("/permissions");
    } catch (err: any) {
      console.error("Save error", err);
      const serverData = err?.response?.data ?? null;
      if (serverData) {
        const fieldErrors = mapServerErrorsToFields(serverData);
        if (Object.keys(fieldErrors).length)
          setErrors((p) => ({ ...p, ...fieldErrors }));
        setGeneralError(
          serverData?.message ??
            serverData?.error ??
            err?.message ??
            "Failed to save"
        );
      } else {
        setGeneralError(err?.message ?? "Failed to save");
      }
      toast.error(
        serverData?.message ?? err?.message ?? "Failed to save permission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Permission" : "Create Permission"}
        description={
          isEdit
            ? "Update permission details"
            : "Add a new permission to the system"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Permissions", href: "/permissions" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/permissions")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <GlassCard variant="elevated" className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>Permission Details</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading permission...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                  {generalError}
                </div>
              )}

              <FloatingInput
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
              />

              {formData.name && (
                <div className="rounded-xl bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Permission Code Preview
                  </p>
                  <StatusBadge variant="primary" showDot={false}>
                    {permissionCode}
                  </StatusBadge>
                </div>
              )}

              <FloatingTextarea
                label="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                // @ts-ignore if FloatingTextarea doesn't accept error prop remove it
              />

              <SearchableSelect
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "Active" | "Inactive",
                  })
                }
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/permissions")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update Permission" : "Create Permission"}
                </Button>
              </div>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
