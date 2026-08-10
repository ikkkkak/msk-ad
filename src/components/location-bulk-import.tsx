"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  bulkImportLocations,
  getLocationBulkExample,
  type LocationBulkImportResult,
} from "@/lib/api";
import {
  LOCATION_BULK_EXAMPLE,
  LOCATION_BULK_FORMAT_RULES,
  LOCATION_BULK_QUARTIERS_ONLY_EXAMPLE,
  type LocationBulkDocument,
} from "@/lib/locationBulkFormat";
import { toast } from "sonner";
import { FileJson, Upload, Copy, CheckCircle2 } from "lucide-react";

type ImportMode = "full" | "zones" | "quartiers";

type Props = {
  cities: { id: number; name: string; name_ar: string }[];
  zones: {
    id: number;
    name: string;
    name_ar: string;
    city?: { name?: string };
  }[];
  onSuccess?: () => void;
};

export function LocationBulkImport({
  cities,
  zones,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<ImportMode>("full");
  const [jsonText, setJsonText] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [cityId, setCityId] = useState(0);
  const [zoneId, setZoneId] = useState(0);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<LocationBulkImportResult | null>(
    null,
  );

  const loadExample = useCallback(
    (m: ImportMode) => {
      if (m === "full") {
        setJsonText(JSON.stringify(LOCATION_BULK_EXAMPLE, null, 2));
        return;
      }
      if (m === "zones") {
        const doc = {
          version: 1,
          skip_existing: true,
          city_name: cities[0]?.name ?? "Nouakchott",
          zones: [
            {
              name: "New Zone",
              name_ar: "منطقة جديدة",
              description: "Optional English description",
              description_ar: "وصف عربي اختياري",
              quartiers: [],
            },
          ],
        };
        setJsonText(JSON.stringify(doc, null, 2));
        return;
      }
      const doc = {
        ...LOCATION_BULK_QUARTIERS_ONLY_EXAMPLE,
        zone_id: zoneId > 0 ? zoneId : zones[0]?.id ?? 0,
      };
      setJsonText(JSON.stringify(doc, null, 2));
    },
    [cities, zones, zoneId],
  );

  useEffect(() => {
    loadExample(mode);
  }, [mode, loadExample]);

  useEffect(() => {
    void getLocationBulkExample().catch(() => {
      /* optional server example; local fallback is fine */
    });
  }, []);

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      toast.success("Copied JSON to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleImport = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText.trim()) as Record<string, unknown>;
    } catch (e: unknown) {
      toast.error(
        `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
      );
      return;
    }

    if (parsed.version !== 1) {
      toast.error('JSON must include "version": 1');
      return;
    }

    parsed.skip_existing = skipExisting;

    if (mode === "zones") {
      if (!cityId && !parsed.city_id && !parsed.city_name) {
        toast.error("Select a city or set city_id / city_name in JSON");
        return;
      }
      if (cityId > 0) parsed.city_id = cityId;
      delete parsed.cities;
    }

    if (mode === "quartiers") {
      if (!zoneId && !parsed.zone_id) {
        toast.error("Select a zone or set zone_id in JSON");
        return;
      }
      if (zoneId > 0) parsed.zone_id = zoneId;
      delete parsed.cities;
      delete parsed.zones;
    }

    setImporting(true);
    setLastResult(null);
    try {
      const res = await bulkImportLocations(parsed);
      setLastResult(res.data);
      const d = res.data;
      const msg = [
        d.cities_created ? `${d.cities_created} cities` : null,
        d.zones_created ? `${d.zones_created} zones` : null,
        d.quartiers_created ? `${d.quartiers_created} quartiers` : null,
      ]
        .filter(Boolean)
        .join(", ");
      if (msg) {
        toast.success(`Created: ${msg}`);
      } else if (d.errors?.length) {
        toast.warning("Import finished with errors");
      } else {
        toast.info("Nothing new created (all skipped or empty)");
      }
      if (d.errors?.length) {
        console.warn("Bulk import errors:", d.errors);
      }
      onSuccess?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Bulk import (JSON)
          </CardTitle>
          <CardDescription>
            Import cities, zones, and quartiers in one upload. Follow the format
            below — invalid JSON will be rejected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "full" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("full")}
            >
              Full tree (cities → zones → quartiers)
            </Button>
            <Button
              type="button"
              variant={mode === "zones" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("zones")}
            >
              Zones for existing city
            </Button>
            <Button
              type="button"
              variant={mode === "quartiers" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("quartiers")}
            >
              Quartiers for existing zone
            </Button>
          </div>

          {mode === "zones" && (
            <div className="space-y-2">
              <Label>Target city</Label>
              <select
                className="w-full max-w-md p-2 border rounded-md"
                value={cityId}
                onChange={(e) => setCityId(parseInt(e.target.value, 10))}
              >
                <option value={0}>Use city_name in JSON only</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.name_ar})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "quartiers" && (
            <div className="space-y-2">
              <Label>Target zone</Label>
              <select
                className="w-full max-w-md p-2 border rounded-md"
                value={zoneId}
                onChange={(e) => setZoneId(parseInt(e.target.value, 10))}
              >
                <option value={0}>Use zone_id in JSON only</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.name_ar}) — {z.city?.name ?? "?"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipExisting}
              onChange={(e) => setSkipExisting(e.target.checked)}
            />
            Skip existing (match by name + Arabic name within same parent)
          </label>

          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
            <p className="font-semibold">Format rules</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {LOCATION_BULK_FORMAT_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => loadExample(mode)}>
              Load example
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={copyExample}>
              <Copy className="h-4 w-4 mr-1" />
              Copy JSON
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-json">JSON payload</Label>
            <Textarea
              id="bulk-json"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-xs min-h-[320px]"
              spellCheck={false}
            />
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => void handleImport()}
            disabled={importing || !jsonText.trim()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Importing…" : "Import from JSON"}
          </Button>

          {lastResult && (
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Last import result
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Cities +{lastResult.cities_created} / skip {lastResult.cities_skipped}
                </Badge>
                <Badge variant="secondary">
                  Zones +{lastResult.zones_created} / skip {lastResult.zones_skipped}
                </Badge>
                <Badge variant="secondary">
                  Quartiers +{lastResult.quartiers_created} / skip{" "}
                  {lastResult.quartiers_skipped}
                </Badge>
              </div>
              {lastResult.errors?.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-red-600 text-xs space-y-1">
                  {lastResult.errors.slice(0, 20).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                  {lastResult.errors.length > 20 && (
                    <p>…and {lastResult.errors.length - 20} more</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
