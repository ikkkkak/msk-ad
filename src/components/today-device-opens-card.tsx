"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeviceAnalytics } from "@/lib/api";

type TodayOpensState = {
  count: number;
  todayDate: string;
  generatedAt: string;
  devices: Array<{
    deviceId: string;
    deviceModel: string;
    platform: string;
    appVersion: string;
    lastSeenAt: number;
  }>;
};

function formatDateLabel(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return dateLike;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimeLabel(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return dateLike;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TodayDeviceOpensCard() {
  const [data, setData] = useState<TodayOpensState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getDeviceAnalytics();
        setData({
          count: res.analytics.todayUniqueDevices ?? 0,
          todayDate: res.analytics.todayDate ?? new Date().toISOString(),
          generatedAt: res.analytics.generatedAt ?? new Date().toISOString(),
          devices: res.analytics.todayOpenedDevices ?? [],
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load today's app opens");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Unique App Opens</CardTitle>
        <CardDescription>Distinct devices that opened the app today</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-4xl font-bold tracking-tight">
              {data?.count?.toLocaleString() ?? "0"}
            </div>
            <div className="text-sm text-muted-foreground">
              Date: {formatDateLabel(data?.todayDate ?? "")}
            </div>
            <div className="text-xs text-muted-foreground">
              Updated at: {formatTimeLabel(data?.generatedAt ?? "")}
            </div>
            <div className="mt-2 rounded-md border">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                Devices opened today
              </div>
              <div className="max-h-52 overflow-auto">
                {data?.devices?.length ? (
                  data.devices.map((d) => (
                    <div
                      key={d.deviceId}
                      className="px-3 py-2 border-b last:border-b-0 text-sm flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{d.deviceModel}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {d.platform.toUpperCase()} - {d.appVersion}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeLabel(new Date((d.lastSeenAt || 0) * 1000).toISOString())}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    No devices recorded today yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
