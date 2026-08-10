"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MeskenyKnowledgeEntry,
  createMeskenyKnowledgeEntry,
  deleteMeskenyKnowledgeEntry,
  listMeskenyKnowledge,
  updateMeskenyKnowledgeEntry,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MobileAIInsightsCard } from "@/components/mobile-ai-insights";
import { toast } from "sonner";

const DOC_TYPES = [
  { value: "faq", label: "FAQ — short Q&A the model can quote" },
  { value: "policy", label: "Policy — fees, verification, listing rules" },
  { value: "pricing", label: "Pricing — MRU/MRO, typical bands (no fake listings)" },
  { value: "zones", label: "Zones — cities, secteurs, naming conventions" },
  { value: "product", label: "Product — how Meskeny search & filters work" },
  { value: "legal_other", label: "Legal / other — disclaimers, boundaries" },
] as const;

const LOCALES = [
  { value: "any", label: "Any language" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "en", label: "English" },
] as const;

const INTENT_OPTIONS = [
  { value: "all", label: "All intents (broad — use sparingly)" },
  { value: "search_buy", label: "Property search — buy" },
  { value: "search_rent", label: "Property search — rent" },
  { value: "search_land", label: "Land / terrain" },
  {
    value: "search_any",
    label: "General search + FAQ (matches unknown / help / greeting + all search_* intents)",
  },
  { value: "greeting", label: "Greeting" },
  { value: "help", label: "Help" },
  { value: "unknown", label: "Unknown / fallback" },
] as const;

const MAX_BODY = 2000;
const MAX_TITLE = 160;

const SEARCH_RULE_TEMPLATE = `# Structured search rules (deterministic, no tokens)
# ZONE_OR:<trigger>=<pipe-separated patterns>
# Example (Iskan includes Alnesim):
ZONE_OR:اسكان=اسكان|الإسكان|Iskan|النسيم|Alnesim
ZONE_OR:iskan=اسكان|الإسكان|Iskan|النسيم|Alnesim
`;

export default function MeskenyTrainingPage() {
  const [rows, setRows] = useState<MeskenyKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [docType, setDocType] = useState<string>("faq");
  const [locale, setLocale] = useState<string>("any");
  const [intentMode, setIntentMode] = useState<string>("all");
  const [matchKeywords, setMatchKeywords] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<string>("0");
  const [active, setActive] = useState(true);

  const bodyLen = useMemo(() => [...body].length, [body]);
  const titleLen = useMemo(() => [...title].length, [title]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMeskenyKnowledge();
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setDocType("faq");
    setLocale("any");
    setIntentMode("all");
    setMatchKeywords("");
    setTitle("");
    setBody("");
    setPriority("0");
    setActive(true);
  }

  function fillForm(e: MeskenyKnowledgeEntry) {
    setEditingId(e.id);
    setDocType(e.doc_type);
    setLocale(e.locale);
    const intents = (e.intent_scope || "all").split(",").map((s) => s.trim());
    if (intents.length === 1 && intents[0] === "all") {
      setIntentMode("all");
    } else if (intents.length === 1 && INTENT_OPTIONS.some((o) => o.value === intents[0])) {
      setIntentMode(intents[0]);
    } else {
      setIntentMode(intents[0] || "all");
    }
    setMatchKeywords(e.match_keywords || "");
    setTitle(e.title);
    setBody(e.body);
    setPriority(String(e.priority ?? 0));
    setActive(e.active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleLen > MAX_TITLE || bodyLen > MAX_BODY) {
      toast.error(`Title max ${MAX_TITLE} chars, body max ${MAX_BODY} chars`);
      return;
    }
    const intent_scope = intentMode === "all" ? "all" : intentMode;
    const pr = parseInt(priority, 10);
    const payload = {
      doc_type: docType,
      locale,
      intent_scope,
      match_keywords: matchKeywords.trim(),
      title: title.trim(),
      body: body.trim(),
      priority: Number.isFinite(pr) ? pr : 0,
      active,
    };
    try {
      if (editingId != null) {
        await updateMeskenyKnowledgeEntry(editingId, payload);
        toast.success("Entry updated");
      } else {
        await createMeskenyKnowledgeEntry(payload);
        toast.success("Entry created");
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Remove this knowledge entry? (soft delete)")) return;
    try {
      await deleteMeskenyKnowledgeEntry(id);
      toast.success("Deleted");
      if (editingId === id) resetForm();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <MobileAIInsightsCard />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meskeny training</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
          Structured knowledge for MeskenyGPT: each row is one scoped fact block. At
          runtime the server retrieves only entries that match{" "}
          <strong>language</strong>, <strong>intent</strong>, and optional{" "}
          <strong>keywords</strong> in the user message — then injects a capped snippet
          into the system prompt (RAG-style, token-efficient). Do not paste long chats
          here; write concise canonical answers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId != null ? "Edit entry" : "New entry"}</CardTitle>
          <CardDescription>
            Pick a document type and audience. Use <code>match keywords</code> only when
            you need extra narrowing (comma-separated substrings). Leave empty to match
            on intent + language only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Document type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language audience</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>When to apply (intent)</Label>
              <Select value={intentMode} onValueChange={setIntentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kw">Match keywords (optional)</Label>
              <Input
                id="kw"
                placeholder="e.g. secteur, ouguiya, تسجيل — comma separated"
                value={matchKeywords}
                onChange={(e) => setMatchKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If set, the user message must contain at least one keyword (case
                insensitive). Leave empty to rely on intent + language only.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="title">Title</Label>
                <span className="text-xs text-muted-foreground">
                  {titleLen}/{MAX_TITLE}
                </span>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE}
                placeholder="Short label shown in the admin table"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="body">Canonical content</Label>
                <span className="text-xs text-muted-foreground">
                  {bodyLen}/{MAX_BODY}
                </span>
              </div>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="Facts, tone, and boundaries. No hallucinated listings."
              />
              {(docType === "zones" || docType === "product") && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBody((prev) =>
                        prev?.trim()
                          ? `${prev.trim()}\n\n${SEARCH_RULE_TEMPLATE}`
                          : SEARCH_RULE_TEMPLATE,
                      );
                      toast.message("Inserted ZONE_OR template");
                    }}
                  >
                    Insert ZONE_OR template
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    These lines directly affect DB search (deterministic). Keep them short.
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pri">Priority (higher loads first)</Label>
                <Input
                  id="pri"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border"
                  />
                  Active (inactive rows are never retrieved)
                </label>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editingId != null ? "Save changes" : "Create entry"}</Button>
              {editingId != null && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published rows</CardTitle>
          <CardDescription>
            Retrieval budget per chat turn is capped server-side (~2.4k chars total).
          </CardDescription>
        </CardHeader>
        <CardContent className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[52px]">ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Pr</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>Loading…</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    No entries yet. Create one above.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.doc_type}</Badge>
                    </TableCell>
                    <TableCell>{r.locale}</TableCell>
                    <TableCell className="max-w-[140px] truncate" title={r.intent_scope}>
                      {r.intent_scope}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate" title={r.title}>
                      {r.title}
                    </TableCell>
                    <TableCell>{r.priority}</TableCell>
                    <TableCell>{r.active ? "yes" : "no"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" type="button" onClick={() => fillForm(r)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        type="button"
                        onClick={() => onDelete(r.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
