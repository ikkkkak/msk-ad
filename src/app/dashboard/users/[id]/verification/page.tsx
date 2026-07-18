"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { adminVerifyUser, getAdminUser, AdminUser } from "@/lib/api";

export default function VerificationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await getAdminUser(id);
      setUser(res.data.user);
      setHistory(res.data.verifications || []);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { if (!Number.isNaN(id)) load(); /* eslint-disable-next-line */ }, [id]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Verification Review</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : !user ? (
        <div className="text-sm">User not found</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
              <Image src={user.avatarURL || '/avatar-placeholder.png'} alt="avatar" width={48} height={48} className="h-12 w-12 object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ') || `User #${user.ID}`}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
            <div className="ml-auto text-xs">Current status: <b>{user.verificationStatus || 'pending'}</b></div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">ID Front</div>
              <div className="overflow-hidden rounded-md border bg-muted/30">
                <Image src={user.idFrontImage || '/id-placeholder.png'} alt="id front" width={800} height={500} className="h-56 w-full object-cover" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">ID Back</div>
              <div className="overflow-hidden rounded-md border bg-muted/30">
                <Image src={user.idBackImage || '/id-placeholder.png'} alt="id back" width={800} height={500} className="h-56 w-full object-cover" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Selfie</div>
              <div className="overflow-hidden rounded-md border bg-muted/30">
                <Image src={user.selfieImage || '/avatar-placeholder.png'} alt="selfie" width={800} height={500} className="h-56 w-full object-cover" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">ID Type</div>
              <div className="rounded-md border p-3 text-sm">{user.idType || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">ID Number</div>
              <div className="rounded-md border p-3 text-sm">{user.idNumber || '-'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Verification History</div>
            <div className="rounded-md border">
              <div className="divide-y">
                {history.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No history</div>
                ) : history.map((h) => (
                  <div key={h.ID} className="flex items-center justify-between p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{h.status}</span>
                      {h.notes ? <span className="text-muted-foreground">— {h.notes}</span> : null}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(h.CreatedAt || h.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="destructive" onClick={async () => { await adminVerifyUser(user.ID, { status: 'rejected', notes: 'Rejected by admin' }); await load(); }}>Reject</Button>
            <Button onClick={async () => { await adminVerifyUser(user.ID, { status: 'verified', notes: 'Verified by admin' }); await load(); }}>Verify</Button>
          </div>
        </div>
      )}
    </div>
  );
}


