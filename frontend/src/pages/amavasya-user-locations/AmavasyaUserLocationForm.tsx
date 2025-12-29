import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select";
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
function extractArray(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

function extractId(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return String(val._id ?? val.id ?? "");
}

function mkOption(value: any, label: string) {
  return { value: extractId(value), label: String(label ?? "") };
}

// --------------------------------------------------------------------------

export default function AmavasyaUserLocationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [isBulk, setIsBulk] = useState(false);
  const [bulkUserIds, setBulkUserIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    amavasyaId: "",
    userId: "",
    locationId: "",
    note: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amavasyaOptions, setAmavasyaOptions] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [locationsStore, setLocationsStore] = useState<any>({});

  // -------------------------------
  // LOAD DROPDOWNS
  // -------------------------------
  const loadDropdowns = useCallback(async () => {
    setLoading(true);
    try {
      const [am, users, locs] = await Promise.all([
        api.get("/amavasya"),
        api.get("/user"),
        api.get("/location"),
      ]);

      setAmavasyaOptions(
        extractArray(am).map((a: any) =>
          mkOption(a._id, `${a.month ?? ""} ${a.year ?? ""}`)
        )
      );

      setUserOptions(
        extractArray(users).map((u: any) =>
          mkOption(u._id, u.userName ?? u.name ?? u.email)
        )
      );

      const locItems = extractArray(locs);
      setLocationOptions(locItems.map((l: any) => mkOption(l._id, l.name)));

      const cache: any = {};
      locItems.forEach((l: any) => (cache[l._id] = l));
      setLocationsStore(cache);
    } catch {
      toast.error("Failed to load dropdowns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // -------------------------------
  // VALIDATION
  // -------------------------------
  const validate = () => {
    const e: any = {};
    if (!formData.amavasyaId) e.amavasyaId = "Required";
    if (!formData.locationId) e.locationId = "Required";

    if (isBulk) {
      if (!bulkUserIds.length) e.userId = "Select users";
    } else {
      if (!formData.userId) e.userId = "Required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isBulk) {
        await api.post("/amavasyaUserLocation/bulk", {
          amavasyaId: formData.amavasyaId,
          locationId: formData.locationId,
          userIds: bulkUserIds,
          note: formData.note || null,
          isActive: formData.isActive,
        });
        toast.success("Users assigned successfully");
      } else {
        await api.post("/amavasyaUserLocation", {
          ...formData,
          note: formData.note || null,
        });
        toast.success("Created successfully");
      }
      navigate("/amavasyaUserLocation");
    } catch (err: any) {
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
        title="Assign User Location"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/amavasyaUserLocation")}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>Assignment Details</GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={!isBulk ? "default" : "outline"}
                  onClick={() => setIsBulk(false)}
                >
                  Single Assign
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isBulk ? "default" : "outline"}
                  onClick={() => setIsBulk(true)}
                >
                  Bulk Assign
                </Button>
              </div>

              <SearchableSelect
                label="Amavasya"
                options={amavasyaOptions}
                value={formData.amavasyaId}
                onChange={(v) => setFormData({ ...formData, amavasyaId: v })}
                error={errors.amavasyaId}
              />

              {!isBulk && (
                <SearchableSelect
                  label="User"
                  options={userOptions}
                  value={formData.userId}
                  onChange={(v) => setFormData({ ...formData, userId: v })}
                  error={errors.userId}
                />
              )}

              {isBulk && (
                <MultiSearchableSelect
                  label="Users"
                  options={userOptions}
                  value={bulkUserIds}
                  onChange={setBulkUserIds}
                  error={errors.userId}
                />
              )}

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
                <Label>Active Status</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isActive: v })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex gap-2 items-center">
              <MapPin className="h-5 w-5" /> Location Preview
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {selectedLocation ? (
              <>
                <h4 className="font-semibold">{selectedLocation.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation.description || "No description"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-center">
                Select location to preview
              </p>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
