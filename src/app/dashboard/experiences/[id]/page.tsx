"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AdminExperience, getAdminExperience, updateExperienceStatus } from "@/lib/api";

export default function ExperienceReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exp, setExp] = useState<AdminExperience | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await getAdminExperience(id);
      setExp(res.data);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => { if (!Number.isNaN(id)) load(); /* eslint-disable-next-line */ }, [id]);

  const images: string[] = (() => {
    const fromImages = Array.isArray(exp?.images) ? exp!.images.map((im: any) => typeof im === 'string' ? im : im?.url || im?.src).filter(Boolean) : [];
    const fromPhotos = Array.isArray(exp?.photos) ? (exp!.photos as any[]).map((im: any) => typeof im === 'string' ? im : im?.url || im?.src).filter(Boolean) : [];
    const combined = [...fromImages, ...fromPhotos];
    return Array.from(new Set(combined));
  })();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Experience Review</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : !exp ? (
        <div className="text-sm">Not found</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-20 overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={exp.thumbnailURL || exp.coverImage || images[0] || '/property-placeholder.jpg'} alt={exp.title} className="h-14 w-20 object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="text-lg font-semibold">{exp.title}</div>
              <div className="text-sm text-muted-foreground">{[exp.city, exp.country].filter(Boolean).join(', ')}</div>
            </div>
            <div className="ml-auto text-xs">Status: <b>{exp.status || 'pending'}</b></div>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {images.map((src, idx) => (
                <div key={idx} className="overflow-hidden rounded-md border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`image-${idx}`} className="h-40 w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}

          {exp.videoURL && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Video demo</div>
              <video src={exp.videoURL} controls className="w-full rounded-md border" />
            </div>
          )}

          {exp.description && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{exp.description}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="rounded-md border p-3 text-sm">{exp.pricePerPerson != null ? `${exp.pricePerPerson} ${exp.currency || ''}` : '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="rounded-md border p-3 text-sm">{exp.duration != null ? `${exp.duration} min` : '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Capacity</div>
              <div className="rounded-md border p-3 text-sm">{exp.groupSize ?? exp.capacity ?? '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Language</div>
              <div className="rounded-md border p-3 text-sm">{exp.language || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Focus</div>
              <div className="rounded-md border p-3 text-sm">{exp.focus || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="rounded-md border p-3 text-sm">{exp.rating != null ? `${exp.rating} / 5` : '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Start Time</div>
              <div className="rounded-md border p-3 text-sm">{exp.startTime || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">End Time</div>
              <div className="rounded-md border p-3 text-sm">{exp.endTime || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Arrival Time (min)</div>
              <div className="rounded-md border p-3 text-sm">{exp.arrivalTime ?? '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Min Age</div>
              <div className="rounded-md border p-3 text-sm">{exp.minAge ?? '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Max Age</div>
              <div className="rounded-md border p-3 text-sm">{exp.maxAge ?? '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Difficulty</div>
              <div className="rounded-md border p-3 text-sm capitalize">{exp.difficultyLevel || '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Activity Level</div>
              <div className="rounded-md border p-3 text-sm capitalize">{exp.activityLevel || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Bring Required</div>
              <div className="rounded-md border p-3 text-sm">{exp.bringRequired != null ? (exp.bringRequired ? 'Yes' : 'No') : '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Hosted Before</div>
              <div className="rounded-md border p-3 text-sm">{exp.hasHostedBefore != null ? (exp.hasHostedBefore ? 'Yes' : 'No') : '-'}</div>
            </div>
          </div>

          {exp.whatWeDo && (
            <div className="space-y-2">
              <div className="text-sm font-medium">What we do</div>
              <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{exp.whatWeDo}</div>
            </div>
          )}

          {exp.whatToBring && (
            <div className="space-y-2">
              <div className="text-sm font-medium">What to bring</div>
              <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{exp.whatToBring}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Policy</div>
              <div className="rounded-md border p-3 text-sm">{exp.cancellationPolicy || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Flagged</div>
              <div className="rounded-md border p-3 text-sm">{exp.isFlagged ? `Yes — ${exp.flagReason || ''}` : 'No'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Identity Verified</div>
              <div className="rounded-md border p-3 text-sm">{exp.identityVerified != null ? (exp.identityVerified ? 'Yes' : 'No') : '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Review Status</div>
              <div className="rounded-md border p-3 text-sm">{exp.reviewStatus || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Review Notes</div>
              <div className="rounded-md border p-3 text-sm">{exp.reviewNotes || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Approved At</div>
              <div className="rounded-md border p-3 text-sm">{exp.approvedAt ? new Date(exp.approvedAt as any).toLocaleString() : '-'}</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={async () => { await updateExperienceStatus(id, { status: 'rejected', note: 'Rejected by admin' }); await load(); }}>Reject</Button>
            <Button onClick={async () => { await updateExperienceStatus(id, { status: 'approved', note: 'Approved by admin' }); await load(); }}>Approve</Button>
          </div>
        </div>
      )}
    </div>
  );
}


