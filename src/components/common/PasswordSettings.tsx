import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { authService } from "@/services/auth";

/** Account settings: change password. */
export function PasswordSettings() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-lg space-y-4 rounded-2xl border bg-card p-6 shadow-card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return toast.error("Use at least 8 characters");
        setBusy(true);
        const { error } = await authService.updatePassword(pw);
        setBusy(false);
        if (error) return toast.error(error.message);
        setPw("");
        toast.success("Password updated");
      }}
    >
      <h2 className="font-semibold">Change password</h2>
      <div className="space-y-1.5">
        <Label htmlFor="npw">New password</Label>
        <PasswordInput
          id="npw"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
      </Button>
    </form>
  );
}
