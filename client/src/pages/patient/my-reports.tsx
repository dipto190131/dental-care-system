import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Trash2, Eye, ImageIcon, FileText, FolderOpen, X, CheckCircle, Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface PatientFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  description: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreviewModal({ file, onClose }: { file: PatientFile; onClose: () => void }) {
  const isImage = file.fileType.startsWith("image/");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{file.originalName}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.fileSize)}</p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <a
              href={`/api/chat/files/${file.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
              data-testid={`link-open-file-${file.id}`}
            >
              Open full
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted"
              data-testid="button-close-preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/30 min-h-64">
          {isImage ? (
            <img
              src={`/api/chat/files/${file.id}/download`}
              alt={file.originalName}
              className="max-w-full max-h-[60vh] rounded-lg object-contain shadow"
            />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Preview not available</p>
              <a
                href={`/api/chat/files/${file.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-sm underline-offset-2 hover:underline mt-1 inline-block"
              >
                Open file
              </a>
            </div>
          )}
        </div>
        {file.description && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Note: </span>{file.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyReportsPage() {
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<PatientFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: files = [], isLoading } = useQuery<PatientFile[]>({
    queryKey: ["/api/chat/files"],
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("description", description);
      const res = await fetch("/api/chat/files", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/files"] });
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Report uploaded successfully" });
    },
    onError: (e: Error) => {
      toast({ title: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/chat/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/files"] });
      setDeleteConfirm(null);
      toast({ title: "Report deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete report", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(f.type)) {
      toast({ title: "Only image files are allowed (JPG, PNG, GIF, WEBP)", variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large. Maximum size is 10MB", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setSelectedFile(f);
  };

  const imageFiles = files.filter((f) => f.fileType.startsWith("image/"));
  const otherFiles = files.filter((f) => !f.fileType.startsWith("image/"));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and manage your dental reports and X-ray images. Your doctor can view these before or during your appointment.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Upload a Report
          </CardTitle>
          <CardDescription>Images only (JPG, PNG, WEBP). Maximum 10 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-upload"
          >
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                <button
                  className="text-xs text-destructive hover:underline mt-1"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  data-testid="button-clear-file"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-40" />
                <p className="text-sm font-medium">Click to select an image</p>
                <p className="text-xs">JPG, PNG, WEBP up to 10 MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-file-upload"
          />
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Description <span className="text-muted-foreground font-normal">(optional — e.g. "Left molar X-ray from Dr. Smith, 2024")</span>
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this report…"
              className="text-sm"
              data-testid="input-file-description"
            />
          </div>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-upload-report"
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Upload Report</>
            )}
          </Button>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            My Uploaded Reports
            <Badge variant="secondary">{files.length}</Badge>
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No reports uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your dental X-rays and reports so your doctor can review them.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {imageFiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Images</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imageFiles.map((f) => (
                    <div
                      key={f.id}
                      className="group relative rounded-xl overflow-hidden border border-border bg-muted/30 aspect-square"
                      data-testid={`report-card-${f.id}`}
                    >
                      <img
                        src={`/api/chat/files/${f.id}/download`}
                        alt={f.originalName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setPreviewFile(f)}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                          data-testid={`button-preview-${f.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {deleteConfirm === f.id ? (
                          <button
                            onClick={() => deleteMutation.mutate(f.id)}
                            className="p-2 rounded-lg bg-red-500/80 hover:bg-red-600/80 text-white transition-colors"
                            data-testid={`button-confirm-delete-${f.id}`}
                          >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(f.id)}
                            className="p-2 rounded-lg bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                            data-testid={`button-delete-${f.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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

            {otherFiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Files</p>
                <div className="space-y-2">
                  {otherFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      data-testid={`report-row-${f.id}`}
                    >
                      <FileText className="h-8 w-8 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(f.fileSize)} · {format(new Date(f.createdAt), "d MMM yyyy")}
                        </p>
                        {f.description && <p className="text-xs text-muted-foreground italic truncate">{f.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`/api/chat/files/${f.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                          data-testid={`link-download-${f.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {deleteConfirm === f.id ? (
                          <button
                            onClick={() => deleteMutation.mutate(f.id)}
                            className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                            data-testid={`button-confirm-delete-${f.id}`}
                          >
                            {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(f.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            data-testid={`button-delete-${f.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center py-2">
              Your reports are private and only visible to you and doctors you book appointments with.
            </p>
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
