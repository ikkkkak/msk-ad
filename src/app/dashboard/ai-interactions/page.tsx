"use client";

import { useEffect, useState } from "react";
import { AdminAIInteraction, listAdminAIInteractions } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function AdminAIInteractionsPage() {
  const [items, setItems] = useState<AdminAIInteraction[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminAIInteractions({ limit: 200 });
      setItems(res.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load AI interactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = items.filter((it) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      it.user_message.toLowerCase().includes(s) ||
      it.ai_response.toLowerCase().includes(s) ||
      (it.cities || "").toLowerCase().includes(s) ||
      (it.zones || "").toLowerCase().includes(s) ||
      (it.intent || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">MeskenyGPT Interactions</h1>
        <Input
          placeholder="Search by question, answer, city, zone, intent…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-96"
        />
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[60px]">Lang</TableHead>
              <TableHead className="min-w-[80px]">Intent</TableHead>
              <TableHead className="min-w-[140px]">City / Zone</TableHead>
              <TableHead className="min-w-[220px]">User Message</TableHead>
              <TableHead className="min-w-[260px]">AI Response</TableHead>
              <TableHead className="min-w-[80px]">Thumbs</TableHead>
              <TableHead className="min-w-[80px]">Latency</TableHead>
              <TableHead className="min-w-[160px]">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-red-600">
                  {error}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No interactions</TableCell>
              </TableRow>
            ) : (
              filtered.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.lang || "-"}</TableCell>
                  <TableCell>{it.intent || "-"}</TableCell>
                  <TableCell>
                    {(it.cities || "").split(",").filter(Boolean).join(", ") || "-"}
                    {it.zones ? ` / ${it.zones}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate" title={it.user_message}>
                    {it.user_message}
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate" title={it.ai_response}>
                    {it.ai_response}
                  </TableCell>
                  <TableCell>
                    👍 {it.thumbs_up} / 👎 {it.thumbs_down}
                  </TableCell>
                  <TableCell>{it.latency_ms ? `${it.latency_ms} ms` : "-"}</TableCell>
                  <TableCell>
                    {it.created_at ? new Date(it.created_at).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

