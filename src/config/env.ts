import { z } from "zod";

/**
 * Typed, validated access to client env vars. Only VITE_-prefixed, publishable
 * values belong here — never private keys (those live in backend secrets).
 */
const schema = z.object({
  VITE_APP_NAME: z.string().default("CSLC"),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

const parsed = schema.parse(import.meta.env);

export const env = {
  appName: parsed.VITE_APP_NAME,
  supabaseUrl: parsed.VITE_SUPABASE_URL,
  supabaseKey: parsed.VITE_SUPABASE_PUBLISHABLE_KEY,
  isDev: import.meta.env.DEV,
} as const;
