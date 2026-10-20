import { supabase } from "@/integrations/supabase/client";

/** Auth data-access. Components use these via the useAuth hook. */
export const authService = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string, fullName: string, returnTo?: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${returnTo ?? "/"}`, data: { full_name: fullName } },
    }),
  signOut: () => supabase.auth.signOut(),
  requestPasswordReset: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
  updatePassword: (password: string) => supabase.auth.updateUser({ password }),
};
