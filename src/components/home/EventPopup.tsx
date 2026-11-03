import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/programmes/useProgrammes";
import { eventUrl } from "@/routes/paths";

const KEY = "cslc-event-popup-seen";

/** Shows the next upcoming event once per browsing session, auto-dismissing after 5s. */
export function EventPopup() {
  const { data } = useEvents();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const e = (data ?? []).find((x) => x.event_date >= today);

  useEffect(() => {
    if (!e || sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, "1");
    setOpen(true);
    const t = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(t);
  }, [e]);

  if (!open || !e) return null;
  return (
    <aside role="dialog" aria-label="Upcoming event" className="fixed bottom-4 left-3 right-3 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border bg-card p-3 text-card-foreground shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 sm:left-auto sm:right-6 sm:mx-0">
      {e.poster_url && <img src={e.poster_url} alt={e.title} className="h-20 w-16 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Upcoming event</p>
        <p className="truncate font-semibold">{e.title}</p>
        <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
        <Button asChild size="sm" className="mt-1.5 h-7 rounded-full px-3 text-xs"><Link to={eventUrl(e.id)}>See More</Link></Button>
      </div>
      <button onClick={() => setOpen(false)} aria-label="Close" className="self-start rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
    </aside>
  );
}
