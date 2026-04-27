import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Send, Bot, User, Paperclip, Trash2, X, RefreshCw,
  FileText, Image, AlertCircle, Upload, Download, Sparkles, ScanEye,
} from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  description: string;
  createdAt: string;
}

interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`} data-testid={`chat-message-${msg.id}`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${isUser ? "bg-primary" : "bg-emerald-600"}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-card-foreground rounded-tl-sm"}`}>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        <div className={`text-xs mt-1.5 opacity-60`}>
          {format(new Date(msg.createdAt), "h:mm a")}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function PatientChatPage() {
  const [input, setInput] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analyzeFileId, setAnalyzeFileId] = useState<string | null>(null);
  const [analyzeFileName, setAnalyzeFileName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery<ChatSession>({
    queryKey: ["/api/chat/session"],
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<ChatFile[]>({
    queryKey: ["/api/chat/files"],
  });

  const sendMutation = useMutation({
    mutationFn: async ({ message, fileId }: { message: string; fileId?: string }) => {
      const res = await apiRequest("POST", "/api/chat/message", {
        message,
        ...(fileId ? { file_id: fileId } : {}),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/session"] });
      setAnalyzeFileId(null);
      setAnalyzeFileName("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/chat/session");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/session"] });
      toast({ title: "Conversation cleared" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/chat/files", {
        method: "POST",
        body: formData,
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
      setFileDescription("");
      setShowUpload(false);
      toast({ title: "File uploaded successfully" });
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiRequest("DELETE", `/api/chat/files/${fileId}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/files"] });
      toast({ title: "File deleted" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, sendMutation.isPending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate({ message: text, fileId: analyzeFileId ?? undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", fileDescription);
    uploadMutation.mutate(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const messages = session?.messages ?? [];

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-600" />
              DentAI Assistant
            </h1>
            <p className="text-sm text-muted-foreground">Describe your dental concern and I'll help you understand it</p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              data-testid="button-clear-chat"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              New Chat
            </Button>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sessionLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Hello! I'm DentAI</h3>
                <p className="text-sm max-w-xs">
                  Tell me about your dental concern and I'll ask some questions to help you understand what might be going on.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {["I have tooth pain", "My gums are bleeding", "Sensitivity to cold", "I need a checkup"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                      data-testid={`suggestion-${s.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
            )}
            {sendMutation.isPending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-3 space-y-2">
            {analyzeFileId && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <ScanEye className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 flex-1 truncate">
                  Analyzing: <span className="font-medium">{analyzeFileName}</span>
                </span>
                <button
                  onClick={() => { setAnalyzeFileId(null); setAnalyzeFileName(""); }}
                  className="text-emerald-600 hover:text-emerald-800"
                  data-testid="button-detach-image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={analyzeFileId ? "Ask DentAI about this image… (Enter to send)" : "Describe your dental concern… (Enter to send, Shift+Enter for new line)"}
                className="min-h-[44px] max-h-32 resize-none text-sm"
                disabled={sendMutation.isPending}
                data-testid="input-chat-message"
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  className="h-9 w-9 shrink-0"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setShowUpload(!showUpload)}
                  className="h-9 w-9 shrink-0"
                  data-testid="button-toggle-upload"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="w-72 flex flex-col gap-3">
        {showUpload && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Upload File
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowUpload(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">X-rays, reports, or dental photos (JPG, PNG, PDF — max 10MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-file-upload"
              >
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Drop file here or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                data-testid="input-file-upload"
              />
              <Textarea
                placeholder="Description (optional)"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                className="min-h-[60px] text-xs resize-none"
                data-testid="input-file-description"
              />
              {uploadMutation.isPending && (
                <p className="text-xs text-center text-muted-foreground">Uploading…</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Records
              <Badge variant="secondary" className="ml-auto text-xs">{files.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Uploaded X-rays &amp; reports shared with your doctor</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 pt-0 space-y-2">
            {filesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No files uploaded yet</p>
              </div>
            ) : (
              files.map((f) => (
                <div key={f.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden" data-testid={`file-item-${f.id}`}>
                  {f.fileType.startsWith("image/") && (
                    <a href={`/api/chat/files/${f.id}/download`} target="_blank" rel="noreferrer">
                      <img
                        src={`/api/chat/files/${f.id}/download`}
                        alt={f.originalName}
                        className="w-full h-20 object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                  <div className="p-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {f.fileType.startsWith("image/") ? (
                          <Image className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" title={f.originalName}>{f.originalName}</p>
                        {f.description && <p className="text-xs text-muted-foreground italic truncate">{f.description}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <a
                          href={`/api/chat/files/${f.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded hover:bg-background transition-colors"
                          data-testid={`button-download-file-${f.id}`}
                        >
                          <Download className="h-3 w-3 text-muted-foreground" />
                        </a>
                        <button
                          onClick={() => deleteMutation.mutate(f.id)}
                          className="p-1 rounded hover:bg-background transition-colors"
                          data-testid={`button-delete-file-${f.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                    {f.fileType.startsWith("image/") && (
                      <button
                        onClick={() => {
                          setAnalyzeFileId(f.id);
                          setAnalyzeFileName(f.originalName);
                          setInput("Please analyze this dental image and tell me what you observe. Are there any concerning findings?");
                        }}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors ${analyzeFileId === f.id ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300"}`}
                        data-testid={`button-analyze-image-${f.id}`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {analyzeFileId === f.id ? "Image attached" : "Analyze with AI"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>DentAI provides information only, not medical diagnoses. Always consult a qualified dentist.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
