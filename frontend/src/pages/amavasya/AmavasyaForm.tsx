// src/pages/AmavasyaForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Save, ArrowLeft, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Month } from "@/types/models";

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const months: Month[] = FULL_MONTHS;
const monthOptions = months.map((m) => ({ value: m, label: m }));

interface AmavasyaFormData {
  month: Month;
  year: number;
  startDate?: Date | null;
  endDate?: Date | null;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isActive: boolean;
}

// --- helpers ---------------------------------------------------------------

// robust payload extractor (handles resp.data.data, resp.data.data.items, resp.data)
function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) {
    return d.items.length ? d.items[0] : null;
  }
  return d;
}

// normalize different time shapes to "HH:mm" string or ""
// accepts "HH:mm", "HH:mm:ss", ISO datetime string, Date instance
function normalizeTimeString(input: any): string {
  if (input === null || typeof input === "undefined" || input === "") return "";
  if (input instanceof Date && !isNaN(input.getTime())) {
    const hh = String(input.getHours()).padStart(2, "0");
    const mm = String(input.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (typeof input === "string") {
    // HH:mm or H:mm
    const hhmm = input.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;

    // HH:mm:ss
    const hhmmss = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hhmmss) return `${hhmmss[1].padStart(2, "0")}:${hhmmss[2]}`;

    // ISO datetime
    const iso = /^\d{4}-\d{2}-\d{2}T/;
    if (iso.test(input)) {
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
    }

    // fallback: try Date.parse
    const parsed = Date.parse(input);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`;
    }
  }
  return "";
}

// map server validation shape to field errors
function mapServerErrorsToFields(
  serverErrors: any
): Partial<Record<keyof AmavasyaFormData, string>> {
  const out: Partial<Record<keyof AmavasyaFormData, string>> = {};
  if (!serverErrors) return out;
  const maybe = serverErrors.errors ?? serverErrors;
  if (typeof maybe !== "object") return out;
  for (const k of Object.keys(maybe)) {
    const val = maybe[k];
    const key = k as keyof AmavasyaFormData;
    if (Array.isArray(val)) out[key] = val.join(" ");
    else if (typeof val === "string") out[key] = val;
    else if (val && typeof val.message === "string") out[key] = val.message;
  }
  return out;
}

// map short/various month forms to full month names
function expandMonth(input: any): string {
  if (input === null || typeof input === "undefined") return "";
  if (typeof input === "string") {
    const trimmed = input.trim();
    // exact full month match (case-insensitive)
    const fullMatch = FULL_MONTHS.find(
      (m) => m.toLowerCase() === trimmed.toLowerCase()
    );
    if (fullMatch) return fullMatch;
    // short form like "Dec", "Sep"
    const short = trimmed.slice(0, 3).toLowerCase();
    const idx = FULL_MONTHS.findIndex(
      (m) => m.slice(0, 3).toLowerCase() === short
    );
    if (idx >= 0) return FULL_MONTHS[idx];
    // numeric month like "12" or 12
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= 12)
      return FULL_MONTHS[asNum - 1];
  }
  if (
    typeof input === "number" &&
    Number.isInteger(input) &&
    input >= 1 &&
    input <= 12
  ) {
    return FULL_MONTHS[input - 1];
  }
  // fallback: return stringified input
  return String(input);
}

// --------------------------------------------------------------------------

export default function AmavasyaForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateItem = (location.state as any)?.item ?? null;
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<AmavasyaFormData>({
    month: "January",
    year: new Date().getFullYear(),
    startDate: undefined,
    endDate: undefined,
    startTime: "",
    endTime: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AmavasyaFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loadAmavasya = useCallback(async (amId: string) => {
    if (!amId) return;
    setLoading(true);
    setGeneralError(null);
    try {
      const resp = await api.get(`/amavasya/${amId}`);
      const payload = extractPayload(resp) ?? resp?.data ?? null;
      if (!payload) {
        setGeneralError("Amavasya not found");
        return;
      }

      const normalized = {
        month: expandMonth(
          payload.month ?? payload.monthName ?? "January"
        ) as Month,
        year: Number(payload.year) || new Date().getFullYear(),
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        startTime:
          normalizeTimeString(payload.startTime) ||
          (payload.startDate ? normalizeTimeString(payload.startDate) : ""),
        endTime:
          normalizeTimeString(payload.endTime) ||
          (payload.endDate ? normalizeTimeString(payload.endDate) : ""),
        isActive:
          typeof payload.isActive === "boolean"
            ? payload.isActive
            : Boolean(payload.active),
      };

      setFormData(normalized);
    } catch (err: any) {
      console.error("Failed to load amavasya", err);
      setGeneralError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load amavasya"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // If the navigator passed the item in state, use it (avoid refetch). Otherwise fetch if editing.
  useEffect(() => {
    if (stateItem) {
      // use location.state item if available (normalize shape)
      const p = stateItem;
      const normalized = {
        month: expandMonth(p.month ?? p.monthName ?? "January") as Month,
        year: Number(p.year) || new Date().getFullYear(),
        startDate: p.startDate ? new Date(p.startDate) : undefined,
        endDate: p.endDate ? new Date(p.endDate) : undefined,
        startTime:
          normalizeTimeString(p.startTime) ||
          (p.startDate ? normalizeTimeString(p.startDate) : ""),
        endTime:
          normalizeTimeString(p.endTime) ||
          (p.endDate ? normalizeTimeString(p.endDate) : ""),
        isActive:
          typeof p.isActive === "boolean" ? p.isActive : Boolean(p.active),
      };
      setFormData(normalized);
    } else if (isEdit && id) {
      loadAmavasya(id);
    }
  }, [stateItem, isEdit, id, loadAmavasya]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AmavasyaFormData, string>> = {};
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (
      formData.endDate &&
      formData.startDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = "End date must be after start date";
    }
    // Optional: validate time format HH:mm
    const timeRegex = /^\d{2}:\d{2}$/;
    if (formData.startTime && !timeRegex.test(formData.startTime)) {
      newErrors.startTime = "Start time must be in HH:mm format";
    }
    if (formData.endTime && !timeRegex.test(formData.endTime)) {
      newErrors.endTime = "End time must be in HH:mm format";
    }

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
      const payload: any = {
        // always send expanded full month name
        month: expandMonth(formData.month),
        year: formData.year,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
        // keep times as strings "HH:mm" (or null)
        startTime: formData.startTime ? formData.startTime : null,
        endTime: formData.endTime ? formData.endTime : null,
        isActive: formData.isActive,
      };

      if (isEdit && id) {
        await api.put(`/amavasya/${id}`, payload);
        toast.success("Amavasya updated successfully");
      } else {
        await api.post("/amavasya", payload);
        toast.success("Amavasya created successfully");
      }

      navigate("/amavasya");
    } catch (err: any) {
      console.error("Save error", err);
      const serverData = err?.response?.data ?? null;

      // Map field errors if provided by server
      const mapped = mapServerErrorsToFields(
        serverData ?? err?.response?.data?.errors
      );
      if (Object.keys(mapped).length) setErrors((p) => ({ ...p, ...mapped }));

      const msg =
        serverData?.message ??
        serverData?.error ??
        err?.message ??
        "Failed to save amavasya";
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Amavasya" : "Create Amavasya"}
        description={
          isEdit ? "Update amavasya details" : "Add a new amavasya record"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Amavasya", href: "/amavasya" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/amavasya")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <GlassCard variant="elevated" className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>Amavasya Details</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading amavasya...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                  {generalError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <SearchableSelect
                  label="Month"
                  options={monthOptions}
                  value={formData.month}
                  onChange={(value) =>
                    setFormData({ ...formData, month: value as Month })
                  }
                />

                <FloatingInput
                  label="Year"
                  type="number"
                  value={String(formData.year)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year:
                        parseInt(e.target.value || "", 10) ||
                        new Date().getFullYear(),
                    })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(formData.startDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate ?? undefined}
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            startDate: date ?? undefined,
                          })
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-xs text-destructive">
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate
                          ? format(formData.endDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate ?? undefined}
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            endDate: date ?? undefined,
                          })
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingInput
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
                <FloatingInput
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                <div>
                  <Label htmlFor="isActive" className="font-medium">
                    Active Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Amavasya is currently active
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: Boolean(checked) })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/amavasya")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update Amavasya" : "Create Amavasya"}
                </Button>
              </div>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
