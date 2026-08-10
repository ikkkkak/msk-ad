"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  listAdminOrganizations,
  createAdminOrganization,
  updateAdminOrganization,
  uploadImage,
  type AdminOrganization,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/** Next/Image only supports remote http(s) URLs; block file://, blob:, relative paths, etc. */
function isRemoteHttpImageUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Matches server: 8 national digits or 222 + 8 digits (optional + and spaces). */
function isMauritanianPhone(raw: string): boolean {
  const s = raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/^\+/, "");
  if (/^\d{8}$/.test(s)) return true;
  if (/^222\d{8}$/.test(s)) return true;
  return false;
}

type OrgEditForm = {
  name: string;
  description: string;
  logo: string;
  banner_image: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  license_number: string;
  tax_id: string;
  business_type: string;
  owner_user_id: string;
  status: string;
  is_active: boolean;
};

function orgToEditForm(o: AdminOrganization): OrgEditForm {
  return {
    name: o.name ?? "",
    description: o.description ?? "",
    logo: o.logo ?? "",
    banner_image: o.banner_image ?? "",
    website: o.website ?? "",
    phone: o.phone ?? "",
    email: o.email ?? "",
    address: o.address ?? "",
    city: o.city ?? "",
    state: o.state ?? "",
    country: o.country ?? "",
    postal_code: o.postal_code ?? "",
    license_number: o.license_number ?? "",
    tax_id: o.tax_id ?? "",
    business_type: o.business_type ?? "",
    owner_user_id: o.owner_id != null ? String(o.owner_id) : "",
    status: o.status ?? "approved",
    is_active: o.is_active !== false,
  };
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo: "",
    banner_image: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    license_number: "",
    tax_id: "",
    business_type: "",
    owner_user_id: "" as string,
  });

  const [editOrg, setEditOrg] = useState<AdminOrganization | null>(null);
  const [editForm, setEditForm] = useState<OrgEditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editUploadingLogo, setEditUploadingLogo] = useState(false);
  const [editUploadingBanner, setEditUploadingBanner] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await listAdminOrganizations();
      setOrgs(res.organizations || []);
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load organizations",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone is required (Mauritanian number)");
      return;
    }
    if (!isMauritanianPhone(form.phone)) {
      toast.error(
        "Invalid Mauritanian phone: use 8 digits (e.g. 45123456) or +22245123456",
      );
      return;
    }
    setCreating(true);
    try {
      const owner_user_id = form.owner_user_id.trim()
        ? parseInt(form.owner_user_id, 10)
        : undefined;
      if (form.owner_user_id.trim() && Number.isNaN(owner_user_id)) {
        toast.error("Owner user ID must be a number");
        setCreating(false);
        return;
      }
      await createAdminOrganization({
        name: form.name.trim(),
        phone: form.phone.trim(),
        description: form.description.trim() || undefined,
        logo: form.logo.trim() || undefined,
        banner_image: form.banner_image.trim() || undefined,
        website: form.website.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        license_number: form.license_number.trim() || undefined,
        tax_id: form.tax_id.trim() || undefined,
        business_type: form.business_type.trim() || undefined,
        ...(owner_user_id ? { owner_user_id } : {}),
      });
      toast.success("Organization created");
      setForm({
        name: "",
        description: "",
        logo: "",
        banner_image: "",
        website: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        license_number: "",
        tax_id: "",
        business_type: "",
        owner_user_id: "",
      });
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleLogoFile(files: FileList | null) {
    if (!files?.length) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(files[0]);
      setForm((f) => ({ ...f, logo: url }));
      toast.success("Logo uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBannerFile(files: FileList | null) {
    if (!files?.length) return;
    setUploadingBanner(true);
    try {
      const url = await uploadImage(files[0]);
      setForm((f) => ({ ...f, banner_image: url }));
      toast.success("Banner uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Banner upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  function openEdit(org: AdminOrganization) {
    setEditOrg(org);
    setEditForm(orgToEditForm(org));
  }

  function closeEdit() {
    setEditOrg(null);
    setEditForm(null);
  }

  async function onSaveEdit() {
    if (!editOrg || !editForm) return;
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editForm.phone.trim()) {
      toast.error("Phone is required (Mauritanian number)");
      return;
    }
    if (!isMauritanianPhone(editForm.phone)) {
      toast.error(
        "Invalid Mauritanian phone: use 8 digits (e.g. 45123456) or +22245123456",
      );
      return;
    }
    const owner_user_id = editForm.owner_user_id.trim()
      ? parseInt(editForm.owner_user_id, 10)
      : undefined;
    if (editForm.owner_user_id.trim() && Number.isNaN(owner_user_id)) {
      toast.error("Owner user ID must be a number");
      return;
    }
    setEditSaving(true);
    try {
      await updateAdminOrganization(editOrg.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        description: editForm.description.trim(),
        logo: editForm.logo.trim(),
        banner_image: editForm.banner_image.trim(),
        website: editForm.website.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        country: editForm.country.trim(),
        postal_code: editForm.postal_code.trim(),
        license_number: editForm.license_number.trim(),
        tax_id: editForm.tax_id.trim(),
        business_type: editForm.business_type.trim(),
        status: editForm.status,
        is_active: editForm.is_active,
        ...(owner_user_id ? { owner_user_id } : {}),
      });
      toast.success("Organization updated");
      closeEdit();
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleEditLogoFile(files: FileList | null) {
    if (!files?.length || !editForm) return;
    setEditUploadingLogo(true);
    try {
      const url = await uploadImage(files[0]);
      setEditForm((f) => (f ? { ...f, logo: url } : f));
      toast.success("Logo uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setEditUploadingLogo(false);
    }
  }

  async function handleEditBannerFile(files: FileList | null) {
    if (!files?.length || !editForm) return;
    setEditUploadingBanner(true);
    try {
      const url = await uploadImage(files[0]);
      setEditForm((f) => (f ? { ...f, banner_image: url } : f));
      toast.success("Banner uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Banner upload failed");
    } finally {
      setEditUploadingBanner(false);
    }
  }

  function thumb(url: string | undefined, alt: string, w: number, h: number) {
    if (!url?.trim()) {
      return <span className="text-muted-foreground text-xs">—</span>;
    }
    const src = url.trim();
    if (!isRemoteHttpImageUrl(src)) {
      return (
        <div
          className="flex shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted px-1 text-center"
          style={{ width: w, height: h }}
          title={src.length > 80 ? `${src.slice(0, 80)}…` : src}
        >
          <span className="text-[10px] leading-tight text-muted-foreground">
            Not a web URL
            <span className="block opacity-70">(e.g. app file path)</span>
          </span>
        </div>
      );
    }
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-md bg-muted"
        style={{ width: w, height: h }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${w}px`}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Create agencies with logo, banner, and Mauritanian contact phone. Link
          listings and landmarks from Property Sales and Landmarks.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="max-w-2xl space-y-4 border rounded-lg p-4"
      >
        <h2 className="font-medium">New organization</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Agency name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-phone">
              Phone (Mauritania) <span className="text-red-600">*</span>
            </Label>
            <Input
              id="org-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="45123456 or +22245123456"
              required
            />
            <p className="text-xs text-muted-foreground">
              8-digit national number or full +222 / 222 prefix.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-email">Email (optional)</Label>
          <Input
            id="org-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="contact@agency.example"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-desc">Description (optional)</Label>
          <Textarea
            id="org-desc"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Logo</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploadingLogo}
              onChange={(e) => void handleLogoFile(e.target.files)}
            />
            {form.logo ? (
              <div className="flex items-center gap-2 pt-1">
                {thumb(form.logo, "Logo preview", 64, 64)}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>Banner image</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploadingBanner}
              onChange={(e) => void handleBannerFile(e.target.files)}
            />
            {form.banner_image ? (
              <div className="flex flex-col gap-2 pt-1">
                {thumb(form.banner_image, "Banner preview", 200, 56)}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => setForm((f) => ({ ...f, banner_image: "" }))}
                >
                  Remove banner
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="org-website">Website (optional)</Label>
            <Input
              id="org-website"
              value={form.website}
              onChange={(e) =>
                setForm((f) => ({ ...f, website: e.target.value }))
              }
              placeholder="https://"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-business">Business type (optional)</Label>
            <Input
              id="org-business"
              value={form.business_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, business_type: e.target.value }))
              }
              placeholder="agency, brokerage…"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-address">Address (optional)</Label>
          <Input
            id="org-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="org-city">City</Label>
            <Input
              id="org-city"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-state">State / region</Label>
            <Input
              id="org-state"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-country">Country</Label>
            <Input
              id="org-country"
              value={form.country}
              onChange={(e) =>
                setForm((f) => ({ ...f, country: e.target.value }))
              }
              placeholder="Mauritania"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="org-postal">Postal code (optional)</Label>
            <Input
              id="org-postal"
              value={form.postal_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, postal_code: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="owner-id">Owner user ID (optional)</Label>
            <Input
              id="owner-id"
              type="number"
              min={1}
              value={form.owner_user_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, owner_user_id: e.target.value }))
              }
              placeholder="Defaults to your admin account if empty"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="org-license">License # (optional)</Label>
            <Input
              id="org-license"
              value={form.license_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, license_number: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-tax">Tax ID (optional)</Label>
            <Input
              id="org-tax"
              value={form.tax_id}
              onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))}
            />
          </div>
        </div>

        <Button type="submit" disabled={creating || uploadingLogo || uploadingBanner}>
          {creating ? "Creating…" : "Create organization"}
        </Button>
      </form>

      <div>
        <h2 className="font-medium mb-2">All organizations</h2>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Logo</TableHead>
                <TableHead className="min-w-[120px]">Banner</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9}>Loading…</TableCell>
                </TableRow>
              ) : orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>No organizations yet</TableCell>
                </TableRow>
              ) : (
                orgs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="align-middle">
                      {thumb(o.logo, o.name, 48, 48)}
                    </TableCell>
                    <TableCell className="align-middle">
                      {thumb(o.banner_image, `${o.name} banner`, 120, 40)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{o.name}</div>
                      {o.description ? (
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
                          {o.description}
                        </div>
                      ) : null}
                      {o.website ? (
                        <a
                          href={o.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline block truncate max-w-[200px]"
                        >
                          {o.website}
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {o.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm break-all max-w-[140px]">
                      {o.email?.trim() ? o.email : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                      {[o.city, o.state, o.country].filter(Boolean).join(", ") ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.status ?? "—"}</Badge>
                      {o.is_active === false ? (
                        <Badge variant="outline" className="ml-1">
                          inactive
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>ID {o.owner_id ?? "—"}</div>
                      {o.owner ? (
                        <div className="text-muted-foreground text-xs">
                          {(o.owner.firstName ?? "") +
                            " " +
                            (o.owner.lastName ?? "")}
                          {o.owner.email ? (
                            <span className="block truncate max-w-[140px]">
                              {o.owner.email}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(o)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editOrg} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit organization{editOrg ? ` — ${editOrg.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {editForm ? (
            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-name">Name</Label>
                  <Input
                    id="edit-org-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, name: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-phone">Phone (Mauritania)</Label>
                  <Input
                    id="edit-org-phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, phone: e.target.value } : f,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-org-email">Email</Label>
                <Input
                  id="edit-org-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, email: e.target.value } : f,
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-org-desc">Description</Label>
                <Textarea
                  id="edit-org-desc"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, description: e.target.value } : f,
                    )
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={editUploadingLogo}
                    onChange={(e) => void handleEditLogoFile(e.target.files)}
                  />
                  {editForm.logo ? (
                    <div className="flex items-center gap-2 pt-1">
                      {thumb(editForm.logo, "Logo", 64, 64)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditForm((f) => (f ? { ...f, logo: "" } : f))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label>Banner image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={editUploadingBanner}
                    onChange={(e) => void handleEditBannerFile(e.target.files)}
                  />
                  {editForm.banner_image ? (
                    <div className="flex flex-col gap-2 pt-1">
                      {thumb(editForm.banner_image, "Banner", 200, 56)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit"
                        onClick={() =>
                          setEditForm((f) =>
                            f ? { ...f, banner_image: "" } : f,
                          )
                        }
                      >
                        Remove banner
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-website">Website</Label>
                  <Input
                    id="edit-org-website"
                    value={editForm.website}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, website: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-business">Business type</Label>
                  <Input
                    id="edit-org-business"
                    value={editForm.business_type}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, business_type: e.target.value } : f,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-org-address">Address</Label>
                <Input
                  id="edit-org-address"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, address: e.target.value } : f,
                    )
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-city">City</Label>
                  <Input
                    id="edit-org-city"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, city: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-state">State / region</Label>
                  <Input
                    id="edit-org-state"
                    value={editForm.state}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, state: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-country">Country</Label>
                  <Input
                    id="edit-org-country"
                    value={editForm.country}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, country: e.target.value } : f,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-postal">Postal code</Label>
                  <Input
                    id="edit-org-postal"
                    value={editForm.postal_code}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, postal_code: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-owner-id">Owner user ID</Label>
                  <Input
                    id="edit-owner-id"
                    type="number"
                    min={1}
                    value={editForm.owner_user_id}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, owner_user_id: e.target.value } : f,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-license">License #</Label>
                  <Input
                    id="edit-org-license"
                    value={editForm.license_number}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, license_number: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-org-tax">Tax ID</Label>
                  <Input
                    id="edit-org-tax"
                    value={editForm.tax_id}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, tax_id: e.target.value } : f,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) =>
                      setEditForm((f) => (f ? { ...f, status: v } : f))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-4 mt-6">
                  <Checkbox
                    id="edit-org-active"
                    checked={editForm.is_active}
                    onCheckedChange={(c) =>
                      setEditForm((f) =>
                        f ? { ...f, is_active: c === true } : f,
                      )
                    }
                  />
                  <Label htmlFor="edit-org-active" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEdit}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void onSaveEdit()}
              disabled={
                editSaving || editUploadingLogo || editUploadingBanner
              }
            >
              {editSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
