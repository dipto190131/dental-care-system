import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Users, Clock, CheckCircle, AlertCircle, ArrowRight, Star, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function DoctorDashboard() {
  const { user, doctorProfile, setDoctorProfile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState("");

  const feeMutation = useMutation({
    mutationFn: async (fee: number) => {
      const res = await apiRequest("PUT", "/api/doctor/profile", { consultationFee: fee });
      if (!res.ok) throw new Error("Failed to update fee");
      return res.json();
    },
    onSuccess: (data) => {
      setDoctorProfile(data);
      qc.invalidateQueries({ queryKey: ["/api/doctor/profile"] });
      setEditingFee(false);
      toast({ title: "Consultation fee updated", description: `New fee: ${data.consultationFee} credits (৳${data.consultationFee})` });
    },
    onError: () => {
      toast({ title: "Failed to update fee", variant: "destructive" });
    },
  });

  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/appointments"],
  });

  const { data: slots = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors/" + (doctorProfile?.id || "") + "/slots"],
    enabled: !!doctorProfile?.id,
  });

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const completed = appointments.filter((a) => a.status === "completed");
  const availableSlots = slots.filter((s: any) => s.status === "available");

  const verificationStatus = doctorProfile?.verificationStatus;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, Dr. {user?.firstName}
          </h1>
          <p className="text-muted-foreground mt-0.5">Here's your practice overview.</p>
        </div>
        {verificationStatus === "pending" && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 max-w-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Verification Pending</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Your profile is under review. You cannot accept appointments until verified.</p>
            </div>
          </div>
        )}
        {verificationStatus === "approved" && (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Verified
          </Badge>
        )}
        {verificationStatus === "rejected" && (
          <Badge variant="destructive">Profile Rejected</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Slots</p>
                <p className="text-2xl font-bold text-foreground">{availableSlots.length}</p>
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
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-foreground">{doctorProfile?.totalEarnings || 0}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
              <CardTitle className="text-base font-semibold">Recent Appointments</CardTitle>
              <Link href="/doctor/appointments">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
              ) : appointments.slice(0, 5).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No appointments yet.</p>
                  <Link href="/doctor/availability">
                    <Button size="sm" className="mt-3" data-testid="button-add-slots">Add Availability Slots</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between rounded-md border border-border p-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0 font-medium text-sm text-primary">
                          {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appt.slot ? `${appt.slot.date} · ${appt.slot.startTime}` : "TBD"}
                          </p>
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Profile Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {doctorProfile && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Specialty</span>
                    <span className="font-medium text-foreground">{doctorProfile.specialty}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium text-foreground">{doctorProfile.yearsExperience} years</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Fee per visit</span>
                    {editingFee ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={feeInput}
                          onChange={(e) => setFeeInput(e.target.value)}
                          className="h-7 w-16 text-xs text-right"
                          autoFocus
                          data-testid="input-consultation-fee"
                        />
                        <span className="text-xs text-muted-foreground">cr</span>
                        <button
                          onClick={() => { const v = parseInt(feeInput); if (v > 0) feeMutation.mutate(v); }}
                          disabled={feeMutation.isPending || !feeInput}
                          className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                          data-testid="button-save-fee"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFee(false)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          data-testid="button-cancel-fee"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{doctorProfile.consultationFee} credits (৳{doctorProfile.consultationFee})</span>
                        <button
                          onClick={() => { setFeeInput(String(doctorProfile.consultationFee)); setEditingFee(true); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          data-testid="button-edit-fee"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">{parseFloat(doctorProfile.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending Payout</span>
                    <span className="font-semibold text-primary">{doctorProfile.pendingPayouts} credits</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/doctor/availability">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <Clock className="h-4 w-4 text-primary" />
                  Manage Availability
                </Button>
              </Link>
              <Link href="/doctor/payouts">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Request Payout
                </Button>
              </Link>
              <Link href="/doctor/records">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <Users className="h-4 w-4 text-primary" />
                  Patient Records
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
