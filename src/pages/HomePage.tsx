import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { ContactBand, FeatureStrip, Hero, QuickServicesCard, ServicesGrid, WhyChoose } from "@/components/hospitality/HomeSections";

const HomePage = () => (
  <div className="relative overflow-x-hidden">
    <SiteHeader />
    <Hero />
    <QuickServicesCard />
    <FeatureStrip />
    <ServicesGrid />
    <WhyChoose />
    <ContactBand />
    <SiteFooter />
  </div>
);

export default HomePage;
