// src/pages/AmavasyaUserLocationForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";

import { Save, ArrowLeft, MapPin } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

// ---- Types ----
interface FormData {
  amavasyaId: string;
  userId: string;
  locationId: string;
  note: string;
  isActive: boolean;
}

// ---- Helpers ----
function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items.length ? d.items[0] : null;
  if (Array.isArray(d)) return d.length ? d[0] : null;
  return d;
}

function extractArray(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) {
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

// robust id extractor: handles primitives and objects with _id / id
function extractId(val: any): string {
  if (val === undefined || val === null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") {
    return String(val._id ?? val.id ?? val._id?.$oid ?? val.id?.$oid ?? "");
  }
  return "";
}

function mkOption(value: any, label: string) {
  return { value: extractId(value), label: String(label ?? "") };
}

function labelForAmavasya(objOrMonth: any): string {
  if (!objOrMonth) return "";
  if (typeof objOrMonth === "string") return objOrMonth;
  const month = objOrMonth.month ?? objOrMonth.monthName ?? objOrMonth.monthShort ?? "";
  const year = objOrMonth.year ?? objOrMonth.y ?? "";
  return `${month} ${year}`.trim() || extractId(objOrMonth);
}

function labelForUser(objOrUser: any): string {
  if (!objOrUser) return "";
  if (typeof objOrUser === "string") return objOrUser;
  return objOrUser.userName ?? objOrUser.name ?? objOrUser.email ?? extractId(objOrUser);
}

function labelForLocation(objOrLoc: any): string {
  if (!objOrLoc) return "";
  if (typeof objOrLoc === "string") return objOrLoc;
  return objOrLoc.name ?? objOrLoc.label ?? objOrLoc.title ?? extractId(objOrLoc);
}

// --------------------------------------------------------------------------

export default function AmavasyaUserLocationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    amavasyaId: "",
    userId: "",
    locationId: "",
    note: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options
  const [amavasyaOptions, setAmavasyaOptions] = useState<{ value: string; label: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  // Cache for preview
  const [locationsStore, setLocationsStore] = useState<Record<string, any>>({});

  // Track if dropdowns are loaded
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  // -------------------------------
  // LOAD DROPDOWN LISTS
  // -------------------------------
  const loadDropdowns = useCallback(async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const [amResp, userResp, locResp] = await Promise.all([
        api.get("/amavasya", { params: { limit: 1000 } }),
        api.get("/user", { params: { limit: 1000 } }),
        api.get("/location", { params: { limit: 1000 } }),
      ]);

      const amItems = extractArray(amResp);
      const userItems = extractArray(userResp);
      const locItems = extractArray(locResp);

      setAmavasyaOptions(
        amItems.map((a: any) =>
          mkOption(a._id ?? a.id ?? a, `${a.month ?? ""} ${a.year ?? ""}`.trim())
        )
      );

      setUserOptions(
        userItems.map((u: any) => mkOption(u._id ?? u.id ?? u, u.userName ?? u.name ?? u.email ?? ""))
      );

      setLocationOptions(
        locItems.map((l: any) => mkOption(l._id ?? l.id ?? l, l.name ?? ""))
      );

      // Cache locations for preview
      const cache: Record<string, any> = {};
      locItems.forEach((l: any) => {
        const key = extractId(l._id ?? l.id ?? l);
        if (key) cache[key] = l;
      });
      setLocationsStore(cache);

      setDropdownsLoaded(true);
    } catch (err: any) {
      console.error("Dropdown loading failed", err);
      toast.error("Failed to load dropdowns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // -------------------------------
  // LOAD RECORD IF EDIT MODE
  // -------------------------------
  const loadRecord = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setGeneralError(null);
    try {
      const resp = await api.get(`/amavasyaUserLocation/${id}`);
      const payload = extractPayload(resp);

      console.log("Loaded payload:", payload);

      if (!payload) {
        setGeneralError("Record not found");
        return;
      }

      // Determine ids from several possible shapes
      const selAmId = extractId(
        payload.amavasyaId ?? payload.amavasya?._id ?? payload.amavasya?.id ?? payload.amavasya
      );
      const selUserId = extractId(
        payload.userId ??
          payload.user?._id ??
          payload.user?.id ??
          payload.user ??
          payload.userName ??
          payload.email
      );
      const selLocId = extractId(
        payload.locationId ?? payload.location?._id ?? payload.location?.id ?? payload.location
      );

      setFormData({
        amavasyaId: selAmId,
        userId: selUserId,
        locationId: selLocId,
        note: payload.note || "",
        isActive: Boolean(payload.isActive ?? payload.active ?? true),
      });

      // --- ensure selected options exist in dropdowns with friendly labels ---
      if (selAmId) {
        setAmavasyaOptions((prev) => {
          if (prev.find((o) => o.value === selAmId)) return prev;
          const label = labelForAmavasya(payload.amavasya ?? payload);
          return [mkOption(selAmId, label), ...prev];
        });
      }

      if (selUserId) {
        setUserOptions((prev) => {
          if (prev.find((o) => o.value === selUserId)) return prev;
          const label = labelForUser(payload.user ?? payload);
          return [mkOption(selUserId, label), ...prev];
        });
      }

      if (selLocId) {
        setLocationOptions((prev) => {
          if (prev.find((o) => o.value === selLocId)) return prev;
          const label = labelForLocation(payload.location ?? payload);
          return [mkOption(selLocId, label), ...prev];
        });

        // Also cache the location preview object if provided
        if (payload.location) {
          setLocationsStore((prev) => ({ ...prev, [selLocId]: payload.location }));
        }
      }
    } catch (err) {
      console.error("Record load failed", err);
      toast.error("Failed to load record");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load record **after dropdowns are ready**
  useEffect(() => {
    if (isEdit && dropdownsLoaded) {
      loadRecord();
    }
  }, [isEdit, dropdownsLoaded, loadRecord]);

  // Also handle edge-case where dropdowns already loaded but record did not populate
  useEffect(() => {
    if (isEdit && !dropdownsLoaded) return;
    if (isEdit && id && !formData.amavasyaId && !loading) {
      loadRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  // -------------------------------
  // VALIDATION
  // -------------------------------
  const validate = () => {
    const e: any = {};
    if (!formData.amavasyaId) e.amavasyaId = "Required";
    if (!formData.userId) e.userId = "Required";
    if (!formData.locationId) e.locationId = "Required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // -------------------------------
  // SUBMIT (CREATE / UPDATE)
  // -------------------------------
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        note: formData.note || null,
      };

      if (isEdit) {
        await api.put(`/amavasyaUserLocation/${id}`, payload);
        toast.success("Updated successfully");
      } else {
        await api.post(`/amavasyaUserLocation`, payload);
        toast.success("Created successfully");
      }

      navigate("/amavasyaUserLocation");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLocation = locationsStore[formData.locationId];

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit User Location" : "Assign User Location"}
        description={
          isEdit
            ? "Update assignment"
            : "Assign a user to a location for amavasya"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "User Locations", href: "/amavasyaUserLocation" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/amavasyaUserLocation")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT SIDE FORM */}
        <GlassCard variant="elevated" className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Assignment Details</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            {loading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {generalError && (
                  <div className="bg-destructive/10 text-destructive p-2 rounded">
                    {generalError}
                  </div>
                )}

                <SearchableSelect
                  label="Amavasya"
                  options={amavasyaOptions}
                  value={formData.amavasyaId}
                  onChange={(v) => setFormData({ ...formData, amavasyaId: v })}
                  error={errors.amavasyaId}
                />

                <SearchableSelect
                  label="User"
                  options={userOptions}
                  value={formData.userId}
                  onChange={(v) => setFormData({ ...formData, userId: v })}
                  error={errors.userId}
                />

                <SearchableSelect
                  label="Location"
                  options={locationOptions}
                  value={formData.locationId}
                  onChange={(v) => setFormData({ ...formData, locationId: v })}
                  error={errors.locationId}
                />

                <FloatingTextarea
                  label="Note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />

                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Assignment is active
                    </p>
                  </div>

                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) =>
                      setFormData({ ...formData, isActive: v })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/amavasyaUserLocation")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4" />
                    {isEdit ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* RIGHT SIDE PREVIEW */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location Preview
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            {selectedLocation ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-rose-300/20 to-pink-400/20 rounded-xl flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-rose-500" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedLocation.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.description || "No description"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <MapPin className="mx-auto h-12 w-12 opacity-30" />
                Select a location to preview
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
