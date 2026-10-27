export interface CategoryConfig {
  capacity: string;
  start: string;
  end: string;
  unit: string;
  information: string[];
  requests: string[];
}
const categories: Record<string, CategoryConfig> = {
  accommodation: {
    capacity: "Guests",
    start: "Arrival date",
    end: "Departure date",
    unit: "per day",
    information: ["Room type", "Bed configuration", "Bathroom", "Meal plan"],
    requests: ["Arrival time", "Room preferences"],
  },
  conference: {
    capacity: "Delegates",
    start: "Event start",
    end: "Event end",
    unit: "per day",
    information: [
      "Seating layouts",
      "AV equipment",
      "Internet",
      "Refreshments",
    ],
    requests: ["Event name", "Seating layout", "AV requirements"],
  },
  restaurant: {
    capacity: "Diners",
    start: "Dining date",
    end: "Last dining date",
    unit: "per person",
    information: ["Menu", "Dining style", "Dietary options", "Meal service"],
    requests: ["Meal service", "Dietary requirements"],
  },
  grounds: {
    capacity: "Attendees",
    start: "Event start",
    end: "Event end",
    unit: "per day",
    information: [
      "Outdoor area",
      "Weather provision",
      "Power supply",
      "Event setup",
    ],
    requests: ["Event type", "Setup requirements"],
  },
  catering: {
    capacity: "Servings",
    start: "Event date",
    end: "Last service date",
    unit: "per person",
    information: [
      "Menu package",
      "Service style",
      "Delivery area",
      "Included equipment",
    ],
    requests: ["Delivery venue", "Menu preferences", "Dietary requirements"],
  },
  hostels: {
    capacity: "Residents",
    start: "Arrival date",
    end: "Departure date",
    unit: "per person",
    information: ["Room sharing", "Beds", "Bathroom", "Resident facilities"],
    requests: ["Group name", "Room-sharing preferences"],
  },
};
export const categoryConfig = (slug: string): CategoryConfig =>
  categories[slug] ?? {
    capacity: "Guests",
    start: "Start date",
    end: "End date",
    unit: "per day",
    information: [],
    requests: [],
  };
