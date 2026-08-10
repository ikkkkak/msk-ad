"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Video, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Image as ImageIcon,
  Upload,
  X
} from "lucide-react";
import {
  listAdminPromotionalVideos,
  createPromotionalVideo,
  updatePromotionalVideo,
  deletePromotionalVideo,
  uploadVideo,
  uploadImage,
  type AdminPromotionalVideo,
} from "@/lib/api";
import { toast } from "sonner";

function formatListDate(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function PromotionalVideosPage() {
  const [videos, setVideos] = useState<AdminPromotionalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdminPromotionalVideo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<AdminPromotionalVideo | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    videoURL: "",
    thumbnailURL: "",
    title: "",
    description: "",
    caption: "",
    durationSec: 0,
  });

  // File upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await listAdminPromotionalVideos({ page: 1, per_page: 100 });
      setVideos(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load promotional videos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!videoFile && !formData.videoURL) {
        toast.error("Please upload a video file or provide a video URL");
        return;
      }

      if (!formData.title) {
        toast.error("Title is required");
        return;
      }

      let finalVideoURL = formData.videoURL;
      let finalThumbnailURL = formData.thumbnailURL;

      // Upload video file if provided
      if (videoFile) {
        setUploadingVideo(true);
        try {
          finalVideoURL = await uploadVideo(videoFile);
          toast.success("Video uploaded successfully");
        } catch (err) {
          toast.error("Failed to upload video: " + (err instanceof Error ? err.message : "Unknown error"));
          setUploadingVideo(false);
          return;
        }
        setUploadingVideo(false);
      }

      // Upload thumbnail file if provided
      if (thumbnailFile) {
        setUploadingThumbnail(true);
        try {
          finalThumbnailURL = await uploadImage(thumbnailFile);
          toast.success("Thumbnail uploaded successfully");
        } catch (err) {
          toast.error("Failed to upload thumbnail: " + (err instanceof Error ? err.message : "Unknown error"));
          setUploadingThumbnail(false);
          return;
        }
        setUploadingThumbnail(false);
      }

      await createPromotionalVideo({
        videoURL: finalVideoURL.trim(),
        thumbnailURL: finalThumbnailURL?.trim() || undefined,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        caption: formData.caption.trim() || undefined,
        durationSec: formData.durationSec || undefined,
      });

      toast.success("Promotional video created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create video");
    } finally {
      setUploadingVideo(false);
      setUploadingThumbnail(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingVideo) return;

    try {
      await updatePromotionalVideo(editingVideo.ID, {
        videoURL: formData.videoURL || undefined,
        thumbnailURL: formData.thumbnailURL || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        caption: formData.caption || undefined,
      });

      toast.success("Promotional video updated successfully");
      setEditingVideo(null);
      resetForm();
      fetchVideos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update video");
    }
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;

    try {
      await deletePromotionalVideo(videoToDelete.ID);
      toast.success("Promotional video deleted successfully");
      setIsDeleteDialogOpen(false);
      setVideoToDelete(null);
      fetchVideos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete video");
    }
  };

  const resetForm = () => {
    setFormData({
      videoURL: "",
      thumbnailURL: "",
      title: "",
      description: "",
      caption: "",
      durationSec: 0,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setUploadProgress(0);
  };

  const openEditDialog = (video: AdminPromotionalVideo) => {
    setEditingVideo(video);
    setFormData({
      videoURL: video.videoURL,
      thumbnailURL: video.thumbnailURL || "",
      title: video.title,
      description: video.description || "",
      caption: video.caption || "",
      durationSec: video.durationSec || 0,
    });
  };

  const openDeleteDialog = (video: AdminPromotionalVideo) => {
    setVideoToDelete(video);
    setIsDeleteDialogOpen(true);
  };

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
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotional Videos</h1>
          <p className="text-muted-foreground">
            Manage app demo videos and tutorials that appear in the video feed
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Promotional Video</DialogTitle>
              <DialogDescription>
                Add a new promotional video (app demo, tutorial) that will appear randomly in the video feed
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="videoFile">Video File *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        setFormData({ ...formData, videoURL: "" }); // Clear URL when file is selected
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {videoFile && (
                    <div className="text-sm text-muted-foreground">
                      {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
                {uploadingVideo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading video...
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Or provide a video URL (if video is already uploaded)
                </div>
                <Input
                  placeholder="https://res.cloudinary.com/... (optional if uploading file)"
                  value={formData.videoURL}
                  onChange={(e) => {
                    setFormData({ ...formData, videoURL: e.target.value });
                    if (e.target.value) setVideoFile(null); // Clear file when URL is entered
                  }}
                  disabled={!!videoFile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailFile">Thumbnail Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="thumbnailFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setThumbnailFile(file);
                        setFormData({ ...formData, thumbnailURL: "" }); // Clear URL when file is selected
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {thumbnailFile && (
                    <div className="text-sm text-muted-foreground">
                      {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
                {uploadingThumbnail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading thumbnail...
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Or provide a thumbnail URL (if thumbnail is already uploaded)
                </div>
                <Input
                  placeholder="https://res.cloudinary.com/... (optional if uploading file)"
                  value={formData.thumbnailURL}
                  onChange={(e) => {
                    setFormData({ ...formData, thumbnailURL: e.target.value });
                    if (e.target.value) setThumbnailFile(null); // Clear file when URL is entered
                  }}
                  disabled={!!thumbnailFile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., How to Book a Property"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Brief description of the video content"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  placeholder="Video caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={uploadingVideo || uploadingThumbnail}
              >
                {uploadingVideo || uploadingThumbnail ? "Uploading..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No promotional videos</h3>
            <p className="text-muted-foreground mb-4">
              Create your first promotional video to help users learn about the app
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.ID} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{video.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {video.description || video.caption || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {video.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Preview */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {video.thumbnailURL ? (
                    <img
                      src={video.thumbnailURL}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                    <a
                      href={video.videoURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Play className="h-6 w-6 text-white" />
                    </a>
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatListDate(video.createdAt)}</span>
                  </div>
                  {video.durationSec && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{Math.round(video.durationSec)}s</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEditDialog(video)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(video)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingVideo && (
        <Dialog open={!!editingVideo} onOpenChange={(open) => !open && setEditingVideo(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Promotional Video</DialogTitle>
              <DialogDescription>
                Update the promotional video details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-videoURL">Video URL *</Label>
                <Input
                  id="edit-videoURL"
                  value={formData.videoURL}
                  onChange={(e) => setFormData({ ...formData, videoURL: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-thumbnailURL">Thumbnail URL</Label>
                <Input
                  id="edit-thumbnailURL"
                  value={formData.thumbnailURL}
                  onChange={(e) => setFormData({ ...formData, thumbnailURL: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption</Label>
                <Input
                  id="edit-caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVideo(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotional Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

