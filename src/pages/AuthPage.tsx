import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, User } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/common/AuthShell";
import { PasswordInput } from "@/components/common/PasswordInput";
import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { signupSchema } from "@/lib/registration";

type Mode = "signin" | "signup" | "forgot";

const email = z.string().trim().email("Enter a valid email address").max(255);
const schemas = {
  signin: z.object({
    email,
    password: z.string().min(1, "Enter your password"),
  }),
  signup: signupSchema,
  forgot: z.object({ email }),
};

const AuthPage = () => {
  const [params, setParams] = useSearchParams();
  const mode: Mode = (
    ["signup", "forgot"].includes(params.get("mode") ?? "")
      ? params.get("mode")
      : "signin"
  ) as Mode;
  const navigate = useNavigate();
  const { user } = useAuth();
  const next = params.get("next");
  const returnTo =
    next && next.startsWith("/") && !next.startsWith("//") ? next : paths.home;
  const { isStaff, isLoading: rolesLoading } = useRoles();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !rolesLoading)
      navigate(next ? returnTo : isStaff ? paths.admin : paths.home, {
        replace: true,
      });
  }, [user, rolesLoading, isStaff, navigate, next, returnTo]);

  const setMode = (m: Mode) => {
    setErrors({});
    setError("");
    setNotice("");
    setParams({
      ...(returnTo !== paths.home ? { next: returnTo } : {}),
      ...(m === "signin" ? {} : { mode: m }),
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const parsed = schemas[mode].safeParse({ ...form, consent });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path[0], i.message]),
        ),
      );
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const em = form.email.trim();
      if (mode === "signin") {
        const { error } = await authService.signIn(em, form.password);
        if (error) throw error;
        toast.success("Welcome back!");
      } else if (mode === "signup") {
        const { data, error } = await authService.signUp(
          em,
          form.password,
          form.fullName.trim(),
          returnTo,
        );
        if (error) throw error;
        if (!data.session)
          setNotice(
            "Account created. Check your email to confirm your address, then sign in.",
          );
        else toast.success("Account created");
      } else {
        const { error } = await authService.requestPasswordReset(em);
        if (error) throw error;
        setNotice(
          "If an account exists for that email, a password reset link has been sent.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value }),
    "aria-invalid": !!errors[k],
  });

  return (
    <AuthShell>
      {mode !== "forgot" ? (
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          {(["signin", "signup"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant="ghost"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition",
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </Button>
          ))}
        </div>
      ) : (
        <div className="mb-6 text-center">
          <p className="font-semibold">Reset your password</p>
          <p className="text-sm text-muted-foreground">
            We'll email you a link to set a new password.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Jane Wanjiku"
                className="h-11 bg-muted pl-10"
                {...field("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 bg-muted pl-10"
              {...field("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>
        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Button>
              )}
            </div>
            <PasswordInput
              id="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              placeholder="••••••••"
              {...field("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="signup-consent"
                checked={consent}
                onCheckedChange={(value) => setConsent(value === true)}
                aria-invalid={!!errors.consent}
              />
              <Label
                htmlFor="signup-consent"
                className="text-xs font-normal leading-relaxed"
              >
                I consent to CSLC processing my account and contact details to
                manage my bookings, orders, and support requests.
              </Label>
            </div>
            {errors.consent && (
              <p role="alert" className="text-xs text-destructive">
                {errors.consent}
              </p>
            )}
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={loading || (mode === "signup" && !consent)}
          className="h-11 w-full text-base"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin"
            ? "Sign In"
            : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
        </Button>
        {mode === "forgot" && (
          <Button
            type="button"
            variant="link"
            onClick={() => setMode("signin")}
            className="w-full text-sm text-primary hover:underline"
          >
            Back to sign in
          </Button>
        )}
      </form>
    </AuthShell>
  );
};

export default AuthPage;
