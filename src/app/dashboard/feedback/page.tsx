"use client";

import { useEffect, useState } from "react";
import { listAdminFeedback, AdminFeedback } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const res = await listAdminFeedback();
      setItems(res.data || []);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter(f => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (f.title || "").toLowerCase().includes(s) || (f.message || "").toLowerCase().includes(s) || (f.user?.email || "").toLowerCase().includes(s);
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Feedback</h1>
        <Input placeholder="Search by title/message/email" value={q} onChange={(e) => setQ(e.target.value)} className="w-80" />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={6} className="text-red-600">{error}</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No feedback</TableCell></TableRow>
            ) : (
              filtered.map((f) => (
                <TableRow key={f.ID}>
                  <TableCell>{f.user ? `${f.user.firstName || ''} ${f.user.lastName || ''}`.trim() || `#${f.userID}` : `#${f.userID}`}</TableCell>
                  <TableCell>{f.title || '-'}</TableCell>
                  <TableCell className="max-w-[480px] truncate" title={f.message}>{f.message}</TableCell>
                  <TableCell>{f.rating ?? '-'}</TableCell>
                  <TableCell>{f.context || '-'}</TableCell>
                  <TableCell>{f.createdAt ? new Date(f.createdAt).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


