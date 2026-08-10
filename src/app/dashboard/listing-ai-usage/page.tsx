"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ListingAIUsageMetrics } from "@/components/listing-ai-usage-metrics";
import {
  getAdminListingAIUsage,
  type ListingAIUsageAnalytics,
} from "@/lib/api";

export default function ListingAIUsagePage() {
  const [data, setData] = useState<ListingAIUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminListingAIUsage();
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load listing AI usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Add with AI usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rent, property sale, and land listing flows powered by AI.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : data ? (
        <ListingAIUsageMetrics data={data} />
      ) : null}
    </div>
  );
}
