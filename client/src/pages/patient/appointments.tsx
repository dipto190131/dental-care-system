import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar, Clock, AlertCircle, CheckCircle, Star, Loader2, MessageSquare,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          data-testid={`star-${star}`}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function AppointmentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
  const [reviewAppt, setReviewAppt] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewApptIdForCheck, setReviewApptIdForCheck] = useState<string | null>(null);

  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/patient/appointments"],
  });

  const { data: existingReviews = [] } = useQuery<any[]>({
    queryKey: ["/api/patient/reviews"],
  });

  const reviewedApptIds = new Set((existingReviews as any[]).map((r: any) => r.appointmentId));

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/patient/appointments/${id}/cancel`, {});
      if (!res.ok) throw new Error("Cancellation failed");
    },
    onSuccess: () => {
      toast({ title: "Appointment cancelled", description: "Your credits have been refunded." });
      qc.invalidateQueries({ queryKey: ["/api/patient/appointments"] });
      qc.invalidateQueries({ queryKey: ["/api/patient/credits"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => toast({ title: "Error", description: "Could not cancel appointment.", variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/patient/appointments/${id}/complete`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete appointment");
      }
      return res.json();
    },
    onSuccess: (_, id) => {
      toast({ title: "Appointment marked as completed" });
      qc.invalidateQueries({ queryKey: ["/api/patient/appointments"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      setConfirmCompleteId(null);
      const appt = appointments.find((a) => a.id === id);
      if (appt) {
        setReviewAppt(appt);
        setReviewRating(0);
        setReviewComment("");
      }
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ appointmentId, doctorId, rating, comment }: any) => {
      const res = await apiRequest("POST", "/api/patient/reviews", { appointmentId, doctorId, rating, comment: comment || undefined });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thank you for your feedback!" });
      qc.invalidateQueries({ queryKey: ["/api/patient/reviews"] });
      setReviewAppt(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled"].includes(a.status));

  function AppointmentCard({ appt }: { appt: any }) {
    const [cancelling, setCancelling] = useState(false);
    return (
      <Card data-testid={`appt-card-${appt.id}`}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0 font-bold text-primary">
                {appt.doctor?.firstName?.[0]}{appt.doctor?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{appt.doctorProfile?.specialty}</p>
                {appt.slot && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {format(parseISO(appt.slot.date), "MMM d, yyyy")}
                    </span>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                    <span className="text-sm text-foreground">
                      {appt.slot.startTime} – {appt.slot.endTime}
                    </span>
                  </div>
                )}
                {appt.notes && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">"{appt.notes}"</p>
                )}
                {appt.status === "completed" && reviewedApptIds.has(appt.id) && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground">Review submitted</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColor[appt.status]}`}>
                {appt.status}
              </span>
              <span className="text-xs text-muted-foreground">{appt.creditsCost} credits</span>

              <div className="flex flex-col gap-1.5">
                {appt.status === "confirmed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmCompleteId(appt.id)}
                    className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                    data-testid={`button-complete-${appt.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark as Done
                  </Button>
                )}
                {appt.status === "completed" && !reviewedApptIds.has(appt.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setReviewAppt(appt); setReviewRating(0); setReviewComment(""); }}
                    className="gap-1.5"
                    data-testid={`button-review-${appt.id}`}
                  >
                    <Star className="h-3.5 w-3.5" />
                    Leave Review
                  </Button>
                )}
                {["pending", "confirmed"].includes(appt.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelMutation.mutate(appt.id)}
                    disabled={cancelMutation.isPending}
                    data-testid={`button-cancel-${appt.id}`}
                    className="text-destructive"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
          <p className="text-muted-foreground mt-0.5">Manage your dental appointments.</p>
        </div>
        <Link href="/doctors">
          <Button size="sm" data-testid="button-book-new">Book New</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No appointments yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Find a verified dentist and book your first appointment.</p>
          <Link href="/doctors">
            <Button data-testid="button-find-dentist">Find a Dentist</Button>
          </Link>
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
              </div>
            ) : (
              upcoming.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No past appointments.</p>
              </div>
            ) : (
              past.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)
            )}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!confirmCompleteId} onOpenChange={() => setConfirmCompleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark appointment as completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This confirms that your appointment has taken place. You will then have the opportunity to leave a review for your doctor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCompleteId && completeMutation.mutate(confirmCompleteId)}
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {completeMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Marking…</> : "Yes, Mark as Done"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reviewAppt} onOpenChange={() => setReviewAppt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              Rate your experience
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="text-center rounded-xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">How was your appointment with</p>
              <p className="font-semibold text-foreground mt-0.5">
                Dr. {reviewAppt?.doctor?.firstName} {reviewAppt?.doctor?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{reviewAppt?.doctorProfile?.specialty}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <StarRating value={reviewRating} onChange={setReviewRating} />
              {reviewRating > 0 && (
                <span className="text-sm font-medium text-foreground">{ratingLabels[reviewRating]}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                Comment <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share details about your experience…"
                rows={3}
                data-testid="input-review-comment"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewAppt(null)}
              data-testid="button-skip-review"
            >
              Skip
            </Button>
            <Button
              onClick={() => reviewMutation.mutate({
                appointmentId: reviewAppt?.id,
                doctorId: reviewAppt?.doctorId,
                rating: reviewRating,
                comment: reviewComment,
              })}
              disabled={reviewRating === 0 || reviewMutation.isPending}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
