"use client";

import { useEffect, useState } from "react";
import {
  listAdminLandmarks,
  adminVerifyLandmark,
  adminUpdateLandmark,
  listAdminOrganizations,
  adminSetLandmarkOrganization,
  adminDeleteLandmark,
  listAdminCities,
  listAdminZones,
  listAdminQuartiers,
  uploadImage,
  lookupHabitatPlot,
  type AdminLandmark,
  type AdminOrganization,
  type AdminCity,
  type AdminZone,
  type AdminQuartier,
  type HabitatPlotLookupResult,
} from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { LandmarkMapEditor } from "@/components/landmark-map-editor";

const BRAND = "#D16024";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

function AdminLandmarkReviewPanel({
  landmark,
  onImageClick,
}: {
  landmark: AdminLandmark;
  onImageClick: (url: string) => void;
}) {
  const host = landmark.host;
  const locationParts = [
    landmark.city_name || landmark.region,
    landmark.zone_name || landmark.zoning,
    landmark.quartier_name || landmark.district,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4 space-y-3 bg-orange-50/40 border-orange-200">
        <h3 className="text-sm font-semibold" style={{ color: BRAND }}>
          Location & plot verification
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="City" value={landmark.city_name || landmark.region} />
          <InfoRow label="Zone" value={landmark.zone_name || landmark.zoning} />
          <InfoRow label="Sector (quartier)" value={landmark.quartier_name || landmark.district} />
          <InfoRow label="Plot number (listed)" value={landmark.plot_number} />
          <InfoRow
            label="Plot confirmed by host"
            value={landmark.plot_confirmed ? "Yes" : "No"}
          />
          <InfoRow
            label="Cadastre link"
            value={
              landmark.cadastre_linked
                ? `Plot #${landmark.cadastre_plot?.plot_number ?? "—"} in GIS`
                : "Not linked to cadastre"
            }
          />
        </div>
        {landmark.plot_number && (
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border"
            style={{
              color: BRAND,
              borderColor: "#F4C9B4",
              backgroundColor: "#FFF1EA",
            }}
          >
            Plot #{landmark.plot_number}
            {landmark.cadastre_linked && landmark.plot_number_matches_cadastre
              ? " · matches cadastre"
              : landmark.cadastre_linked
                ? " · cadastre mismatch"
                : " · host confirmed only"}
          </div>
        )}
        {landmark.cadastre_plot && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2 space-y-1">
            <p>
              Cadastre: {landmark.cadastre_plot.plan_name || landmark.cadastre_plot.plan_code} →{" "}
              {landmark.cadastre_plot.sector_name} → #{landmark.cadastre_plot.plot_number}
              {landmark.cadastre_plot.area_m2 != null
                ? ` (${landmark.cadastre_plot.area_m2} m²)`
                : ""}
            </p>
          </div>
        )}
        {locationParts.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Full path: {locationParts.join(" → ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoRow
          label="Price"
          value={
            landmark.price != null && landmark.price > 0
              ? `${landmark.price.toLocaleString()} ${landmark.currency || "MRU"}`
              : "On request"
          }
        />
        <InfoRow label="Area" value={`${landmark.area} ${landmark.area_unit}`} />
        <InfoRow label="Land type" value={landmark.land_type} />
        <InfoRow label="Legacy labels" value={[landmark.district, landmark.region].filter(Boolean).join(", ")} />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
          {landmark.description || "—"}
        </p>
      </div>

      {landmark.paper_types && landmark.paper_types.length > 0 && (
        <div>
          <label className="text-sm font-medium">Declared paper types</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {landmark.paper_types.map((pt) => (
              <Badge key={pt} variant="outline" className="text-xs">
                {pt.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {landmark.images && landmark.images.length > 0 && (
        <div>
          <label className="text-sm font-medium">
            Property photos ({landmark.images.length})
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {landmark.images.map((imageUrl, index) => (
              <button
                key={index}
                type="button"
                className="relative rounded-md border overflow-hidden hover:opacity-90"
                onClick={() => onImageClick(imageUrl)}
              >
                <Image
                  src={imageUrl}
                  alt={`Land photo ${index + 1}`}
                  width={200}
                  height={120}
                  className="w-full h-28 object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {landmark.video_url ? (
        <div>
          <label className="text-sm font-medium">Property video</label>
          <video
            src={landmark.video_url}
            controls
            className="w-full mt-2 rounded-md border max-h-56 bg-black"
          />
          <a
            href={landmark.video_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs mt-1 inline-block underline"
            style={{ color: BRAND }}
          >
            Open video URL
          </a>
        </div>
      ) : null}

      {landmark.property_papers && landmark.property_papers.length > 0 && (
        <div>
          <label className="text-sm font-medium">
            Uploaded property papers ({landmark.property_papers.length})
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {landmark.property_papers.map((paperUrl, index) => (
              <button
                key={index}
                type="button"
                className="relative rounded-md border overflow-hidden"
                onClick={() => onImageClick(paperUrl)}
              >
                <Image
                  src={paperUrl}
                  alt={`Paper ${index + 1}`}
                  width={200}
                  height={120}
                  className="w-full h-28 object-cover"
                  unoptimized
                />
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                  Paper {index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <h3 className="text-sm font-semibold">Listed by (host)</h3>
        <InfoRow label="Type" value={host?.type} />
        <InfoRow label="Name" value={host?.name || landmark.organization?.name} />
        <InfoRow label="Phone" value={host?.phone || landmark.organization?.phone} />
        <InfoRow label="Email" value={host?.email || landmark.organization?.email} />
        {landmark.host_private_note ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Host private note (admin only)</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{landmark.host_private_note}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LandmarkAgencyLink({
  landmark,
  organizations,
  onUpdated,
}: {
  landmark: AdminLandmark;
  organizations: AdminOrganization[];
  onUpdated: () => void;
}) {
  const initial =
    landmark.organization?.id ?? landmark.organization_id ?? null;
  const [value, setValue] = useState<string>(
    initial != null ? String(initial) : "",
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const v =
      landmark.organization?.id ?? landmark.organization_id ?? null;
    setValue(v != null ? String(v) : "");
  }, [landmark.id, landmark.organization?.id, landmark.organization_id]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const orgId = value === "" ? null : parseInt(value, 10);
      if (value !== "" && Number.isNaN(orgId)) {
        setMsg("Invalid selection");
        return;
      }
      await adminSetLandmarkOrganization(landmark.id, orgId);
      onUpdated();
      setMsg("Saved");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 border rounded-md p-3 bg-muted/30">
      <Label>Listing agency (organization)</Label>
      <p className="text-xs text-muted-foreground">
        Shown on landmark details in the app. Reassign to any organization.
      </p>
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">None</option>
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => void save()}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save agency link"}
      </Button>
      {msg && (
        <p
          className={`text-xs ${msg === "Saved" ? "text-green-600" : "text-red-600"}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

export default function AdminLandmarksPage() {
  const [items, setItems] = useState<AdminLandmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<AdminLandmark | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orgList, setOrgList] = useState<AdminOrganization[]>([]);

  // ── Full edit ──
  type EditForm = {
    title: string;
    description: string;
    price: string;
    area: string;
    area_unit: string;
    land_type: string;
    zoning: string;
    district: string;
    region: string;
    plot_number: string;
    elevation_m: string;
    video_url: string;
    images: string[];
    city_id: number | null;
    zone_id: number | null;
    quartier_id: number | null;
    habitat_plot_id: number | null;
  };
  const [editing, setEditing] = useState<AdminLandmark | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Location picker data (loaded once) + image upload / cadastre-link state.
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [quartiers, setQuartiers] = useState<AdminQuartier[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkingPlot, setLinkingPlot] = useState(false);
  const [plotLink, setPlotLink] = useState<
    | { status: "linked"; plot: HabitatPlotLookupResult }
    | { status: "error"; message: string }
    | null
  >(null);

  function openEdit(l: AdminLandmark) {
    setEditForm({
      title: l.title ?? "",
      description: l.description ?? "",
      price: l.price != null ? String(l.price) : "",
      area: l.area != null ? String(l.area) : "",
      area_unit: l.area_unit ?? "sqm",
      land_type: l.land_type ?? "",
      zoning: (l as any).zoning ?? "",
      district: (l as any).district ?? "",
      region: (l as any).region ?? "",
      plot_number: l.plot_number ?? "",
      elevation_m: (l as any).elevation_m != null ? String((l as any).elevation_m) : "",
      video_url: l.video_url ?? "",
      images: Array.isArray(l.images) ? [...l.images] : [],
      city_id: l.city_id ?? null,
      zone_id: l.zone_id ?? null,
      quartier_id: l.quartier_id ?? null,
      habitat_plot_id: l.habitat_plot_id ?? null,
    });
    // Seed the cadastre-link banner from the landmark's current link state.
    if (l.habitat_plot_id && l.cadastre_plot) {
      setPlotLink({ status: "linked", plot: l.cadastre_plot });
    } else {
      setPlotLink(null);
    }
    setEditing(l);
  }

  async function saveEdit() {
    if (!editing || !editForm) return;
    setSavingEdit(true);
    setError(null);
    try {
      await adminUpdateLandmark(editing.id, {
        title: editForm.title.trim(),
        description: editForm.description,
        price: editForm.price.trim() ? Number(editForm.price) : 0,
        area: editForm.area.trim() ? Number(editForm.area) : 0,
        area_unit: editForm.area_unit.trim(),
        land_type: editForm.land_type.trim(),
        zoning: editForm.zoning.trim(),
        district: editForm.district.trim(),
        region: editForm.region.trim(),
        plot_number: editForm.plot_number.trim(),
        elevation_m: editForm.elevation_m.trim() ? Number(editForm.elevation_m) : 0,
        video_url: editForm.video_url.trim(),
        images: editForm.images,
        city_id: editForm.city_id ?? 0,
        zone_id: editForm.zone_id ?? 0,
        quartier_id: editForm.quartier_id ?? 0,
        habitat_plot_id: editForm.habitat_plot_id ?? 0,
      });
      setEditing(null);
      setEditForm(null);
      fetchData();
    } catch (e: any) {
      setError(e?.message || "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching admin landmarks...");
      const res = await listAdminLandmarks();
      console.log("Landmarks response:", res);
      setItems(res.landmarks || []);
    } catch (e: any) {
      console.error("Error fetching landmarks:", e);
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await listAdminOrganizations();
        setOrgList(res.organizations || []);
      } catch {
        /* optional for table; sheet will show empty org list */
      }
    })();
  }, []);

  // Location picker data — cities, zones, quartiers (cascade filtered in the sheet).
  useEffect(() => {
    (async () => {
      try {
        const [c, z, q] = await Promise.all([
          listAdminCities(),
          listAdminZones(),
          listAdminQuartiers(),
        ]);
        setCities(c.data || []);
        setZones(z.data || []);
        setQuartiers(q.data || []);
      } catch {
        /* pickers will show empty; admin can still edit other fields */
      }
    })();
  }, []);

  // Upload a chosen image file and append its hosted URL to the form's images.
  async function uploadEditImage(file: File) {
    setUploadingImage(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setEditForm((f) => (f ? { ...f, images: [...f.images, url] } : f));
    } catch (e: any) {
      setError(e?.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  // Resolve the typed plot number against the quartier's cadastre sector and
  // stage the matched habitat_plot_id for saving.
  async function linkPlot() {
    if (!editForm) return;
    const qid = editForm.quartier_id;
    const pn = editForm.plot_number.trim();
    if (!qid) {
      setPlotLink({ status: "error", message: "Pick a quartier first" });
      return;
    }
    if (!pn) {
      setPlotLink({ status: "error", message: "Enter a plot number first" });
      return;
    }
    setLinkingPlot(true);
    setPlotLink(null);
    try {
      const { plot, reason } = await lookupHabitatPlot(qid, pn);
      if (plot && plot.id) {
        setEditForm((f) => (f ? { ...f, habitat_plot_id: plot.id } : f));
        setPlotLink({ status: "linked", plot });
      } else {
        setEditForm((f) => (f ? { ...f, habitat_plot_id: null } : f));
        setPlotLink({
          status: "error",
          message: reason || "No cadastre plot found with this number in the sector",
        });
      }
    } catch (e: any) {
      setPlotLink({ status: "error", message: e?.message || "Lookup failed" });
    } finally {
      setLinkingPlot(false);
    }
  }

  async function onVerify(landmark: AdminLandmark, isVerified: boolean) {
    setIsVerifying(true);
    try {
      await adminVerifyLandmark(landmark.id, {
        is_verified: isVerified,
        verification_notes: verificationNotes || (isVerified ? "Approved by admin" : "Rejected by admin"),
      });
      setVerificationNotes("");
      setSelectedLandmark(null);
      fetchData();
    } catch (e: any) {
      setError(e?.message || "Failed to verify landmark");
    } finally {
      setIsVerifying(false);
    }
  }

  async function onDelete(landmark: AdminLandmark) {
    if (!window.confirm(`Delete landmark "${landmark.title}" permanently?`)) return;
    await adminDeleteLandmark(landmark.id);
    fetchData();
  }

  async function onToggleInvestment(landmark: AdminLandmark) {
    await adminUpdateLandmark(landmark.id, {
      is_investment_opportunity: !landmark.is_investment_opportunity,
    });
    fetchData();
  }
  async function onToggleGoodDeal(landmark: AdminLandmark) {
    await adminUpdateLandmark(landmark.id, {
      is_good_deal: !landmark.is_good_deal,
    });
    fetchData();
  }
  async function onToggleGold(landmark: AdminLandmark) {
    await adminUpdateLandmark(landmark.id, {
      is_gold: !landmark.is_gold,
    });
    fetchData();
  }

  const getStatusBadge = (landmark: AdminLandmark) => {
    if (landmark.is_verified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    if (landmark.status === "pending_verification") {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    if (landmark.status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const getOrganizationName = (landmark: AdminLandmark) => {
    const name = landmark.organization?.name?.trim();
    return name && name.length > 0 ? name : "Not provided";
  };

  const filteredItems = items.filter(landmark => {
    if (filter === 'all') return true;
    if (filter === 'pending') return landmark.status === 'pending_verification';
    if (filter === 'verified') return landmark.is_verified;
    if (filter === 'rejected') return landmark.status === 'rejected';
    return true;
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Landmark Management</h1>
        <p className="text-sm text-muted-foreground">
          Review, verify, and manage landmark submissions from property owners
        </p>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="map">Map Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('pending')}
        >
          Pending ({items.filter(l => l.status === 'pending_verification').length})
        </Button>
        <Button 
          variant={filter === 'verified' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('verified')}
        >
          Verified ({items.filter(l => l.is_verified).length})
        </Button>
        <Button 
          variant={filter === 'rejected' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('rejected')}
        >
          Rejected ({items.filter(l => l.status === 'rejected').length})
          </Button>
          </div>

          <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Landmark</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Plot</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-red-600">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No landmarks found for the selected filter</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((landmark) => (
                <TableRow key={landmark.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {landmark.images && landmark.images.length > 0 && (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                          <Image
                            src={landmark.images[0]}
                            alt={landmark.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkwxOCAyMEgzMEwyNCAxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4IDIwVjI4SDMwVjIwSDE4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">{landmark.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {landmark.description?.substring(0, 100)}
                          {landmark.description && landmark.description.length > 100 && "..."}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {landmark.images && landmark.images.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              📷 {landmark.images.length}
                            </Badge>
                          )}
                          {landmark.property_papers && landmark.property_papers.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              📄 {landmark.property_papers.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[140px]">
                    <div className="space-y-0.5">
                      {landmark.city_name || landmark.region ? (
                        <div>{landmark.city_name || landmark.region}</div>
                      ) : null}
                      {landmark.zone_name || landmark.zoning ? (
                        <div className="text-muted-foreground">
                          {landmark.zone_name || landmark.zoning}
                        </div>
                      ) : null}
                      {landmark.quartier_name || landmark.district ? (
                        <div className="text-muted-foreground">
                          {landmark.quartier_name || landmark.district}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {landmark.plot_number ? (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color: BRAND, borderColor: "#F4C9B4", backgroundColor: "#FFF1EA" }}
                      >
                        #{landmark.plot_number}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getOrganizationName(landmark)}</TableCell>
                  <TableCell>
                    {landmark.area} {landmark.area_unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(landmark)}
                      {landmark.is_investment_opportunity ? (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                          Investment
                        </Badge>
                      ) : null}
                      {landmark.is_good_deal ? (
                        <Badge variant="default" className="bg-amber-100 text-amber-800">
                          Good Deal
                        </Badge>
                      ) : null}
                      {landmark.is_gold ? (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          Gold
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={landmark.is_investment_opportunity ? "default" : "outline"}
                      className={landmark.is_investment_opportunity ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      onClick={() => onToggleInvestment(landmark)}
                    >
                      {landmark.is_investment_opportunity ? "Investment ON" : "Mark Investment"}
                    </Button>
                    <Button
                      size="sm"
                      variant={landmark.is_good_deal ? "default" : "outline"}
                      className={landmark.is_good_deal ? "bg-amber-600 hover:bg-amber-700" : ""}
                      onClick={() => onToggleGoodDeal(landmark)}
                    >
                      {landmark.is_good_deal ? "Good Deal ON" : "Mark Good Deal"}
                    </Button>
                    <Button
                      size="sm"
                      variant={landmark.is_gold ? "default" : "outline"}
                      className={landmark.is_gold ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      onClick={() => onToggleGold(landmark)}
                    >
                      {landmark.is_gold ? "Gold ON" : "Mark Gold"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(landmark)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(landmark)}
                    >
                      Delete
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLandmark(landmark)}
                        >
                          Review
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl max-h-screen overflow-hidden flex flex-col">
                        <SheetHeader className="flex-shrink-0">
                          <SheetTitle>Review land listing: {landmark.title}</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                          <LandmarkAgencyLink
                            landmark={landmark}
                            organizations={orgList}
                            onUpdated={fetchData}
                          />
                          <AdminLandmarkReviewPanel
                            landmark={landmark}
                            onImageClick={setSelectedImage}
                          />

                          <div>
                            <label className="text-sm font-medium">Verification Notes</label>
                            <textarea
                              placeholder="Add verification notes..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Fixed action buttons at bottom */}
                        <div className="flex-shrink-0 border-t pt-4 mt-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => onVerify(landmark, true)}
                              disabled={isVerifying || landmark.is_verified}
                              className="bg-green-600 hover:bg-green-700 flex-1"
                            >
                              {isVerifying ? "Verifying..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => onVerify(landmark, false)}
                              disabled={isVerifying}
                              variant="destructive"
                              className="flex-1"
                            >
                              {isVerifying ? "Verifying..." : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>
        </TabsContent>

        <TabsContent value="map">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-1">Map Editor Instructions</h3>
              <p className="text-sm text-blue-800">
                Drag any landmark marker to a new position on the map. You&apos;ll be asked to confirm before the change is saved.
              </p>
            </div>
            <LandmarkMapEditor landmarks={items} onUpdate={fetchData} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Full-screen image viewer */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
            >
              ✕
            </button>
            <Image
              src={selectedImage}
              alt="Full size view"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MDAgMjQwTDMwMCAzMDBINTAwTDQwMCAyNDBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0zMDAgMzAwVjQ1MEg1MDBWMzAwSDMwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
              }}
              unoptimized
            />
          </div>
        </div>
      )}

      {/* ── Full edit sheet ── */}
      <Sheet
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setEditForm(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl max-h-screen overflow-hidden flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Edit land listing</SheetTitle>
          </SheetHeader>
          {editForm && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-2">
              {(
                [
                  ["title", "Title", "text"],
                  ["price", "Price (MRU)", "number"],
                  ["area", "Area", "number"],
                  ["area_unit", "Area unit", "text"],
                  ["land_type", "Land type", "text"],
                  ["zoning", "Zoning", "text"],
                  ["elevation_m", "Elevation (m)", "number"],
                  ["video_url", "Video URL", "text"],
                ] as [keyof EditForm, string, string][]
              ).map(([key, label, type]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <input
                    type={type}
                    value={(editForm[key] as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, [key]: e.target.value } : f,
                      )
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div>
                <Label className="text-xs">Description</Label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, description: e.target.value } : f,
                    )
                  }
                  className="mt-1 w-full min-h-[90px] rounded-md border px-3 py-2 text-sm"
                />
              </div>

              {/* ── Location (cascading pickers) ── */}
              <div className="rounded-lg border p-3 space-y-3">
                <Label className="text-xs font-semibold">Location</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* City */}
                  <div>
                    <Label className="text-[11px] text-muted-foreground">City</Label>
                    <select
                      value={editForm.city_id ?? ""}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        // Changing city clears the dependent zone/quartier + plot link.
                        setEditForm((f) =>
                          f
                            ? { ...f, city_id: v, zone_id: null, quartier_id: null, habitat_plot_id: null }
                            : f,
                        );
                        setPlotLink(null);
                      }}
                      className="mt-1 w-full rounded-md border px-2 py-2 text-sm bg-background"
                    >
                      <option value="">— Select —</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.name_ar ? ` · ${c.name_ar}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Zone */}
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Zone</Label>
                    <select
                      value={editForm.zone_id ?? ""}
                      disabled={!editForm.city_id}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        setEditForm((f) =>
                          f
                            ? { ...f, zone_id: v, quartier_id: null, habitat_plot_id: null }
                            : f,
                        );
                        setPlotLink(null);
                      }}
                      className="mt-1 w-full rounded-md border px-2 py-2 text-sm bg-background disabled:opacity-50"
                    >
                      <option value="">— Select —</option>
                      {zones
                        .filter((z) => z.city_id === editForm.city_id)
                        .map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                            {z.name_ar ? ` · ${z.name_ar}` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                  {/* Quartier */}
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Quartier</Label>
                    <select
                      value={editForm.quartier_id ?? ""}
                      disabled={!editForm.zone_id}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        // New quartier invalidates any existing cadastre match.
                        setEditForm((f) =>
                          f ? { ...f, quartier_id: v, habitat_plot_id: null } : f,
                        );
                        setPlotLink(null);
                      }}
                      className="mt-1 w-full rounded-md border px-2 py-2 text-sm bg-background disabled:opacity-50"
                    >
                      <option value="">— Select —</option>
                      {quartiers
                        .filter((q) => q.zone_id === editForm.zone_id)
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.name}
                            {q.name_ar ? ` · ${q.name_ar}` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                {/* Free-text descriptive labels (district / region) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      ["district", "District (label)"],
                      ["region", "Region (label)"],
                    ] as [keyof EditForm, string][]
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-[11px] text-muted-foreground">{label}</Label>
                      <input
                        type="text"
                        value={(editForm[key] as string) ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, [key]: e.target.value } : f))
                        }
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Cadastre link ── */}
              <div className="rounded-lg border p-3 space-y-2">
                <Label className="text-xs font-semibold">Cadastre plot</Label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-[11px] text-muted-foreground">Plot number</Label>
                    <input
                      type="text"
                      value={editForm.plot_number}
                      onChange={(e) => {
                        const v = e.target.value;
                        // Editing the number breaks the confirmed link until re-verified.
                        setEditForm((f) =>
                          f ? { ...f, plot_number: v, habitat_plot_id: null } : f,
                        );
                        setPlotLink(null);
                      }}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={linkingPlot || !editForm.quartier_id || !editForm.plot_number.trim()}
                    onClick={linkPlot}
                  >
                    {linkingPlot ? "Linking…" : "Link to cadastre"}
                  </Button>
                </div>
                {!editForm.quartier_id && (
                  <p className="text-[11px] text-muted-foreground">
                    Pick a quartier above to enable cadastre linking.
                  </p>
                )}
                {plotLink?.status === "linked" && (
                  <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">
                    ✅ Linked to cadastre plot #{plotLink.plot.plot_number}
                    {plotLink.plot.area_m2 ? ` · ${plotLink.plot.area_m2} m²` : ""}
                    {plotLink.plot.sector_name ? ` · ${plotLink.plot.sector_name}` : ""}
                    {plotLink.plot.plan_code ? ` · ${plotLink.plot.plan_code}` : ""}
                  </div>
                )}
                {plotLink?.status === "error" && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                    ⚠️ {plotLink.message}
                  </div>
                )}
                {!plotLink && editForm.habitat_plot_id && (
                  <p className="text-[11px] text-muted-foreground">
                    Currently linked (plot #{editForm.habitat_plot_id}).
                  </p>
                )}
              </div>

              {/* Images CRUD */}
              <div>
                <Label className="text-xs">Images ({editForm.images.length})</Label>
                <div className="mt-1 space-y-2">
                  {editForm.images.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Image
                        src={url}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 rounded object-cover border"
                      />
                      <span className="flex-1 truncate text-xs text-muted-foreground">
                        {url}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() =>
                          setEditForm((f) =>
                            f
                              ? { ...f, images: f.images.filter((_, j) => j !== i) }
                              : f,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center gap-2 cursor-pointer rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground hover:bg-accent/40 transition">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = ""; // allow re-selecting the same file
                        for (const file of files) {
                          await uploadEditImage(file);
                        }
                      }}
                    />
                    {uploadingImage ? "Uploading…" : "＋ Upload image(s)"}
                  </label>
                </div>
              </div>
            </div>
          )}
          <div className="flex-shrink-0 border-t pt-4 mt-4 flex gap-2">
            <Button onClick={saveEdit} disabled={savingEdit} className="flex-1">
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditing(null);
                setEditForm(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
