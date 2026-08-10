"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingAIUsageAnalytics } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatShortDate(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toCalendarDayKey(raw: string | undefined | null): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
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
  const pct =
    previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;
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
      {previous > 0 ? (
        <span className="text-muted-foreground font-normal">
          ({pct > 0 ? "+" : ""}
          {pct}%)
        </span>
      ) : null}
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

function KindCard({
  title,
  stats,
}: {
  title: string;
  stats: {
    started_all_time: number;
    completed_all_time: number;
    failed_all_time: number;
    published_all_time: number;
    unique_users_30d: number;
    started_today: number;
    started_this_week: number;
    started_last_7_days: number;
    published_last_7_days: number;
  };
}) {
  const completionRate =
    stats.started_all_time > 0
      ? Math.round((stats.completed_all_time / stats.started_all_time) * 100)
      : 0;
  const publishRate =
    stats.started_all_time > 0
      ? Math.round((stats.published_all_time / stats.started_all_time) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">AI runs (all time)</p>
          <p className="font-semibold tabular-nums">{stats.started_all_time}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Unique users (30d)</p>
          <p className="font-semibold tabular-nums">{stats.unique_users_30d}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Completed</p>
          <p className="font-semibold tabular-nums">
            {stats.completed_all_time}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({completionRate}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Published</p>
          <p className="font-semibold tabular-nums">
            {stats.published_all_time}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({publishRate}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Today / this week</p>
          <p className="font-semibold tabular-nums">
            {stats.started_today} / {stats.started_this_week}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Last 7d published</p>
          <p className="font-semibold tabular-nums">{stats.published_last_7_days}</p>
        </div>
      </div>
    </div>
  );
}

export function ListingAIUsageMetrics({ data }: { data: ListingAIUsageAnalytics }) {
  const s = data.summary;

  const dailyChart = useMemo(() => {
    const map = new Map<string, ListingAIUsageAnalytics["daily"][0]>();
    for (const row of data.daily ?? []) {
      const day = toCalendarDayKey(row.date);
      if (day) map.set(day, row);
    }
    const out: {
      date: string;
      label: string;
      started: number;
      published: number;
      users: number;
      rent: number;
      sale: number;
      land: number;
    }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - i,
        ),
      );
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key);
      out.push({
        date: key,
        label: formatShortDate(key),
        started: row?.started ?? 0,
        published: row?.published ?? 0,
        users: row?.users ?? 0,
        rent: row?.rent ?? 0,
        sale: row?.sale ?? 0,
        land: row?.land ?? 0,
      });
    }
    return out;
  }, [data.daily]);

  const weeklyChart = useMemo(() => {
    return (data.weekly ?? []).map((w) => ({
      ...w,
      label: formatShortDate(w.week_start),
    }));
  }, [data.weekly]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
          Add with AI — listing creation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Tracks when hosts start the AI wizard, when generation completes or fails,
          and when they publish or apply the draft (rent, property sale, or land).
        </p>
      </div>

      <div className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-card dark:from-violet-950/20 dark:to-card dark:border-violet-900/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-800/80 dark:text-violet-400/90">
              Unique hosts using Add with AI
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">
              {(s.unique_users_all_time ?? 0).toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              {(s.unique_users_started_30d ?? 0).toLocaleString()} started a flow in
              the last 30 days ·{" "}
              {(s.unique_users_published_30d ?? 0).toLocaleString()} published in the
              last 30 days
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              Total events recorded:{" "}
              <span className="font-medium text-foreground">
                {(s.total_events_all_time ?? 0).toLocaleString()}
              </span>
            </p>
            <p className="mt-1">
              Published all time:{" "}
              <span className="font-medium text-foreground">
                {(s.published_all_time ?? 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="AI runs — today"
          value={(s.started_today ?? 0).toLocaleString()}
          hint="New Add with AI sessions started today (UTC)."
        />
        <StatCard
          label="AI runs — this week"
          value={(s.started_this_week ?? 0).toLocaleString()}
          hint="From Monday (UTC) through today."
        >
          <TrendBadge
            current={s.started_this_week ?? 0}
            previous={s.started_previous_week ?? 0}
            versusLabel="last week"
          />
        </StatCard>
        <StatCard
          label="AI runs — last 7 days"
          value={(s.started_last_7_days ?? 0).toLocaleString()}
          hint="Rolling 7-day window."
        >
          <TrendBadge
            current={s.started_last_7_days ?? 0}
            previous={s.started_previous_7_days ?? 0}
            versusLabel="prior 7 days"
          />
        </StatCard>
        <StatCard
          label="Published — last 30 days"
          value={(s.published_last_30_days ?? 0).toLocaleString()}
          hint={`Completed: ${(s.completed_last_30_days ?? 0).toLocaleString()} · Failed: ${(s.failed_last_30_days ?? 0).toLocaleString()}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <KindCard title="Rental listings" stats={s.by_kind.rent} />
        <KindCard title="Property for sale" stats={s.by_kind.sale} />
        <KindCard title="Land for sale" stats={s.by_kind.land} />
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Daily — last 30 days</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Started sessions, unique users, and published listings per day (UTC).
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date
                    ? formatShortDate(String(payload[0].payload.date))
                    : ""
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="started"
                name="Started"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="published"
                name="Published"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="users"
                name="Unique users"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">By listing type (daily)</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            AI runs started — rent vs sale vs land.
          </p>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rent" name="Rent" stackId="a" fill="#6366f1" />
                <Bar dataKey="sale" name="Sale" stackId="a" fill="#db2777" />
                <Bar dataKey="land" name="Land" stackId="a" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Weekly — last 12 weeks</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Week starts Monday (UTC).
          </p>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="started" name="Started" fill="#7c3aed" />
                <Bar dataKey="published" name="Published" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80">
          <h3 className="text-sm font-semibold">Recent events</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Last 50 Add with AI events (started, completed, failed, published).
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time (UTC)</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.recent ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No events yet. Usage appears when hosts use Add with AI in the app.
                  </TableCell>
                </TableRow>
              ) : (
                data.recent.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{row.user_id}</TableCell>
                    <TableCell className="capitalize">{row.kind}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded px-1.5 py-0.5 text-xs font-medium",
                          row.event === "published" && "bg-emerald-100 text-emerald-800",
                          row.event === "completed" && "bg-blue-100 text-blue-800",
                          row.event === "failed" && "bg-rose-100 text-rose-800",
                          row.event === "started" && "bg-violet-100 text-violet-800",
                        )}
                      >
                        {row.event}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {row.job_id || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
