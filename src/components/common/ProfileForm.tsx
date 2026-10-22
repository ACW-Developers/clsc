import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAction, useMyProfile } from "@/hooks/useHospitality";
import { hospitalityService as svc } from "@/services/hospitality";
import { initials } from "./UserMenu";

/** Own profile: photo, name and phone. */
export function ProfileForm() {
  const { user } = useAuth();
  const me = useMyProfile();
  const qc = useQueryClient();
  const [f, setF] = useState<{ full_name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const save = useAction(
    (p: { full_name?: string; phone?: string }) => svc.updateProfile(user!.id, p),
    ["profiles"],
    "Profile saved",
  );
  if (me.isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  const p = me.data;
  const name = p?.full_name || user?.email || "";
  return (
    <form
      className="max-w-lg space-y-4 rounded-2xl border bg-card p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({
          full_name: (f.full_name ?? p?.full_name ?? "").trim().slice(0, 100),
          phone: (f.phone ?? p?.phone ?? "").trim().slice(0, 30),
        });
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={p?.avatar_url ?? undefined} alt="Profile photo" className="object-cover" />
          <AvatarFallback className="bg-primary text-xl text-primary-foreground">{initials(name)}</AvatarFallback>
        </Avatar>
        <Button asChild type="button" variant="outline" size="sm">
          <label className="cursor-pointer">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
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
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={p?.email ?? user?.email ?? ""} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-name">Full name</Label>
        <Input id="pf-name" defaultValue={p?.full_name ?? ""} maxLength={100} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-phone">Phone</Label>
        <Input id="pf-phone" defaultValue={p?.phone ?? ""} maxLength={30} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <Button type="submit" disabled={save.isPending}>
        {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
      </Button>
    </form>
  );
}
