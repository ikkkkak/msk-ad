/** Canonical Add-with-locations bulk import format (version 1). */

export type LocationBulkQuartier = {
  key?: string;
  name: string;
  name_ar: string;
  parent_key?: string | null;
  parent_index?: number | null;
  sub_quartiers?: LocationBulkQuartier[];
};

export type LocationBulkZone = {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  quartiers?: LocationBulkQuartier[];
};

export type LocationBulkCity = {
  name: string;
  name_ar: string;
  country?: string;
  country_ar?: string;
  zones?: LocationBulkZone[];
};

export type LocationBulkDocument = {
  version: 1;
  skip_existing?: boolean;
  cities?: LocationBulkCity[];
  city_id?: number;
  city_name?: string;
  zone_id?: number;
  zones?: LocationBulkZone[];
  quartiers?: LocationBulkQuartier[];
};

export const LOCATION_BULK_EXAMPLE: LocationBulkDocument = {
  version: 1,
  skip_existing: true,
  cities: [
    {
      name: "Nouakchott",
      name_ar: "نواكشوط",
      country: "Mauritania",
      country_ar: "موريتانيا",
      zones: [
        {
          name: "Tevragh-Zeina",
          name_ar: "تفرغ زينة",
          description: "Central district",
          description_ar: "الحي المركزي",
          quartiers: [
            {
              key: "center",
              name: "Center",
              name_ar: "الوسط",
              parent_key: null,
              sub_quartiers: [
                {
                  name: "Main Market",
                  name_ar: "السوق الرئيسي",
                },
              ],
            },
            {
              key: "coast",
              name: "Coastal strip",
              name_ar: "الساحل",
              parent_key: null,
            },
          ],
        },
      ],
    },
  ],
};

/** Quartiers-only example (select zone in UI or set zone_id). */
export const LOCATION_BULK_QUARTIERS_ONLY_EXAMPLE = {
  version: 1 as const,
  skip_existing: true,
  zone_id: 0,
  quartiers: [
    { name: "Downtown Center", name_ar: "وسط المدينة", parent_index: null },
    { name: "Commercial District", name_ar: "المنطقة التجارية", parent_index: null },
    { name: "Main Market", name_ar: "السوق الرئيسي", parent_index: 2 },
  ],
};

export const LOCATION_BULK_FORMAT_RULES = [
  "Set version to 1 (required).",
  "Set skip_existing to true to skip duplicates (matched by name + name_ar within the same parent).",
  "Full tree: use cities[] → zones[] → quartiers[].",
  "Add zones to an existing city: set city_id or city_name and provide zones[] (no cities[]).",
  "Add quartiers to an existing zone: set zone_id and provide quartiers[] (no cities[]).",
  "Quartier required fields: name (English), name_ar (Arabic).",
  "Parent links: use sub_quartiers[] (nested), parent_key (string key on sibling), or parent_index (1-based position in the quartiers array).",
  "Country defaults to Mauritania / موريتانيا if omitted on new cities.",
];
