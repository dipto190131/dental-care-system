import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Stethoscope, CheckCircle, XCircle, Clock, MapPin, Award, Star, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  certificate_pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function VerifyModal({ doctor, onClose }: { doctor: any; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/admin/doctors/${doctor.id}/verify`, { status: action, notes });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: action === "approved" ? "Doctor approved!" : "Doctor rejected", description: `Dr. ${doctor.user.firstName} ${doctor.user.lastName} has been ${action}.` });
      qc.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      onClose();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Doctor Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-card border border-card-border p-4 space-y-2">
            <p className="font-semibold text-foreground">Dr. {doctor.user.firstName} {doctor.user.lastName}</p>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-muted-foreground">Specialty</span><span className="text-foreground">{doctor.specialty}</span>
              <span className="text-muted-foreground">License</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground">{doctor.licenseNumber}</span>
                {doctor.medicalCertificate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => {
                      window.open(`/api/certificates/${doctor.medicalCertificate}`, '_blank');
                    }}
                    data-testid={`button-download-cert-${doctor.id}`}
                  >
                    <Download className="h-3 w-3" />
                    Download Cert
                  </Button>
                )}
              </div>
              <span className="text-muted-foreground">Experience</span><span className="text-foreground">{doctor.yearsExperience} years</span>
              {doctor.clinicName && <><span className="text-muted-foreground">Clinic</span><span className="text-foreground">{doctor.clinicName}</span></>}
              {doctor.education && <><span className="text-muted-foreground">Education</span><span className="text-foreground text-xs">{doctor.education}</span></>}
            </div>
            {doctor.bio && <p className="text-sm text-muted-foreground mt-2">{doctor.bio}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes for the doctor..." rows={2} data-testid="input-verify-notes" />
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-1.5"
              variant="outline"
              onClick={() => { setAction("rejected"); }}
              data-testid="button-set-reject"
            >
              <XCircle className="h-4 w-4 text-destructive" />
              Reject
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={() => { setAction("approved"); }}
              data-testid="button-set-approve"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          </div>
          {action && (
            <div className={`rounded-md p-3 text-sm ${action === "approved" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}>
              Ready to {action} this doctor. Click Confirm to proceed.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!action || mutation.isPending} data-testid="button-confirm-verify">
            {mutation.isPending ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DoctorCard({ doctor, onVerify }: { doctor: any; onVerify: () => void }) {
  return (
    <Card data-testid={`doctor-card-${doctor.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0 font-bold text-primary">
              {doctor.user.firstName[0]}{doctor.user.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">Dr. {doctor.user.firstName} {doctor.user.lastName}</p>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="h-3 w-3" /> {doctor.yearsExperience} yrs
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {parseFloat(doctor.rating || 0).toFixed(1)}
                </span>
                {doctor.clinicName && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" /> {doctor.clinicName}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">License: {doctor.licenseNumber}</p>
              {doctor.verificationNotes && (
                <p className="text-xs text-muted-foreground mt-1 italic">Notes: {doctor.verificationNotes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColor[doctor.verificationStatus]}`}>
              {doctor.verificationStatus === "certificate_pending" ? "Certificate Pending" : doctor.verificationStatus}
            </span>
            {(doctor.verificationStatus === "pending" || doctor.verificationStatus === "certificate_pending") && (
              <Button size="sm" onClick={onVerify} data-testid={`button-verify-${doctor.id}`}>
                Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDoctors() {
  const { data: doctors = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/doctors"],
  });
  const [verifyDoctor, setVerifyDoctor] = useState<any | null>(null);

  const pending = doctors.filter((d) => d.verificationStatus === "pending" || d.verificationStatus === "certificate_pending");
  const approved = doctors.filter((d) => d.verificationStatus === "approved");
  const rejected = doctors.filter((d) => d.verificationStatus === "rejected");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Doctor Verification</h1>
        <p className="text-muted-foreground mt-0.5">Review and verify doctor profiles.</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          {[{ key: "pending", list: pending }, { key: "approved", list: approved }, { key: "rejected", list: rejected }].map(({ key, list }) => (
            <TabsContent key={key} value={key} className="mt-4 space-y-3">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No {key} doctors.</p>
              ) : list.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} onVerify={() => setVerifyDoctor(doc)} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
      {verifyDoctor && <VerifyModal doctor={verifyDoctor} onClose={() => setVerifyDoctor(null)} />}
    </div>
  );
}
