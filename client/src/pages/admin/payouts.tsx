import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  paid: "bg-primary/10 text-primary",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminPayouts() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: payouts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/payouts"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/payouts/${id}`, { status });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Payout updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const totalPending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payout Management</h1>
        <p className="text-muted-foreground mt-0.5">Review and process doctor payout requests.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-foreground">{totalPending}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-foreground">{totalPaid}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No payout requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p: any) => (
            <Card key={p.id} data-testid={`payout-row-${p.id}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 font-medium text-sm text-primary">
                      {p.doctor?.user?.firstName?.[0]}{p.doctor?.user?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Dr. {p.doctor?.user?.firstName} {p.doctor?.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{p.doctor?.specialty}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(p.requestedAt), "MMM d, yyyy")}</span>
                        <span className="font-semibold text-foreground">{p.amount} credits</span>
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColor[p.status]}`}>
                      {p.status}
                    </span>
                    {p.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: p.id, status: "paid" })}
                          disabled={updateMutation.isPending}
                          className="gap-1"
                          data-testid={`button-pay-${p.id}`}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: p.id, status: "rejected" })}
                          disabled={updateMutation.isPending}
                          className="gap-1 text-destructive"
                          data-testid={`button-reject-payout-${p.id}`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
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
