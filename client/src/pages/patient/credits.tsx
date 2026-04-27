import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, TrendingUp, TrendingDown, Zap, Star, Crown, Lock, CheckCircle, Loader2, PoundSterling } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const packages = [
  {
    id: "starter",
    name: "Starter",
    credits: 5,
    price: 5,
    icon: Zap,
    description: "Perfect for a single consultation",
    color: "bg-secondary/50",
    badge: null,
  },
  {
    id: "standard",
    name: "Standard",
    credits: 10,
    price: 10,
    icon: Star,
    description: "Best for regular dental care",
    color: "bg-primary/5 border-primary/20",
    badge: "Most Popular",
  },
  {
    id: "premium",
    name: "Premium",
    credits: 20,
    price: 20,
    icon: Crown,
    description: "For families or frequent visits",
    color: "bg-accent/50",
    badge: null,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    credits: 50,
    price: 50,
    icon: Crown,
    description: "Maximum value for power users",
    color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    badge: "Best Value",
  },
];

interface PaymentModalProps {
  pkg: typeof packages[0] | null;
  onClose: () => void;
  onPay: (packageId: string) => void;
  isPending: boolean;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function PaymentModal({ pkg, onClose, onPay, isPending }: PaymentModalProps) {
  const [cardNum, setCardNum] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/26");
  const [cvv, setCvv] = useState("123");
  const [cardName, setCardName] = useState("");
  const [paid, setPaid] = useState(false);

  if (!pkg) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    onPay(pkg.id);
  };

  return (
    <Dialog open={!!pkg} onOpenChange={() => { if (!isPending) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{pkg.name} Package</p>
              <p className="text-xs text-muted-foreground">{pkg.credits} credits · 1 credit = ৳1</p>
            </div>
            <p className="text-2xl font-bold text-primary">৳{pkg.price}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Cardholder Name</Label>
            <Input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Smith"
              required
              data-testid="input-card-name"
            />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Card Number</Label>
            <div className="relative">
              <Input
                value={cardNum}
                onChange={(e) => setCardNum(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="pr-10 font-mono"
                data-testid="input-card-number"
              />
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Expiry Date</Label>
              <Input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                data-testid="input-card-expiry"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">CVV</Label>
              <Input
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="123"
                maxLength={3}
                type="password"
                data-testid="input-card-cvv"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>This is a simulated payment page for demonstration purposes. No real charges are made.</span>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !cardName.trim()}
            data-testid="button-confirm-payment"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
            ) : (
              <><Lock className="h-4 w-4 mr-2" />Pay ৳{pkg.price}</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CreditsPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [payingPackage, setPayingPackage] = useState<typeof packages[0] | null>(null);

  const { data: creditData, isLoading } = useQuery<any>({
    queryKey: ["/api/patient/credits"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiRequest("POST", "/api/patient/credits/purchase", { packageId });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Purchase failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Payment successful!", description: `${data.newBalance} credits added to your account.` });
      qc.invalidateQueries({ queryKey: ["/api/patient/credits"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      refresh();
      setPayingPackage(null);
    },
    onError: (e: Error) => {
      toast({ title: "Payment failed", description: e.message, variant: "destructive" });
    },
  });

  const balance = creditData?.balance ?? user?.creditBalance ?? 0;
  const transactions: any[] = creditData?.transactions || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credits</h1>
        <p className="text-muted-foreground mt-0.5">Purchase and manage your appointment credits. <span className="font-medium">1 credit = ৳1</span></p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              {isLoading ? (
                <Skeleton className="h-10 w-24 mt-0.5" />
              ) : (
                <p className="text-4xl font-bold text-foreground">{balance}</p>
              )}
              <p className="text-xs text-muted-foreground">credits available · equivalent to ৳{balance}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Purchase Credits</h2>
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
          <PoundSterling className="h-3.5 w-3.5" />
          1 credit = ৳1 · Secure mock payment for demonstration
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={`relative hover-elevate ${pkg.color}`} data-testid={`card-package-${pkg.id}`}>
              {pkg.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="text-xs">{pkg.badge}</Badge>
                </div>
              )}
              <CardContent className="p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                  <pkg.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                <p className="text-3xl font-bold text-foreground mt-1">{pkg.credits}</p>
                <p className="text-xs text-muted-foreground">credits</p>
                <p className="text-sm font-semibold text-primary mt-1">৳{pkg.price}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{pkg.description}</p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setPayingPackage(pkg)}
                  disabled={purchaseMutation.isPending}
                  data-testid={`button-buy-${pkg.id}`}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-md" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 gap-3"
                  data-testid={`tx-${tx.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${tx.amount > 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {tx.amount > 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-semibold block ${tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount} credits
                    </span>
                    {tx.amount !== 0 && (
                      <span className="text-xs text-muted-foreground">৳{Math.abs(tx.amount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal
        pkg={payingPackage}
        onClose={() => setPayingPackage(null)}
        onPay={(pkgId) => purchaseMutation.mutate(pkgId)}
        isPending={purchaseMutation.isPending}
      />
    </div>
  );
}
