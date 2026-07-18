"use client";

import { useEffect, useState } from "react";
import {
  listAdminCrashLogs,
  getCrashLogStats,
  updateCrashLog,
  AdminCrashLog,
  CrashLogStats,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminCrashLogsPage() {
  const [items, setItems] = useState<AdminCrashLog[]>([]);
  const [stats, setStats] = useState<CrashLogStats | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unresolved" | "fatal">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminCrashLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [notes, setNotes] = useState("");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, statsRes] = await Promise.all([
        listAdminCrashLogs({
          page,
          limit: 20,
          resolved: filter === "unresolved" ? "false" : filter === "all" ? undefined : undefined,
          platform: platformFilter || undefined,
          search: q || undefined,
        }),
        getCrashLogStats(),
      ]);
      setItems(logsRes.data || []);
      setPagination(logsRes.pagination || pagination);
      setStats(statsRes.data || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      toast.error("Failed to load crash logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, filter, platformFilter, q]);

  const handleMarkResolved = async (log: AdminCrashLog, resolved: boolean) => {
    try {
      await updateCrashLog(log.id, {
        is_resolved: resolved,
        notes: notes || log.notes || "",
      });
      toast.success(resolved ? "Marked as resolved" : "Marked as unresolved");
      setDialogOpen(false);
      setSelectedLog(null);
      setNotes("");
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const openLogDetails = (log: AdminCrashLog) => {
    setSelectedLog(log);
    setNotes(log.notes || "");
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCrashTypeColor = (type: string) => {
    switch (type) {
      case "unhandledError":
        return "destructive";
      case "unhandledPromiseRejection":
        return "default";
      case "componentError":
        return "destructive";
      case "apiError":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filtered = items.filter((log) => {
    if (filter === "fatal" && !log.is_fatal) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Crash Logs</h1>
        <Input
          placeholder="Search by error message..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-80"
        />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Crashes</div>
          </div>
          <div className="border rounded-lg p-4 border-red-200 bg-red-50">
            <div className="text-2xl font-bold text-red-600">
              {stats.unresolved}
            </div>
            <div className="text-sm text-muted-foreground">Unresolved</div>
          </div>
          <div className="border rounded-lg p-4 border-red-200 bg-red-50">
            <div className="text-2xl font-bold text-red-600">{stats.fatal}</div>
            <div className="text-sm text-muted-foreground">Fatal</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.last_24_hours}</div>
            <div className="text-sm text-muted-foreground">Last 24h</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.last_7_days}</div>
            <div className="text-sm text-muted-foreground">Last 7d</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "unresolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unresolved")}
        >
          Unresolved
        </Button>
        <Button
          variant={filter === "fatal" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("fatal")}
        >
          Fatal
        </Button>
        {stats?.by_platform &&
          Object.keys(stats.by_platform).map((platform) => (
            <Button
              key={platform}
              variant={platformFilter === platform ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setPlatformFilter(platformFilter === platform ? "" : platform)
              }
            >
              {platform}
            </Button>
          ))}
      </div>

      {/* Crash Logs Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Screen</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-red-600">
                  {error}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No crash logs found</TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow
                  key={log.id}
                  className={
                    log.is_fatal
                      ? "bg-red-50 hover:bg-red-100"
                      : log.is_resolved
                      ? "bg-green-50 hover:bg-green-100"
                      : ""
                  }
                >
                  <TableCell className="font-mono text-xs">{log.id}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.error}>
                    {log.error}
                  </TableCell>
                  <TableCell>{log.screen || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.platform}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.device_model} ({log.os_version})
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCrashTypeColor(log.crash_type) as any}>
                      {log.crash_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.is_fatal && (
                      <Badge variant="destructive" className="mr-1">
                        FATAL
                      </Badge>
                    )}
                    {log.is_resolved ? (
                      <Badge variant="default" className="bg-green-600">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unresolved</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openLogDetails(log)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crash Log Details #{selectedLog?.id}</DialogTitle>
            <DialogDescription>
              Full crash report with stack traces and context
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Error Message */}
              <div>
                <h3 className="font-semibold mb-2">Error Message</h3>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  {selectedLog.error}
                </div>
              </div>

              {/* Stack Trace */}
              {selectedLog.stack && (
                <div>
                  <h3 className="font-semibold mb-2">Stack Trace</h3>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{selectedLog.stack}</pre>
                  </div>
                </div>
              )}

              {/* Component Stack */}
              {selectedLog.component_stack && (
                <div>
                  <h3 className="font-semibold mb-2">Component Stack</h3>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.component_stack}
                    </pre>
                  </div>
                </div>
              )}

              {/* Context */}
              {selectedLog.context_parsed && (
                <div>
                  <h3 className="font-semibold mb-2">Context</h3>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.context_parsed, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Device Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Device Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Platform: </span>
                      {selectedLog.platform}
                    </div>
                    <div>
                      <span className="text-muted-foreground">OS Version: </span>
                      {selectedLog.os_version}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Device: </span>
                      {selectedLog.device_model}
                    </div>
                    <div>
                      <span className="text-muted-foreground">App Version: </span>
                      {selectedLog.app_version}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Crash Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Screen: </span>
                      {selectedLog.screen}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phase: </span>
                      {selectedLog.phase}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type: </span>
                      {selectedLog.crash_type}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Is Fatal: </span>
                      {selectedLog.is_fatal ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      {formatDate(selectedLog.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {selectedLog.user && (
                <div>
                  <h3 className="font-semibold mb-2">User Information</h3>
                  <div className="text-sm">
                    <div>
                      <span className="text-muted-foreground">User ID: </span>
                      {selectedLog.user.id}
                    </div>
                    {selectedLog.user.email && (
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        {selectedLog.user.email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="font-semibold mb-2">Admin Notes</h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this crash..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!selectedLog.is_resolved ? (
                  <Button
                    onClick={() => handleMarkResolved(selectedLog, true)}
                    className="flex-1"
                  >
                    Mark as Resolved
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleMarkResolved(selectedLog, false)}
                    className="flex-1"
                  >
                    Mark as Unresolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
