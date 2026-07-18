"use client";

import { useEffect, useState } from "react";
import { listAdminReservations, AdminReservation, cancelReservation, updateReservationStatus } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AdminReservationsPage() {
  const [items, setItems] = useState<AdminReservation[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(p = page) {
    setLoading(true); setError(null);
    try {
      const res = await listAdminReservations({ page: p, per_page: perPage, status });
      setItems(res.data); setTotal(res.meta.total); setPage(res.meta.page); setPerPage(res.meta.per_page);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, [status, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function onCancel(id: number) { await cancelReservation(id, "Admin cancel"); fetchData(page); }
  async function onSet(id: number, newStatus: string) { await updateReservationStatus(id, newStatus); fetchData(page); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Reservations</h1>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => setStatus(v === "all" ? undefined : v)} value={status || "all"}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="confirmed">confirmed</SelectItem>
              <SelectItem value="rejected">rejected</SelectItem>
              <SelectItem value="cancelled">cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => fetchData(1)} disabled={loading}>Filter</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reservation</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={5} className="text-red-600">{error}</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5}>No reservations found</TableCell></TableRow>
            ) : (
              items.map((r) => {
                const propertyTitle = r.property?.title || `#${r.propertyID}`;
                const firstImage = Array.isArray(r.property?.images)
                  ? (typeof r.property?.images[0] === 'string' ? r.property?.images[0] as string : (r.property?.images[0] as any)?.url || (r.property?.images[0] as any)?.src)
                  : undefined;
                const propertyThumb = r.property?.thumbnailURL || r.property?.coverImage || firstImage || "/property-placeholder.jpg";
                const guestName = [r.guest?.firstName, r.guest?.lastName].filter(Boolean).join(" ") || `#${r.guestID}`;
                const guestAvatar = r.guest?.avatarURL || "/avatar-placeholder.png";
                return (
                  <TableRow key={r.ID}>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">#{r.ID}</span>
                        <span className="text-xs text-muted-foreground">{r.checkIn} → {r.checkOut}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 overflow-hidden rounded-md bg-muted">
                          <Image src={propertyThumb} alt={propertyTitle} width={56} height={40} className="h-10 w-14 object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="leading-none">{propertyTitle}</span>
                          <span className="text-xs text-muted-foreground">#{r.propertyID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                          <Image src={guestAvatar} alt={guestName} width={32} height={32} className="h-8 w-8 object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="leading-none">{guestName}</span>
                          <span className="text-xs text-muted-foreground">#{r.guestID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">{r.status}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onSet(r.ID, "confirmed")}>Set Confirmed</Button>
                      <Button size="sm" variant="outline" onClick={() => onSet(r.ID, "rejected")}>Set Rejected</Button>
                      <Button size="sm" variant="destructive" onClick={() => onCancel(r.ID)}>Cancel</Button>
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


