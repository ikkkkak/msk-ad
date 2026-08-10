"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getNewHomesNotificationAnalytics,
  getNewHomesNotificationDeviceTiming,
  type NewHomesNotificationDeviceTimingResponse,
  type NewHomesNotificationAnalytics,
} from "@/lib/api";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function NewHomesNotificationInsightsCard() {
  const [data, setData] = useState<NewHomesNotificationAnalytics | null>(null);
  const [devices, setDevices] = useState<NewHomesNotificationDeviceTimingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [devicePage, setDevicePage] = useState(1);
  const [devicePerPage] = useState(20);
  const [onlyThrottled, setOnlyThrottled] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("");
  const [userIDFilterInput, setUserIDFilterInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getNewHomesNotificationAnalytics();
        setData(res.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load new homes notification analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadDeviceTiming = async (nextPage: number, resetPage?: boolean) => {
    setDeviceLoading(true);
    setDeviceError(null);
    try {
      const parsedUserID = Number(userIDFilterInput);
      const res = await getNewHomesNotificationDeviceTiming({
        page: resetPage ? 1 : nextPage,
        per_page: devicePerPage,
        only_throttled: onlyThrottled,
        user_id: Number.isFinite(parsedUserID) && parsedUserID > 0 ? parsedUserID : undefined,
        platform: platformFilter.trim() || undefined,
      });
      setDevices(res);
      setDevicePage(resetPage ? 1 : nextPage);
    } catch (e: unknown) {
      setDeviceError(e instanceof Error ? e.message : "Failed to load device timing details");
    } finally {
      setDeviceLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceTiming(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const top5 = useMemo(() => data?.top_properties?.slice(0, 5) ?? [], [data]);
  const recent20 = useMemo(() => data?.recent_deliveries?.slice(0, 20) ?? [], [data]);
  const totalPages = useMemo(() => {
    const total = devices?.meta?.total ?? 0;
    const perPage = devices?.meta?.per_page || devicePerPage;
    return Math.max(1, Math.ceil(total / perPage));
  }, [devices, devicePerPage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Homes Notification Analytics</CardTitle>
        <CardDescription>
          Devices reached, last sent timestamp, and detailed delivery logs for rent-home notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error || !data ? (
          <p className="text-sm text-red-600">{error || "No data available"}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{data.summary.total_sent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total notifications sent</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{data.summary.unique_users.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Unique users reached</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{data.summary.unique_devices.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Unique devices reached</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{data.summary.last_24h_sent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Sent in last 24h</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{data.summary.last_7d_sent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Sent in last 7d</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {(data.summary.throttled_now_count ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Devices currently throttled (cooldown active)
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">Last notification sent</div>
              <div className="text-sm text-muted-foreground">{fmtDate(data.summary.last_sent_at)}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-sm font-semibold mb-2">Top Properties (by deliveries)</div>
              {top5.length === 0 ? (
                <p className="text-xs text-muted-foreground">No property delivery data yet.</p>
              ) : (
                <div className="space-y-2">
                  {top5.map((p) => (
                    <div key={`${p.property_kind}-${p.reference_id}-${p.last_sent_at || "na"}`} className="text-xs border rounded p-2">
                      <div className="font-medium">{p.title || `Listing #${p.reference_id}`}</div>
                      <div className="text-muted-foreground">
                        Type: {p.property_kind} | Ref: #{p.reference_id} | City: {p.city || "—"} | Sent: {p.sent_count} | Users: {p.unique_users} | Devices: {p.unique_devices}
                      </div>
                      <div className="text-muted-foreground">Last sent: {fmtDate(p.last_sent_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-sm font-semibold mb-2">Recent Deliveries (detailed)</div>
              {recent20.length === 0 ? (
                <p className="text-xs text-muted-foreground">No delivery logs yet.</p>
              ) : (
                <div className="space-y-1">
                  {recent20.map((r, idx) => (
                    <div key={`${r.user_id}-${r.property_kind}-${r.reference_id}-${r.sent_at}-${idx}`} className="text-xs border-b py-1">
                      <span className="font-medium">{fmtDate(r.sent_at)}</span>{" "}
                      — User #{r.user_id}, {r.property_kind} #{r.reference_id} ({r.title || "Untitled"}), city {r.city || "—"}, user devices: {r.device_count}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-semibold">Device Timing Details (Admin)</div>
                <div className="text-xs text-muted-foreground">
                  Page {devices?.meta.page ?? devicePage} of {totalPages} • Total: {(devices?.meta.total ?? 0).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <label className="text-xs flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyThrottled}
                    onChange={(e) => setOnlyThrottled(e.target.checked)}
                  />
                  Only throttled
                </label>
                <input
                  className="border rounded px-2 py-1 text-xs"
                  placeholder="Filter by user id"
                  value={userIDFilterInput}
                  onChange={(e) => setUserIDFilterInput(e.target.value)}
                />
                <input
                  className="border rounded px-2 py-1 text-xs"
                  placeholder="Filter by platform (ios/android)"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                />
                <button
                  className="border rounded px-2 py-1 text-xs hover:bg-muted"
                  type="button"
                  onClick={() => loadDeviceTiming(1, true)}
                  disabled={deviceLoading}
                >
                  {deviceLoading ? "Loading..." : "Apply filters"}
                </button>
              </div>

              {deviceError ? (
                <p className="text-xs text-red-600">{deviceError}</p>
              ) : deviceLoading && !devices ? (
                <p className="text-xs text-muted-foreground">Loading device timing…</p>
              ) : !devices || devices.data.length === 0 ? (
                <p className="text-xs text-muted-foreground">No device timing records found.</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-8 gap-2 text-[11px] font-semibold text-muted-foreground border-b pb-1">
                    <div>Device</div>
                    <div>User</div>
                    <div>Platform</div>
                    <div>Locale</div>
                    <div>Version</div>
                    <div>Last sent</div>
                    <div>Next send</div>
                    <div>Status</div>
                  </div>
                  {devices.data.map((d) => (
                    <div key={`${d.device_id}-${d.updated_at}`} className="grid grid-cols-8 gap-2 text-[11px] border-b py-1">
                      <div>#{d.device_id}</div>
                      <div>{d.user_id ? `#${d.user_id}` : "—"}</div>
                      <div>{d.platform || "—"}</div>
                      <div>{d.locale || "—"}</div>
                      <div>{d.app_version || "—"}</div>
                      <div>{fmtDate(d.last_sent_at)}</div>
                      <div>{fmtDate(d.next_send_at)}</div>
                      <div className={d.is_throttled ? "text-amber-700 font-medium" : "text-emerald-700"}>
                        {d.is_throttled ? "Throttled" : "Ready"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  className="border rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                  type="button"
                  onClick={() => loadDeviceTiming(Math.max(1, devicePage - 1))}
                  disabled={deviceLoading || devicePage <= 1}
                >
                  Previous
                </button>
                <button
                  className="border rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                  type="button"
                  onClick={() => loadDeviceTiming(Math.min(totalPages, devicePage + 1))}
                  disabled={deviceLoading || devicePage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

