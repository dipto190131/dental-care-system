import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, Clock, User, Pill, Plus, Trash2, ImageIcon,
  FileText, Eye, FolderOpen, Loader2, Star,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PatientReportsModal({ patientId, patientName, onClose }: { patientId: string; patientName: string; onClose: () => void }) {
  const [preview, setPreview] = useState<any | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/chat/patient", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/patient/${patientId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const files: any[] = data?.files || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            {patientName}'s Reports
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3 p-1">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-foreground">No reports uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">
                This patient hasn't uploaded any reports yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {files.filter((f) => f.fileType?.startsWith("image/")).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.filter((f) => f.fileType?.startsWith("image/")).map((f: any) => (
                      <div
                        key={f.id}
                        className="group relative rounded-xl overflow-hidden border border-border bg-muted/30 aspect-square cursor-pointer"
                        onClick={() => setPreview(f)}
                        data-testid={`patient-report-${f.id}`}
                      >
                        <img
                          src={`/api/chat/files/${f.id}/download`}
                          alt={f.originalName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">{f.originalName}</p>
                          {f.description && <p className="text-white/70 text-xs truncate">{f.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {files.filter((f) => !f.fileType?.startsWith("image/")).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Files</p>
                  <div className="space-y-2">
                    {files.filter((f) => !f.fileType?.startsWith("image/")).map((f: any) => (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                        <FileText className="h-8 w-8 text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.originalName}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(f.fileSize)}</p>
                        </div>
                        <a
                          href={`/api/chat/files/${f.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center pt-2">
                {files.length} file{files.length !== 1 ? "s" : ""} uploaded by {patientName}
              </p>
            </div>
          )}
        </div>
      </DialogContent>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-8 right-0 text-white text-xs hover:underline"
            >
              Close
            </button>
            <img
              src={`/api/chat/files/${preview.id}/download`}
              alt={preview.originalName}
              className="rounded-xl max-h-[80vh] object-contain w-full shadow-2xl"
            />
            {preview.description && (
              <p className="text-white/80 text-xs text-center mt-2">{preview.description}</p>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function AddRecordModal({ open, onClose, patientId, appointmentId }: any) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [prescriptions, setPrescriptions] = useState([{ medication: "", dosage: "", duration: "" }]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/doctor/medical-records", {
        patientId,
        appointmentId,
        diagnosis,
        treatment,
        notes,
        followUpDate: followUpDate || undefined,
        prescriptions: prescriptions.filter((p) => p.medication),
      });
      if (!res.ok) throw new Error("Failed to create record");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Record created", description: "Medical record has been saved." });
      qc.invalidateQueries({ queryKey: ["/api/doctor/medical-records"] });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Could not save record.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medical Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Diagnosis *</Label>
            <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" data-testid="input-diagnosis" />
          </div>
          <div className="space-y-1.5">
            <Label>Treatment</Label>
            <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Treatment plan..." rows={2} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Prescriptions</Label>
              <Button type="button" variant="ghost" size="sm" className="gap-1 h-7" onClick={() => setPrescriptions([...prescriptions, { medication: "", dosage: "", duration: "" }])}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {prescriptions.map((rx, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <Input placeholder="Medication" value={rx.medication} onChange={(e) => { const p = [...prescriptions]; p[i].medication = e.target.value; setPrescriptions(p); }} />
                  <Input placeholder="Dosage" value={rx.dosage} onChange={(e) => { const p = [...prescriptions]; p[i].dosage = e.target.value; setPrescriptions(p); }} />
                  <Input placeholder="Duration" value={rx.duration} onChange={(e) => { const p = [...prescriptions]; p[i].duration = e.target.value; setPrescriptions(p); }} />
                </div>
                {prescriptions.length > 1 && (
                  <Button type="button" size="icon" variant="ghost" className="shrink-0 h-9" onClick={() => setPrescriptions(prescriptions.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Follow-up Date</Label>
            <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!diagnosis || mutation.isPending} data-testid="button-save-record">
            {mutation.isPending ? "Saving..." : "Save Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppointmentCard({ appt }: { appt: any }) {
  const [showRecord, setShowRecord] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const patientName = `${appt.patient?.firstName || ""} ${appt.patient?.lastName || ""}`.trim();

  return (
    <Card data-testid={`appt-card-${appt.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 font-medium text-sm text-primary">
              {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">{patientName}</p>
              <p className="text-xs text-muted-foreground">{appt.patient?.email}</p>
              {appt.slot && (
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(appt.slot.date), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {appt.slot.startTime}
                  </div>
                </div>
              )}
              {appt.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{appt.notes}"</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColor[appt.status]}`}>
              {appt.status}
            </span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReports(true)}
                className="gap-1.5"
                data-testid={`button-view-reports-${appt.id}`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Reports
              </Button>
              {appt.status === "confirmed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRecord(true)}
                  className="gap-1.5"
                  data-testid={`button-add-record-${appt.id}`}
                >
                  <Pill className="h-3.5 w-3.5" />
                  Add Record
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <AddRecordModal
        open={showRecord}
        onClose={() => setShowRecord(false)}
        patientId={appt.patientId}
        appointmentId={appt.id}
      />

      {showReports && (
        <PatientReportsModal
          patientId={appt.patientId}
          patientName={patientName || "Patient"}
          onClose={() => setShowReports(false)}
        />
      )}
    </Card>
  );
}

export default function DoctorAppointments() {
  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/appointments"],
  });

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled"].includes(a.status));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <p className="text-muted-foreground mt-0.5">Manage your patient appointments and view their uploaded reports.</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No appointments yet</p>
          <p className="text-sm text-muted-foreground">Patients will book once your profile is verified and slots are available.</p>
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0
              ? <p className="text-sm text-muted-foreground py-8 text-center">No upcoming appointments.</p>
              : upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0
              ? <p className="text-sm text-muted-foreground py-8 text-center">No past appointments.</p>
              : past.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
