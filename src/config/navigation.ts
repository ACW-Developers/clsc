import { branchUrl, comingSoon, paths, serviceUrl } from "@/routes/paths";

export interface NavLink {
  label: string;
  to: string;
  description?: string;
}
export interface NavGroup {
  label: string;
  to?: string;
  items?: NavLink[];
}

const soon = (label: string, slug: string, description?: string): NavLink => ({
  label,
  to: comingSoon(slug),
  description,
});

/** Universal CSLC navigation. Hospitality is live; other modules show Coming Soon pages. */
export const mainNav: NavGroup[] = [
  { label: "Home", to: paths.home },
  {
    label: "About CSLC",
    items: [
      soon(
        "Our Mission & History",
        "mission",
        "Who we are and where we come from",
      ),
      soon("Leadership Team", "leadership", "Meet the people behind CSLC"),
    ],
  },
  {
    label: "Bookshop",
    items: [
      { label: "Browse Products", to: paths.bookshop },
      { label: "Yaya Centre Bookshop", to: branchUrl("yaya") },
      { label: "Kisumu Bookshop", to: branchUrl("kisumu") },
      { label: "Shopping Cart", to: paths.cart },
    ],
  },
  {
    label: "Hospitality",
    items: [
      { label: "Accommodation", to: serviceUrl("accommodation") },
      { label: "Conference Facilities", to: serviceUrl("conference") },
      { label: "Restaurant", to: serviceUrl("restaurant") },
      { label: "Grounds", to: serviceUrl("grounds") },
      { label: "Outside Catering", to: serviceUrl("catering") },
      { label: "Hostels", to: serviceUrl("hostels") },
      {
        label: "Book Now",
        to: paths.book,
        description: "Check live availability and request a booking",
      },
    ],
  },
  {
    label: "Student Programmes",
    items: [
      soon("Events Calendar", "events"),
      soon("Programme Materials", "materials"),
      soon("Donate Now", "donate"),
    ],
  },
  {
    label: "Resources",
    items: [
      soon("Daily Devotional", "devotional"),
      soon("Bible Study Resources", "bible-study"),
      soon("Submit Content", "submit-content"),
    ],
  },
  { label: "Contact", to: paths.contact },
];

export const findSoonLabel = (slug: string) =>
  mainNav.flatMap((g) => g.items ?? []).find((i) => i.to === comingSoon(slug))
    ?.label;
