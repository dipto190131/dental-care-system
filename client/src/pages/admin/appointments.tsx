import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useState } from "react";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminAppointments() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/appointments"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/appointments/${id}`, { status });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Appointment updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/appointments"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const filtered = appointments.filter((a) => {
    const text = `${a.patient?.firstName} ${a.patient?.lastName} ${a.doctor?.firstName} ${a.doctor?.lastName}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Appointments</h1>
        <p className="text-muted-foreground mt-0.5">Monitor and manage platform appointments.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-appointment-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No appointments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt: any) => (
            <Card key={appt.id} data-testid={`admin-appt-${appt.id}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                      <p className="text-sm font-semibold text-foreground">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </p>
                      <span className="text-xs text-muted-foreground">→</span>
                      <p className="text-sm font-semibold text-foreground">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </p>
                      <span className="text-xs text-muted-foreground">({appt.doctorProfile?.specialty})</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(appt.createdAt), "MMM d, yyyy")}</span>
                      <span>{appt.creditsCost} credits</span>
                    </div>
                    {appt.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{appt.notes}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColor[appt.status]}`}>
                      {appt.status}
                    </span>
                    {appt.status !== "cancelled" && appt.status !== "completed" && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: appt.id, status: "completed" })}
                          disabled={updateMutation.isPending}
                          data-testid={`button-complete-${appt.id}`}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: appt.id, status: "cancelled" })}
                          disabled={updateMutation.isPending}
                          className="text-destructive"
                          data-testid={`button-cancel-appt-${appt.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
