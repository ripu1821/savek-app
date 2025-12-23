import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Shield,
  MapPin,
  Moon,
  ChevronLeft,
  Menu,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users },
  { title: "Amavasya", href: "/amavasya", icon: Moon },
  { title: "Locations", href: "/locations", icon: MapPin },
  {
    title: "User Amavasya Attendance",
    href: "/amavasyaUserLocation/user",
    icon: MapPin,
  },
  {
    title: "Amavasya User Location",
    href: "/amavasyaUserLocation",
    icon: MapPin,
  },
  // { title: "Roles", href: "/roles", icon: Shield },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  /** 🔥 FIXED ACTIVE LOGIC */
  const isNavActive = (href: string) => {
    // Exact match
    if (location.pathname === href) return true;

    // Child routes match (but avoid prefix conflict)
    if (
      location.pathname.startsWith(href + "/") &&
      href !== "/amavasyaUserLocation"
    ) {
      return true;
    }

    return false;
  };

  return (
    <>
      {/* =========================
          FIXED TOP HEADER
      ========================== */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight">SEVAK</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* =========================
          MOBILE OVERLAY
      ========================== */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-72",
          "lg:relative lg:translate-x-0",
          className
        )}
      >
        {/* DESKTOP COLLAPSE BUTTON */}
        <div className="flex justify-end border-b px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const active = isNavActive(item.href);

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={() =>
                      window.innerWidth < 1024 && setCollapsed(true)
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
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
      </aside>

      {/* CONTENT SPACER */}
      <div className="h-16" />
    </>
  );
}
