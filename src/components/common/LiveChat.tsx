import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Minus, Maximize2, Send, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatService } from "@/services/chat";
import { cn } from "@/lib/utils";

const KEY = "cslc-live-chat";
type Saved = { id: string; token: string; name: string };
const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z.string().trim().regex(/^(\+?254|0)[17]\d{8}$/, "Enter a valid Kenyan phone number"),
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z.string().trim().min(1, "Enter a message").max(2000),
});
const load = (): Saved | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; } };

/** Floating live-chat widget for public pages; replies arrive in real time. */
export function LiveChat() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(false);
  const [session, setSession] = useState<Saved | null>(load);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(0);
  const qc = useQueryClient();
  const end = useRef<HTMLDivElement>(null);

  const thread = useQuery({
    queryKey: ["live-chat", session?.id],
    queryFn: () => chatService.thread(session!.id, session!.token),
    enabled: !!session,
    refetchInterval: open && !min ? 20_000 : 60_000,
  });
  const msgs = thread.data ?? [];
  const unread = Math.max(0, msgs.filter((m) => m.sender === "staff").length - seen);

  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel(`chat-${session.token}`)
      .on("broadcast", { event: "new" }, () => qc.invalidateQueries({ queryKey: ["live-chat", session.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, qc]);
  useEffect(() => {
    if (open && !min) {
      setSeen(msgs.filter((m) => m.sender === "staff").length);
      end.current?.scrollIntoView({ block: "end" });
    }
  }, [msgs, open, min]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/setup-admin")) return null;

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    try {
      const r = await chatService.start(p.data as Required<typeof p.data>);
      const s = { ...r, name: p.data.name };
      localStorage.setItem(KEY, JSON.stringify(s));
      setSession(s);
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !text.trim()) return;
    setBusy(true);
    try { await chatService.send(session.id, session.token, text.trim().slice(0, 2000)); setText(""); thread.refetch(); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  const endChat = () => {
    if (!confirm("End this chat? The conversation will close on this device.")) return;
    localStorage.removeItem(KEY); setSession(null); setOpen(false); setSeen(0);
  };
  const status = msgs[0]?.status;

  if (!open)
    return (
      <button onClick={() => { setOpen(true); setMin(false); }} aria-label="Open live chat" title="Live chat"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6">
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{unread}</span>}
      </button>
    );

  return (
    <div role="dialog" aria-label="CSLC live chat"
      className="fixed bottom-3 right-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:bottom-6 sm:right-6">
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <MessageCircle className="h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">CSLC Live Support</p>
          <p className="truncate text-[11px] opacity-80">{session ? `Chat ${status === "resolved" ? "resolved" : status === "in_progress" ? "with our team" : "open · we'll reply shortly"}` : "We usually reply within minutes"}</p>
        </div>
        <button onClick={() => setMin(!min)} aria-label={min ? "Expand chat" : "Minimize chat"} title={min ? "Expand" : "Minimize"} className="rounded p-1 hover:bg-primary-foreground/15">
          {min ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </button>
        <button onClick={() => setOpen(false)} aria-label="Close chat" title="Close" className="rounded p-1 hover:bg-primary-foreground/15"><X className="h-4 w-4" /></button>
      </header>
      {!min && (session ? (
        <>
          <div className="flex max-h-[55vh] min-h-56 flex-col gap-2 overflow-y-auto bg-secondary/40 p-3" aria-live="polite">
            {thread.isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
            {msgs.map((m) => (
              <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.sender === "visitor" ? "self-end rounded-br-sm bg-primary text-primary-foreground" : "self-start rounded-bl-sm border bg-card")}>
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">{m.sender === "staff" ? "CSLC · " : ""}{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type a message…" aria-label="Message" />
            <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </form>
          <button onClick={endChat} className="pb-2 text-[11px] text-muted-foreground hover:text-foreground">End chat</button>
        </>
      ) : (
        <form onSubmit={start} className="grid gap-2 p-4">
          <p className="text-sm text-muted-foreground">Leave your details and message — our team will reply right here.</p>
          <Input placeholder="Full name" value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Full name" />
          <Input placeholder="Phone (e.g. 0712345678)" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone" />
          <Input placeholder="Email" type="email" value={form.email} maxLength={200} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
          <Textarea placeholder="How can we help?" rows={3} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-label="Message" />
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Start chat</Button>
        </form>
      ))}
    </div>
  );
}
