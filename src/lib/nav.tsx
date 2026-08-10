import {
  IconDashboard,
  IconUsers,
  IconFolder,
  IconListDetails,
  IconReport,
  IconChartBar,
  IconHomeCheck,
  IconMapPin,
  IconMap,
  IconMap2,
  IconShield,
  IconBuilding,
  IconVideo,
  IconCamera,
  IconBug,
  IconCategory,
  IconPhoto,
  IconRobot,
  IconSparkles,
  IconNotebook,
  IconBriefcase,
  IconMusic,
  IconHeadphones,
  IconBrandWhatsapp,
  type Icon,
} from "@tabler/icons-react";

export type NavBadgeKey = "rent" | "sale" | "land" | "whatsapp";

export type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  badgeKey?: NavBadgeKey;
};

export const NAV_MAIN: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
  { title: "Users", url: "/dashboard/users", icon: IconUsers },
  {
    title: "Broker verifications",
    url: "/dashboard/broker-verifications",
    icon: IconShield,
  },
  {
    title: "Identity verifications",
    url: "/dashboard/identity-verifications",
    icon: IconReport,
  },
  {
    title: "Properties",
    url: "/dashboard/properties",
    icon: IconFolder,
    badgeKey: "rent",
  },
  {
    title: "Property Sales",
    url: "/dashboard/property-sales",
    icon: IconHomeCheck,
    badgeKey: "sale",
  },
  {
    title: "Organizations",
    url: "/dashboard/organizations",
    icon: IconBriefcase,
  },
  {
    title: "Countries & Locations",
    url: "/dashboard/cities",
    icon: IconBuilding,
  },
  { title: "Habitat cadastre", url: "/dashboard/habitat-gis", icon: IconMap },
  { title: "Cadastre map", url: "/dashboard/cadastre-map", icon: IconMap2 },
  {
    title: "Property Types",
    url: "/dashboard/property-types",
    icon: IconCategory,
  },
  {
    title: "Property Amenities",
    url: "/dashboard/amenities",
    icon: IconListDetails,
  },
  {
    title: "Landmarks",
    url: "/dashboard/landmarks",
    icon: IconMapPin,
    badgeKey: "land",
  },
  {
    title: "Experiences",
    url: "/dashboard/experiences",
    icon: IconListDetails,
  },
  { title: "Reservations", url: "/dashboard/reservations", icon: IconReport },
  { title: "Reviews", url: "/dashboard/reviews", icon: IconChartBar },
  { title: "Feedback", url: "/dashboard/feedback", icon: IconReport },
  {
    title: "AI Interactions",
    url: "/dashboard/ai-interactions",
    icon: IconRobot,
  },
  {
    title: "Specialist requests",
    url: "/dashboard/ai-escalations",
    icon: IconHeadphones,
  },
  {
    title: "Add with AI usage",
    url: "/dashboard/listing-ai-usage",
    icon: IconSparkles,
  },
  {
    title: "WhatsApp share usage",
    url: "/dashboard/whatsapp-share-usage",
    icon: IconBrandWhatsapp,
    badgeKey: "whatsapp",
  },
  {
    title: "Meskeny training",
    url: "/dashboard/meskeny-training",
    icon: IconNotebook,
  },
  {
    title: "AI web sources",
    url: "/dashboard/scraper",
    icon: IconSparkles,
  },
  {
    title: "Flagged Videos",
    url: "/dashboard/flagged-videos",
    icon: IconShield,
  },
  {
    title: "Video moderation",
    url: "/dashboard/video-moderation",
    icon: IconCamera,
  },
  {
    title: "Promotional Videos",
    url: "/dashboard/promotional-videos",
    icon: IconVideo,
  },
  {
    title: "Listing music",
    url: "/dashboard/music-library",
    icon: IconMusic,
  },
  {
    title: "Banners",
    url: "/dashboard/banners",
    icon: IconPhoto,
  },
  { title: "Crash Logs", url: "/dashboard/crash-logs", icon: IconBug },
];
