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
- First super-admin setup is two-step (register approved mailbox, then claim after email confirmation) in the setup-admin function — server enforces approval and one-time use.
- Keep first-admin eligibility in the setup function's shared policy module with focused tests — registration and claiming must enforce the same approval.
- Unbuilt modules route to a shared Coming Soon page driven by `src/config/navigation.ts` — one place to grow the menu.
- Facility payments run through the simulate_payment security-definer function, which alone may mark bookings paid and issue receipts — clients can never forge payment state.
- Category display and form fields share src/config/facilityCategories.ts; facility information is stored in sub_services.details and booking requests in notes — consistent rendering without changing trusted pricing rules.
- Dashboard charts use the existing Recharts dependency and theme controls use next-themes in AppProviders — reuse dependencies and semantic tokens.
- Facility uploads are resized and compressed before storage; labelled sample media uses asset pointers — reduce transfer size without changing logo storage.
