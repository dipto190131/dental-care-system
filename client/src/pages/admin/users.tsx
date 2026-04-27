import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const roleColor: Record<string, string> = {
  patient: "bg-primary/10 text-primary",
  doctor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  admin: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const filtered = users.filter((u) => {
    const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const counts = {
    all: users.length,
    patient: users.filter((u) => u.role === "patient").length,
    doctor: users.filter((u) => u.role === "doctor").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Users</h1>
        <p className="text-muted-foreground mt-0.5">View and manage platform users.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.all, color: "bg-primary/10 text-primary" },
          { label: "Patients", value: counts.patient, color: "bg-secondary text-secondary-foreground" },
          { label: "Doctors", value: counts.doctor, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
          { label: "Admins", value: counts.admin, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-user-search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user: any) => (
            <Card key={user.id} data-testid={`user-row-${user.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 font-medium text-sm text-primary">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${roleColor[user.role]}`}>
                      {user.role}
                    </span>
                    {user.role === "patient" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        {user.creditBalance} credits
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </div>
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
