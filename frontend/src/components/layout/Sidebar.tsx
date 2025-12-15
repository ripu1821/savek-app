import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Users,
  Shield,
  MapPin,
  Moon,
  Key,
  UserCog,
  Lock,
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Amavasya",
    href: "/amavasya",
    icon: Moon,
  },
  {
    title: "Locations",
    href: "/locations",
    icon: MapPin,
  },
  {
    title: "User Locations",
    href: "/amavasyaUserLocation",
    icon: MapPin,
  },
  {
    title: "Roles",
    href: "/roles",
    icon: Shield,
  },
  // {
  //   title: "Activities",
  //   href: "/activities",
  //   icon: Activity,
  // },
  // {
  //   title: "Activity Permissions",
  //   href: "/activity-permissions",
  //   icon: Key,
  // },
  // {
  //   title: "Permissions",
  //   href: "/permissions",
  //   icon: Lock,
  // },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed
            ? "-translate-x-full lg:translate-x-0 lg:w-20"
            : "w-72 lg:w-72",
          "lg:relative lg:translate-x-0",
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
              <span className="text-lg font-bold text-primary-foreground">
                S
              </span>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight">SEVAK</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() =>
                      window.innerWidth < 1024 && setCollapsed(true)
                    }
                  >
                    <item.icon
                      className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")}
                    />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {/* <div className="border-t border-sidebar-border p-3">
          <NavLink
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </div> */}
      </aside>
    </>
  );
}
