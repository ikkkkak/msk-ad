"use client";

import { useEffect, useState } from "react";
import { listAdminReviews, AdminReview, updateReviewVisibility, deleteReview } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [rating, setRating] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(p = page) {
    setLoading(true); setError(null);
    try {
      const res = await listAdminReviews({ page: p, per_page: perPage, rating });
      setItems(res.data); setTotal(res.meta.total); setPage(res.meta.page); setPerPage(res.meta.per_page);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, [rating, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function onHide(id: number) { await updateReviewVisibility(id, false, "Hidden by admin"); fetchData(page); }
  async function onShow(id: number) { await updateReviewVisibility(id, true); fetchData(page); }
  async function onDelete(id: number) { await deleteReview(id); fetchData(page); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Reviews</h1>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => setRating(v === "all" ? undefined : v)} value={rating || "all"}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="1">1</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => fetchData(1)} disabled={loading}>Filter</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Stars</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={4} className="text-red-600">{error}</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No reviews found</TableCell></TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.ID}>
                  <TableCell>{r.ID}</TableCell>
                  <TableCell>{r.stars}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onShow(r.ID)}>Show</Button>
                    <Button size="sm" variant="outline" onClick={() => onHide(r.ID)}>Hide</Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(r.ID)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
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


