import { Compass, Crown, HeartHandshake, Sprout, type LucideIcon } from "lucide-react";
import leadership from "@/assets/programmes/area-leadership.jpg";
import spiritual from "@/assets/programmes/area-spiritual.jpg";
import mentorship from "@/assets/programmes/area-mentorship.jpg";
import wellbeing from "@/assets/programmes/area-wellbeing.jpg";

/** The four CSLC student programme areas. Slugs match the database check constraint. */
export const programmeAreas = [
  {
    slug: "leadership-development",
    title: "Leadership Development",
    short: "Servant leadership through conferences, seminars and training.",
    description:
      "We nurture servant leaders who lead with integrity, humility and purpose. Through conferences, seminars and practical training, students are equipped to influence their campuses, churches and communities for good.",
    focus: ["Leadership conferences", "Seminars & workshops", "Practical leadership training"],
    image: leadership,
    icon: Crown,
  },
  {
    slug: "spiritual-formation",
    title: "Spiritual Formation & Discipleship",
    short: "Christian faith, spiritual growth and biblical understanding.",
    description:
      "We walk alongside students as they grow in Christian faith. Worship, fellowship, Bible study and discipleship deepen spiritual maturity and a sound understanding of Scripture.",
    focus: ["Bible study & discipleship", "Worship & prayer", "Spiritual growth"],
    image: spiritual,
    icon: Sprout,
  },
  {
    slug: "mentorship-life-skills",
    title: "Mentorship & Life Skills",
    short: "Campus life, professional development and life beyond university.",
    description:
      "We connect students with mentors and practical skills for campus life, professional growth and the transition beyond university — preparing them to thrive in work, family and society.",
    focus: ["Mentorship", "Professional development", "Life beyond university"],
    image: mentorship,
    icon: Compass,
  },
  {
    slug: "student-wellbeing",
    title: "Student Wellbeing & Campus Engagement",
    short: "Counselling, orientation, campus forums and social engagement.",
    description:
      "We care for the whole student. Counselling, orientation, campus forums and social engagement foster wellbeing, belonging and an active, caring campus community.",
    focus: ["Counselling", "Orientation", "Campus forums & social engagement"],
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
