import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  CreditCard,
  FileText,
  LogOut,
  Bell,
  DollarSign,
  ClipboardList,
  Clock,
  ShieldCheck,
  Activity,
  Bot,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";

const patientNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Find Doctors", url: "/doctors", icon: Stethoscope },
  { title: "My Appointments", url: "/appointments", icon: Calendar },
  { title: "Medical Records", url: "/records", icon: FileText },
  { title: "My Reports", url: "/my-reports", icon: ImageIcon },
  { title: "AI Assistant", url: "/chat", icon: Bot },
  { title: "Credits", url: "/credits", icon: CreditCard },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const doctorNav = [
  { title: "Dashboard", url: "/doctor/dashboard", icon: LayoutDashboard },
  { title: "Appointments", url: "/doctor/appointments", icon: Calendar },
  { title: "Availability", url: "/doctor/availability", icon: Clock },
  { title: "Medical Records", url: "/doctor/records", icon: ClipboardList },
  { title: "AI Assistant", url: "/doctor/chat", icon: Bot },
  { title: "Payouts", url: "/doctor/payouts", icon: DollarSign },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const adminNav = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Activity },
  { title: "Verify Doctors", url: "/admin/doctors", icon: ShieldCheck },
  { title: "All Users", url: "/admin/users", icon: Users },
  { title: "Appointments", url: "/admin/appointments", icon: Calendar },
  { title: "Payouts", url: "/admin/payouts", icon: DollarSign },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar() {
  const { user, doctorProfile, setUser, setDoctorProfile } = useAuth();
  const [location, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      setDoctorProfile(null);
      qc.clear();
    },
  });

  const navItems =
    user?.role === "admin"
      ? adminNav
      : user?.role === "doctor"
      ? doctorNav
      : patientNav;

  const getVerificationBadge = () => {
    if (user?.role !== "doctor" || !doctorProfile) return null;
    const status = doctorProfile.verificationStatus;
    if (status === "pending") return <Badge variant="secondary" className="text-xs ml-auto">Pending</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs ml-auto">Rejected</Badge>;
    return null;
  };

  const handleLogoClick = () => {
    // Navigate to Express server homepage without logging out
    window.location.href = "http://localhost:5000/";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity w-full text-left"
          data-testid="button-logo"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">DentalCare</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || "Guest"} Portal
            </p>
          </div>
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                const isNotif = item.url === "/notifications";
                const isAI = item.title === "AI Assistant";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className={`h-4 w-4 shrink-0 ${isAI && !isActive ? "text-emerald-600" : ""}`} />
                        <span className="flex-1">{item.title}</span>
                        {isNotif && unreadCount > 0 && (
                          <Badge className="h-5 min-w-5 text-xs px-1.5">
                            {unreadCount}
                          </Badge>
                        )}
                        {isAI && (
                          <Badge variant="secondary" className="text-xs h-4 px-1 font-medium">AI</Badge>
                        )}
                        {item.title === "Dashboard" && getVerificationBadge()}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && (
          <div className="mb-2 px-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {user.role === "patient" && (
              <div className="mt-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">{user.creditBalance} credits</span>
              </div>
            )}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await logoutMutation.mutateAsync();
                window.location.href = "http://localhost:5000";
              }}
              data-testid="button-logout"
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
