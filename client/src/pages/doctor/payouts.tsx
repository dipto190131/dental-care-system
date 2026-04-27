import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useState } from "react";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  paid: "bg-primary/10 text-primary",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function DoctorPayouts() {
  const { doctorProfile, refresh } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");

  const { data: payouts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/payouts"],
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/doctor/payouts/request", { amount: parseInt(amount) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout requested", description: "Your payout request has been submitted." });
      qc.invalidateQueries({ queryKey: ["/api/doctor/payouts"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setAmount("");
      refresh();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pending = doctorProfile?.pendingPayouts || 0;
  const total = doctorProfile?.totalEarnings || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
        <p className="text-muted-foreground mt-0.5">Track and request your earnings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available to Withdraw</p>
                <p className="text-2xl font-bold text-foreground">{pending}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          {pending === 0 ? (
            <p className="text-sm text-muted-foreground">No credits available for payout. Complete appointments to earn credits.</p>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="space-y-1.5 flex-1">
                <Label>Amount (max: {pending})</Label>
                <Input
                  type="number"
                  min="1"
                  max={pending}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter amount (max ${pending})`}
                  data-testid="input-payout-amount"
                />
              </div>
              <Button
                onClick={() => requestMutation.mutate()}
                disabled={!amount || parseInt(amount) > pending || requestMutation.isPending}
                data-testid="button-request-payout"
              >
                {requestMutation.isPending ? "Requesting..." : "Request"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-md" />)}</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payout requests yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 gap-3" data-testid={`payout-${p.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${p.status === "approved" || p.status === "paid" ? "bg-emerald-100 dark:bg-emerald-900/30" : p.status === "rejected" ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                      {p.status === "approved" || p.status === "paid" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : p.status === "rejected" ? (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.amount} credits</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.requestedAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColor[p.status] || ""}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
