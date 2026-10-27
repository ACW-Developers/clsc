import type { ReactNode } from "react";
import { Activity, type LucideIcon } from "lucide-react";
export function StatCard({ label, value, icon: Icon = Activity, detail }: { label: string; value: ReactNode; icon?: LucideIcon; detail?: string }) {
  return <article className="min-w-0 rounded-lg border bg-card p-4 shadow-card">
    <div className="mb-3 flex items-start justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{label}</p><span className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span></div>
    <p className="break-words text-xl font-bold sm:text-2xl">{value}</p>{detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
  </article>;
}