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
  bulkImportHabitat,
  getHabitatBulkExample,
  type HabitatBulkImportResult,
} from "@/lib/api";
import {
  HABITAT_BULK_RULES,
  NOUAKCHOTT_PLANS_TEMPLATE,
} from "@/lib/habitatBulkFormat";
import { toast } from "sonner";
import { Copy, Map, Upload } from "lucide-react";

type Props = {
  onSuccess?: () => void;
};

export function HabitatBulkImport({ onSuccess }: Props) {
  const [jsonText, setJsonText] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [syncListings, setSyncListings] = useState(true);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<HabitatBulkImportResult | null>(
    null,
  );
  const [mapping, setMapping] = useState<Record<string, unknown> | null>(null);

  const loadExample = useCallback(async (which: "full" | "nouakchott") => {
    if (which === "nouakchott") {
      setJsonText(JSON.stringify(NOUAKCHOTT_PLANS_TEMPLATE, null, 2));
      return;
    }
    try {
      const res = await getHabitatBulkExample();
      setJsonText(JSON.stringify(res.data, null, 2));
      if (res.mapping) setMapping(res.mapping);
    } catch {
      setJsonText(JSON.stringify(NOUAKCHOTT_PLANS_TEMPLATE, null, 2));
    }
  }, []);

  useEffect(() => {
    void loadExample("full");
  }, [loadExample]);

  const handleImport = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText.trim());
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
    parsed.sync_to_listings = syncListings;

    setImporting(true);
    setLastResult(null);
    try {
      const res = await bulkImportHabitat(parsed);
      setLastResult(res.data);
      const d = res.data;
      toast.success(
        `Plans +${d.plans_created}, sectors +${d.sectors_created}, plots +${d.plots_created}`,
      );
      if (d.errors?.length) {
        toast.warning(`${d.errors.length} warning(s) — see details below`);
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
      <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-card dark:from-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5 text-blue-700" />
            Data hierarchy
          </CardTitle>
          <CardDescription className="font-mono text-xs leading-relaxed whitespace-pre">
{`LEVEL 1: PLAN (district)     → 9 records (Nouakchott)
LEVEL 2: SECTOR (sub-zone)   → ~408 per import batch
LEVEL 3: PLOT (parcel)       → 256k+ (batch ≤2000 per request)

Listings sync (optional):
  Plan   → Zone under Nouakchott
  Sector → Quartier under that zone`}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Habitat cadastre — bulk JSON import</CardTitle>
          <CardDescription>
            Import plans, sectors, and plots. Geometry uses GeoJSON in{" "}
            <code className="text-xs bg-muted px-1 rounded">geom_geojson</code>{" "}
            (PostGIS optional later).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-semibold mb-2">Format rules</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {HABITAT_BULK_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          {mapping && (
            <p className="text-xs text-muted-foreground">
              Listing mapping: Plan → Zone, Sector → Quartier (when sync enabled).
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
              />
              Skip existing
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={syncListings}
                onChange={(e) => setSyncListings(e.target.checked)}
              />
              Sync to listings (Zones / Quartiers)
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadExample("full")}
            >
              Load full example
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadExample("nouakchott")}
            >
              Load 9 Nouakchott plans
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(jsonText);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy JSON
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="habitat-json">JSON payload</Label>
            <Textarea
              id="habitat-json"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-xs min-h-[360px]"
              spellCheck={false}
            />
          </div>

          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || !jsonText.trim()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Importing…" : "Import cadastre JSON"}
          </Button>

          {lastResult && (
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p className="font-semibold">Import result</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Plans +{lastResult.plans_created} / skip {lastResult.plans_skipped}
                </Badge>
                <Badge variant="secondary">
                  Sectors +{lastResult.sectors_created} / skip{" "}
                  {lastResult.sectors_skipped}
                </Badge>
                <Badge variant="secondary">
                  Plots +{lastResult.plots_created} / skip {lastResult.plots_skipped}
                </Badge>
                {syncListings && (
                  <>
                    <Badge variant="outline">
                      Zones synced {lastResult.listings_zones_synced}
                    </Badge>
                    <Badge variant="outline">
                      Quartiers synced {lastResult.listings_quartiers_synced}
                    </Badge>
                  </>
                )}
              </div>
              {lastResult.errors?.length > 0 && (
                <div className="max-h-48 overflow-y-auto text-red-600 text-xs space-y-1 mt-2">
                  {lastResult.errors.slice(0, 30).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
