import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useSupport";
import { supportService } from "@/services/support";
import { useAction } from "@/hooks/useHospitality";
import { cn } from "@/lib/utils";

/** Notification bell with unread badge and a dropdown of recent notifications. */
export function NotificationBell() {
  const notes = useNotifications();
  const all = notes.data ?? [];
  const unread = all.filter((n) => !n.read_at);
  const markRead = useAction((id: string) => supportService.markRead(id), ["notifications"]);
  const markAll = useAction((ids: string[]) => supportService.markAllRead(ids), ["notifications"]);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread.length > 9 ? "9+" : unread.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAll.mutate(unread.map((n) => n.id))}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {all.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {all.map((n) => (
            <div
              key={n.id}
              className={cn(
                "border-b px-4 py-3 last:border-0",
                !n.read_at && "bg-secondary/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 shrink-0 text-[10px]"
                    onClick={() => markRead.mutate(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
              {n.link && (
                <Link
                  to={n.link}
                  className="mt-1 inline-block text-xs text-primary hover:underline"
                  onClick={() => !n.read_at && markRead.mutate(n.id)}
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
