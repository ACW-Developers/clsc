/** Single source of truth for route paths. */
export const paths = {
  home: "/",
  auth: "/auth",
  resetPassword: "/reset-password",
  admin: "/admin",
  adminSetup: "/setup-admin",
  account: "/account",
  book: "/account?book=1",
  comingSoon: "/coming-soon/:slug",
} as const;

export const comingSoon = (slug: string) => `/coming-soon/${slug}`;

export type AppPath = (typeof paths)[keyof typeof paths];
