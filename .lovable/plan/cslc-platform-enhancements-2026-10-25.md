# CSLC platform enhancements

## 1. PWA (installable, offline-capable)
- Manifest (`public/manifest.webmanifest`) with CSLC name, theme colors, `display: standalone`, icons from the existing crest logo (192/512px PNGs).
- `vite-plugin-pwa` with `generateSW`, `registerType: "autoUpdate"`, `injectRegister: null`, `devOptions.enabled: false`, NetworkFirst navigations, CacheFirst hashed assets.
- Guarded registration wrapper: never registers in dev, iframe, or Lovable preview hostnames; supports `?sw=off`; unregisters stale workers in refused contexts.
- Head tags: manifest link, theme-color, apple-touch-icon.

## 2. Contact page (`/contact`)
- Hero with overlay, breadcrumb, centered title (matching ServiceListPage style).
- Location map (OpenStreetMap embed of Ufungamano House, Nairobi) — no API key needed.
- Split-screen: contact details (address, email, phone from site config) + validated enquiry form (name, email, subject, message).
- Navbar "Contact" link now points to `/contact` instead of the home anchor.
- Submissions stored in a new `contact_enquiries` table (status: new / in_progress / resolved), insert-only for visitors, staff read/manage.

## 3. Support tickets
- New `support_tickets` table (user_id, subject, message, status: open / in_progress / resolved, admin_reply, created/updated).
- Customer dashboard: new "Support" view — submit a ticket, track own tickets with statuses and replies.
- Admin dashboard: new "Support" view with two tabs — Contact Enquiries and User Tickets — with status management and replies.

## 4. Notifications
- New `notifications` table (user_id nullable = broadcast to staff, title, body, link, read_at).
- Server triggers: new booking → notify staff; booking status/payment change → notify customer; new ticket/enquiry → notify staff; admin reply → notify customer.
- Bell icon in DashboardShell header with unread count badge, dropdown list, mark-as-read; badge dot on matching sidebar items (Bookings, Support).

## 5. Tooltips
- Wrap icon-only controls (theme toggle, refresh, sidebar toggle, bell, mobile menu, gallery arrows) in the existing shadcn Tooltip with accessible labels.

## Verification
- Build check, booking/order tests, Playwright pass: contact form submit → admin Support shows it; ticket submit/reply; notification bell unread flow; PWA manifest served; no overflow on mobile.
