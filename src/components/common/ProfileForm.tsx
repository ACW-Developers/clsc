import { useState } from "react";
import { Camera, Loader2, User, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAction, useMyProfile, useRoles } from "@/hooks/useHospitality";
import { hospitalityService as svc } from "@/services/hospitality";
import { initials } from "./UserMenu";
import { Badge } from "@/components/ui/badge";
import { PasswordSettings } from "./PasswordSettings";

/** Own profile: photo, name and phone. */
export function ProfileForm() {
  const { user } = useAuth();
  const { isStaff, isSuperAdmin } = useRoles();
  const me = useMyProfile();
  const qc = useQueryClient();
  const [f, setF] = useState<{ full_name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const save = useAction(
    (p: { full_name?: string; phone?: string }) => {
      if (!user) throw new Error("Please sign in");
      return svc.updateProfile(user.id, p);
    },
    ["profiles"],
    "Profile saved",
  );
  if (me.isLoading)
    return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  const p = me.data;
  const name = p?.full_name || user?.email || "";
  return (
    <div className="max-w-3xl space-y-6">
    <section className="overflow-hidden rounded-lg border bg-card shadow-card">
      <div className="h-20 border-b bg-primary/5" />
      <div className="flex flex-wrap items-center gap-4 px-5 pb-5">
        <Avatar className="-mt-8 h-20 w-20 border-4 border-card"><AvatarImage src={p?.avatar_url ?? undefined} className="object-cover" /><AvatarFallback className="bg-primary text-xl text-primary-foreground">{initials(name)}</AvatarFallback></Avatar>
        <div className="min-w-0 pt-3"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-xl font-semibold">{name}</h2><Badge variant="secondary"><ShieldCheck className="mr-1 h-3 w-3" />{isSuperAdmin ? "Super administrator" : isStaff ? "Administrator" : "Regular user"}</Badge></div><p className="break-all text-sm text-muted-foreground">{p?.email ?? user?.email}</p>{p?.created_at && <p className="mt-1 text-xs text-muted-foreground">Member since {new Date(p.created_at).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}</p>}</div>
      </div>
    </section>
    <form
      className="space-y-5 rounded-lg border bg-card p-5 sm:p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({
          full_name: (f.full_name ?? p?.full_name ?? "").trim().slice(0, 100),
          phone: (f.phone ?? p?.phone ?? "").trim().slice(0, 30),
        });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold"><User className="h-4 w-4 text-primary" />Personal information</h3>
        <Button asChild type="button" variant="outline" size="sm">
          <label className="cursor-pointer">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {p?.avatar_url ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                setBusy(true);
                try {
                  await svc.uploadAvatar(user.id, file);
                  qc.invalidateQueries({ queryKey: ["profiles"] });
                  toast.success("Photo updated");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="pf-name">Full name</Label>
        <Input
          id="pf-name"
          defaultValue={p?.full_name ?? ""}
          maxLength={100}
          onChange={(e) => setF({ ...f, full_name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-phone">Phone</Label>
        <Input
          id="pf-phone"
          defaultValue={p?.phone ?? ""}
          maxLength={30}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
        />
      </div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="pf-email" className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label><Input id="pf-email" value={p?.email ?? user?.email ?? ""} disabled /><p className="text-xs text-muted-foreground">Your sign-in email cannot be changed here.</p></div>
      <div className="flex justify-end border-t pt-4"><Button type="submit" disabled={save.isPending}>
        {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
        profile
      </Button></div>
    </form>
    <PasswordSettings />
    </div>
  );
}
