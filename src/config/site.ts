import accommodation from "@/assets/svc-accommodation.jpg";
import conference from "@/assets/svc-conference.jpg";
import restaurant from "@/assets/svc-restaurant.jpg";
import grounds from "@/assets/svc-grounds.jpg";
import catering from "@/assets/svc-catering.jpg";
import hostels from "@/assets/svc-hostels.jpg";
import { BedDouble, Presentation, UtensilsCrossed, Trees, ChefHat, Building2, type LucideIcon } from "lucide-react";

/** Public site content. Contact details are added here once confirmed by CSLC. */
export const site = {
  name: "Christian Student Leadership Centre",
  short: "CSLC",
  location: "Ufungamano House, Nairobi, Kenya",
};

export interface HospitalityService {
  id: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  icon: LucideIcon;
}

export const hospitalityServices: HospitalityService[] = [
  { id: "accommodation", title: "Accommodation", tag: "Stay", description: "Comfortable rooms for guests, delegates and visiting groups.", image: accommodation, icon: BedDouble },
  { id: "conference", title: "Conference Facilities", tag: "Meet", description: "Halls and meeting rooms for conferences, trainings and seminars.", image: conference, icon: Presentation },
  { id: "restaurant", title: "Restaurant", tag: "Dine", description: "Freshly prepared meals for guests, delegates and visitors.", image: restaurant, icon: UtensilsCrossed },
  { id: "grounds", title: "Grounds & Outdoor Spaces", tag: "Celebrate", description: "Gardens and open spaces for events, retreats and gatherings.", image: grounds, icon: Trees },
  { id: "catering", title: "Outside Catering", tag: "Cater", description: "Catering services delivered to your event venue.", image: catering, icon: ChefHat },
  { id: "hostels", title: "Hostels", tag: "Live", description: "Hostel accommodation for students and young leaders.", image: hostels, icon: Building2 },
];
