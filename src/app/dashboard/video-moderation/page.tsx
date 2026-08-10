"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAdminVideos,
  updateAdminVideoStatus,
  type AdminVideo,
} from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

export default function VideoModerationPage() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminVideos({
        page: 1,
        per_page: 100,
        status: tab,
        is_promotional: "false",
        sort: "newest",
      });
      setVideos(res.data || []);
      setTotal(res.meta?.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: number, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await updateAdminVideoStatus(id, status);
      toast.success(status === "approved" ? "Video approved" : "Video rejected");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review user-uploaded rent listing videos. Only <strong>approved</strong> videos appear in
          the app feed.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Total in this filter: {total}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rent listing videos</CardTitle>
              <CardDescription>
                Promotional / admin clips are managed under Promotional Videos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : videos.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No videos in this queue.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Preview</TableHead>
                        <TableHead>Caption</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((v) => (
                        <TableRow key={v.ID}>
                          <TableCell>
                            <div className="relative h-16 w-14 rounded overflow-hidden bg-muted shrink-0">
                              {v.thumbnailURL ? (
                                <img
                                  src={v.thumbnailURL}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                                  —
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2 text-sm">
                              {v.caption || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {v.property?.title ? (
                              <span className="line-clamp-2">{v.property.title}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {v.property?.city ? (
                              <div className="text-xs text-muted-foreground">{v.property.city}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-sm">
                            {v.user
                              ? `${v.user.firstName || ""} ${v.user.lastName || ""}`.trim() ||
                                v.user.email
                              : `User #${v.userID}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{v.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={v.videoURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="gap-1"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open
                                </a>
                              </Button>
                              {tab === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-1"
                                    disabled={busyId === v.ID}
                                    onClick={() => setStatus(v.ID, "approved")}
                                  >
                                    {busyId === v.ID ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="gap-1"
                                    disabled={busyId === v.ID}
                                    onClick={() => setStatus(v.ID, "rejected")}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
