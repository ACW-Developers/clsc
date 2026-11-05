import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chatService } from "@/services/chat";
import { cn } from "@/lib/utils";

/** Staff inbox for live-chat tickets with real-time two-way replies. */
export function AdminLiveChat() {
  const qc = useQueryClient();
  const sessions = useQuery({ queryKey: ["chat-sessions"], queryFn: chatService.sessions });
  const [active, setActive] = useState<string | null>(null);
  const current = sessions.data?.find((s) => s.id === active) ?? sessions.data?.[0];
  const msgs = useQuery({ queryKey: ["chat-messages", current?.id], queryFn: () => chatService.messages(current!.id), enabled: !!current });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ch = supabase.channel(`admin-chat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages"] });
        qc.invalidateQueries({ queryKey: ["chat-sessions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.data]);

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !text.trim()) return;
    setBusy(true);
    try { await chatService.reply(current.id, text.trim()); setText(""); msgs.refetch(); sessions.refetch(); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  const setStatus = async (status: string) => {
    try { await chatService.setStatus(current!.id, status); sessions.refetch(); } catch (err) { toast.error((err as Error).message); }
  };

  if (sessions.isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  if (sessions.error) return <p className="text-sm text-destructive">{(sessions.error as Error).message}</p>;
  if (!sessions.data?.length) return <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No live chats yet.</div>;

  return (
    <div className="grid gap-3 md:grid-cols-[16rem_1fr]">
      <ul className="grid max-h-[60vh] content-start gap-2 overflow-y-auto">
        {sessions.data.map((s) => (
          <li key={s.id}>
            <button onClick={() => setActive(s.id)} className={cn("w-full rounded-xl border p-3 text-left transition-colors hover:bg-secondary", current?.id === s.id && "border-primary bg-primary/5")}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{s.name}</span>
                <Badge variant={s.status === "resolved" ? "default" : s.status === "in_progress" ? "secondary" : "outline"} className="shrink-0 text-[10px]">{s.status.replace("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{new Date(s.last_message_at).toLocaleString()}</p>
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div className="flex min-w-0 flex-col rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
            <div className="min-w-0 text-sm">
              <p className="font-semibold">{current.name}</p>
              <p className="break-all text-xs text-muted-foreground"><a href={`tel:${current.phone}`} className="hover:underline">{current.phone}</a> · <a href={`mailto:${current.email}`} className="hover:underline">{current.email}</a></p>
            </div>
            <Select value={current.status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 text-xs" aria-label="Chat status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex max-h-[50vh] min-h-64 flex-col gap-2 overflow-y-auto bg-secondary/40 p-3">
            {msgs.data?.map((m) => (
              <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.sender === "staff" ? "self-end rounded-br-sm bg-primary text-primary-foreground" : "self-start rounded-bl-sm border bg-card")}>
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">{m.sender === "staff" ? "CSLC" : current.name} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form onSubmit={reply} className="flex gap-2 border-t p-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Reply to visitor…" aria-label="Reply" />
            <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Send reply"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      )}
    </div>
  );
}
