import {
  IconDashboard,
  IconUsers,
  IconFolder,
  IconListDetails,
  IconReport,
  IconChartBar,
  IconHomeCheck,
  IconMapPin,
  IconShield,
  IconBuilding,
  IconVideo,
  IconBug,
  IconCategory,
  type Icon,
} from "@tabler/icons-react";

export type NavItem = { title: string; url: string; icon?: Icon };

export const NAV_MAIN: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
  { title: "Users", url: "/dashboard/users", icon: IconUsers },
  { title: "Properties", url: "/dashboard/properties", icon: IconFolder },
  {
    title: "Property Sales",
    url: "/dashboard/property-sales",
    icon: IconHomeCheck,
  },
  { title: "Cities & Zones", url: "/dashboard/cities", icon: IconBuilding },
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
  { title: "Landmarks", url: "/dashboard/landmarks", icon: IconMapPin },
  {
    title: "Experiences",
    url: "/dashboard/experiences",
    icon: IconListDetails,
  },
  { title: "Reservations", url: "/dashboard/reservations", icon: IconReport },
  { title: "Reviews", url: "/dashboard/reviews", icon: IconChartBar },
  { title: "Feedback", url: "/dashboard/feedback", icon: IconReport },
  {
    title: "Flagged Videos",
    url: "/dashboard/flagged-videos",
    icon: IconShield,
  },
  {
    title: "Promotional Videos",
    url: "/dashboard/promotional-videos",
    icon: IconVideo,
  },
  { title: "Crash Logs", url: "/dashboard/crash-logs", icon: IconBug },
];
