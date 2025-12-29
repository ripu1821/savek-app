import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Moon,
  Search,
  RotateCcw,
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

export default function AmavasyaUserLocationDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 FILTER STATES
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // year input + api year
  const [yearInput, setYearInput] = useState("");
  const [year, setYear] = useState("all");

  /* =====================
      API CALL
  ====================== */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: any = {};

        if (year !== "all") params.year = year;
        if (status !== "all") params.status = status;
        if (search.trim()) params.search = search.trim();

        const resp = await api.get(
          `/amavasyaUserLocation/userAttendance/${userId}`,
          { params }
        );

        setData(resp?.data?.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "Failed to load attendance"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, year, status, search]);

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="Loading..." />
        <div className="py-10 text-center text-muted-foreground">
          Loading attendance...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-enter">
        <PageHeader title="Not Found" />
        <div className="py-10 text-center text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* =====================
          HEADER
      ====================== */}
      <PageHeader
        title="Amavasya Attendance"
        description={
          data?.user
            ? `${data.user.name} • ${data.user.email}`
            : "User presence across all amavasya"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "User Locations", href: "/amavasyaUserLocation" },
          { label: "Attendance" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/amavasyaUserLocation/user")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* =====================
          USER DETAILS CARD
      ====================== */}
      <GlassCard className="mb-6">
        <GlassCardContent className="p-4 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{data.user?.userName ?? "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{data.user?.email ?? "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Mobile</p>
            <p className="font-medium">{data.user?.mobileNumber ?? "-"}</p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* =====================
          SUMMARY CARDS (DO NOT REMOVE)
      ====================== */}
      {/* <div className="grid gap-4 mb-6 md:grid-cols-4">
        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Amavasya</p>
            <p className="text-2xl font-bold">{data.totalAmavasya}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-green-600">{data.present}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{data.absent}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Continuous Present</p>
            <p className="text-2xl font-bold text-primary">
              {data.continuousPresentCount}
            </p>
          </GlassCardContent>
        </GlassCard>
      </div> */}

      {/* =====================
          FILTER BAR
      ====================== */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search month (Jan, Feb...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-md border pl-8 pr-3 text-sm"
          />
        </div>

        <input
          type="number"
          placeholder="Year"
          value={yearInput}
          onChange={(e) => {
            const val = e.target.value;

            if (val === "") {
              setYearInput("");
              setYear("all");
              return;
            }

            if (val.length > 4) return;

            setYearInput(val);

            if (val.length === 4) setYear(val);
            else setYear("all");
          }}
          className="h-9 w-32 rounded-md border px-3 text-sm"
          min={1900}
          max={2100}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch("");
            setStatus("all");
            setYearInput("");
            setYear("all");
          }}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* =====================
          ATTENDANCE LIST
      ====================== */}
      <div className="space-y-4">
        {data.items.length === 0 && (
          <p className="text-center text-muted-foreground py-6">
            No records found
          </p>
        )}

        {data.items.map((item: any) => {
          const isAbsent = item.status === "Absent";

          return (
            <GlassCard
              key={item.amavasyaId}
              className={
                isAbsent
                  ? "border border-red-300 bg-red-50/60 dark:bg-red-950/20"
                  : ""
              }
            >
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 ${
                      isAbsent ? "text-red-700 dark:text-red-400" : ""
                    }`}
                  >
                    <Moon className="h-4 w-4 text-primary" />
                    {item.month} {item.year}
                  </div>

                  <StatusBadge variant={isAbsent ? "inactive" : "active"}>
                    {item.status}
                  </StatusBadge>
                </GlassCardTitle>
              </GlassCardHeader>

              <GlassCardContent className="space-y-2">
                <div
                  className={`flex items-center gap-2 text-sm ${
                    isAbsent ? "text-red-600" : "text-muted-foreground"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {new Date(item.startDate).toDateString()} →{" "}
                  {new Date(item.endDate).toDateString()}
                </div>

                {item.status === "Present" && item.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {item.location}
                  </div>
                )}

                {isAbsent && (
                  <p className="text-xs font-medium text-red-600">
                    User was absent on this Amavasya
                  </p>
                )}
              </GlassCardContent>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
