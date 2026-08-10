"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, Users, UserCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminUserListMetrics } from "@/lib/api";

function formatShortDate(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** API may send `2026-04-10` or `2026-04-10T00:00:00Z` — chart keys are always YYYY-MM-DD */
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
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-5 shadow-sm",
        className,
      )}
    >
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

export function AdminUsersMetricsOverview({
  metrics,
  listTotal,
  listFiltered,
}: {
  metrics: AdminUserListMetrics;
  listTotal: number;
  listFiltered: boolean;
}) {
  const chartPoints = useMemo(() => {
    const daily = metrics.daily_signups_last_30_days ?? [];
    const map = new Map<string, number>();
    for (const row of daily) {
      const day = toCalendarDayKey(row.date);
      if (!day) continue;
      const n = Number((row as { count?: unknown }).count);
      const add = Number.isFinite(n) ? Math.trunc(n) : 0;
      map.set(day, (map.get(day) ?? 0) + add);
    }
    const out: { date: string; label: string; signups: number }[] = [];
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
      out.push({
        date: key,
        label: formatShortDate(key),
        signups: map.get(key) ?? 0,
      });
    }
    return out;
  }, [metrics.daily_signups_last_30_days]);

  const totalUsers = metrics.total_users ?? 0;
  const thisWeek = metrics.created_this_week ?? 0;
  const prevWeek = metrics.created_previous_week ?? 0;
  const thisMonth = metrics.created_this_month ?? 0;
  const prevMonth = metrics.created_previous_month ?? 0;
  const roll7 = metrics.rolling_7d ?? 0;
  const rollPrev7 = metrics.rolling_prev_7d ?? 0;
  const roll30 = metrics.created_last_30_days ?? 0;
  const rollPrev30 = metrics.rolling_prev_30d ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          How your community is growing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          A quick snapshot of everyone in the app and how many new accounts were
          added recently. Numbers update when you refresh or change filters below.
        </p>
      </div>

      {/* Primary total — full width emphasis */}
      <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/20 dark:to-card dark:border-emerald-900/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Users className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
                Total people in the app
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                {totalUsers.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">
                This is every account that exists right now (guests and hosts).
                {listFiltered ? (
                  <>
                    {" "}
                    The table below is filtered: it shows{" "}
                    <span className="font-medium text-foreground">
                      {listTotal.toLocaleString()}
                    </span>{" "}
                    matching rows.
                  </>
                ) : (
                  <>
                    {" "}
                    The table matches this total when no search or role filter is
                    applied.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:min-w-[280px]">
            <div className="rounded-lg bg-background/60 dark:bg-background/20 px-3 py-3 border border-border/50">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Host accounts
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {(metrics.hosts_count ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                People who can list
              </p>
            </div>
            <div className="rounded-lg bg-background/60 dark:bg-background/20 px-3 py-3 border border-border/50">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                ID verified
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                {(metrics.verified_identity_count ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                Approved ID check
              </p>
            </div>
            <div className="rounded-lg bg-background/60 dark:bg-background/20 px-3 py-3 border border-border/50">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" aria-hidden />
                Dashboard staff
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {(metrics.staff_count ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                Admin + super admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Week + month with trends */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New accounts — this week"
          value={thisWeek.toLocaleString()}
          hint="From Monday (UTC) through today."
        >
          <TrendBadge
            current={thisWeek}
            previous={prevWeek}
            versusLabel="last week"
          />
        </StatCard>
        <StatCard
          label="Fair comparison — last 7 days"
          value={roll7.toLocaleString()}
          hint="Rolling week ending today vs the 7 days before that."
        >
          <TrendBadge
            current={roll7}
            previous={rollPrev7}
            versusLabel="prior 7 days"
          />
        </StatCard>
        <StatCard
          label="New accounts — this calendar month"
          value={thisMonth.toLocaleString()}
          hint="From the 1st of this month through today."
        >
          <TrendBadge
            current={thisMonth}
            previous={prevMonth}
            versusLabel="all of last month"
          />
        </StatCard>
        <StatCard
          label="Fair comparison — last 30 days"
          value={roll30.toLocaleString()}
          hint="Rolling 30 days vs the 30 days before that."
        >
          <TrendBadge
            current={roll30}
            previous={rollPrev30}
            versusLabel="prior 30 days"
          />
        </StatCard>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
        <span className="font-medium text-foreground">Tip:</span> “This calendar
        month” is only part of the month so far, but “last month” is the full
        previous month — early in the month it may look lower until more days
        pass. Use the rolling 7- and 30-day boxes for a fairer week-to-week
        comparison.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="New accounts today"
          value={(metrics.created_today ?? 0).toLocaleString()}
          hint="Since midnight UTC."
          className="lg:col-span-1"
        />
        <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            New signups per day
          </p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Last 30 days — each point is how many people created an account that
            day. The line is new accounts only (not total users).
          </p>
          <div className="mt-4 h-[220px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartPoints}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/60"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                  tickMargin={8}
                />
                <YAxis
                  width={36}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as { date?: string } | undefined;
                    return p?.date ? `Date: ${p.date}` : "";
                  }}
                  formatter={(value: number | string) => [
                    Number(value).toLocaleString(),
                    "New accounts",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="signups"
                  name="New accounts"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#059669" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
