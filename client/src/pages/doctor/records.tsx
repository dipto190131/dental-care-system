import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText, User, Calendar, Pill, ChevronDown, ChevronUp,
  Plus, Trash2, Lock, ClipboardList, FilePlus, Loader2, Save, Download,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { generateMedicalRecordPDF } from "@/lib/pdf-generator";

function RecordCard({ record }: { record: any }) {
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const patientName = record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : "Patient";

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const doc = await generateMedicalRecordPDF([record], patientName);
      doc.save(`medical_records_${patientName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <Card data-testid={`record-${record.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {record.patient?.firstName} {record.patient?.lastName}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{record.diagnosis}</p>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(record.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
            data-testid={`button-expand-record-${record.id}`}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            data-testid={`button-download-${record.id}`}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 pt-4 border-t border-border">
            {record.treatment && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Treatment</p>
                <p className="text-sm text-foreground">{record.treatment}</p>
              </div>
            )}
            {record.prescriptions && record.prescriptions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Prescriptions</p>
                <div className="space-y-1.5">
                  {record.prescriptions.map((rx: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 rounded-md bg-muted/50 border border-border px-3 py-2">
                      <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{rx.medication}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{rx.dosage}</span>
                      {rx.frequency && <><span className="text-xs text-muted-foreground">·</span><span className="text-xs text-muted-foreground">{rx.frequency}</span></>}
                      {rx.duration && <><span className="text-xs text-muted-foreground">·</span><span className="text-xs text-muted-foreground">{rx.duration}</span></>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {record.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Clinical Notes</p>
                <p className="text-sm text-muted-foreground">{record.notes}</p>
              </div>
            )}
            {record.followUpDate && (
              <Badge variant="secondary" className="text-xs">
                Follow-up: {format(parseISO(record.followUpDate), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

function NewRecordForm({ patients, appointments }: { patients: any[]; appointments: any[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("none");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { medication: "", dosage: "", frequency: "", duration: "" },
  ]);

  const patientAppointments = appointments.filter(
    (a) => a.patientId === patientId && (a.status === "confirmed" || a.status === "completed")
  );

  const addRx = () =>
    setPrescriptions((p) => [...p, { medication: "", dosage: "", frequency: "", duration: "" }]);

  const removeRx = (i: number) =>
    setPrescriptions((p) => p.filter((_, idx) => idx !== i));

  const updateRx = (i: number, field: keyof Prescription, value: string) =>
    setPrescriptions((p) => p.map((rx, idx) => (idx === i ? { ...rx, [field]: value } : rx)));

  const mutation = useMutation({
    mutationFn: async () => {
      const validRx = prescriptions.filter((rx) => rx.medication.trim());
      const res = await apiRequest("POST", "/api/doctor/medical-records", {
        patientId,
        appointmentId: appointmentId === "none" ? undefined : appointmentId,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim() || undefined,
        prescriptions: validRx.length ? validRx : undefined,
        followUpDate: followUpDate || undefined,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create record");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Medical record created", description: "The record is now visible to the patient." });
      qc.invalidateQueries({ queryKey: ["/api/doctor/medical-records"] });
      setPatientId("");
      setAppointmentId("none");
      setDiagnosis("");
      setTreatment("");
      setFollowUpDate("");
      setNotes("");
      setPrescriptions([{ medication: "", dosage: "", frequency: "", duration: "" }]);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const canSubmit = patientId && diagnosis.trim();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Patient <span className="text-destructive">*</span></Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger data-testid="select-patient">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Linked Appointment <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Select value={appointmentId} onValueChange={setAppointmentId} disabled={!patientId}>
            <SelectTrigger data-testid="select-appointment">
              <SelectValue placeholder="Select appointment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific appointment</SelectItem>
              {patientAppointments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.slot?.date} · {a.slot?.startTime} ({a.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Diagnosis <span className="text-destructive">*</span></Label>
        <Textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g. Dental caries on upper left molar (tooth 26)"
          rows={2}
          data-testid="input-diagnosis"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Treatment Plan</Label>
        <Textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          placeholder="Describe the treatment plan..."
          rows={2}
          data-testid="input-treatment"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            <Pill className="h-4 w-4 text-primary" />
            Prescriptions
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRx}
            data-testid="button-add-prescription"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Medication
          </Button>
        </div>

        <div className="space-y-3">
          {prescriptions.map((rx, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3" data-testid={`prescription-row-${i}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medication {i + 1}</span>
                {prescriptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRx(i)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive"
                    data-testid={`button-remove-prescription-${i}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs mb-1 block">Medication name</Label>
                  <Input
                    value={rx.medication}
                    onChange={(e) => updateRx(i, "medication", e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    data-testid={`input-medication-${i}`}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Dosage</Label>
                  <Input
                    value={rx.dosage}
                    onChange={(e) => updateRx(i, "dosage", e.target.value)}
                    placeholder="e.g. 500mg"
                    data-testid={`input-dosage-${i}`}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Frequency</Label>
                  <Input
                    value={rx.frequency}
                    onChange={(e) => updateRx(i, "frequency", e.target.value)}
                    placeholder="e.g. 3x daily"
                    data-testid={`input-frequency-${i}`}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Duration</Label>
                  <Input
                    value={rx.duration}
                    onChange={(e) => updateRx(i, "duration", e.target.value)}
                    placeholder="e.g. 7 days"
                    data-testid={`input-duration-${i}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Follow-up Date</Label>
          <Input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            data-testid="input-followup-date"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Additional Clinical Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other observations..."
            rows={2}
            data-testid="input-clinical-notes"
          />
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={!canSubmit || mutation.isPending}
        className="w-full sm:w-auto"
        data-testid="button-create-record"
      >
        {mutation.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
        ) : (
          <><FilePlus className="h-4 w-4 mr-2" />Create Medical Record</>
        )}
      </Button>
    </div>
  );
}

function PrivateNotesPanel({ patients }: { patients: any[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const { data: notes = [], isLoading: notesLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/private-notes", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const res = await fetch(`/api/doctor/private-notes?patientId=${selectedPatientId}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: !!selectedPatientId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/doctor/private-notes", {
        patientId: selectedPatientId,
        content: noteContent.trim(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save note");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Private note saved" });
      qc.invalidateQueries({ queryKey: ["/api/doctor/private-notes", selectedPatientId] });
      setNoteContent("");
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await apiRequest("DELETE", `/api/doctor/private-notes/${noteId}`, undefined);
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Note deleted" });
      qc.invalidateQueries({ queryKey: ["/api/doctor/private-notes", selectedPatientId] });
      setDeleteNoteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Doctor-Only Private Notes</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            These notes are strictly private and are never visible to the patient. Use them for your personal clinical observations, opinions, or reminders about this patient.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Select Patient</Label>
        <Select value={selectedPatientId} onValueChange={(v) => { setSelectedPatientId(v); setNoteContent(""); }}>
          <SelectTrigger data-testid="select-patient-notes">
            <SelectValue placeholder="Choose a patient to view or add notes" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPatientId && (
        <>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              Add New Note for {selectedPatient?.firstName} {selectedPatient?.lastName}
            </Label>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your private clinical observation or opinion about this patient…"
              rows={4}
              data-testid="input-private-note"
            />
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!noteContent.trim() || saveMutation.isPending}
              size="sm"
              data-testid="button-save-private-note"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
              ) : (
                <><Save className="h-3.5 w-3.5 mr-1.5" />Save Note</>
              )}
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Private Notes History
              {notes.length > 0 && (
                <Badge variant="secondary" className="text-xs">{notes.length} note{notes.length !== 1 ? "s" : ""}</Badge>
              )}
            </h3>

            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-border bg-muted/30">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No private notes yet for this patient.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note: any) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-2"
                    data-testid={`private-note-${note.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1">{note.content}</p>
                      <button
                        onClick={() => setDeleteNoteId(note.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete private note?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteNoteId && deleteMutation.mutate(deleteNoteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function DoctorRecords() {
  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/medical-records"],
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/doctor/appointments"],
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients"],
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Records</h1>
        <p className="text-muted-foreground mt-0.5">
          Create medical records, add prescriptions, and manage private clinical notes.
        </p>
      </div>

      <Tabs defaultValue="records">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="records" data-testid="tab-records">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Records
            {records.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">{records.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="new" data-testid="tab-new-record">
            <FilePlus className="h-4 w-4 mr-1.5" />
            New Record
          </TabsTrigger>
          <TabsTrigger value="private" data-testid="tab-private-notes">
            <Lock className="h-4 w-4 mr-1.5" />
            Private Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">No records yet</p>
              <p className="text-sm text-muted-foreground">
                Switch to the "New Record" tab to create a medical record for a patient.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((r: any) => <RecordCard key={r.id} record={r} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          {patients.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">No patients yet</p>
              <p className="text-sm text-muted-foreground">
                You need at least one confirmed appointment to create a medical record.
              </p>
            </div>
          ) : (
            <NewRecordForm patients={patients} appointments={appointments} />
          )}
        </TabsContent>

        <TabsContent value="private" className="mt-6">
          {patients.length === 0 ? (
            <div className="text-center py-16">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">No patients yet</p>
              <p className="text-sm text-muted-foreground">
                Once you have patients, you can add private clinical notes here.
              </p>
            </div>
          ) : (
            <PrivateNotesPanel patients={patients} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
