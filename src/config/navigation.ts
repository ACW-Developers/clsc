import { comingSoon, paths } from "@/routes/paths";

export interface NavLink { label: string; to: string; description?: string }
export interface NavGroup { label: string; to?: string; items?: NavLink[] }

const soon = (label: string, slug: string, description?: string): NavLink => ({ label, to: comingSoon(slug), description });

/** Universal CSLC navigation. Hospitality is live; other modules show Coming Soon pages. */
export const mainNav: NavGroup[] = [
  { label: "Home", to: paths.home },
  { label: "About CSLC", items: [soon("Our Mission & History", "mission", "Who we are and where we come from"), soon("Leadership Team", "leadership", "Meet the people behind CSLC")] },
  { label: "Bookshop", items: [soon("Browse Products", "bookshop"), soon("Yaya Centre Stock", "yaya-stock"), soon("Kisumu Stock", "kisumu-stock"), soon("Shopping Cart", "cart"), soon("Order Management", "orders")] },
  { label: "Hospitality", items: [
    { label: "Accommodation", to: "/#accommodation" },
    { label: "Conference Facilities", to: "/#conference" },
    { label: "Restaurant", to: "/#restaurant" },
    { label: "Grounds", to: "/#grounds" },
    { label: "Outside Catering", to: "/#catering" },
    { label: "Hostels", to: "/#hostels" },
    { label: "Book Now", to: paths.book, description: "Check live availability and request a booking" },
  ] },
  { label: "Student Programmes", items: [soon("Events Calendar", "events"), soon("Programme Materials", "materials"), soon("Donate Now", "donate")] },
  { label: "Spiritual Resources", items: [soon("Daily Devotional", "devotional"), soon("Bible Study Resources", "bible-study"), soon("Submit Content", "submit-content")] },
  { label: "My Account", items: [{ label: "Login / Register", to: paths.auth }, soon("My Orders", "my-orders"), { label: "My Bookings", to: paths.account }, soon("My Donations", "my-donations")] },
  { label: "Contact", to: "/#contact" },
];

export const findSoonLabel = (slug: string) =>
  mainNav.flatMap((g) => g.items ?? []).find((i) => i.to === comingSoon(slug))?.label;
