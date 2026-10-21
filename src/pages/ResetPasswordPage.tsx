import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/common/AuthShell";
import { PasswordInput } from "@/components/common/PasswordInput";
import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import { paths } from "@/routes/paths";

const ResetPasswordPage = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    const { error } = await authService.updatePassword(password);
    setLoading(false);
    if (error) return setError(error.message);
    toast.success("Password updated");
    navigate(paths.home, { replace: true });
  };

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <p className="font-semibold">Set a new password</p>
      </div>
      {!authLoading && !session ? (
        <Alert variant="destructive">
          <AlertDescription>
            This reset link is invalid or has expired. Request a new one from
            the sign-in page.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">New password</Label>
            <PasswordInput
              id="pw"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirm password</Label>
            <PasswordInput
              id="pw2"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={loading} className="h-11 w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Update
            Password
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPasswordPage;
