import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sun, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import PatientDashboard from "@/pages/patient/dashboard";
import DoctorsPage from "@/pages/patient/doctors";
import DoctorDetailPage from "@/pages/patient/doctor-detail";
import AppointmentsPage from "@/pages/patient/appointments";
import CreditsPage from "@/pages/patient/credits";
import MedicalRecordsPage from "@/pages/patient/medical-records";
import DoctorDashboard from "@/pages/doctor/dashboard";
import DoctorAppointments from "@/pages/doctor/appointments";
import DoctorAvailability from "@/pages/doctor/availability";
import DoctorRecords from "@/pages/doctor/records";
import DoctorPayouts from "@/pages/doctor/payouts";
import DoctorChat from "@/pages/doctor/chat";
import PatientChat from "@/pages/patient/chat";
import MyReportsPage from "@/pages/patient/my-reports";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDoctors from "@/pages/admin/doctors";
import AdminUsers from "@/pages/admin/users";
import AdminAppointments from "@/pages/admin/appointments";
import AdminPayouts from "@/pages/admin/payouts";
import NotificationsPage from "@/pages/notifications";
import NotFound from "@/pages/not-found";

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <Button size="icon" variant="ghost" onClick={() => setDark(!dark)} data-testid="button-theme-toggle">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ component: Component, role }: { component: React.ComponentType; role?: string | string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Redirect to="/login" />;
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) return <Redirect to="/login" />;
  }
  return <AppShell><Component /></AppShell>;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;
  if (user) {
    if (user.role === "admin") return <Redirect to="/admin/dashboard" />;
    if (user.role === "doctor") return <Redirect to="/doctor/dashboard" />;
    return <Redirect to="/dashboard" />;
  }
  return <Component />;
}

function LandingRoute({ component: Component }: { component: React.ComponentType }) {
  const { loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <LandingRoute component={LandingPage} />} />
      <Route path="/login" component={() => <PublicRoute component={LoginPage} />} />
      <Route path="/register" component={() => <PublicRoute component={RegisterPage} />} />

      <Route path="/dashboard" component={() => <ProtectedRoute component={PatientDashboard} role="patient" />} />
      <Route path="/doctors" component={() => <ProtectedRoute component={DoctorsPage} role="patient" />} />
      <Route path="/doctors/:id" component={() => <ProtectedRoute component={DoctorDetailPage} role="patient" />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={AppointmentsPage} role="patient" />} />
      <Route path="/credits" component={() => <ProtectedRoute component={CreditsPage} role="patient" />} />
      <Route path="/records" component={() => <ProtectedRoute component={MedicalRecordsPage} role="patient" />} />
      <Route path="/my-reports" component={() => <ProtectedRoute component={MyReportsPage} role="patient" />} />
      <Route path="/chat" component={() => <ProtectedRoute component={PatientChat} role="patient" />} />

      <Route path="/doctor/dashboard" component={() => <ProtectedRoute component={DoctorDashboard} role="doctor" />} />
      <Route path="/doctor/appointments" component={() => <ProtectedRoute component={DoctorAppointments} role="doctor" />} />
      <Route path="/doctor/availability" component={() => <ProtectedRoute component={DoctorAvailability} role="doctor" />} />
      <Route path="/doctor/records" component={() => <ProtectedRoute component={DoctorRecords} role="doctor" />} />
      <Route path="/doctor/payouts" component={() => <ProtectedRoute component={DoctorPayouts} role="doctor" />} />
      <Route path="/doctor/chat" component={() => <ProtectedRoute component={DoctorChat} role="doctor" />} />

      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} role="admin" />} />
      <Route path="/admin/doctors" component={() => <ProtectedRoute component={AdminDoctors} role="admin" />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} role="admin" />} />
      <Route path="/admin/appointments" component={() => <ProtectedRoute component={AdminAppointments} role="admin" />} />
      <Route path="/admin/payouts" component={() => <ProtectedRoute component={AdminPayouts} role="admin" />} />

      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
