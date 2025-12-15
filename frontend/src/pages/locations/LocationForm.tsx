// src/pages/LocationForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { LocationFormData } from "@/types/models";

type ServerValidation = Record<string, string | string[]>;

function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items.length ? d.items[0] : null;
  if (Array.isArray(d)) return d.length ? d[0] : null;
  return d;
}

function mapServerErrors(serverData: any): Partial<Record<keyof LocationFormData, string>> {
  const out: Partial<Record<keyof LocationFormData, string>> = {};
  if (!serverData) return out;
  const maybe = serverData.errors ?? serverData;
  if (typeof maybe !== "object") return out;
  for (const k of Object.keys(maybe)) {
    const v = maybe[k];
    if (Array.isArray(v)) out[k as keyof LocationFormData] = v.join(" ");
    else if (typeof v === "string") out[k as keyof LocationFormData] = v;
    else if (v && typeof v.message === "string") out[k as keyof LocationFormData] = v.message;
  }
  return out;
}

export default function LocationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LocationFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadLocation = useCallback(async (locId: string) => {
    if (!locId) return;
    setLoading(true);
    setGeneralError(null);
    try {
      const resp = await api.get(`/location/${locId}`);
      const payload = extractPayload(resp) ?? resp?.data ?? null;
      if (!payload) {
        setGeneralError("Location not found");
        return;
      }
      setFormData({
        name: payload.name ?? "",
        description: payload.description ?? "",
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : Boolean(payload.active),
      });
    } catch (err: any) {
      console.error("Failed to load location", err);
      setGeneralError(err?.response?.data?.message ?? err?.message ?? "Failed to load location");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) loadLocation(id);
  }, [isEdit, id, loadLocation]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LocationFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      };

      if (isEdit && id) {
        await api.put(`/location/${id}`, payload);
        toast.success("Location updated successfully");
      } else {
        await api.post("/location", payload);
        toast.success("Location created successfully");
      }

      navigate("/locations");
    } catch (err: any) {
      console.error("Save error", err);
      const serverData = err?.response?.data ?? null;
      if (serverData) {
        const fieldErrors = mapServerErrors(serverData);
        if (Object.keys(fieldErrors).length) setErrors((p) => ({ ...p, ...fieldErrors }));
        setGeneralError(serverData?.message ?? serverData?.error ?? err?.message ?? "Failed to save");
      } else {
        setGeneralError(err?.message ?? "Failed to save");
      }
      toast.error(serverData?.message ?? err?.message ?? "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Location" : "Create Location"}
        description={isEdit ? "Update location details" : "Add a new location to the system"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Locations", href: "/locations" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/locations")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <GlassCard variant="elevated" className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>Location Details</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading location...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive">{generalError}</div>
              )}

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
                error={errors.description}
              />

              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                <div>
                  <Label htmlFor="isActive" className="font-medium">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Location is available for selection
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: Boolean(checked) })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/locations")} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update Location" : "Create Location"}
                </Button>
              </div>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
