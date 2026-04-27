import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CreditCard, FileText, Stethoscope, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { format } from "date-fns";

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: appointments = [], isLoading: apptLoading } = useQuery<any[]>({
    queryKey: ["/api/patient/appointments"],
  });

  const { data: creditData, isLoading: creditLoading } = useQuery<any>({
    queryKey: ["/api/patient/credits"],
  });

  const upcomingAppts = appointments.filter((a) =>
    ["pending", "confirmed"].includes(a.status)
  );
  const recentAppts = appointments.slice(0, 3);

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good day, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-0.5">Here's an overview of your dental care.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Credits</p>
                {creditLoading ? (
                  <Skeleton className="h-6 w-16 mt-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{creditData?.balance ?? user?.creditBalance ?? 0}</p>
                )}
              </div>
            </div>
            <Link href="/credits">
              <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" data-testid="button-buy-credits">
                Buy Credits
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{upcomingAppts.length}</p>
              </div>
            </div>
            <Link href="/appointments">
              <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" data-testid="button-view-appointments">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
              </div>
            </div>
            <Link href="/records">
              <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" data-testid="button-view-records">
                Medical Records
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
              <CardTitle className="text-base font-semibold">Recent Appointments</CardTitle>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {apptLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              ) : recentAppts.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No appointments yet.</p>
                  <Link href="/doctors">
                    <Button size="sm" className="mt-3 gap-1.5" data-testid="button-find-doctor">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Find a Dentist
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAppts.map((appt: any) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between rounded-md border border-border p-3 gap-3"
                      data-testid={`appt-item-${appt.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <Stethoscope className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {appt.slot ? `${appt.slot.date} · ${appt.slot.startTime}` : "Date TBD"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${statusColor[appt.status]}`}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/doctors">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-book-appointment">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Book Appointment
                </Button>
              </Link>
              <Link href="/credits">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-top-up-credits">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Top Up Credits
                </Button>
              </Link>
              <Link href="/records">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-view-records-2">
                  <FileText className="h-4 w-4 text-primary" />
                  View Records
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
