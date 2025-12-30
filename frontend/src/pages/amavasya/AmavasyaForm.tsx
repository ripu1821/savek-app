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

/* -------------------------------------------------------------------------- */
/* CONSTANTS */
/* -------------------------------------------------------------------------- */

const FULL_MONTHS: Month[] = [
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

const monthOptions = FULL_MONTHS.map((m) => ({
  label: m,
  value: m,
}));

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

interface AmavasyaFormData {
  month: Month;
  year: number;
  startDate?: Date;
  endDate?: Date;
  startTime: string; // "08:30 AM"
  endTime: string; // "10:15 PM"
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */

function expandMonth(input: any): Month {
  const found = FULL_MONTHS.find(
    (m) => m.toLowerCase() === String(input).toLowerCase()
  );
  return found ?? "January";
}

function getMonthDate(month: Month, year: number) {
  return new Date(year, FULL_MONTHS.indexOf(month), 1);
}

/* -------------------------------------------------------------------------- */
/* 12-HOUR TIME INPUT COMPONENT */
/* -------------------------------------------------------------------------- */

function Time12Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [time, setTime] = useState("08:00");
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (value) {
      const [t, m] = value.split(" ");
      if (t && m) {
        setTime(t);
        setMeridiem(m as "AM" | "PM");
      }
    }
  }, [value]);

  const update = (t = time, m = meridiem) => {
    onChange(`${t} ${m}`);
  };

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            update(e.target.value, meridiem);
          }}
          className="flex-1 rounded-md border px-2 py-2"
        />
        <select
          value={meridiem}
          onChange={(e) => {
            setMeridiem(e.target.value as "AM" | "PM");
            update(time, e.target.value as "AM" | "PM");
          }}
          className="rounded-md border px-3"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT */
/* -------------------------------------------------------------------------- */

export default function AmavasyaForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateItem = (location.state as any)?.item;
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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* LOAD DATA (EDIT MODE) */
  /* ---------------------------------------------------------------------- */

  const loadAmavasya = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/amavasya/${id}`);
      const d = res.data.data ?? res.data;

      setFormData({
        month: expandMonth(d.month),
        year: Number(d.year),
        startDate: d.startDate ? new Date(d.startDate) : undefined,
        endDate: d.endDate ? new Date(d.endDate) : undefined,
        startTime: d.startTime ?? "",
        endTime: d.endTime ?? "",
        isActive: Boolean(d.isActive),
      });
    } catch {
      toast.error("Failed to load amavasya");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (stateItem) {
      setFormData({
        month: expandMonth(stateItem.month),
        year: Number(stateItem.year),
        startDate: stateItem.startDate
          ? new Date(stateItem.startDate)
          : undefined,
        endDate: stateItem.endDate ? new Date(stateItem.endDate) : undefined,
        startTime: stateItem.startTime ?? "",
        endTime: stateItem.endTime ?? "",
        isActive: Boolean(stateItem.isActive),
      });
    } else if (isEdit) {
      loadAmavasya();
    }
  }, [stateItem, isEdit, loadAmavasya]);

  /* ---------------------------------------------------------------------- */
  /* SUBMIT */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
      };

      if (isEdit) {
        await api.put(`/amavasya/${id}`, payload);
        toast.success("Amavasya updated");
      } else {
        await api.post("/amavasya", payload);
        toast.success("Amavasya created");
      }

      navigate("/amavasya");
    } catch {
      toast.error("Failed to save amavasya");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* UI */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Amavasya" : "Create Amavasya"}
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

      <GlassCard className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>Amavasya Details</GlassCardTitle>
        </GlassCardHeader>

        <GlassCardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Month"
                  options={monthOptions}
                  value={formData.month}
                  onChange={(v) =>
                    setFormData({ ...formData, month: v as Month })
                  }
                />

                <FloatingInput
                  label="Year"
                  type="number"
                  value={String(formData.year)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* START DATE */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(formData.startDate, "PPP")
                          : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        month={getMonthDate(formData.month, formData.year)}
                        onSelect={(d) =>
                          setFormData({ ...formData, startDate: d })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* END DATE */}
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate
                          ? format(formData.endDate, "PPP")
                          : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        month={getMonthDate(formData.month, formData.year)}
                        onSelect={(d) =>
                          setFormData({ ...formData, endDate: d })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* TIME */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Time12Input
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(v) => setFormData({ ...formData, startTime: v })}
                />
                <Time12Input
                  label="End Time"
                  value={formData.endTime}
                  onChange={(v) => setFormData({ ...formData, endTime: v })}
                />
              </div>

              {/* ACTIVE */}
              <div className="flex justify-between items-center rounded-xl bg-muted/30 p-4">
                <Label>Active Status</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isActive: Boolean(v) })
                  }
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/amavasya")}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
