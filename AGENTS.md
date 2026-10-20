# Architecture rules

- Stay a React + Vite + TypeScript SPA with react-router-dom; no framework migration — explicit owner requirement.
- Route paths live only in `src/routes/paths.ts`; routes are declared in `src/routes/AppRoutes.tsx` under `RootLayout` — one place to change URLs.
- Pages (`src/pages`, `*Page.tsx`) compose components; layouts in `src/layouts`; shared app components in `src/components/common`; shadcn primitives in `src/components/ui` untouched — clear ownership.
- Backend access only via `src/services/*` consumed through React Query hooks in `src/hooks` — keeps data access in one pattern and testable.
- Client env vars are read only through `src/config/env.ts` (zod-validated); private keys never go in client code — security.
- Global providers live in `src/providers/AppProviders.tsx` — single composition point.
- Future modules (hospitality, bookshop, programmes) get their own subfolders inside pages/components/services/hooks — modular growth.
- Use semantic design tokens from `src/index.css`; no hardcoded color utilities — theming consistency.
- Keep hospitality administration behind one role-guarded `/admin` page with query-driven views, reusing the existing service and React Query layers so staff permissions stay centralized.
