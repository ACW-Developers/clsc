import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { WhyChoose } from "@/components/hospitality/HomeSections";
import {
  BookshopBand,
  Departments,
  EnquiryBand,
  HospitalityBand,
  InstitutionHero,
  IntroSplit,
  ProgrammesSection,
} from "@/components/home/InstitutionSections";

const HomePage = () => (
  <div className="relative overflow-x-hidden">
    <SiteHeader />
    <InstitutionHero />
    <Departments />
    <IntroSplit />
    <BookshopBand />
    <HospitalityBand />
    <ProgrammesSection />
    <WhyChoose />
    <EnquiryBand />
    <SiteFooter />
  </div>
);

export default HomePage;
