import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Please give consent before creating your account",
    }),
  }),
});
