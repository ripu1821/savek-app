import { useMemo } from "react";
import { Activity, Users, MapPin, Moon, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import useFetchDashboardData from "@/hooks/useFetchDashboardData";

/* =========================
   STATUS → BADGE COLOR
========================= */
const amavasyaStatusVariant = (status?: string) => {
  switch (status) {
    case "PAST":
      return "inactive"; // grey
    case "CURRENT":
      return "active"; // green
    case "FUTURE":
      return "primary"; // blue
    default:
      return "secondary";
  }
};

/* =========================
   STATUS → FULL ROW COLOR
========================= */
const amavasyaRowClass = (status?: string) => {
  switch (status) {
    case "CURRENT":
      return "bg-green-50 border border-green-200 hover:bg-green-100";
    case "FUTURE":
      return "bg-blue-50 border border-blue-200 hover:bg-blue-100";
    case "PAST":
      return "bg-gray-50 border border-gray-200 hover:bg-gray-100";
    default:
      return "bg-muted/30 hover:bg-muted/50";
  }
};

/* =========================
   DATE ONLY FORMATTER
========================= */
const formatDateOnly = (date?: string) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    amavasya,
    users,
    locations,
    userAttendanceRank,
    counts,
    loading,
    error,
  } = useFetchDashboardData();

  /* ================= STATS CARDS ================= */
  const statCards = useMemo(
    () => [
      {
        title: "Amavasya",
        count: counts?.amavasya ?? 0,
        icon: Moon,
        href: "/amavasya",
        gradient: "from-violet-500 to-purple-500",
      },
      {
        title: "Users",
        count: counts?.users ?? 0,
        icon: Users,
        href: "/users",
        gradient: "from-emerald-500 to-teal-500",
      },
      {
        title: "Locations",
        count: counts?.locations ?? 0,
        icon: MapPin,
        href: "/locations",
        gradient: "from-rose-500 to-pink-500",
      },
      {
        title: "User Locations",
        count: userAttendanceRank?.length ?? 0,
        icon: MapPin,
        href: "/amavasyaUserLocation/user",
        gradient: "from-indigo-500 to-purple-500",
      },
    ],
    [counts, userAttendanceRank]
  );

  const recentActivities = amavasya.slice(0, 5);

  return (
    <div className="page-enter">
      <PageHeader
        title="Dashboard"
        description="Welcome to SEVAK Admin Dashboard"
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          Error loading dashboard: {error}
        </div>
      )}

      {/* ================= STATS GRID ================= */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-muted/20 animate-pulse"
              />
            ))
          : statCards.map((stat, index) => (
              <Link
                key={stat.title}
                to={stat.href}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GlassCard
                  variant="elevated"
                  className="transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-up"
                >
                  <GlassCardContent className="flex items-center gap-4 min-h-[96px]">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                        stat.gradient
                      )}
                    >
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold">{stat.count}</p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </Link>
            ))}
      </div>

      {/* ================= CONTENT GRID ================= */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===== Upcoming Amavasya ===== */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              Upcoming Amavasya
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 w-full rounded-xl bg-muted/20 animate-pulse"
                    />
                  ))
                : recentActivities.map((activity) => (
                    <div
                      key={activity._id}
                      className={cn(
                        "flex items-center justify-between rounded-xl p-3 transition-colors",
                        amavasyaRowClass(activity.timeStatus)
                      )}
                    >
                      <div>
                        <p className="font-medium">
                          {activity.month} {activity.year}
                        </p>

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            <span className="font-medium text-foreground">
                              Start:
                            </span>{" "}
                            {formatDateOnly(activity.startDate)}{" "}
                            <span className="text-foreground font-medium">
                              {activity.startTime}
                            </span>
                          </p>

                          <p>
                            <span className="font-medium text-foreground">
                              End:
                            </span>{" "}
                            {formatDateOnly(activity.endDate)}{" "}
                            <span className="text-foreground font-medium">
                              {activity.endTime}
                            </span>
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        variant={amavasyaStatusVariant(activity.timeStatus)}
                      >
                        {activity.timeStatus}
                      </StatusBadge>
                    </div>
                  ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* ===== Recent Users ===== */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Users
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 w-full rounded-md bg-muted/20 animate-pulse"
                    />
                  ))
                : users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                          {user.userName?.charAt(0) ?? "U"}
                        </div>
                        <div>
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <StatusBadge variant="primary" showDot={false}>
                        {user.roleId?.name ?? "—"}
                      </StatusBadge>
                    </div>
                  ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* ===== Top Amavasya Attendees ===== */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Top Amavasya Attendees
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full rounded-md bg-muted/20 animate-pulse"
                  />
                ))
              ) : userAttendanceRank?.length ? (
                userAttendanceRank.slice(0, 5).map((item, index) => (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between rounded-xl bg-muted/30 p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          Total Attendance:{" "}
                          <span className="font-semibold text-foreground">
                            {item.totalAttendance}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/amavasyaUserLocation/user/${item.userId}`)
                      }
                      className="p-2 rounded-lg hover:bg-primary/10"
                      title="View Attendance"
                    >
                      <Eye className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No attendance data found
                </p>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
