import { useMemo, useState } from "react";
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
      return "inactive";
    case "CURRENT":
      return "active";
    case "FUTURE":
      return "primary";
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

  const { amavasya, users, userAttendanceRank, counts, loading, error } =
    useFetchDashboardData();

  /* 🔍 SEARCH STATE (ONLY FOR ATTENDEES) */
  const [attendanceSearch, setAttendanceSearch] = useState("");

  /* 🔍 FILTERED ATTENDEES */
  const filteredAttendance = useMemo(() => {
    if (!attendanceSearch) return userAttendanceRank;

    return userAttendanceRank.filter((item) =>
      item.userName?.toLowerCase().includes(attendanceSearch.toLowerCase())
    );
  }, [attendanceSearch, userAttendanceRank]);

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
                <GlassCard variant="elevated">
                  <GlassCardContent className="flex items-center gap-4 min-h-[96px]">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
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
      <div className="grid gap-6 lg:grid-cols-2">
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
                        "flex items-center justify-between rounded-xl p-3",
                        amavasyaRowClass(activity.timeStatus)
                      )}
                    >
                      <div>
                        <p className="font-medium">
                          {activity.month} {activity.year}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateOnly(activity.startDate)} →{" "}
                          {formatDateOnly(activity.endDate)}
                        </p>
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
        {/* <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Users
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
                >
                  <p className="font-medium">{user.userName}</p>
                  <StatusBadge variant="primary" showDot={false}>
                    {user.roleId?.name ?? "—"}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard> */}

        {/* ===== Top Amavasya Attendees ===== */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Top Amavasya Attendees
            </GlassCardTitle>

            {/* 🔍 SEARCH */}
          <div className="relative mt-3">
  <input
    type="text"
    placeholder="Search user..."
    value={attendanceSearch}
    onChange={(e) => setAttendanceSearch(e.target.value)}
    className="w-full rounded-md border bg-background px-3 py-2 pr-9 text-sm
               focus:outline-none focus:ring-2 focus:ring-primary"
  />

  {attendanceSearch && (
    <button
      type="button"
      onClick={() => setAttendanceSearch("")}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      title="Clear"
    >
      ✕
    </button>
  )}
</div>

          </GlassCardHeader>

          <GlassCardContent>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : filteredAttendance.length ? (
                filteredAttendance.map((item, index) => (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          Total Attendance:{" "}
                          <span className="font-semibold">
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
                    >
                      <Eye className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No matching users found
                </p>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
