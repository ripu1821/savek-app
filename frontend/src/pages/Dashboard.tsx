// src/pages/Dashboard.tsx
import { useMemo } from "react";
import { Activity, Users, MapPin, Shield, Moon, Lock } from "lucide-react";
import { Link } from "react-router-dom";
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
  const {
    amavasya,
    users,
    roles,
    locations,
    permissions,
    amavasyaUserLocations,
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
        title: "Roles",
        count: roles.length,
        active: roles.filter((r) => r.isActive).length,
        icon: Shield,
        href: "/roles",
        gradient: "from-orange-500 to-amber-500",
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
      {
        title: "Permissions",
        count: permissions.length,
        active: permissions.filter((p) => p.status === "Active").length,
        icon: Lock,
        href: "/permissions",
        gradient: "from-cyan-500 to-blue-500",
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

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
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
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <GlassCardContent className="flex items-center gap-4">
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
                      <div className="flex items-baseline gap-2">
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

      {/* Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard
          variant="elevated"
          className="animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
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
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {activity.month} {activity.year}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.startDate
                            ? new Date(activity.startDate).toLocaleDateString()
                            : `${activity.startTime ?? ""} - ${
                                activity.endTime ?? ""
                              }`}
                        </p>
                        {activity.startTime && activity.endTime && (
                          <p className="text-xs text-muted-foreground">
                            {activity.startTime} - {activity.endTime}
                          </p>
                        )}
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

        {/* Recent Users card — same as before but uses live `users` */}
        <GlassCard
          variant="elevated"
          className="animate-slide-up"
          style={{ animationDelay: "350ms" }}
        >
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
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
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
      </div>
    </div>
  );
}
