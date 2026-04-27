import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Stethoscope, Calendar, ShieldCheck, CheckCircle, XCircle, Activity, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/doctors"],
  });

  const pendingDoctors = doctors.filter((d) => d.verificationStatus === "pending");

  const statCards = [
    { label: "Total Patients", value: stats?.totalPatients ?? 0, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Doctors", value: stats?.totalDoctors ?? 0, icon: Stethoscope, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
    { label: "Total Appointments", value: stats?.totalAppointments ?? 0, icon: Calendar, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
    { label: "Pending Verifications", value: stats?.pendingVerifications ?? 0, icon: ShieldCheck, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
    { label: "Completed", value: stats?.completedAppointments ?? 0, icon: CheckCircle, color: "bg-primary/10 text-primary" },
    { label: "Cancelled", value: stats?.cancelledAppointments ?? 0, icon: XCircle, color: "bg-secondary text-secondary-foreground" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-0.5">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md mb-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mb-0.5" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Pending Verifications
            </CardTitle>
            <Link href="/admin/doctors">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingDoctors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up! No pending verifications.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDoctors.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-md border border-border p-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0 font-medium text-sm text-primary">
                        {doc.user.firstName[0]}{doc.user.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Dr. {doc.user.firstName} {doc.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                      </div>
                    </div>
                    <Link href="/admin/doctors">
                      <Button size="sm" variant="outline" data-testid={`button-review-${doc.id}`}>Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/doctors">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Verify Doctors
                {(stats?.pendingVerifications || 0) > 0 && (
                  <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                    {stats.pendingVerifications}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/admin/appointments">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Manage Appointments
              </Button>
            </Link>
            <Link href="/admin/payouts">
              <Button variant="outline" className="w-full justify-start gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Process Payouts
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4 text-primary" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
