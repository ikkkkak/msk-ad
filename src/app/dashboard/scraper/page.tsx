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
  scraperHeadlessCheck,
  listScrapedAPICalls,
  ScrapedAPICall,
  pasteScrapedJSON,
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
  const [apiPreview, setApiPreview] = useState<{ id: number; rows: ScrapedAPICall[] } | null>(null);
  const [headless, setHeadless] = useState<{ ok: boolean; detail: string } | null>(null);
  const [headlessChecking, setHeadlessChecking] = useState(false);
  const [pasteName, setPasteName] = useState("");
  const [pasteJson, setPasteJson] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteResult, setPasteResult] = useState<string | null>(null);

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

      {/* Headless-Chromium diagnostic (needed for JS-rendered sites) */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border p-3">
        <Button
          size="sm"
          variant="outline"
          disabled={headlessChecking}
          onClick={async () => {
            setHeadlessChecking(true);
            try {
              const r = await scraperHeadlessCheck();
              setHeadless({ ok: r.headless_available, detail: r.detail });
            } catch (e: any) {
              setHeadless({ ok: false, detail: e?.message || "check failed" });
            } finally {
              setHeadlessChecking(false);
            }
          }}
        >
          {headlessChecking ? "Checking…" : "Check headless browser"}
        </Button>
        {headless ? (
          <span className="text-sm">
            <span
              className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                headless.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {headless.ok ? "AVAILABLE" : "UNAVAILABLE"}
            </span>
            <span className="text-muted-foreground">{headless.detail}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Needed to scrape JavaScript-rendered sites (e.g. ijraati.gov.mr).
          </span>
        )}
      </div>

      {/* Paste external JSON → becomes AI knowledge */}
      <div className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-1 text-lg font-semibold">Paste external JSON</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Already crawled or scraped data somewhere else? Paste the raw JSON
          here. MeskenyGPT stores it as citable knowledge and uses it as context
          when answering users&apos; questions. Any shape works — an array of
          objects, a single object, or a wrapper with a{" "}
          <code className="rounded bg-muted px-1">data</code>/
          <code className="rounded bg-muted px-1">items</code>/
          <code className="rounded bg-muted px-1">results</code> array.
        </p>
        <input
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Name (e.g. Cadastre FAQ export)"
          value={pasteName}
          onChange={(e) => setPasteName(e.target.value)}
        />
        <textarea
          className="mb-3 h-48 w-full rounded-lg border px-3 py-2 font-mono text-xs"
          placeholder='[{"title":"How to transfer land ownership","description":"…","url":"https://…"}]'
          value={pasteJson}
          onChange={(e) => setPasteJson(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button
            disabled={pasteBusy || !pasteJson.trim()}
            onClick={async () => {
              setPasteBusy(true);
              setPasteResult(null);
              try {
                const r = await pasteScrapedJSON({
                  name: pasteName.trim() || "Pasted data",
                  kind: "market_info",
                  json: pasteJson,
                });
                setPasteResult(`Imported ${r.inserted} record(s) — the AI can now use them.`);
                setPasteJson("");
                setPasteName("");
                load();
              } catch (e: any) {
                setPasteResult(e?.message || "Import failed");
              } finally {
                setPasteBusy(false);
              }
            }}
          >
            {pasteBusy ? "Importing…" : "Import as AI knowledge"}
          </Button>
          {pasteResult ? (
            <span className="text-sm text-muted-foreground">{pasteResult}</span>
          ) : null}
        </div>
      </div>

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

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-blue-900">
          <b>Two modes:</b> Leave all selectors <b>empty</b> to <b>crawl the whole
          site</b> (reads the sitemap + follows every internal link, up to ~1,200
          pages, depth 8) and extract information (ministry, cadastre, land, housing
          procedures) — best for government/institutional sites like ijraati.gov.mr.
          Fill selectors below to extract <b>listing cards</b> from a property portal.
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={selectors._store_all === "true"}
            onChange={(e) =>
              setSelectors((s) => ({
                ...s,
                _store_all: e.target.checked ? "true" : "",
              }))
            }
          />
          <span>
            <b>Store every page</b> (not just real-estate-filtered) — use for a
            dedicated housing/land/cadastre site where all content matters.
          </span>
        </label>
        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          CSS selectors — map the page onto our fields (listing-card mode only)
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (apiPreview?.id === s.id) {
                        setApiPreview(null);
                        return;
                      }
                      try {
                        const rows = await listScrapedAPICalls(s.id, 50);
                        setApiPreview({ id: s.id, rows });
                      } catch {
                        setApiPreview({ id: s.id, rows: [] });
                      }
                    }}
                  >
                    {apiPreview?.id === s.id ? "Hide APIs" : "View APIs"}
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

              {/* Captured AJAX/API responses (the JSON behind JS sites) */}
              {apiPreview?.id === s.id ? (
                <div className="mt-4 rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {apiPreview.rows.length} captured API response(s)
                  </div>
                  {apiPreview.rows.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No API responses captured yet — run the source; JSON-driven
                      pages will populate this after the next crawl.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiPreview.rows.slice(0, 20).map((r) => (
                        <details key={r.id} className="text-xs">
                          <summary className="cursor-pointer truncate">
                            <span className="mr-2 rounded bg-slate-200 px-1 font-mono text-[10px]">
                              {r.method || r.resource_type} {r.status}
                            </span>
                            <span className="font-mono">{r.api_url}</span>
                          </summary>
                          <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-900 p-2 text-[11px] text-slate-100">
                            {r.body.slice(0, 4000)}
                          </pre>
                        </details>
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
