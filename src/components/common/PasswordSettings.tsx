import { useState } from "react";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";

/** Account settings: change password. */
export function PasswordSettings() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-3xl space-y-4 rounded-lg border bg-card p-5 sm:p-6 shadow-card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return toast.error("Use at least 8 characters");
        if (pw !== confirm) return toast.error("Passwords do not match");
        setBusy(true);
        const { error } = await authService.updatePassword(pw);
        setBusy(false);
        if (error) return toast.error(error.message);
        setPw("");
        setConfirm("");
        toast.success("Password updated");
      }}
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Security
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="npw">New password</Label>
          <PasswordInput
            id="npw"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Confirm password</Label>
          <PasswordInput
            id="confirm-pw"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={busy || !user?.email}
          onClick={async () => {
            if (!user?.email) return;
            setBusy(true);
            try {
              const { error } = await authService.requestPasswordReset(
                user.email,
              );
              if (error) throw error;
              toast.success("Password reset link sent to your email");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not send reset email",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Mail className="h-4 w-4" />
          Email reset link
        </Button>
        <Button
          type="submit"
          disabled={busy || pw.length < 8 || pw !== confirm}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </Button>
      </div>
    </form>
  );
}
