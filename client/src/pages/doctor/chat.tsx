import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Send, Bot, User, Stethoscope, RefreshCw, FileText,
  Image, Download, Search, ChevronRight, MessageSquare, AlertCircle, Sparkles,
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

interface PatientChatData {
  patient: { id: string; firstName: string; lastName: string; email: string };
  messages: ChatMessage[];
  files: ChatFile[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ msg, isDoctor }: { msg: ChatMessage; isDoctor: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm ${isUser ? (isDoctor ? "bg-blue-600" : "bg-primary") : "bg-emerald-600"}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser ? "bg-blue-600 text-white rounded-tr-sm" : "bg-card border border-border text-card-foreground rounded-tl-sm"}`}>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        <div className="text-xs mt-1.5 opacity-60">
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

function PatientRecordsPanel({ patientId, onAskAI }: { patientId: string; onAskAI: (prompt: string) => void }) {
  const { data, isLoading } = useQuery<PatientChatData>({
    queryKey: ["/api/chat/patient", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/patient/${patientId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!patientId,
  });

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  );

  if (!data) return null;

  const buildFilePrompt = (f: ChatFile) => {
    const desc = f.description ? ` The patient described it as: "${f.description}".` : "";
    return `I am reviewing a report uploaded by patient ${data.patient.firstName} ${data.patient.lastName}. The file is named "${f.originalName}" (${f.fileType}, uploaded ${format(new Date(f.createdAt), "d MMM yyyy")}).${desc} Based on this context, please provide clinical recommendations or ask me what you can see in this report.`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          AI Consultation History
          <Badge variant="secondary">{data.messages.length}</Badge>
        </h3>
        {data.messages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No consultation history yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {data.messages.map((m) => (
              <div key={m.id} className={`text-xs p-2 rounded-lg ${m.role === "user" ? "bg-muted" : "bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800"}`}>
                <span className="font-medium capitalize">{m.role === "user" ? "Patient" : "DentAI"}:</span>{" "}
                <span className="text-muted-foreground">{m.content.slice(0, 200)}{m.content.length > 200 ? "…" : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Uploaded Reports
          <Badge variant="secondary">{data.files.length}</Badge>
        </h3>
        {data.files.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No reports uploaded by this patient</p>
        ) : (
          <div className="space-y-2">
            {data.files.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden" data-testid={`patient-file-${f.id}`}>
                {f.fileType.startsWith("image/") && (
                  <a href={`/api/chat/files/${f.id}/download`} target="_blank" rel="noreferrer">
                    <img
                      src={`/api/chat/files/${f.id}/download`}
                      alt={f.originalName}
                      className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                )}
                <div className="p-2 space-y-1.5">
                  <div className="flex items-start gap-2">
                    {f.fileType.startsWith("image/") ? (
                      <Image className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{f.originalName}</p>
                      {f.description && <p className="text-xs text-muted-foreground italic truncate">{f.description}</p>}
                      <p className="text-xs text-muted-foreground">{formatBytes(f.fileSize)} · {format(new Date(f.createdAt), "d MMM yyyy")}</p>
                    </div>
                    <a
                      href={`/api/chat/files/${f.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded hover:bg-background shrink-0"
                      data-testid={`button-download-patient-file-${f.id}`}
                    >
                      <Download className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                  <button
                    onClick={() => onAskAI(buildFilePrompt(f))}
                    className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                    data-testid={`button-ask-ai-file-${f.id}`}
                  >
                    <Sparkles className="h-3 w-3" />
                    Ask AI about this report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorChatPage() {
  const [input, setInput] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery<ChatSession>({
    queryKey: ["/api/chat/session"],
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/doctor/appointments"],
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat/message", { message });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/session"] });
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, sendMutation.isPending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const patientMap = new Map<string, { id: string; name: string }>();
  for (const appt of appointments) {
    if (appt.patient && !patientMap.has(appt.patient.id)) {
      patientMap.set(appt.patient.id, {
        id: appt.patient.id,
        name: `${appt.patient.firstName} ${appt.patient.lastName}`,
      });
    }
  }
  const patients = Array.from(patientMap.values()).filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const messages = session?.messages ?? [];

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Clinical AI Assistant
            </h1>
            <p className="text-sm text-muted-foreground">Ask me about diagnoses, treatments, pharmacology, or patient cases</p>
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
                <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Clinical Decision Support</h3>
                <p className="text-sm max-w-xs">
                  Ask me about differential diagnoses, treatment options, drug references, or discuss a patient case.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {[
                    "Differential for tooth sensitivity",
                    "Antibiotic choice for dental abscess",
                    "When to refer for endodontics",
                    "Post-extraction care instructions",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                      data-testid={`suggestion-${s.slice(0, 20).toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} isDoctor={true} />
              ))
            )}
            {sendMutation.isPending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a clinical question… (Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-32 resize-none text-sm"
                disabled={sendMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sendMutation.isPending}
                className="h-9 w-9 shrink-0 self-end"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="w-72 flex flex-col gap-3">
        <Card className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Patient Records
            </CardTitle>
            <CardDescription className="text-xs">View a patient's AI consultation history and uploaded files</CardDescription>
            <div className="mt-1">
              <Input
                placeholder="Search patients…"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-patient-search"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 pt-0 space-y-1">
            {patients.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No patients found</p>
            ) : (
              patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(selectedPatientId === p.id ? null : p.id)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${selectedPatientId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  data-testid={`button-patient-${p.id}`}
                >
                  <div className="h-6 w-6 rounded-full bg-current/20 flex items-center justify-center text-xs font-medium shrink-0">
                    {p.name[0]}
                  </div>
                  <span className="flex-1 truncate">{p.name}</span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${selectedPatientId === p.id ? "rotate-90" : ""}`} />
                </button>
              ))
            )}
          </CardContent>

          {selectedPatientId && (
            <div className="border-t border-border p-3">
              <PatientRecordsPanel
                patientId={selectedPatientId}
                onAskAI={(prompt) => {
                  setInput(prompt);
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          )}
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>DentAI is a reference tool. Clinical decisions should be based on professional judgment and current guidelines.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
