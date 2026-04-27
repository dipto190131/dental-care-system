import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { useState } from "react";

function groupSlotsByDate(slots: any[]) {
  const grouped: Record<string, any[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }
  return grouped;
}

export default function DoctorAvailability() {
  const { doctorProfile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const { data: slots = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/doctors/${doctorProfile?.id}/slots`],
    enabled: !!doctorProfile?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/doctor/slots", { date, startTime, endTime });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add slot");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Slot added", description: "Availability slot has been created." });
      qc.invalidateQueries({ queryKey: [`/api/doctors/${doctorProfile?.id}/slots`] });
      setDate("");
      setStartTime("");
      setEndTime("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/doctor/slots/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Slot removed" });
      qc.invalidateQueries({ queryKey: [`/api/doctors/${doctorProfile?.id}/slots`] });
    },
    onError: () => toast({ title: "Error", description: "Could not remove slot.", variant: "destructive" }),
  });

  const grouped = groupSlotsByDate(slots);
  const availableCount = slots.filter((s: any) => s.status === "available").length;
  const bookedCount = slots.filter((s: any) => s.status === "booked").length;

  const handleAddBulk = async () => {
    if (!date || !startTime) return;
    const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    for (const t of times) {
      const end = times[times.indexOf(t) + 1] || "17:00";
      await apiRequest("POST", "/api/doctor/slots", { date, startTime: t, endTime: end });
    }
    toast({ title: "Slots added", description: `Added 12 slots for ${date}.` });
    qc.invalidateQueries({ queryKey: [`/api/doctors/${doctorProfile?.id}/slots`] });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Availability</h1>
        <p className="text-muted-foreground mt-0.5">Manage your appointment slots.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-foreground">{availableCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Booked</p>
              <p className="text-xl font-bold text-foreground">{bookedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add Time Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-1 space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-slot-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                data-testid="input-slot-start"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                data-testid="input-slot-end"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!date || !startTime || !endTime || addMutation.isPending}
                className="flex-1"
                data-testid="button-add-slot"
              >
                Add
              </Button>
            </div>
          </div>
          {date && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={handleAddBulk}
              data-testid="button-add-bulk-slots"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Full Day ({date})
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">All Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-md" />)}</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No slots added yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([d, daySlots]) => (
                <div key={d}>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {format(parseISO(d), "EEEE, MMMM d, yyyy")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 ${slot.status === "booked" ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
                        data-testid={`slot-item-${slot.id}`}
                      >
                        <span className="text-sm text-foreground">{slot.startTime}</span>
                        <Badge variant={slot.status === "booked" ? "default" : "secondary"} className="text-xs">
                          {slot.status}
                        </Badge>
                        {slot.status === "available" && (
                          <button
                            onClick={() => deleteMutation.mutate(slot.id)}
                            disabled={deleteMutation.isPending}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            data-testid={`button-delete-slot-${slot.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
