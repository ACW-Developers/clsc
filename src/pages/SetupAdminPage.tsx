import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/common/AuthShell";
import { PasswordInput } from "@/components/common/PasswordInput";
import { FullLoader } from "@/components/common/RouteGuards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useSetupStatus } from "@/hooks/useHospitality";
import { hospitalityService } from "@/services/hospitality";
import { paths } from "@/routes/paths";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(10, "Use at least 10 characters").max(72),
});

/** One-time first super-admin setup. The server refuses once a super admin exists. */
const SetupAdminPage = () => {
  const status = useSetupStatus();
  const { user } = useAuth();
  const claim = async () => {
    setError("");
    setLoading(true);
    try {
      await hospitalityService.setupAdmin({ action: "claim" });
      toast.success("You are now the super administrator");
      window.location.assign(paths.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (status.isLoading) return <FullLoader />;
  if (status.data && !done) return <Navigate to={paths.auth} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const p = schema.safeParse(form);
    if (!p.success)
      return setErrors(
        Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])),
      );
    setErrors({});
    setLoading(true);
    try {
      await hospitalityService.setupAdmin(
        p.data as { fullName: string; email: string; password: string },
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
      status.refetch();
    } finally {
      setLoading(false);
    }
  };
  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <AuthShell>
      <div className="mb-5 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-2 font-semibold">First-time administrator setup</p>
        <p className="text-sm text-muted-foreground">
          This page works once. It closes permanently after the first super
          administrator is created.
        </p>
      </div>
      {user ? (
        <div className="space-y-4 text-center">
          <p className="text-sm">
            Signed in as <strong>{user.email}</strong>.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={claim} disabled={loading} className="h-11 w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Finish
            Setup
          </Button>
        </div>
      ) : done ? (
        <div className="space-y-4 text-center">
          <Alert>
            <AlertDescription>
              Check your inbox and confirm your email. Then sign in and return
              to this page to finish setup.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to={`${paths.auth}?next=${paths.adminSetup}`}>
              Go to Sign In
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fn">Full name</Label>
            <Input id="fn" className="h-11 bg-muted" {...f("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em">Email</Label>
            <Input
              id="em"
              type="email"
              className="h-11 bg-muted"
              {...f("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <PasswordInput
              id="pw"
              autoComplete="new-password"
              {...f("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={loading} className="h-11 w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create
            Super Administrator
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already confirmed?{" "}
            <Link
              to={`${paths.auth}?next=${paths.adminSetup}`}
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
};
export default SetupAdminPage;
