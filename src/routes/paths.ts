/** Single source of truth for route paths. Add module paths here as they are built. */
export const paths = {
  home: "/",
  // hospitality: "/hospitality",
  // bookshop: "/bookshop",
  // programmes: "/programmes",
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
