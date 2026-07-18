"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeviceDailyUsage, DeviceDailyUsageData } from "@/lib/api";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

export function DeviceDailyUsageCard() {
  const [data, setData] = useState<DeviceDailyUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [viewMode, setViewMode] = useState<"daily" | "summary">("summary");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDeviceDailyUsage(days);
        if (response.success) {
          setData(response.data);
        } else {
          setError("Failed to fetch device usage data");
        }
      } catch (err: any) {
        console.error("Error fetching device daily usage:", err);
        setError(err.message || "Failed to fetch device usage data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Daily Usage</CardTitle>
          <CardDescription>Loading device usage statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Daily Usage</CardTitle>
          <CardDescription>Error loading device usage data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device Daily Usage Analytics</CardTitle>
            <CardDescription>
              Precise tracking of app visits and usage time per device per day
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as "daily" | "summary")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Device Summary</SelectItem>
                <SelectItem value="daily">Daily Details</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total Unique Devices
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {data.totalUniqueDevices.toLocaleString()}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              App installations
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              Active Devices
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {data.deviceSummaries.length.toLocaleString()}
            </div>
            <div className="text-xs text-green-500 dark:text-green-400 mt-1">
              Used in last {days} days
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Total Sessions
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {data.deviceSummaries.reduce((sum, d) => sum + d.totalVisits, 0).toLocaleString()}
            </div>
            <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              App opens
            </div>
          </div>
        </div>

        {/* Device Summary Table */}
        {viewMode === "summary" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Device Summary</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Model</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Total Visits</TableHead>
                    <TableHead>Total Usage</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Avg Daily Usage</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.deviceSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No device usage data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.deviceSummaries.map((device) => (
                      <TableRow key={device.deviceId}>
                        <TableCell className="font-medium">{device.deviceModel}</TableCell>
                        <TableCell>
                          <Badge variant={device.platform === "ios" ? "default" : "secondary"}>
                            {device.platform.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{device.totalVisits.toLocaleString()}</TableCell>
                        <TableCell>{formatTime(device.totalUsageSec)}</TableCell>
                        <TableCell>{device.daysActive}</TableCell>
                        <TableCell>{formatTime(device.averageDailySec)}</TableCell>
                        <TableCell>{formatDate(device.firstSeen)}</TableCell>
                        <TableCell>{formatDate(device.lastSeen)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Daily Usage Table */}
        {viewMode === "daily" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Daily Usage Details</h3>
            <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Device Model</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Usage Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dailyUsage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No daily usage data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.dailyUsage.map((usage, index) => (
                      <TableRow key={`${usage.deviceId}-${usage.date}-${index}`}>
                        <TableCell className="font-medium">{formatDate(usage.date)}</TableCell>
                        <TableCell>{usage.deviceModel}</TableCell>
                        <TableCell>
                          <Badge variant={usage.platform === "ios" ? "default" : "secondary"}>
                            {usage.platform.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{usage.visitCount}</TableCell>
                        <TableCell>{usage.sessionCount}</TableCell>
                        <TableCell>{formatTime(usage.usageSeconds)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

