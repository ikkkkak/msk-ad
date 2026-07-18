"use client";

import { useEffect, useState } from "react";
import { listAdminExperiences, AdminExperience, updateExperienceStatus } from "@/lib/api";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminExperiencesPage() {
  const [items, setItems] = useState<AdminExperience[]>([]);
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
      const res = await listAdminExperiences({ page: p, per_page: perPage, status, search });
      const normalized = (res.data || []).map((e: any) => ({ ...e, ID: e?.ID ?? e?.id }));
      setItems(normalized);
      setTotal(res.meta.total); setPage(res.meta.page); setPerPage(res.meta.per_page);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, [status, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function onApprove(id: number) { await updateExperienceStatus(id, { status: "approved", note: "Approved" }); fetchData(page); }
  async function onReject(id: number) { await updateExperienceStatus(id, { status: "rejected", note: "Rejected" }); fetchData(page); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Experiences</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search title" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") fetchData(1); }} className="w-64" />
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
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={4} className="text-red-600">{error}</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No experiences found</TableCell></TableRow>
            ) : (
              items.map((p) => {
                const firstImage = Array.isArray(p.images) ? (typeof p.images[0] === 'string' ? p.images[0] as string : (p.images[0] as any)?.url || (p.images[0] as any)?.src) : undefined;
                const thumbnail = p.thumbnailURL || p.coverImage || firstImage || "/property-placeholder.jpg";
                return (
                  <TableRow key={p.ID}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded-md bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbnail} alt={p.title} className="h-12 w-16 object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{p.title}</span>
                          <span className="text-xs text-muted-foreground">#{p.ID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">{p.status || "pending"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Link href={`/dashboard/experiences/${p.ID}`} className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-sm">View</Link>
                      <Button size="sm" variant="outline" onClick={() => onApprove(p.ID)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => onReject(p.ID)}>Reject</Button>
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


