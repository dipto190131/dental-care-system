import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MapPin, Clock, Award, Stethoscope, GraduationCap, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format, parseISO } from "date-fns";

function groupSlotsByDate(slots: any[]) {
  const grouped: Record<string, any[]> = {};
  for (const slot of slots) {
    if (slot.status !== "available") continue;
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }
  return grouped;
}

export default function DoctorDetailPage() {
  const [, params] = useRoute("/doctors/:id");
  const doctorId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [notes, setNotes] = useState("");
  const { data: doctor, isLoading } = useQuery<any>({
    queryKey: [`/api/doctors/${doctorId}`],
    enabled: !!doctorId,
  });

  const { data: creditData } = useQuery<any>({
    queryKey: ["/api/patient/credits"],
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/patient/appointments/book", {
        doctorId: doctor.id,
        slotId: selectedSlot.id,
        notes,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Booking failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Appointment booked!", description: "Your appointment has been confirmed." });
      setShowBookModal(false);
      setSelectedSlot(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["/api/patient/appointments"] });
      qc.invalidateQueries({ queryKey: ["/api/patient/credits"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      qc.invalidateQueries({ queryKey: [`/api/doctors/${doctorId}`] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (e: Error) => {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Doctor not found.</p>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(doctor.slots || []);
  const balance = creditData?.balance ?? user?.creditBalance ?? 0;
  const cost = doctor.consultationFee;
  const canAfford = balance >= cost;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary shrink-0">
              {doctor.user.firstName[0]}{doctor.user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Dr. {doctor.user.firstName} {doctor.user.lastName}
                  </h1>
                  <Badge variant="secondary" className="mt-1">{doctor.specialty}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{cost} credits (৳{cost}) / appointment</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {doctor.clinicName && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                    {doctor.clinicName}
                  </div>
                )}
                {doctor.clinicAddress && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {doctor.clinicAddress}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {doctor.yearsExperience} years experience
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {parseFloat(doctor.rating || 0).toFixed(1)} ({doctor.totalReviews} reviews)
                </div>
              </div>
              {doctor.bio && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{doctor.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {doctor.education && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Education & Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{doctor.education}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Available Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!canAfford && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Insufficient Credits</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You need {cost} credits (৳{cost}) but only have {balance}. <a href="/credits" className="underline">Buy more credits</a>.
                </p>
              </div>
            </div>
          )}
          {Object.keys(groupedSlots).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No available slots at this time.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedSlots).slice(0, 7).map(([date, slots]) => (
                <div key={date}>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {format(parseISO(date), "EEEE, MMMM d")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setShowBookModal(true);
                        }}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                          selectedSlot?.id === slot.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover-elevate"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        data-testid={`slot-${slot.id}`}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBookModal} onOpenChange={setShowBookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="rounded-md bg-card border border-card-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium text-foreground">Dr. {doctor.user.firstName} {doctor.user.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(selectedSlot.date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium text-foreground">{selectedSlot.startTime} – {selectedSlot.endTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-semibold text-primary">{cost} credits (৳{cost})</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes for Doctor (optional)</Label>
                <Textarea
                  placeholder="Describe your concern or reason for visit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="input-appointment-notes"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                After booking, {cost} credits (৳{cost}) will be deducted from your balance ({balance} credits available).
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookModal(false)}>Cancel</Button>
            <Button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              data-testid="button-confirm-booking"
            >
              {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
