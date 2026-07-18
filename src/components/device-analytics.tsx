"use client"

import * as React from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell as BarCell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getDeviceAnalytics, DeviceAnalytics } from "@/lib/api"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DeviceAnalyticsCard() {
  const [analytics, setAnalytics] = React.useState<DeviceAnalytics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getDeviceAnalytics()
      .then((res) => {
        setAnalytics(res.analytics)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch device analytics:", err)
        setError(err.message || "Failed to load analytics")
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Analytics</CardTitle>
          <CardDescription>Mobile device and platform statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Analytics</CardTitle>
          <CardDescription>Mobile device and platform statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || "No analytics data available"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Analytics</CardTitle>
        <CardDescription>Mobile device and platform statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{analytics.totalDevices.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{analytics.activeDevices.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Active (7 days)</div>
          </div>
          {analytics.usageStats && (
            <>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">{analytics.usageStats.totalSessions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">{analytics.usageStats.totalUsageHours.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">Total Usage</div>
              </div>
            </>
          )}
        </div>

        {/* Usage Statistics */}
        {analytics.usageStats && (
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Usage Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Avg Session Duration</div>
                <div className="font-semibold">
                  {Math.round(analytics.usageStats.averageSessionSec / 60)} min
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Daily Avg Usage</div>
                <div className="font-semibold">
                  {analytics.usageStats.dailyAverageHours.toFixed(1)} hours
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Usage Time</div>
                <div className="font-semibold">
                  {analytics.usageStats.totalUsageHours.toFixed(1)} hours
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Sessions</div>
                <div className="font-semibold">
                  {analytics.usageStats.totalSessions.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform Distribution Pie Chart */}
        {analytics.platformStats && analytics.platformStats.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-4">Platform Distribution</h3>
            <ChartContainer
              config={{}}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={analytics.platformStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, percentage }) => `${platform}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {/* Top Device Models */}
        {analytics.deviceModelStats && analytics.deviceModelStats.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-4">Top Device Models</h3>
            <ChartContainer
              config={{}}
              className="h-[300px] w-full"
            >
              <BarChart data={analytics.deviceModelStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="deviceModel" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#0088FE">
                  {analytics.deviceModelStats.slice(0, 10).map((entry, index) => (
                    <BarCell key={`cell-${index}`} fill={entry.platform === 'ios' ? '#007AFF' : '#34C759'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Registration Trends */}
        {analytics.timeSeriesData && analytics.timeSeriesData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-4">Registration Trends (Last 30 Days)</h3>
            <ChartContainer
              config={{}}
              className="h-[200px] w-full"
            >
              <BarChart data={analytics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Usage Trends */}
        {analytics.usageTimeSeries && analytics.usageTimeSeries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-4">Daily Usage Trends (Last 30 Days)</h3>
            <ChartContainer
              config={{}}
              className="h-[200px] w-full"
            >
              <BarChart data={analytics.usageTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalUsageHours" fill="#00C49F" name="Usage Hours" />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

