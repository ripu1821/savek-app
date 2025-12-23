// src/pages/Dashboard.tsx
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

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    amavasya,
    users,
    roles,
    locations,
    permissions,
    amavasyaUserLocations,
    userAttendanceRank,
    loading,
    error,
  } = useFetchDashboardData();

  // build statCards from live state
  const statCards = useMemo(
    () => [
      {
        title: "Amavasya",
        count: amavasya.length,
        active: amavasya.filter((a) => a.isActive).length,
        icon: Moon,
        href: "/amavasya",
        gradient: "from-violet-500 to-purple-500",
      },
      {
        title: "Users",
        count: users.length,
        active: users.filter((u) => u.isActive).length,
        icon: Users,
        href: "/users",
        gradient: "from-emerald-500 to-teal-500",
      },
      {
        title: "Locations",
        count: locations.length,
        active: locations.filter((l) => l.isActive).length,
        icon: MapPin,
        href: "/locations",
        gradient: "from-rose-500 to-pink-500",
      },
      {
        title: "User Locations",
        count: amavasyaUserLocations.length,
        active: amavasyaUserLocations.filter((a) => a.isActive === true).length,
        icon: MapPin,
        href: "/amavasya-user-locations",
        gradient: "from-indigo-500 to-purple-500",
      },
    ],
    [amavasya, users, roles, locations, permissions, amavasyaUserLocations]
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
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                        <p className="text-3xl font-bold">{stat.count}</p>
                        <span className="text-xs text-muted-foreground">
                          ({stat.active} active)
                        </span>
                      </div>
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
                      key={activity.id}
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {activity.month} {activity.year}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.startDate &&
                            new Date(activity.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge
                        variant={activity.isActive ? "active" : "inactive"}
                      >
                        {activity.isActive ? "Active" : "Inactive"}
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
