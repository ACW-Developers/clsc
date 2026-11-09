import { Church, Compass, Crown, HeartHandshake, Sprout, type LucideIcon } from "lucide-react";
import leadership from "@/assets/programmes/area-leadership.jpg";
import spiritual from "@/assets/programmes/area-spiritual.jpg";
import mentorship from "@/assets/programmes/area-mentorship.jpg";
import church from "@/assets/programmes/area-church.jpg";
import wellbeing from "@/assets/programmes/area-wellbeing.jpg";

/** The five CSLC thematic areas (from the CSLC profile). Slugs match the database check constraint. */
export const programmeAreas = [
  {
    slug: "leadership-development",
    title: "Leadership and Capacity Development",
    short: "Instilling servant leadership in Christian students and student leaders.",
    description:
      "This programme seeks to build the capacity of Christian students, Student Government officials, and the general student body with the aim of instilling the values of servant leadership, supporting them to grow as leaders, and improving service delivery to their constituents.",
    focus: [
      "Christian student leaders training — Nairobi and Western",
      "Leaders transition support programme",
      "Annual Christian student leaders conference",
      "Student Government mentorship programme — UNSA",
      "Global Leadership Summit support",
      "Annual student leadership summit",
      "Student Leadership Academy",
    ],
    image: leadership,
    icon: Crown,
  },
  {
    slug: "mentorship-life-skills",
    title: "Mentorship and Life-Skills",
    short: "Helping students cope with life's issues and make the best of its opportunities.",
    description:
      "This is a programme designed to help students cope with issues that they face in their lives and to make the best out of the opportunities that life offers them.",
    focus: [
      "First Year Mentorship Programme — Campus Smart",
      "Orientation leaders training",
      "Mentorship classes",
      "Finalists programme",
      "Young Leaders Programme",
      "Gender-based mentorship programme",
    ],
    image: mentorship,
    icon: Compass,
  },
  {
    slug: "student-church-engagement",
    title: "Student Church Engagement Programme",
    short: "A one-year internship exposing graduates to Christian ministry.",
    description:
      "This is a one-year internship programme which is designed to equip and expose university graduates to Christian ministry in the church and Christian organizations.",
    focus: ["ECMP internship recruitment, training and placement", "ECMP hosts follow-up programme"],
    image: church,
    icon: Church,
  },
  {
    slug: "spiritual-formation",
    title: "Student Spiritual Formation Programme",
    short: "Encouraging Christian maturity, witness and unity on campus.",
    description:
      "This programme aims at encouraging Christian maturity, witness, and promoting unity among Christian groups on the campus.",
    focus: [
      "Worship experience services",
      "Student mission outreach",
      "Campus ministry network",
      "Chaplaincy support programme",
      "Worship leaders training",
      "Student morning devotion and chapel services",
      "Meeting facilities for student small groups",
    ],
    image: spiritual,
    icon: Sprout,
  },
  {
    slug: "student-wellbeing",
    title: "Student Wellness Programme",
    short: "Holistic care — spiritual, mental, social and physical wellbeing.",
    description:
      "This involves programmes that target holistic ministry to students, which includes spiritual, mental, social, and physical well-being and support for needy students.",
    focus: [
      "Student Wellness Summit",
      "Support for needy students",
      "Students work-study programme",
      "Counselling and psycho-social support",
      "Advocacy",
      "Student Wellness Support Network",
    ],
    image: wellbeing,
    icon: HeartHandshake,
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  short: string;
  description: string;
  focus: readonly string[];
  image: string;
  icon: LucideIcon;
}[];

export type ProgrammeAreaSlug = (typeof programmeAreas)[number]["slug"];
export const findProgrammeArea = (slug?: string) =>
  programmeAreas.find((a) => a.slug === slug);
