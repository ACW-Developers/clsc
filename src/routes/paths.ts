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
  serviceList: "/hospitality/:slug",
  facility: "/hospitality/:slug/:id",
  checkout: "/checkout/:id",
  receipt: "/receipts/:id",
} as const;

export const comingSoon = (slug: string) => `/coming-soon/${slug}`;

export type AppPath = (typeof paths)[keyof typeof paths];
export const serviceUrl = (slug: string) => `/hospitality/${slug}`;
export const facilityUrl = (slug: string, id: string) =>
  `/hospitality/${slug}/${id}`;
export const checkoutUrl = (id: string) => `/checkout/${id}`;
export const receiptUrl = (id: string) => `/receipts/${id}`;
export const accountView = (v: string) => `/account?view=${v}`;
