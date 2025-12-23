import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Moon } from "lucide-react";

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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const resp = await api.get(
          `/amavasyaUserLocation/userAttendance/${userId}`
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
  }, [userId]);

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
      {/* HEADER */}
      <PageHeader
        title="Amavasya Attendance"
        description="User presence across all amavasya"
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
          SUMMARY CARDS
      ====================== */}
      <div className="grid gap-4 mb-6 md:grid-cols-4">
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

        {/* 🔥 NEW COUNT */}
        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Continuous Present</p>
            <p className="text-2xl font-bold text-primary">
              {data.continuousPresentCount}
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* =====================
          ATTENDANCE LIST
      ====================== */}
      <div className="space-y-4">
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
