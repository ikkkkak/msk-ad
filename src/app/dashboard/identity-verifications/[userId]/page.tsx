"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminVerifyUser,
  getAdminIdentityVerificationUser,
  type AdminIdentityVerificationRecord,
  type AdminIdentityVerificationUser,
} from "@/lib/api";

function displayName(u: AdminIdentityVerificationUser) {
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return n || `User #${u.userId}`;
}

function CopyField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <button
        type="button"
        className="w-full rounded-md border bg-muted/30 px-3 py-2 text-left font-mono text-sm hover:bg-muted/50"
        onClick={() => void navigator.clipboard.writeText(value)}
        title="Click to copy"
      >
        {value}
      </button>
    </div>
  );
}

export default function IdentityVerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params?.userId);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminIdentityVerificationUser | null>(null);
  const [history, setHistory] = useState<AdminIdentityVerificationRecord[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(userId) || userId <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminIdentityVerificationUser(userId);
      setUser(res.data.user);
      setHistory(res.data.verifications || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(status: "verified" | "rejected") {
    if (!user) return;
    setBusy(true);
    try {
      await adminVerifyUser(user.userId, {
        status,
        notes: notes.trim() || `Marked ${status} from identity archive`,
      });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/identity-verifications"
            className="text-xs text-primary underline"
          >
            ← All identity verifications
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {user ? displayName(user) : "Identity review"}
          </h1>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !user ? (
        <p className="text-sm">Not found</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                <Image
                  src={user.avatarURL || "/avatar-placeholder.png"}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 object-cover"
                />
              </div>
              <div className="min-w-[220px] flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">{displayName(user)}</span>
                  <Badge>{user.verificationStatus || "unknown"}</Badge>
                  {user.isVerified ? (
                    <Badge variant="outline">Verified flag</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.phoneNumber ? (
                  <p className="text-sm text-muted-foreground">
                    {user.phoneNumber}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Role: {user.role || "user"}
                  {user.brokerStatus
                    ? ` · Broker: ${user.brokerStatus}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CopyField label="User ID" value={String(user.userId)} />
              <CopyField label="Broker ID" value={user.brokerId || ""} />
              <CopyField label="ID type" value={user.idType || ""} />
              <CopyField label="ID number" value={user.idNumber || ""} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Document previews</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <DocPanel label="ID front" src={user.idFrontImage} />
              <DocPanel label="ID back" src={user.idBackImage} />
              <DocPanel label="Selfie" src={user.selfieImage} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Verification history</h2>
            <div className="overflow-hidden rounded-xl border">
              {history.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No history rows — only current submission on file.
                </p>
              ) : (
                <div className="divide-y">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
                    >
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{h.id}
                        </span>
                        <span className="mx-2 font-medium capitalize">
                          {h.status}
                        </span>
                        <span className="text-muted-foreground">
                          {h.document_type}
                        </span>
                        {h.notes ? (
                          <p className="mt-1 text-muted-foreground">{h.notes}</p>
                        ) : null}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString()}
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Admin decision</h2>
            <textarea
              className="mt-3 w-full rounded-md border bg-background p-3 text-sm"
              rows={3}
              placeholder="Notes for audit trail (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void decide("verified")}>
                Mark verified
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => void decide("rejected")}
              >
                Mark rejected
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/users`}>Users list</Link>
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DocPanel({ label, src }: { label: string; src?: string }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <a
        href={src || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border bg-muted/30"
      >
        <Image
          src={src || "/id-placeholder.png"}
          alt={label}
          width={900}
          height={560}
          className="h-56 w-full object-contain bg-black/5 lg:h-72"
          unoptimized={!!src?.startsWith("http")}
        />
      </a>
    </div>
  );
}
