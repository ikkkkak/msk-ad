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
import { Plus, Edit, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import {
  listAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadImage,
  type AdminBanner,
} from "@/lib/api";
import { toast } from "sonner";

export default function BannersPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<AdminBanner | null>(null);

  const [formData, setFormData] = useState({
    image_url: "",
    link_url: "",
    width: 800,
    height: 200,
    sort_order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await listAdminBanners();
      setBanners(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ image_url: "", link_url: "", width: 800, height: 200, sort_order: banners.length });
    setImageFile(null);
  };

  const handleCreate = async () => {
    try {
      let finalImageURL = formData.image_url;

      if (imageFile) {
        setUploading(true);
        try {
          finalImageURL = await uploadImage(imageFile);
          toast.success("Image uploaded to Cloudinary");
        } catch (err) {
          toast.error("Failed to upload image: " + (err instanceof Error ? err.message : "Unknown error"));
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      if (!finalImageURL) {
        toast.error("Please upload an image or provide an image URL");
        return;
      }

      await createBanner({
        image_url: finalImageURL,
        link_url: formData.link_url || undefined,
        width: formData.width,
        height: formData.height,
        sort_order: formData.sort_order,
      });

      toast.success("Banner created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create banner");
    }
  };

  const handleUpdate = async () => {
    if (!editingBanner) return;

    try {
      let finalImageURL = formData.image_url;

      if (imageFile) {
        setUploading(true);
        try {
          finalImageURL = await uploadImage(imageFile);
          toast.success("Image uploaded to Cloudinary");
        } catch (err) {
          toast.error("Failed to upload image");
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      await updateBanner(editingBanner.id, {
        image_url: finalImageURL || undefined,
        link_url: formData.link_url,
        width: formData.width,
        height: formData.height,
        sort_order: formData.sort_order,
      });

      toast.success("Banner updated successfully");
      setEditingBanner(null);
      resetForm();
      fetchBanners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update banner");
    }
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    try {
      await deleteBanner(bannerToDelete.id);
      toast.success("Banner deleted successfully");
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
      fetchBanners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete banner");
    }
  };

  const openEditDialog = (banner: AdminBanner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      width: banner.width || 800,
      height: banner.height || 200,
      sort_order: banner.sort_order,
    });
    setImageFile(null);
  };

  const openDeleteDialog = (banner: AdminBanner) => {
    setBannerToDelete(banner);
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
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">
            Promotional banners shown in the property sale list feed (after every 4–5 properties)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Banner</DialogTitle>
              <DialogDescription>
                Upload an image to Cloudinary. It will appear in the property sale feed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Banner Image *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setFormData({ ...formData, image_url: "" });
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {imageFile && (
                    <span className="text-sm text-muted-foreground">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading to Cloudinary...
                  </div>
                )}
                <Input
                  placeholder="Or paste image URL (Cloudinary)"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value });
                    if (e.target.value) setImageFile(null);
                  }}
                  disabled={!!imageFile}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    min={100}
                    max={2000}
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: parseInt(e.target.value) || 800 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Display width for mobile</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={50}
                    max={800}
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: parseInt(e.target.value) || 200 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Display height for mobile</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL (optional)</Label>
                <Input
                  id="link_url"
                  placeholder="https://..."
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Where users go when they tap the banner
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">Lower = higher priority</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={uploading}>
                {uploading ? "Uploading..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No banners</h3>
            <p className="text-muted-foreground mb-4">
              Add banners to show in the property sale list feed
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="hover:shadow-md transition-shadow overflow-hidden">
              <div className="aspect-[2/1] bg-muted relative">
                <img
                  src={banner.image_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
                <Badge
                  variant={banner.is_active ? "default" : "secondary"}
                  className="absolute top-2 right-2"
                >
                  {banner.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                {banner.link_url && (
                  <p className="text-xs text-muted-foreground truncate" title={banner.link_url}>
                    Link: {banner.link_url}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Order: {banner.sort_order}</p>
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(banner)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(banner)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingBanner && (
        <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Banner</DialogTitle>
              <DialogDescription>Update the banner image, dimensions, and link</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Banner Image *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {imageFile && (
                    <span className="text-sm text-muted-foreground">
                      {imageFile.name} (upload on save)
                    </span>
                  )}
                </div>
                <Input
                  placeholder="Image URL"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  disabled={!!imageFile}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-width">Width (px)</Label>
                  <Input
                    id="edit-width"
                    type="number"
                    min={100}
                    max={2000}
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        width: parseInt(e.target.value) || 800,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Display width for mobile</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-height">Height (px)</Label>
                  <Input
                    id="edit-height"
                    type="number"
                    min={50}
                    max={800}
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height: parseInt(e.target.value) || 200,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Display height for mobile</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBanner(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={uploading}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this banner? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
