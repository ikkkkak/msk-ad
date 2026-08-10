/** Habitat cadastre bulk import — Plan → Sector → Plot (version 1). */

export type HabitatBulkPlot = {
  plot_number: string;
  l_value?: string;
  i_value?: number;
  area_m2?: number;
  area_rounded?: number;
  il_value?: number;
  el_value?: number;
  res_value?: number;
  dimensions_string?: string;
  centroid_lat?: number;
  centroid_lng?: number;
  geom_geojson?: Record<string, unknown>;
  corners?: unknown;
  raw_properties?: Record<string, unknown>;
};

export type HabitatBulkSector = {
  name: string;
  name_ar?: string;
  code?: string;
  centroid_lat?: number;
  centroid_lng?: number;
  plots?: HabitatBulkPlot[];
};

export type HabitatBulkPlan = {
  code?: string;
  name: string;
  name_ar: string;
  color?: string;
  sectors?: HabitatBulkSector[];
};

export type HabitatBulkDocument = {
  version: 1;
  skip_existing?: boolean;
  sync_to_listings?: boolean;
  listings_city_name?: string;
  plans?: HabitatBulkPlan[];
  plan_id?: number;
  plan_code?: string;
  sector_id?: number;
  sectors?: HabitatBulkSector[];
  plots?: HabitatBulkPlot[];
};

export const HABITAT_BULK_RULES = [
  "version must be 1.",
  "Hierarchy: Plan (district) → Sector (sub-zone) → Plot (parcel).",
  "Plan required fields: name, name_ar. Optional: code (auto-generated from name if omitted).",
  "Sector required: name. name_ar defaults to name if omitted.",
  "Plot required: plot_number. Optional: area_m2, il_value, el_value, res_value, geom_geojson, centroid_lat/lng.",
  "skip_existing: skip duplicates (same plan code, or same sector name per plan, or same plot_number per sector).",
  "sync_to_listings: also create Zone (plan) and Quartier (sector) under listings_city_name (default Nouakchott).",
  "Max 2000 plots per API request — import large sectors in multiple batches using sector_id + plots[].",
  "Partial import: plan_code + sectors[], or sector_id + plots[], without full plans[] tree.",
];

/** Nine Nouakchott districts — import skeleton (add sectors/plots per plan in follow-up uploads). */
export const NOUAKCHOTT_PLANS_TEMPLATE: HabitatBulkDocument = {
  version: 1,
  skip_existing: true,
  sync_to_listings: true,
  listings_city_name: "Nouakchott",
  plans: [
    { code: "TEV", name: "Tevergh Zeina", name_ar: "تفرغ زينة" },
    { code: "ARF", name: "Arafat", name_ar: "عرفات" },
    { code: "DNM", name: "Dar Naim", name_ar: "دار النعيم" },
    { code: "MNA", name: "El Mina", name_ar: "الميناء" },
    { code: "RYD", name: "Riyad", name_ar: "الرياض" },
    { code: "SBK", name: "Sebkha", name_ar: "السبخة" },
    { code: "TYR", name: "Teyarett", name_ar: "تيارت" },
    { code: "TJN", name: "Toujounine", name_ar: "تجكجة" },
    { code: "KSR", name: "Ksar", name_ar: "لكصر" },
  ],
};
