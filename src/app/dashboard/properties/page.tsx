"use client";

import { useEffect, useState } from "react";
import {
  listAdminProperties,
  AdminProperty,
  updatePropertyStatus,
  flagProperty,
  deleteAdminProperty,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function propertyHostNote(p: AdminProperty): string {
  return String(p.hostPrivateNote || p.host_private_note || "").trim();
}

function propertyReviewNote(p: AdminProperty): string {
  return String(p.reviewNotes || p.review_notes || p.note || "").trim();
}

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<AdminProperty[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(p = page) {
    setLoading(true); setError(null);
    try {
      const res = await listAdminProperties({ page: p, per_page: perPage, status, search });
      setItems(res.data); setTotal(res.meta.total); setPage(res.meta.page); setPerPage(res.meta.per_page);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, [status, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function onApprove(id: number) { await updatePropertyStatus(id, { status: "approved", note: "Approved from admin" }); fetchData(page); }
  async function onReject(id: number) { await updatePropertyStatus(id, { status: "rejected", note: "Rejected from admin" }); fetchData(page); }
  async function onFlag(id: number) { await flagProperty(id, { reason: "Policy violation" }); fetchData(page); }
  async function onDelete(id: number) {
    if (!window.confirm("Delete this rent property permanently?")) return;
    await deleteAdminProperty(id);
    fetchData(page);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Properties</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search title/city" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") fetchData(1); }} className="w-64" />
          <Select onValueChange={(v) => setStatus(v === "all" ? undefined : v)} value={status || "all"}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="approved">approved</SelectItem>
              <SelectItem value="rejected">rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => fetchData(1)} disabled={loading}>Filter</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Host notes</TableHead>
              <TableHead>Admin note</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={6} className="text-red-600">{error}</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No properties found</TableCell></TableRow>
            ) : (
              items.map((p) => {
                const firstImage = Array.isArray(p.images) ? (typeof p.images[0] === 'string' ? p.images[0] as string : (p.images[0] as any)?.url || (p.images[0] as any)?.src) : undefined;
                const thumbnail = p.thumbnailURL || p.coverImage || firstImage || "/property-placeholder.jpg";
                return (
                  <TableRow key={p.ID}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded-md bg-muted">
                          <Image src={thumbnail} alt={p.title} width={64} height={48} className="h-12 w-16 object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{p.title}</span>
                          <span className="text-xs text-muted-foreground">#{p.ID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{[p.city, p.state, p.country].filter(Boolean).join(", ")}</TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">{p.status || "pending"}</TableCell>
                    <TableCell className="max-w-xs">
                      <span
                        className="text-xs whitespace-pre-wrap line-clamp-3"
                        title={propertyHostNote(p) || undefined}
                      >
                        {propertyHostNote(p) || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[10rem]">
                      <span
                        className="text-xs text-muted-foreground line-clamp-2"
                        title={propertyReviewNote(p) || undefined}
                      >
                        {propertyReviewNote(p) || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="flex gap-2">
                    <Link href={`/dashboard/properties/${p.ID}`} className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-sm">Review</Link>
                    <Button size="sm" variant="outline" onClick={() => onApprove(p.ID)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => onReject(p.ID)}>Reject</Button>
                      <Button size="sm" variant="destructive" onClick={() => onFlag(p.ID)}>Flag</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(p.ID)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => fetchData(page - 1)}>Prev</Button>
          <div className="text-sm">Page {page} / {totalPages}</div>
          <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => fetchData(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}


