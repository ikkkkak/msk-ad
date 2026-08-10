"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  listAdminIdentityVerifications,
  type AdminIdentityVerificationUser,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function statusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  const s = (status || "").toLowerCase();
  if (s === "verified" || s === "approved") return "default";
  if (s === "rejected") return "destructive";
  if (s === "pending") return "secondary";
  return "outline";
}

function displayName(u: AdminIdentityVerificationUser) {
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return n || `User #${u.userId}`;
}

export default function IdentityVerificationsPage() {
  const [items, setItems] = useState<AdminIdentityVerificationUser[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAdminIdentityVerifications({
          page: p,
          per_page: perPage,
          q: q.trim() || undefined,
          user_id: userId.trim() || undefined,
          status: status === "all" ? undefined : status,
        });
        setItems(res.data || []);
        setTotal(res.meta?.total ?? 0);
        setPage(res.meta?.page ?? p);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, q, userId, status],
  );

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Identity verifications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Search former and current identity submissions — by name, email, user
            ID, document number, or broker ID. Open a card for full profile and
            ID previews.
          </p>
        </div>
        <Badge variant="secondary">{total} records</Badge>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-[200px] flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            placeholder="Name, email, phone, ID number, broker ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(1)}
          />
        </div>
        <div className="w-36 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            User ID
          </label>
          <Input
            placeholder="e.g. 42"
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && void load(1)}
          />
        </div>
        <div className="w-40 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => void load(1)}>Search</Button>
        <Button variant="outline" onClick={() => void load(page)}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No identity verification records match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((u) => (
            <Link
              key={u.userId}
              href={`/dashboard/identity-verifications/${u.userId}`}
              className="group rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={u.avatarURL || "/avatar-placeholder.png"}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate font-semibold group-hover:text-primary">
                      {displayName(u)}
                    </span>
                    <Badge variant={statusVariant(u.verificationStatus)}>
                      {u.verificationStatus || "unknown"}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      UID {u.userId}
                    </Badge>
                    {u.brokerId ? (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {u.brokerId}
                      </Badge>
                    ) : null}
                    {u.idNumber ? (
                      <Badge variant="outline" className="text-[10px]">
                        Doc ···{u.idNumber.slice(-4)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <IdThumb label="Front" src={u.idFrontImage} />
                <IdThumb label="Back" src={u.idBackImage} />
                <IdThumb label="Selfie" src={u.selfieImage} />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {u.historyCount ?? 0} history event
                {(u.historyCount ?? 0) === 1 ? "" : "s"}
                {u.updatedAt
                  ? ` · Updated ${new Date(u.updatedAt).toLocaleDateString()}`
                  : ""}
              </p>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => void load(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => void load(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function IdThumb({ label, src }: { label: string; src?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="aspect-[4/3] overflow-hidden rounded-md border bg-muted/40">
        <Image
          src={src || "/id-placeholder.png"}
          alt={label}
          width={120}
          height={90}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
