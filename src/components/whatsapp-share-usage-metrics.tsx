"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhatsAppShareUsageAnalytics } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatShortDate(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TrendBadge({
  current,
  previous,
  versusLabel,
}: {
  current: number;
  previous: number;
  versusLabel: string;
}) {
  const diff = current - previous;
  if (diff === 0) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Same as {versusLabel}
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-xs font-medium",
        up ? "text-emerald-600" : "text-rose-600",
      )}
    >
      {up ? (
        <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      {up ? "Up" : "Down"} {Math.abs(diff)} vs {versusLabel}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string | number;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

function eventBadgeVariant(event: string) {
  switch (event) {
    case "share_completed":
      return "default";
    case "share_failed":
      return "destructive";
    case "share_dismissed":
      return "secondary";
    default:
      return "outline";
  }
}

export function WhatsAppShareUsageMetrics({
  data,
}: {
  data: WhatsAppShareUsageAnalytics;
}) {
  const summary = data.summary ?? ({} as WhatsAppShareUsageAnalytics["summary"]);
  const daily = data.daily ?? [];
  const byPlatform = data.by_platform ?? [];
  const recent = data.recent ?? [];

  const num = (v: number | undefined | null) => Number(v ?? 0);

  const chartDaily = useMemo(
    () =>
      daily.map((d) => ({
        ...d,
        label: formatShortDate(d.date),
      })),
    [daily],
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Shares completed (all time)"
          value={num(summary.shares_completed_all_time).toLocaleString()}
          hint="Successful WhatsApp share card exports"
        />
        <StatCard
          label="Shares today"
          value={num(summary.shares_completed_today).toLocaleString()}
        >
          <TrendBadge
            current={num(summary.shares_completed_last_7_days)}
            previous={num(summary.shares_completed_previous_7_days)}
            versusLabel="previous 7 days"
          />
        </StatCard>
        <StatCard
          label="Sheet opens (30d)"
          value={num(summary.sheet_opened_last_30_days).toLocaleString()}
          hint={`${num(summary.share_started_last_30_days).toLocaleString()} share attempts`}
        />
        <StatCard
          label="Completion rate (30d)"
          value={`${Math.round(num(summary.completion_rate_last_30_days))}%`}
          hint={`${num(summary.unique_users_completed_30d)} users · ${num(summary.unique_listings_shared_30d)} listings`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Daily funnel (30 days)</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Opens, attempts, and completed shares
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="opened"
                  name="Opened"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="started"
                  name="Started"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#25D366"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Completed shares by platform (30d)</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            iOS vs Android share card usage
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPlatform}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" name="Completed" fill="#25D366" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Recent activity log</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Last 100 WhatsApp share card events from the mobile app
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Platform</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No WhatsApp share events recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              recent.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(row.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={eventBadgeVariant(row.event)}>
                      {row.event.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    #{row.property_sale_id}
                    {row.property_title ? ` · ${row.property_title}` : ""}
                  </TableCell>
                  <TableCell>
                    {row.user_id > 0 ? `#${row.user_id}` : "Guest"}
                  </TableCell>
                  <TableCell className="uppercase text-xs">
                    {row.platform || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
