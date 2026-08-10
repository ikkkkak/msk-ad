"use client";

import { useEffect, useState } from "react";
import {
  listAdminAIEscalations,
  resolveAdminAIEscalation,
  AdminAIEscalation,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminAIEscalationsPage() {
  const [items, setItems] = useState<AdminAIEscalation[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminAIEscalations();
      setItems(res.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function markResolved(id: number) {
    await resolveAdminAIEscalation(id, "Resolved from admin dashboard");
    await fetchData();
  }

  const filtered = items.filter((row) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    const contact = [
      row.guest_name,
      row.guest_email,
      row.guest_phone,
      row.user?.email,
      row.user?.firstName,
      row.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      String(row.id).includes(s) ||
      (row.reason || "").toLowerCase().includes(s) ||
      (row.session_id || "").toLowerCase().includes(s) ||
      contact.includes(s)
    );
  });

  function contactCell(row: AdminAIEscalation) {
    const name =
      row.guest_name?.trim() ||
      [row.user?.firstName, row.user?.lastName].filter(Boolean).join(" ") ||
      "Guest";
    const email = row.guest_email?.trim() || row.user?.email || "—";
    const phone = row.guest_phone?.trim() || row.user?.phoneNumber || "—";
    return (
      <div className="text-sm leading-relaxed">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground">{email}</div>
        <div className="text-muted-foreground">{phone}</div>
        {row.user_id ? (
          <div className="text-xs text-muted-foreground">User #{row.user_id}</div>
        ) : (
          <div className="text-xs text-amber-700">Not signed in</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Specialist requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Talk-to-specialist handoffs from Meskeny Model X46 chat
          </p>
        </div>
        <Input
          placeholder="Search contact, reason, session…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-80 max-w-full"
        />
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
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
                <TableCell colSpan={8}>No specialist requests yet</TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>{contactCell(row)}</TableCell>
                  <TableCell className="uppercase text-xs font-semibold">
                    {row.urgency}
                  </TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell
                    className="max-w-[240px] truncate"
                    title={row.reason}
                  >
                    {row.reason || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[140px] truncate">
                    {row.session_id}
                  </TableCell>
                  <TableCell>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.status !== "resolved" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markResolved(row.id)}
                      >
                        Resolve
                      </Button>
                    ) : null}
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
