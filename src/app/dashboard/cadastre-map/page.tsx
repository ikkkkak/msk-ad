"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type StyleSpecification,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Meskeny cadastre map — full-bleed satellite view of the Nouakchott cadastre.
 *
 * - Basemap: MapLibre GL + Esri World Imagery (no token; Mapbox's hosts don't
 *   resolve from this network).
 * - Pick a Zone → Sector to overlay that sector's cadastre grid (per-sector
 *   RASTER tiles, which render via a legacy path with no PostGIS — the same
 *   proven path the mobile app uses).
 * - Tick one or more Sub-areas (Ilots) to draw those plots as vectors in the
 *   mobile cadastre style: amber outline, terracotta for-sale, corner dots,
 *   plot number + area on click.
 * - For-sale parcels: polygons + pins from /landmarks/public/map (no PostGIS).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://api.meskeny.com/api";

const NOUAKCHOTT: [number, number] = [-15.9785, 18.0858];
const TERRACOTTA = "#D16024";
// Mobile cadastre palette (utils/habitatMapTheme.ts).
const PLOT_STROKE = "#D97706"; // neutral amber
const PLOT_FILL = "rgba(255,255,255,0.32)";
const SALE_STROKE = "#D16024";
const SALE_FILL = "rgba(209,96,36,0.16)";

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  },
  layers: [{ id: "esri", type: "raster", source: "esri" }],
};

type Plan = { id: number; name: string; name_ar?: string; code?: string };
type Sector = {
  id: number;
  name: string;
  name_ar?: string;
  code?: string;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
};
type SubSector = {
  id: number;
  name: string;
  name_ar?: string;
  plot_count?: number;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
};
type PlotRow = {
  plot_number?: string;
  area_rounded?: number;
  area_m2?: number;
  is_for_sale?: boolean;
  geom_geojson?: unknown;
};

type RingPoint = {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};
type Landmark = {
  title?: string;
  price?: number;
  currency?: string;
  area?: number;
  area_unit?: string;
  zone_name?: string;
  centroid_lat?: number;
  centroid_lng?: number;
  plot_ring?: RingPoint[];
  point1_lat?: number;
  point1_lng?: number;
  point2_lat?: number;
  point2_lng?: number;
  point3_lat?: number;
  point3_lng?: number;
  point4_lat?: number;
  point4_lng?: number;
};

const label = (o: { name: string; name_ar?: string }) =>
  o.name_ar?.trim() || o.name;

function money(v?: number, currency?: string): string {
  if (v == null || !Number.isFinite(v) || v <= 0) return "";
  return `${Math.round(v).toLocaleString()} ${currency || "MRU"}`;
}

/** Outer rings ([lng,lat][]) from a plot's geom_geojson (Polygon/MultiPolygon/Feature). */
function geomToRings(geom: unknown): [number, number][][] {
  const out: [number, number][][] = [];
  const g = geom as { type?: string; geometry?: unknown; coordinates?: unknown };
  if (!g || typeof g !== "object") return out;
  const geometry = (g.type === "Feature" ? g.geometry : g) as {
    type?: string;
    coordinates?: unknown;
  } | null;
  if (!geometry) return out;
  const pushPoly = (coords: unknown) => {
    if (Array.isArray(coords) && Array.isArray(coords[0])) {
      const ring = (coords[0] as unknown[])
        .filter(
          (c): c is [number, number] =>
            Array.isArray(c) &&
            Number.isFinite((c as number[])[0]) &&
            Number.isFinite((c as number[])[1]),
        )
        .map((c) => [Number(c[0]), Number(c[1])] as [number, number]);
      if (ring.length >= 3) out.push(ring);
    }
  };
  if (geometry.type === "Polygon") pushPoly(geometry.coordinates);
  else if (geometry.type === "MultiPolygon")
    for (const poly of (geometry.coordinates as unknown[]) ?? []) pushPoly(poly);
  return out;
}

function landmarkRing(l: Landmark): [number, number][] | null {
  const pr = l.plot_ring;
  if (Array.isArray(pr) && pr.length >= 3) {
    const ring = pr
      .map(
        (p) =>
          [Number(p.lng ?? p.longitude), Number(p.lat ?? p.latitude)] as [
            number,
            number,
          ],
      )
      .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
    if (ring.length >= 3) {
      ring.push(ring[0]);
      return ring;
    }
  }
  const corners = (
    [
      [Number(l.point1_lng), Number(l.point1_lat)],
      [Number(l.point2_lng), Number(l.point2_lat)],
      [Number(l.point3_lng), Number(l.point3_lat)],
      [Number(l.point4_lng), Number(l.point4_lat)],
    ] as [number, number][]
  ).filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
  if (corners.length >= 3) {
    corners.push(corners[0]);
    return corners;
  }
  return null;
}

function landmarkPopupHTML(l: Landmark): string {
  const title = String(l.title ?? "Land for sale");
  const price = money(Number(l.price), String(l.currency));
  const area =
    l.area != null && Number(l.area) > 0
      ? `${Number(l.area).toLocaleString()} ${String(l.area_unit || "m²")}`
      : "";
  return `
    <div class="cm-pop">
      <div class="cm-pop-head"><span class="cm-pop-badge">For sale</span></div>
      <div class="cm-pop-title">${title}</div>
      ${price ? `<div class="cm-pop-price">${price}</div>` : ""}
      ${area ? `<div class="cm-pop-row"><span>Area</span><b>${area}</b></div>` : ""}
    </div>`;
}

function plotPopupHTML(p: PlotRow): string {
  const no = String(p.plot_number ?? "—");
  const areaRaw = p.area_rounded ?? p.area_m2;
  const area =
    areaRaw != null && Number(areaRaw) > 0
      ? `${Number(areaRaw).toLocaleString()} m²`
      : "—";
  return `
    <div class="cm-pop">
      <div class="cm-pop-head">
        <span class="cm-pop-kicker">Parcel</span>
        ${p.is_for_sale ? '<span class="cm-pop-badge">For sale</span>' : ""}
      </div>
      <div class="cm-pop-title">N° ${no}</div>
      <div class="cm-pop-row"><span>Area</span><b>${area}</b></div>
    </div>`;
}

async function getJSON<T>(url: string): Promise<T[]> {
  try {
    const r = await fetch(url);
    const j = (await r.json()) as { data?: T[] };
    return j?.data ?? [];
  } catch {
    return [];
  }
}

export default function CadastreMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [forSaleCount, setForSaleCount] = useState<number | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subSectors, setSubSectors] = useState<SubSector[]>([]);
  const [planId, setPlanId] = useState<number | "">("");
  const [sectorId, setSectorId] = useState<number | "">("");
  const [subSectorIds, setSubSectorIds] = useState<number[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(false);

  // ── Map + satellite + for-sale layer + delegated click handlers (once) ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: SATELLITE_STYLE,
        center: NOUAKCHOTT,
        zoom: 12.6,
        attributionControl: false,
      });
    } catch (err) {
      console.error("Cadastre map failed to initialize:", err);
      setMapError(true);
      return;
    }
    mapRef.current = map;

    map.on("error", (e) =>
      console.error("Cadastre map error:", e?.error?.message ?? e?.error ?? e),
    );
    map.on("load", () => {
      try {
        map.resize();
      } catch {}
      setLoaded(true);
    });
    const ro = new ResizeObserver(() => {
      try {
        map.resize();
      } catch {}
    });
    if (containerRef.current) ro.observe(containerRef.current);
    const resizeRaf = requestAnimationFrame(() => {
      try {
        map.resize();
      } catch {}
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    );

    // Delegated handlers — safe to bind before the layers exist; they only
    // fire once the corresponding layer is on the map.
    const pointer = () => (map.getCanvas().style.cursor = "pointer");
    const clear = () => (map.getCanvas().style.cursor = "");
    for (const id of ["parcels-fill", "pins-core"]) {
      map.on("mouseenter", id, pointer);
      map.on("mouseleave", id, clear);
      map.on("click", id, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: "260px" })
          .setLngLat(e.lngLat)
          .setHTML(landmarkPopupHTML((f.properties ?? {}) as Landmark))
          .addTo(map);
      });
    }
    map.on("mouseenter", "ss-plots-fill", pointer);
    map.on("mouseleave", "ss-plots-fill", clear);
    map.on("click", "ss-plots-fill", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      new maplibregl.Popup({ offset: 8, closeButton: false, maxWidth: "220px" })
        .setLngLat(e.lngLat)
        .setHTML(plotPopupHTML((f.properties ?? {}) as PlotRow))
        .addTo(map);
    });

    fetch(`${API_BASE}/landmarks/public/map?lang=en`)
      .then((r) => r.json())
      .then((json: { data?: Landmark[]; landmarks?: Landmark[] }) => {
        const list = json?.data ?? json?.landmarks ?? [];
        setForSaleCount(list.length);

        const polygons: GeoJSON.Feature[] = [];
        const points: GeoJSON.Feature[] = [];
        for (const l of list) {
          const props = {
            title: l.title ?? "Land for sale",
            price: l.price ?? 0,
            currency: l.currency ?? "MRU",
            area: l.area ?? 0,
            area_unit: l.area_unit ?? "m²",
            zone_name: l.zone_name ?? "",
          };
          const ring = landmarkRing(l);
          if (ring)
            polygons.push({
              type: "Feature",
              geometry: { type: "Polygon", coordinates: [ring] },
              properties: props,
            });
          const lat = Number(l.centroid_lat);
          const lng = Number(l.centroid_lng);
          if (Number.isFinite(lat) && Number.isFinite(lng))
            points.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: [lng, lat] },
              properties: props,
            });
        }

        const render = () => {
          if (!mapRef.current) return;
          map.addSource("parcels", {
            type: "geojson",
            data: { type: "FeatureCollection", features: polygons },
          });
          map.addLayer({
            id: "parcels-fill",
            type: "fill",
            source: "parcels",
            paint: { "fill-color": TERRACOTTA, "fill-opacity": 0.28 },
          });
          map.addLayer({
            id: "parcels-line",
            type: "line",
            source: "parcels",
            paint: { "line-color": TERRACOTTA, "line-width": 1.6 },
          });
          map.addSource("pins", {
            type: "geojson",
            data: { type: "FeatureCollection", features: points },
          });
          map.addLayer({
            id: "pins-halo",
            type: "circle",
            source: "pins",
            paint: {
              "circle-radius": 12,
              "circle-color": TERRACOTTA,
              "circle-opacity": 0.22,
              "circle-blur": 0.3,
            },
          });
          map.addLayer({
            id: "pins-core",
            type: "circle",
            source: "pins",
            paint: {
              "circle-radius": 5.5,
              "circle-color": TERRACOTTA,
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 2,
            },
          });
        };
        if (map.isStyleLoaded()) render();
        else map.once("load", render);
      })
      .catch(() => setForSaleCount(0));

    return () => {
      ro.disconnect();
      cancelAnimationFrame(resizeRaf);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Load the Zone list once ────────────────────────────────────────────
  useEffect(() => {
    void getJSON<Plan>(`${API_BASE}/habitat/plans`).then(setPlans);
  }, []);

  // ── Zone → sectors ─────────────────────────────────────────────────────
  useEffect(() => {
    setSectors([]);
    setSubSectors([]);
    setSectorId("");
    setSubSectorIds([]);
    if (planId === "") return;
    setLoadingSectors(true);
    void getJSON<Sector>(`${API_BASE}/habitat/plans/${planId}/sectors`)
      .then(setSectors)
      .finally(() => setLoadingSectors(false));
  }, [planId]);

  // ── Sector → sub-sectors ───────────────────────────────────────────────
  useEffect(() => {
    setSubSectors([]);
    setSubSectorIds([]);
    if (sectorId === "") return;
    void getJSON<SubSector>(
      `${API_BASE}/habitat/sectors/${sectorId}/sub-sectors`,
    ).then(setSubSectors);
  }, [sectorId]);

  // ── Sector → raster cadastre overlay + fly-to ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const apply = () => {
      if (map.getLayer("sector-cadastre")) map.removeLayer("sector-cadastre");
      if (map.getSource("sector-cadastre")) map.removeSource("sector-cadastre");
      if (sectorId === "") return;

      map.addSource("sector-cadastre", {
        type: "raster",
        tiles: [
          `${API_BASE}/habitat/sectors/${sectorId}/raster-tiles/{z}/{x}/{y}`,
        ],
        tileSize: 256,
        minzoom: 11,
        maxzoom: 20,
      });
      const before = map.getLayer("parcels-fill") ? "parcels-fill" : undefined;
      map.addLayer(
        {
          id: "sector-cadastre",
          type: "raster",
          source: "sector-cadastre",
          paint: { "raster-opacity": 1 },
        },
        before,
      );

      const s = sectors.find((x) => x.id === sectorId);
      if (s?.centroid_lat != null && s?.centroid_lng != null) {
        map.flyTo({
          center: [Number(s.centroid_lng), Number(s.centroid_lat)],
          zoom: 15.5,
          duration: 900,
        });
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [sectorId, loaded, sectors]);

  // ── Selected sub-areas → mobile-style vector plots (+ corners) + fit ────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    let cancelled = false;

    const clearPlotLayers = () => {
      for (const id of ["ss-corners", "ss-plots-line", "ss-plots-fill"])
        if (map.getLayer(id)) map.removeLayer(id);
      for (const id of ["ss-plots-src", "ss-corners-src"])
        if (map.getSource(id)) map.removeSource(id);
    };

    if (subSectorIds.length === 0) {
      if (map.isStyleLoaded()) clearPlotLayers();
      return;
    }

    setLoadingPlots(true);
    void (async () => {
      const chunks = await Promise.all(
        subSectorIds.map((id) =>
          getJSON<PlotRow>(
            `${API_BASE}/habitat/sub-sectors/${id}/plots?all=true`,
          ),
        ),
      );
      if (cancelled || !mapRef.current) return;
      const plots = chunks.flat();

      const polys: GeoJSON.Feature[] = [];
      const corners: GeoJSON.Feature[] = [];
      const bounds = new maplibregl.LngLatBounds();
      for (const p of plots) {
        const props = {
          plot_number: p.plot_number ?? "",
          area_rounded: p.area_rounded ?? p.area_m2 ?? 0,
          is_for_sale: !!p.is_for_sale,
        };
        for (const ring of geomToRings(p.geom_geojson)) {
          const closed =
            ring[0][0] === ring[ring.length - 1][0] &&
            ring[0][1] === ring[ring.length - 1][1]
              ? ring
              : [...ring, ring[0]];
          polys.push({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [closed] },
            properties: props,
          });
          for (let i = 0; i < ring.length; i++) {
            const c = ring[i];
            bounds.extend(c);
            if (i < ring.length - 1 || ring.length < 4)
              corners.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: c },
                properties: {},
              });
          }
        }
      }

      const applyLayers = () => {
        if (!mapRef.current) return;
        clearPlotLayers();
        map.addSource("ss-plots-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: polys },
        });
        map.addLayer({
          id: "ss-plots-fill",
          type: "fill",
          source: "ss-plots-src",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["get", "is_for_sale"], false],
              SALE_FILL,
              PLOT_FILL,
            ],
          },
        });
        map.addLayer({
          id: "ss-plots-line",
          type: "line",
          source: "ss-plots-src",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["get", "is_for_sale"], false],
              SALE_STROKE,
              PLOT_STROKE,
            ],
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13,
              0.8,
              16,
              1.4,
              18,
              1.8,
            ],
          },
        });
        map.addSource("ss-corners-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: corners },
        });
        map.addLayer({
          id: "ss-corners",
          type: "circle",
          source: "ss-corners-src",
          minzoom: 15,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              1.6,
              18,
              3.2,
            ],
            "circle-color": "#FFFFFF",
            "circle-stroke-color": PLOT_STROKE,
            "circle-stroke-width": 1.2,
          },
        });
        if (!bounds.isEmpty())
          map.fitBounds(bounds, { padding: 60, maxZoom: 17.5, duration: 800 });
      };
      if (map.isStyleLoaded()) applyLayers();
      else map.once("load", applyLayers);
      setLoadingPlots(false);
    })();

    return () => {
      cancelled = true;
      setLoadingPlots(false);
    };
  }, [subSectorIds, loaded]);

  const selectCls =
    "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-400 disabled:opacity-50";

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ height: "calc(100svh - 6rem)", minHeight: 520 }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: "#171717", minHeight: 520 }}
      />

      {!loaded && !mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-900">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
            Loading satellite map…
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-900 p-6 text-center">
          <div className="max-w-sm text-xs text-neutral-400">
            This browser doesn&apos;t support WebGL, which the satellite map
            requires. Open the dashboard in Chrome, Edge, or Safari.
          </div>
        </div>
      )}

      {/* Control panel */}
      <div className="absolute left-4 top-4 z-10 w-72 space-y-2.5 rounded-2xl bg-white/95 p-3.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: TERRACOTTA }}
          />
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Meskeny · Cadastre
          </span>
          {forSaleCount != null && (
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {forSaleCount.toLocaleString()} for sale
            </span>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Zone
          </label>
          <select
            className={selectCls}
            value={planId}
            onChange={(e) =>
              setPlanId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Select a zone…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {label(p)}
                {p.code ? ` · ${p.code}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Sector
          </label>
          <select
            className={selectCls}
            value={sectorId}
            disabled={planId === "" || loadingSectors}
            onChange={(e) =>
              setSectorId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">
              {loadingSectors
                ? "Loading…"
                : planId === ""
                  ? "Pick a zone first"
                  : `Select a sector… (${sectors.length})`}
            </option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {label(s)}
                {s.code ? ` · ${s.code}` : ""}
              </option>
            ))}
          </select>
        </div>

        {subSectors.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Sub-areas (Ilot){loadingPlots ? " — loading…" : ""}
              </label>
              {subSectorIds.length > 0 && (
                <button
                  className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800"
                  onClick={() => setSubSectorIds([])}
                >
                  Clear ({subSectorIds.length})
                </button>
              )}
            </div>
            <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-neutral-200 p-1">
              {subSectors.map((ss) => {
                const checked = subSectorIds.includes(ss.id);
                return (
                  <label
                    key={ss.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setSubSectorIds((prev) =>
                          e.target.checked
                            ? [...prev, ss.id]
                            : prev.filter((x) => x !== ss.id),
                        )
                      }
                      className="h-3.5 w-3.5 accent-[#D16024]"
                    />
                    <span className="flex-1 truncate text-neutral-800">
                      {label(ss)}
                    </span>
                    {ss.plot_count ? (
                      <span className="text-[11px] text-neutral-400">
                        {ss.plot_count}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {planId !== "" && (
          <button
            className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            onClick={() => setPlanId("")}
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-6 left-4 z-10 rounded-xl bg-white/95 px-3.5 py-3 shadow-lg backdrop-blur">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Legend
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-700">
          <span
            className="inline-block h-3 w-4 rounded-[2px] border"
            style={{ background: PLOT_FILL, borderColor: PLOT_STROKE }}
          />
          Cadastre parcel
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-700">
          <span
            className="inline-block h-3 w-4 rounded-[2px] border"
            style={{ background: SALE_FILL, borderColor: SALE_STROKE }}
          />
          For sale
        </div>
      </div>

      <style jsx global>{`
        .maplibregl-popup-content {
          border-radius: 12px;
          padding: 12px 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          font-family: var(--font-sans, system-ui, sans-serif);
        }
        .maplibregl-popup-close-button {
          display: none;
        }
        .cm-pop-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .cm-pop-kicker {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #9aa0a6;
        }
        .cm-pop-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #fff;
          background: #d16024;
          padding: 2px 7px;
          border-radius: 999px;
        }
        .cm-pop-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .cm-pop-price {
          font-size: 14px;
          font-weight: 800;
          color: #d16024;
          margin-top: 2px;
        }
        .cm-pop-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          font-size: 12.5px;
          color: #6b7280;
          margin-top: 4px;
        }
        .cm-pop-row b {
          color: #1a1a1a;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
