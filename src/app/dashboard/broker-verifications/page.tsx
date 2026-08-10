"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminReviewBrokerVerification,
  listPendingBrokerVerifications,
  type PendingBrokerVerification,
} from "@/lib/api";

export default function BrokerVerificationsPage() {
  const [items, setItems] = useState<PendingBrokerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPendingBrokerVerifications();
      setItems(res.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(
    userId: number,
    status: "approved" | "rejected",
  ) {
    setBusyId(userId);
    try {
      await adminReviewBrokerVerification(userId, {
        status,
        notes: notes[userId]?.trim() || undefined,
      });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Broker identity verification
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve hosts to issue a public broker ID (MSK-B-XXXXXX) and verified badge.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{items.length} pending</Badge>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No pending broker applications.
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((u) => {
            const name =
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              `User #${u.id}`;
            return (
              <div
                key={u.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={u.avatarURL || "/avatar-placeholder.png"}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 object-cover"
                    />
                  </div>
                  <div className="min-w-[200px] flex-1 space-y-1">
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                      {u.phoneNumber ? ` · ${u.phoneNumber}` : ""}
                    </div>
                    {u.id_type ? (
                      <Badge variant="outline" className="mt-1">
                        {u.id_type === "passport"
                          ? "Passport"
                          : "National ID card"}
                      </Badge>
                    ) : null}
                    {u.spoken_languages?.length ? (
                      <div className="text-xs">
                        Languages: {u.spoken_languages.join(", ")}
                      </div>
                    ) : null}
                    {u.broker_submitted_at ? (
                      <div className="text-xs text-muted-foreground">
                        Submitted:{" "}
                        {new Date(u.broker_submitted_at).toLocaleString()}
                      </div>
                    ) : null}
                    <Link
                      href={`/dashboard/users/${u.id}/verification`}
                      className="text-xs text-primary underline"
                    >
                      Open user profile
                    </Link>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Doc label="Profile" src={u.avatarURL} />
                  {u.id_type === "passport" ? (
                    <Doc label="Passport" src={u.id_front_image} />
                  ) : (
                    <>
                      <Doc label="ID front" src={u.id_front_image} />
                      <Doc label="ID back" src={u.id_back_image} />
                    </>
                  )}
                </div>

                <textarea
                  className="mt-4 w-full rounded-md border bg-background p-2 text-sm"
                  rows={2}
                  placeholder="Rejection notes (optional)"
                  value={notes[u.id] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={busyId === u.id}
                    onClick={() => void review(u.id, "approved")}
                  >
                    Approve & assign ID
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busyId === u.id}
                    onClick={() => void review(u.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Doc({ label, src }: { label: string; src?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="overflow-hidden rounded-md border bg-muted/30">
        <Image
          src={src || "/id-placeholder.png"}
          alt={label}
          width={400}
          height={260}
          className="h-40 w-full object-cover"
        />
      </div>
    </div>
  );
}
