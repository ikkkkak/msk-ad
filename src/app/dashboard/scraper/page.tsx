"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ScrapedSource,
  ScrapedListing,
  listScrapedSources,
  createScrapedSource,
  updateScrapedSource,
  deleteScrapedSource,
  runScrapedSource,
  listScrapedListings,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

const KINDS = [
  { value: "property_sale", label: "Property — Sale" },
  { value: "property_rent", label: "Property — Rent" },
  { value: "land_sale", label: "Land — Sale" },
  { value: "market_info", label: "Market info" },
];

/** Fields the reusable scraper maps via CSS selectors. `item` is required. */
const SELECTOR_FIELDS: { key: string; hint: string }[] = [
  { key: "item", hint: "each listing card, e.g. .listing-card" },
  { key: "title", hint: ".title" },
  { key: "price", hint: ".price" },
  { key: "location", hint: ".location" },
  { key: "city", hint: ".city" },
  { key: "area", hint: ".area (m²)" },
  { key: "bedrooms", hint: ".beds" },
  { key: "bathrooms", hint: ".baths" },
  { key: "type", hint: ".property-type" },
  { key: "description", hint: ".description" },
  { key: "image", hint: "img@src" },
  { key: "link", hint: "a@href" },
];

export default function ScraperPage() {
  const [sources, setSources] = useState<ScrapedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ id: number; rows: ScrapedListing[] } | null>(null);

  // New-source form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("property_sale");
  const [selectors, setSelectors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listScrapedSources();
      setSources(res.data ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async () => {
    if (!name.trim() || !url.trim()) return;
    setCreating(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(selectors).filter(([, v]) => v.trim() !== ""),
      );
      await createScrapedSource({ name, url, kind, selectors: cleaned });
      setName("");
      setUrl("");
      setSelectors({});
      await load();
    } catch (e: any) {
      setError(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const onRun = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      // Scrape runs in the BACKGROUND on the server (returns immediately so
      // the proxy can't time out). Poll the source status + listings until
      // it finishes or ~30s elapses.
      await runScrapedSource(id);
      let done = false;
      for (let i = 0; i < 15 && !done; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const fresh = await listScrapedSources();
        setSources(fresh.data ?? []);
        const s = (fresh.data ?? []).find((x) => x.id === id);
        if (s && s.last_status && s.last_status !== "running…") done = true;
      }
      const listings = await listScrapedListings({ source_id: id, limit: 30 });
      setPreview({ id, rows: listings.data ?? [] });
      if (!done) {
        setError("Scrape is taking a while — showing latest results; refresh for more.");
      }
    } catch (e: any) {
      setError(e?.message || "Scrape failed");
    } finally {
      setBusyId(null);
    }
  };

  const onToggle = async (s: ScrapedSource) => {
    await updateScrapedSource(s.id, { active: !s.active });
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this source? Its scraped listings remain.")) return;
    await deleteScrapedSource(id);
    if (preview?.id === id) setPreview(null);
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">MeskenyGPT — Web Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register market pages to scrape. The AI reads the extracted listings
          and cites them as sources in its answers.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* New source */}
      <div className="mb-8 rounded-2xl border p-5">
        <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Add a source
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Name (e.g. Bayut Riyadh villas)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          CSS selectors — map the page onto our fields
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SELECTOR_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-[11px] font-medium text-muted-foreground">
                {f.key}
                {f.key === "item" ? " *" : ""}
              </label>
              <input
                className="mt-0.5 w-full rounded-md border px-2.5 py-1.5 text-xs"
                placeholder={f.hint}
                value={selectors[f.key] || ""}
                onChange={(e) =>
                  setSelectors((s) => ({ ...s, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tip: append <code className="rounded bg-muted px-1">@src</code> or{" "}
          <code className="rounded bg-muted px-1">@href</code> to read an
          attribute instead of text (e.g. <code>img@src</code>,{" "}
          <code>a@href</code>).
        </p>

        <div className="mt-4">
          <Button onClick={onCreate} disabled={creating || !name.trim() || !url.trim()}>
            {creating ? "Adding…" : "Add source"}
          </Button>
        </div>
      </div>

      {/* Sources list */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : sources.length === 0 ? (
        <div className="text-sm text-muted-foreground">No sources yet.</div>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.id} className="rounded-2xl border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{s.name}</span>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold uppercase">
                      {s.kind.replace("_", " ")}
                    </span>
                    {s.active ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        active
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        paused
                      </span>
                    )}
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-blue-600 hover:underline"
                  >
                    {s.url}
                  </a>
                  {s.last_status ? (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Last run: {s.last_status}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => onRun(s.id)} disabled={busyId === s.id}>
                    {busyId === s.id ? "Scraping…" : "Run now"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onToggle(s)}>
                    {s.active ? "Pause" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(s.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              {/* Preview of extracted rows */}
              {preview?.id === s.id ? (
                <div className="mt-4 rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Extracted {preview.rows.length} listing(s)
                  </div>
                  {preview.rows.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      Nothing extracted — check the `item` and field selectors.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {preview.rows.slice(0, 12).map((r) => (
                        <div key={r.id} className="flex items-baseline gap-2 text-xs">
                          <span className="font-semibold">{r.price_text || "—"}</span>
                          <span className="truncate">{r.title}</span>
                          <span className="text-muted-foreground">{r.location}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
