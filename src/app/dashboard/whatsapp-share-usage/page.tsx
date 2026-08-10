"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WhatsAppShareUsageMetrics } from "@/components/whatsapp-share-usage-metrics";
import {
  getAdminWhatsAppShareUsage,
  type WhatsAppShareUsageAnalytics,
} from "@/lib/api";
import { usePendingModeration } from "@/components/pending-moderation-provider";

export default function WhatsAppShareUsagePage() {
  const { refresh: refreshSidebar } = usePendingModeration();
  const [data, setData] = useState<WhatsAppShareUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminWhatsAppShareUsage();
      setData(res.data);
      await refreshSidebar();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to load WhatsApp share usage",
      );
    } finally {
      setLoading(false);
    }
  }, [refreshSidebar]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">WhatsApp share usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Property sale share card opens, attempts, and completed shares from
            the mobile app.
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
        <WhatsAppShareUsageMetrics data={data} />
      ) : null}
    </div>
  );
}
