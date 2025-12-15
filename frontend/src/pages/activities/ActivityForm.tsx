// src/pages/ActivityForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { ActivityFormData } from "@/types/models";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

type ServerValidationErrors = Record<string, string | string[]>;

function extractData<T = any>(resp: any): T | null {
  // unified shapes handled: resp.data.data.items, resp.data.data (object), resp.data (object)
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  // if paginated (items array), pick first for single resource endpoints
  if (Array.isArray(d.items)) {
    if (d.items.length === 1) return d.items[0] as T;
    // if multiple, return the whole payload so callers can handle
    return d as unknown as T;
  }
  return d as T;
}

export default function ActivityForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ActivityFormData>({
    name: "",
    status: "Active",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false); // loading for edit fetch
  const [generalError, setGeneralError] = useState<string | null>(null);

  const loadActivity = useCallback(async (activityId: string) => {
    setLoading(true);
    setGeneralError(null);
    try {
      // Adjust endpoint if needed (some APIs use /activities/:id)
      const resp = await api.get(`/activity/${activityId}`);
      const payload = extractData<any>(resp);

      // handle payload being either the object or nested object
      if (!payload) {
        throw new Error("Activity not found");
      }

      // Normalize id field
      const act = { ...payload, id: payload.id ?? payload._id };

      setFormData({
        name: act.name ?? "",
        status: (act.status as "Active" | "Inactive") ?? "Active",
      });
    } catch (err: any) {
      console.error("Failed to load activity", err);
      setGeneralError(err?.response?.data?.message ?? err?.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadActivity(id);
    }
  }, [isEdit, id, loadActivity]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ActivityFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 120) {
      newErrors.name = "Name must be less than 120 characters";
    }

    if (!formData.status) {
      // defensive
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mapServerErrors = (serverErrors: ServerValidationErrors | undefined) => {
    if (!serverErrors) return;
    const fieldErrors: Partial<Record<keyof ActivityFormData, string>> = {};

    // common patterns:
    // { errors: { name: "Name is required" } } or { name: ["err1", "err2"] }
    // or resp.data.errors
    const maybeErrors = (serverErrors as any).errors ?? serverErrors;

    if (typeof maybeErrors === "object" && maybeErrors !== null) {
      for (const key of Object.keys(maybeErrors)) {
        const val = (maybeErrors as any)[key];
        if (Array.isArray(val)) {
          fieldErrors[key as keyof ActivityFormData] = val.join(" ");
        } else if (typeof val === "string") {
          fieldErrors[key as keyof ActivityFormData] = val;
        } else if (typeof val === "object" && val !== null && typeof val.message === "string") {
          fieldErrors[key as keyof ActivityFormData] = val.message;
        }
      }
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isEdit && id) {
        const resp = await api.put(`/activity/${id}`, formData);
        // success
        toast.success("Activity updated successfully");
        // optional: you can navigate to detail page or list
        navigate("/activities");
      } else {
        const resp = await api.post("/activity", formData);
        toast.success("Activity created successfully");
        navigate("/activities");
      }
    } catch (err: any) {
      console.error("Submit error", err);
      // Try to extract structured validation errors
      const serverData = err?.response?.data;
      if (serverData) {
        // If server returned field errors, map them
        mapServerErrors(serverData.errors ?? serverData?.data?.errors ?? serverData);
        // friendly message
        const msg = serverData.message ?? serverData.error ?? null;
        if (msg) setGeneralError(msg);
      } else {
        setGeneralError(err?.message ?? "Something went wrong");
      }
      // show toast for quick feedback
      toast.error(serverData?.message ?? err?.message ?? "Failed to save activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Activity" : "Create Activity"}
        description={isEdit ? "Update activity details" : "Add a new activity to the system"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Activities", href: "/activities" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/activities")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <GlassCard variant="elevated" className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>Activity Details</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading activity...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="rounded-md bg-destructive/10 p-3 text-destructive">{generalError}</div>
              )}

              <FloatingInput
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                maxLength={120}
              />

              <SearchableSelect
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: value as "Active" | "Inactive" })
                }
                error={errors.status}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/activities")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} className="animate-bounce-sm">
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update Activity" : "Create Activity"}
                </Button>
              </div>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
