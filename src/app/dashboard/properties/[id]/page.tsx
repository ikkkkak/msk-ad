"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AdminProperty,
  AdminHostStats,
  AdminUser,
  getAdminProperty,
  getAdminUser,
  listAdminAmenities,
  updatePropertyStatus,
  flagProperty,
} from "@/lib/api";

/** Old server binaries ship images/amenities as raw JSON strings — normalize. */
function parseMaybeJsonArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ---------- small presentational atoms (Fashion-Nova-clean: uppercase
   micro-labels, thin dividers, generous whitespace, bold values) ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-black/5 py-2.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "violet";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-black/5 text-foreground",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    violet: "bg-violet-100 text-violet-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function statusTone(status?: string): "green" | "amber" | "red" | "neutral" {
  const s = (status || "pending").toLowerCase();
  if (["approved", "live", "published"].includes(s)) return "green";
  if (["rejected", "removed"].includes(s)) return "red";
  return "amber";
}

function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ------------------------------ page ------------------------------ */

export default function PropertyReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prop, setProp] = useState<AdminProperty | null>(null);
  const [hostStats, setHostStats] = useState<AdminHostStats | null>(null);
  const [host, setHost] = useState<AdminUser | null>(null);
  const [amenityNames, setAmenityNames] = useState<Map<number, string>>(new Map());
  const [heroIdx, setHeroIdx] = useState(0);
  const [acting, setActing] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminProperty(id);
      setProp(res.data);
      setHostStats(res.meta?.host_stats ?? null);

      // Live binary may return an empty host object (ID 0) — fall back to
      // fetching the full user record by hostID so the dossier is complete
      // no matter which server version answers.
      const embedded = res.data.host;
      if (embedded && embedded.ID > 0) {
        setHost(embedded);
      } else if (res.data.hostID) {
        try {
          const u = await getAdminUser(res.data.hostID);
          setHost(u.data?.user ?? null);
        } catch {
          setHost(null);
        }
      } else {
        setHost(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isNaN(id)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Amenity IDs → localized names (the property stores bare amenity ids).
  useEffect(() => {
    listAdminAmenities()
      .then((res) => {
        const map = new Map<number, string>();
        for (const a of res.data ?? []) {
          map.set(a.id, a.name?.en || a.name?.fr || a.name?.ar || String(a.id));
        }
        setAmenityNames(map);
      })
      .catch(() => {});
  }, []);

  const images: string[] = useMemo(() => {
    return parseMaybeJsonArray(prop?.images)
      .map((im: any) => (typeof im === "string" ? im : im?.url || im?.src))
      .filter(Boolean);
  }, [prop]);

  const hero =
    images[heroIdx] || prop?.coverImage || prop?.thumbnailURL || "/property-placeholder.jpg";

  const hostName =
    [host?.firstName, host?.lastName].filter(Boolean).join(" ") ||
    (host ? `User #${host.ID}` : "—");

  /** Amenity labels: ids resolved to names; anything unrecognized shows as-is. */
  const amenities: string[] = useMemo(() => {
    return parseMaybeJsonArray(prop?.amenities)
      .map((a: any) => {
        if (typeof a === "object" && a?.name) return String(a.name);
        const raw = String(a);
        const asId = Number(raw);
        if (Number.isFinite(asId) && amenityNames.has(asId)) {
          return amenityNames.get(asId)!;
        }
        return raw;
      })
      .filter(Boolean);
  }, [prop, amenityNames]);

  const act = async (fn: () => Promise<unknown>) => {
    setActing(true);
    try {
      await fn();
      await load();
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Sticky action header */}
      <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
        <div className="truncate text-sm font-semibold">{prop?.title || "Property"}</div>
        <Pill tone={statusTone(prop?.status)}>{prop?.status || "pending"}</Pill>
        {prop?.isFlagged ? <Pill tone="red">Flagged</Pill> : null}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={acting || loading}
            onClick={() => act(() => flagProperty(id, { reason: "Admin flagged" }))}
          >
            Flag
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={acting || loading}
            onClick={() =>
              act(() => updatePropertyStatus(id, { status: "rejected", note: "Rejected by admin" }))
            }
          >
            Reject
          </Button>
          <Button
            size="sm"
            disabled={acting || loading}
            onClick={() =>
              act(() => updatePropertyStatus(id, { status: "approved", note: "Approved by admin" }))
            }
          >
            Approve
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !prop ? (
        <div className="text-sm">Not found</div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr]">
          {/* ---------------- LEFT: gallery ---------------- */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt={prop.title} className="aspect-[4/3] w-full object-cover" />
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 12).map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroIdx(idx)}
                    className={`overflow-hidden rounded-lg border-2 transition ${
                      idx === heroIdx ? "border-foreground" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`thumb-${idx}`} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            {prop.description ? (
              <div className="pt-4">
                <SectionLabel>Description</SectionLabel>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
                  {prop.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* ---------------- RIGHT: ordered product column ---------------- */}
          <div className="space-y-8">
            {/* 1 — identity */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight">{prop.title}</h1>
              <div className="text-sm text-muted-foreground">
                {[prop.addressLine1, prop.addressLine2, prop.city, prop.state, prop.country]
                  .filter(Boolean)
                  .join(", ") || "No address"}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {prop.propertyType ? <Pill>{prop.propertyType}</Pill> : null}
                {prop.rating != null ? <Pill tone="violet">★ {prop.rating}/5</Pill> : null}
                {prop.isActive != null ? (
                  <Pill tone={prop.isActive ? "green" : "neutral"}>
                    {prop.isActive ? "Active" : "Inactive"}
                  </Pill>
                ) : null}
              </div>
            </div>

            {/* 2 — price block */}
            <div className="rounded-2xl bg-black/[0.03] p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">
                  {prop.nightlyPrice != null ? prop.nightlyPrice : "—"}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {prop.currency || ""} / night
                </span>
              </div>
              <div className="mt-2 flex gap-6 text-xs text-muted-foreground">
                <span>Cleaning: {prop.cleaningFee ?? 0}</span>
                <span>Service: {prop.serviceFee ?? 0}</span>
                <span>Policy: {prop.cancellationPolicy || "—"}</span>
              </div>
            </div>

            {/* 3 — key specs */}
            <div>
              <SectionLabel>Details</SectionLabel>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                {[
                  ["Bedrooms", prop.bedrooms],
                  ["Beds", prop.beds],
                  ["Baths", prop.bathrooms],
                  ["Guests", prop.capacity],
                ].map(([label, v]) => (
                  <div key={String(label)} className="rounded-xl border border-black/5 py-3">
                    <div className="text-lg font-bold">{v ?? "—"}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Row
                  label="Coordinates"
                  value={prop.lat != null && prop.lng != null ? `${prop.lat}, ${prop.lng}` : "—"}
                />
                <Row label="Created" value={formatDate(prop.createdAt)} />
                <Row
                  label="Flagged"
                  value={prop.isFlagged ? `Yes — ${prop.flagReason || ""}` : "No"}
                />
              </div>
            </div>

            {/* 4 — amenities */}
            {amenities.length > 0 ? (
              <div>
                <SectionLabel>Amenities</SectionLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {amenities.map((a: any, i: number) => (
                    <span
                      key={i}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium"
                    >
                      {typeof a === "string" ? a : a?.name || "—"}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 5 — full host dossier */}
            <div className="rounded-2xl border border-black/10 p-5">
              <SectionLabel>Host</SectionLabel>
              {host ? (
                <div className="mt-3 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={host.avatarURL || "/avatar-placeholder.png"}
                        alt="host"
                        className="h-14 w-14 object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-semibold">{hostName}</span>
                        {host.role ? <Pill tone="violet">{host.role}</Pill> : null}
                        {host.isVerified || host.verificationStatus === "approved" ? (
                          <Pill tone="green">Verified</Pill>
                        ) : host.verificationStatus ? (
                          <Pill tone="amber">{host.verificationStatus}</Pill>
                        ) : null}
                        {host.trueBroker || host.true_broker ? (
                          <Pill tone="green">TrueBroker</Pill>
                        ) : host.broker_status && host.broker_status !== "none" ? (
                          <Pill tone="amber">Broker: {host.broker_status}</Pill>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{host.ID}
                        {host.broker_id ? ` · Broker ID ${host.broker_id}` : ""}
                      </div>
                    </div>
                  </div>

                  {host.bio ? (
                    <p className="text-sm leading-6 text-foreground/85">{host.bio}</p>
                  ) : null}

                  <div>
                    <Row label="Email" value={host.email || "—"} />
                    <Row label="Phone" value={host.phoneNumber || "—"} />
                    <Row
                      label="Languages"
                      value={
                        Array.isArray(host.languages) && host.languages.length
                          ? host.languages.join(", ")
                          : "—"
                      }
                    />
                    <Row
                      label="Member since"
                      value={formatDate(hostStats?.member_since || host.CreatedAt || host.createdAt)}
                    />
                    <Row
                      label="ID document"
                      value={
                        host.idType
                          ? `${host.idType}${host.idNumber ? ` · ${host.idNumber}` : ""}`
                          : "—"
                      }
                    />
                    {host.socialLogin ? (
                      <Row label="Sign-in" value={host.socialProvider || "social"} />
                    ) : null}
                  </div>

                  {/* portfolio stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Listings", hostStats?.total_properties],
                      ["Approved", hostStats?.approved_properties],
                      ["Bookings", hostStats?.total_reservations],
                    ].map(([label, v]) => (
                      <div key={String(label)} className="rounded-xl bg-black/[0.03] py-3">
                        <div className="text-lg font-bold">{v ?? "—"}</div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(host.idFrontImage || host.idBackImage || host.selfieImage) && (
                    <div>
                      <SectionLabel>Identity documents</SectionLabel>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {[
                          ["Front", host.idFrontImage],
                          ["Back", host.idBackImage],
                          ["Selfie", host.selfieImage],
                        ]
                          .filter(([, src]) => Boolean(src))
                          .map(([label, src]) => (
                            <a
                              key={String(label)}
                              href={String(src)}
                              target="_blank"
                              rel="noreferrer"
                              className="group overflow-hidden rounded-lg border border-black/10"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={String(src)}
                                alt={String(label)}
                                className="aspect-[4/3] w-full object-cover transition group-hover:scale-105"
                              />
                              <div className="py-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                                {label}
                              </div>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/users/${host.ID}`)}
                  >
                    View full host profile →
                  </Button>
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">No host on record</div>
              )}
            </div>

            {/* 6 — notes */}
            {(prop.hostPrivateNote || prop.host_private_note) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <SectionLabel>Host private note</SectionLabel>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {prop.hostPrivateNote || prop.host_private_note}
                </p>
              </div>
            )}
            {(prop.reviewNotes || prop.review_notes || prop.note) && (
              <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                <SectionLabel>Admin review note</SectionLabel>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {prop.reviewNotes || prop.review_notes || prop.note}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
