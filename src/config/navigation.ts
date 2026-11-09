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


/** Universal CSLC navigation. Hospitality is live; other modules show Coming Soon pages. */
export const mainNav: NavGroup[] = [
  { label: "Home", to: paths.home },
  {
    label: "About CSLC",
    items: [
      { label: "About CSLC", to: paths.about, description: "Who we are and what we do" },
      { label: "Thematic Areas", to: `${paths.about}#programmes` },
      { label: "Core Values", to: `${paths.about}#values` },
      { label: "Our Impact", to: `${paths.about}#impact` },
      { label: "Leadership & Team", to: `${paths.about}#team` },
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
      {
        label: "Browse Services",
        to: paths.hospitality,
        description: "Explore all hospitality services and facilities",
      },
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
      { label: "Events Calendar", to: paths.events },
      { label: "Programme Materials", to: paths.materials },
      { label: "Donate Now", to: paths.donate },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Daily Devotional", to: paths.devotionals },
      { label: "Bible Study Resources", to: paths.bibleStudy },
      { label: "Student Contributions", to: paths.contributions },
    ],
  },
  { label: "Contact", to: paths.contact },
];

export const findSoonLabel = (slug: string) =>
  mainNav.flatMap((g) => g.items ?? []).find((i) => i.to === comingSoon(slug))
    ?.label;
