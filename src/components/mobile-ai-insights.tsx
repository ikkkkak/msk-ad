"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminMobileAIInsights, type AdminMobileAIInsights } from "@/lib/api";

export function MobileAIInsightsCard() {
  const [insights, setInsights] = useState<AdminMobileAIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminMobileAIInsights();
        setInsights(res.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load insights");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile AI + Investment Insights</CardTitle>
        <CardDescription>
          Phones with investment targeting and MeskenyGPT usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error || !insights ? (
          <p className="text-sm text-red-600">{error || "No data available"}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">
                {insights.investment_enabled_phones.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Investment-enabled phones
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">
                {insights.ai_active_phones_30d.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Phones using AI (30 days)
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">
                {insights.ai_active_phones_all_time.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Phones using AI (all time)
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

