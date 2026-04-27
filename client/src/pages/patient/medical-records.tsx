import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Stethoscope, Calendar, Pill, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { generateMedicalRecordPDF } from "@/lib/pdf-generator";
import { useAuth } from "@/contexts/AuthContext";

function RecordCard({ record, patientName }: { record: any; patientName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    <Card data-testid={`record-card-${record.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{record.diagnosis}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Stethoscope className="h-3 w-3" />
                  Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(record.createdAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
            data-testid={`button-expand-${record.id}`}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "Less" : "Details"}
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
                <div className="space-y-2">
                  {record.prescriptions.map((rx: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-md bg-card border border-card-border p-3">
                      <Pill className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{rx.medication}</p>
                        <p className="text-xs text-muted-foreground">{rx.dosage} · {rx.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {record.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{record.notes}</p>
              </div>
            )}
            {record.followUpDate && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Follow-up: {format(parseISO(record.followUpDate), "MMM d, yyyy")}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/patient/medical-records"],
  });

  const patientName = user ? `${user.firstName} ${user.lastName}` : "Patient";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
        <p className="text-muted-foreground mt-0.5">Your dental health history and prescriptions.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No records yet</h3>
          <p className="text-sm text-muted-foreground">Your dental records will appear here after your appointments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record: any) => (
            <RecordCard key={record.id} record={record} patientName={patientName} />
          ))}
        </div>
      )}
    </div>
  );
}
