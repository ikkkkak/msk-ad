"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Video, 
  MessageSquare,
  Shield
} from "lucide-react";

interface VideoReport {
  id: number;
  video_id: number;
  reporter_id: number | null; // Can be null for anonymous reports
  reason: string;
  description: string;
  status: string;
  admin_notes: string;
  created_at: string;
  video: {
    id: number;
    caption: string;
    videoURL: string;
    thumbnailURL: string;
    durationSec: number;
    userID: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null; // Can be null if user data is missing
  };
  reporter: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null; // Can be null for anonymous reports
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-orange-100 text-orange-800", icon: Clock },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-800", icon: Eye },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const reasonConfig = {
  inappropriate: "Inappropriate Content",
  spam: "Spam or Misleading",
  harassment: "Harassment or Bullying",
  violence: "Violence or Dangerous Acts",
  fake: "Fake Information",
  other: "Other",
};

export default function FlaggedVideosPage() {
  const [reports, setReports] = useState<VideoReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchFlaggedVideos();
    // eslint-disable-next-line
  }, []);

  const fetchFlaggedVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/flagged-videos", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch flagged videos");
      }
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: number, status: string, adminNotes: string = "") => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update report status");
      }
      await fetchFlaggedVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleStatusUpdate = (reportId: number, status: string) => {
    const adminNotes = prompt("Add admin notes (optional):");
    updateReportStatus(reportId, status, adminNotes || "");
  };

  const filteredReports = selectedStatus === "all" 
    ? reports 
    : reports.filter(report => report.status === selectedStatus);

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: reports.length, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
    reports.forEach(report => {
      if (counts.hasOwnProperty(report.status)) {
        counts[report.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }


  // Utility to render icon in status overview cards
  function StatusOverviewIcon({ status }: { status: string }) {
    if (status === "all") {
      return <Shield className="h-4 w-4 text-gray-600" />;
    }

    const config = statusConfig[status as keyof typeof statusConfig];
    if (config && config.icon) {
      const IconComp = config.icon;
      return <IconComp className="h-4 w-4" />;
    }
    return null;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flagged Videos</h1>
          <p className="text-muted-foreground">
            Manage video reports and user flags
          </p>
        </div>
        <Button onClick={fetchFlaggedVideos} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <StatusOverviewIcon status={status} />
                <div>
                  <p className="text-sm font-medium capitalize">{status}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports List */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({statusCounts.reviewed})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({statusCounts.dismissed})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No reports found</h3>
                <p className="text-muted-foreground">
                  {selectedStatus === "all" 
                    ? "No video reports have been submitted yet."
                    : `No reports with status "${selectedStatus}" found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => {
              const StatusIcon = statusConfig[report.status as keyof typeof statusConfig]?.icon || Clock;
              const statusColor = statusConfig[report.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800";
              
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-lg">Report #{report.id}</CardTitle>
                          <CardDescription>
                            {new Date(report.created_at).toLocaleDateString()} at{" "}
                            {new Date(report.created_at).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={statusColor}>
                        {statusConfig[report.status as keyof typeof statusConfig]?.label || report.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Report Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3">Report Details</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">Reason:</span>
                            <span>{reasonConfig[report.reason as keyof typeof reasonConfig] || report.reason}</span>
                          </div>
                          {report.description && (
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div>
                                <span className="font-medium">Description:</span>
                                <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3">Video Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">Caption:</span>
                            <span>{report.video.caption || "No caption"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Video ID:</span>
                            <span>{report.video.id}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">Duration:</span>
                            <span>{report.video.durationSec ? `${Math.round(report.video.durationSec)}s` : "Unknown"}</span>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-cyan-500" />
                              <span className="font-medium">Video Preview:</span>
                            </div>
                            <video 
                              controls 
                              className="w-full max-w-lg h-64 rounded-lg border shadow-md bg-gray-50"
                              preload="metadata"
                              poster={report.video.thumbnailURL || undefined}
                            >
                              <source src={report.video.videoURL} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Owner:</span>
                            <span>
                              {report.video.user 
                                ? `${report.video.user.firstName} ${report.video.user.lastName} (${report.video.user.email})`
                                : `User ID: ${report.video.userID}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reporter Information */}
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Reporter Information</h4>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Reporter:</span>
                        <span>
                          {report.reporter 
                            ? `${report.reporter.firstName} ${report.reporter.lastName} (${report.reporter.email})`
                            : "Anonymous User"
                          }
                        </span>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {report.admin_notes && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Admin Notes</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">{report.admin_notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {report.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "reviewed")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Mark as Reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "dismissed")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Dismiss
                          </Button>
                        </>
                      )}
                      
                      {report.status === "reviewed" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "dismissed")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Dismiss
                          </Button>
                        </>
                      )}

                      {(report.status === "resolved" || report.status === "dismissed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(report.id, "reviewed")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Re-review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}