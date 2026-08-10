"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listAdminPropertySales,
  adminVerifyPropertySale,
  publishPropertySale,
  adminDeactivatePropertySale,
  adminReactivatePropertySale,
  adminMarkPropertySaleAsSold,
  getAdminPropertySale,
  adminUpdatePropertySale,
  adminSetPropertySaleOrganization,
  adminDeletePropertySale,
  listAdminCities,
  listAdminZones,
  listAdminQuartiers,
  listAdminOrganizations,
  uploadImage,
  uploadVideo,
  type AdminPropertySale,
  type AdminPropertySaleUpdate,
  type AdminOrganization,
  type AdminCity,
  type AdminZone,
  type AdminQuartier,
} from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function AdminPropertySalesPage() {
  const [items, setItems] = useState<AdminPropertySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AdminPropertySale | null>(null);
  const [editForm, setEditForm] = useState<AdminPropertySaleUpdate>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [quartiers, setQuartiers] = useState<AdminQuartier[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [editOrganizationId, setEditOrganizationId] = useState<number | null>(
    null,
  );

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminPropertySales();
      setItems(res.properties || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchData();
  }, []);

  // Load cities / zones / quartiers once for selectors
  useEffect(() => {
    async function loadLocationData() {
      try {
        const [citiesRes, zonesRes, quartiersRes, orgsRes] = await Promise.all([
          listAdminCities(),
          listAdminZones(),
          listAdminQuartiers(),
          listAdminOrganizations(),
        ]);
        setCities(citiesRes.data || []);
        setZones(zonesRes.data || []);
        setQuartiers(quartiersRes.data || []);
        setOrganizations(orgsRes.organizations || []);
      } catch (e) {
        console.error("Failed to load cities/zones/quartiers", e);
      }
    }
    loadLocationData();
  }, []);

  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.id, label: c.name })),
    [cities],
  );
  const zoneOptions = useMemo(() => {
    const cityId = editForm.city_id ?? null;
    return zones
      .filter((z) => (cityId ? z.city_id === cityId : true))
      .map((z) => ({ value: z.id, label: z.name }));
  }, [zones, editForm.city_id]);
  const quartierOptions = useMemo(() => {
    const zoneId = editForm.zone_id ?? null;
    return quartiers
      .filter((q) => (zoneId ? q.zone_id === zoneId : true))
      .map((q) => ({ value: q.id, label: q.name }));
  }, [quartiers, editForm.zone_id]);

  async function openEdit(p: AdminPropertySale) {
    setEditError(null);
    setEditItem(p);
    try {
      const res = await getAdminPropertySale(p.id);
      const prop = res.property;
      // Use prop first, fallback to list item p (in case GET omits truckeck e.g. caching)
      const truckeckVal = prop.truckeck ?? (p as { truckeck?: boolean }).truckeck;
      setEditOrganizationId(
        prop.organization?.id ??
          prop.organization_id ??
          null,
      );
      setEditForm({
        title: prop.title ?? "",
        description: prop.description ?? "",
        address: prop.address ?? "",
        city: prop.city ?? "",
        state: prop.state ?? "",
        country: prop.country ?? "",
        property_type: prop.property_type ?? "",
        listing_price: prop.listing_price ?? prop.listing_price ?? 0,
        bedrooms: prop.bedrooms ?? 0,
        bathrooms: prop.bathrooms ?? 0,
        square_footage: prop.square_footage ?? prop.area ?? 0,
        year_built: prop.year_built ?? 0,
        city_id: prop.city_id ?? null,
        zone_id: prop.zone_id ?? null,
        quartier_id: prop.quartier_id ?? null,
        images: Array.isArray(prop.images) ? prop.images : [],
        videos: Array.isArray(prop.videos) ? prop.videos : [],
        status: prop.status ?? "",
        truckeck: !!truckeckVal,
        is_investment_opportunity: !!(prop as any).is_investment_opportunity,
        is_gold: !!prop.is_gold,
      });
    } catch (e: any) {
      setEditError(e?.message || "Failed to load property");
    }
  }

  function closeEdit() {
    setEditItem(null);
    setEditForm({});
    setEditError(null);
  }

  async function saveEdit() {
    if (!editItem) return;
    setEditLoading(true);
    setEditError(null);
    try {
      // Build payload with truckeck always explicit (keeps backend in sync)
      const truckeckVal = editForm.truckeck === true;
      const payload: AdminPropertySaleUpdate = {
        ...editForm,
        truckeck: truckeckVal,
        is_investment_opportunity: editForm.is_investment_opportunity === true,
        is_gold: editForm.is_gold === true,
      };
      await adminUpdatePropertySale(editItem.id, payload);
      await adminSetPropertySaleOrganization(
        editItem.id,
        editOrganizationId,
      );
      closeEdit();
      fetchData();
    } catch (e: any) {
      setEditError(e?.message || "Failed to save");
    } finally {
      setEditLoading(false);
    }
  }

  function updateField<K extends keyof AdminPropertySaleUpdate>(
    key: K,
    value: AdminPropertySaleUpdate[K]
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function moveImage(index: number, direction: "left" | "right") {
    setEditForm((prev) => {
      const imgs = Array.isArray(prev.images) ? [...prev.images] : [];
      const from = index;
      const to = direction === "left" ? index - 1 : index + 1;
      if (from < 0 || from >= imgs.length || to < 0 || to >= imgs.length) {
        return prev;
      }
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...prev, images: imgs };
    });
  }

  function removeImage(index: number) {
    setEditForm((prev) => {
      const imgs = Array.isArray(prev.images) ? [...prev.images] : [];
      if (index < 0 || index >= imgs.length) return prev;
      imgs.splice(index, 1);
      return { ...prev, images: imgs };
    });
  }

  async function handleImageFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMediaLoading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        urls.push(url);
      }
      setEditForm((prev) => {
        const imgs = Array.isArray(prev.images) ? prev.images : [];
        return { ...prev, images: [...imgs, ...urls] };
      });
    } catch (e) {
      console.error("Failed to upload images", e);
    } finally {
      setMediaLoading(false);
    }
  }

  async function handleVideoFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMediaLoading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadVideo(file);
        urls.push(url);
      }
      setEditForm((prev) => {
        const vids = Array.isArray(prev.videos) ? prev.videos : [];
        return { ...prev, videos: [...vids, ...urls] };
      });
    } catch (e) {
      console.error("Failed to upload videos", e);
    } finally {
      setMediaLoading(false);
    }
  }

  async function onApprove(p: AdminPropertySale) {
    await adminVerifyPropertySale(p.id, {
      is_verified: true,
      verification_notes: "Approved",
    });
    fetchData();
  }
  async function onReject(p: AdminPropertySale) {
    await adminVerifyPropertySale(p.id, {
      is_verified: false,
      verification_notes: "Rejected",
    });
    fetchData();
  }
  async function onPublish(p: AdminPropertySale) {
    await publishPropertySale(p.id);
    fetchData();
  }
  async function onDeactivate(p: AdminPropertySale) {
    await adminDeactivatePropertySale(p.id);
    fetchData();
  }
  async function onReactivate(p: AdminPropertySale) {
    await adminReactivatePropertySale(p.id);
    fetchData();
  }
  async function onDelete(p: AdminPropertySale) {
    if (!window.confirm(`Delete property sale "${p.title}" permanently?`)) return;
    await adminDeletePropertySale(p.id);
    fetchData();
  }
  async function onMarkSold(p: AdminPropertySale) {
    await adminMarkPropertySaleAsSold(p.id);
    fetchData();
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Property Sales</h1>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gold</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-red-600">
                  {error}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No listings</TableCell>
              </TableRow>
            ) : (
              items.map((p) => {
                const img =
                  Array.isArray(p.images) && p.images[0]
                    ? p.images[0]
                    : "/property-placeholder.jpg";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={img}
                            alt={p.title}
                            width={64}
                            height={48}
                            className="h-12 w-16 object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">
                            {p.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.property_type}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[140px]">
                      {p.organization?.name?.trim() || "—"}
                    </TableCell>
                    <TableCell>
                      {[p.city, p.state, p.country].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell className="text-xs uppercase tracking-wide">
                      {p.is_sold ? "sold" : null}
                      {p.is_sold ? " · " : null}
                      {p.is_deactivated
                        ? "deactivated"
                        : p.is_published
                        ? "published"
                        : p.is_verified
                        ? "verified"
                        : p.status || "draft"}
                      {p.is_investment_opportunity ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold tracking-normal text-emerald-700">
                          INVESTMENT
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.is_gold ? (
                        <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-medium text-neutral-800">
                          Gold
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApprove(p)}
                        disabled={p.is_verified}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(p)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onPublish(p)}
                        disabled={!p.is_verified || !!p.is_published}
                      >
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant={p.is_sold ? "secondary" : "outline"}
                        onClick={() => onMarkSold(p)}
                        disabled={!!p.is_sold}
                      >
                        {p.is_sold ? "Sold" : "Mark Sold"}
                      </Button>
                      {p.is_deactivated ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReactivate(p)}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeactivate(p)}
                          disabled={!p.is_published}
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(p)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property Sale</DialogTitle>
          </DialogHeader>
          {editError && (
            <p className="text-sm text-red-600">{editError}</p>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title ?? ""}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization_id">Listing agency (organization)</Label>
              <select
                id="organization_id"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={editOrganizationId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditOrganizationId(v === "" ? null : parseInt(v, 10));
                }}
              >
                <option value="">None (individual / no agency)</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Shown on the property sale details screen as the listing agency. Saving
                updates the link and clears the assigned agent if the agency changed.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address ?? ""}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city_id">City</Label>
                <select
                  id="city_id"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={editForm.city_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    updateField("city_id", val as any);
                    // Reset dependent fields
                    updateField("zone_id", null as any);
                    updateField("quartier_id", null as any);
                  }}
                >
                  <option value="">Select city</option>
                  {cityOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone_id">Zone</Label>
                <select
                  id="zone_id"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={editForm.zone_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    updateField("zone_id", val as any);
                    updateField("quartier_id", null as any);
                  }}
                  disabled={!editForm.city_id}
                >
                  <option value="">Select zone</option>
                  {zoneOptions.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quartier_id">Quartier</Label>
              <select
                id="quartier_id"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={editForm.quartier_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  updateField("quartier_id", val as any);
                }}
                disabled={!editForm.zone_id}
              >
                <option value="">Select quartier</option>
                {quartierOptions.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="property_type">Property Type</Label>
                <Input
                  id="property_type"
                  value={editForm.property_type ?? ""}
                  onChange={(e) =>
                    updateField("property_type", e.target.value)
                  }
                  placeholder="e.g. Apartment, House"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={editForm.status ?? ""}
                  onChange={(e) => updateField("status", e.target.value)}
                  placeholder="draft, verified, published"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="listing_price">Listing Price (MRU)</Label>
                <Input
                  id="listing_price"
                  type="number"
                  value={editForm.listing_price ?? ""}
                  onChange={(e) =>
                    updateField(
                      "listing_price",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="square_footage">Area (sqm)</Label>
                <Input
                  id="square_footage"
                  type="number"
                  value={editForm.square_footage ?? ""}
                  onChange={(e) =>
                    updateField(
                      "square_footage",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={editForm.bedrooms ?? ""}
                  onChange={(e) =>
                    updateField("bedrooms", parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={editForm.bathrooms ?? ""}
                  onChange={(e) =>
                    updateField(
                      "bathrooms",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year_built">Year Built</Label>
                <Input
                  id="year_built"
                  type="number"
                  value={editForm.year_built ?? ""}
                  onChange={(e) =>
                    updateField(
                      "year_built",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                />
              </div>
            </div>
            {/* Media management: images + videos */}
            <div className="grid gap-4 border rounded-md p-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Media</Label>
                {mediaLoading && (
                  <span className="text-xs text-muted-foreground">
                    Uploading…
                  </span>
                )}
              </div>
              {/* Images */}
              <div className="grid gap-2">
                <Label className="text-sm">Images</Label>
                <div className="flex flex-wrap gap-3">
                  {(editForm.images ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No images yet. Upload high-quality property photos.
                    </p>
                  )}
                  {(editForm.images ?? []).map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="relative flex flex-col items-center gap-1"
                    >
                      <div className="h-20 w-28 overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={url}
                          alt={`Image ${idx + 1}`}
                          width={112}
                          height={80}
                          className="h-20 w-28 object-cover"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveImage(idx, "left")}
                          disabled={idx === 0}
                        >
                          ◀
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveImage(idx, "right")}
                          disabled={
                            !editForm.images ||
                            idx === (editForm.images?.length || 0) - 1
                          }
                        >
                          ▶
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeImage(idx)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageFilesSelected(e.target.files)}
                />
                <p className="text-xs text-muted-foreground">
                  First image is used as the primary thumbnail in the feed.
                  Drag-order equivalent via the arrow buttons.
                </p>
              </div>
              {/* Videos */}
              <div className="grid gap-2">
                <Label className="text-sm">Videos</Label>
                <div className="space-y-2">
                  {(editForm.videos ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No videos yet. Upload a short walkthrough or highlight
                      clip.
                    </p>
                  )}
                  {(editForm.videos ?? []).map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-2 py-1"
                    >
                      <span className="truncate text-xs text-muted-foreground">
                        Video {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVideoPreviewUrl(url)}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleVideoFilesSelected(e.target.files)}
                />
                {videoPreviewUrl && (
                  <div className="mt-2 rounded-md border bg-muted/40 p-2">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="h-auto w-full max-h-[360px] rounded-md bg-black"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-4">
              <Checkbox
                id="is_gold"
                checked={!!editForm.is_gold}
                onCheckedChange={(checked) =>
                  updateField("is_gold", checked === true)
                }
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="is_gold" className="cursor-pointer font-medium">
                  Gold listing (distribution boost)
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, this sale gets higher priority in feeds, discovery, and Gold analytics (feed impressions, detail views, notification sends).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-4">
              <Checkbox
                id="truckeck"
                checked={!!editForm.truckeck}
                onCheckedChange={(checked) =>
                  updateField("truckeck", checked === true)
                }
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="truckeck" className="cursor-pointer font-medium">
                  Truckeck (Quality validated)
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, the listing shows that our quality control team has validated the Oqood of this property.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
              <Checkbox
                id="is_investment_opportunity"
                checked={!!editForm.is_investment_opportunity}
                onCheckedChange={(checked) =>
                  updateField("is_investment_opportunity", checked === true)
                }
              />
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="is_investment_opportunity"
                  className="cursor-pointer font-medium text-emerald-800"
                >
                  Mark as investment opportunity
                </Label>
                <p className="text-sm text-emerald-700">
                  When enabled and listing is published, a targeted push alert is sent to users interested in investment opportunities.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editLoading}>
              {editLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
