import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Shield,
  MapPin,
  Moon,
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Map,
  UserCheck,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* =========================
   NAVIGATION ITEMS
========================= */
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
    icon: Map, // 🌍 list of locations
  },
  {
    title: "User Amavasya Attendance",
    href: "/amavasyaUserLocation/user",
    icon: UserCheck, // ✅ user attendance
  },
  {
    title: "Amavasya User Location",
    href: "/amavasyaUserLocation",
    icon: MapPin, // 📍 specific location
  },
  {
    title: "Roles",
    href: "/roles",
    icon: Shield,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  /* =========================
     ACTIVE ROUTE LOGIC
  ========================= */
  const isNavActive = (href: string) => {
    if (location.pathname === href) return true;

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
          MOBILE HEADER
      ========================== */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between border-b bg-background px-4 lg:hidden">
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
          "lg:relative lg:top-0 lg:h-screen lg:translate-x-0",
          className
        )}
      >
        {/* =========================
            DESKTOP BRAND
        ========================== */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
              <span className="text-sm font-bold text-primary-foreground">
                S
              </span>
            </div>

            {!collapsed && (
              <span className="font-semibold tracking-tight">SEVAK</span>
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
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* =========================
            NAVIGATION
        ========================== */}
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

        {/* =========================
            USER INFO & LOGOUT
        ========================== */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-2 text-sm">
              <p className="font-medium text-sidebar-foreground truncate">
                {user.userName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center"
            )}
          >
            <LogOut className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER SPACER */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
