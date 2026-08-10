"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Music, Plus, Edit, Trash2, Upload } from "lucide-react";
import {
  listAdminMusicTracks,
  createMusicTrack,
  updateMusicTrack,
  deleteMusicTrack,
  uploadAdminMusicFile,
  musicTrackId,
  type MusicTrack,
} from "@/lib/api";
import { toast } from "sonner";

const MUSIC_CATEGORIES = [
  { value: "default", label: "Default (fallback)" },
  { value: "luxury", label: "Luxury" },
  { value: "land", label: "Land" },
  { value: "business", label: "Business" },
  { value: "urban", label: "Urban" },
] as const;

type TrackForm = {
  title: string;
  category: string;
  file_url: string;
  duration_sec: number;
  is_active: boolean;
  sort_order: number;
  notes: string;
};

const emptyForm = (): TrackForm => ({
  title: "",
  category: "default",
  file_url: "",
  duration_sec: 0,
  is_active: true,
  sort_order: 0,
  notes: "",
});

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const sec = Number.isFinite(audio.duration) ? audio.duration : 0;
      URL.revokeObjectURL(url);
      resolve(Math.round(sec * 10) / 10);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}

export default function MusicLibraryPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MusicTrack | null>(null);
  const [form, setForm] = useState<TrackForm>(emptyForm());
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminMusicTracks();
      setTracks(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tracks";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setAudioFile(null);
  };

  const openEdit = (track: MusicTrack) => {
    setEditingTrack(track);
    setForm({
      title: track.title,
      category: track.category || "default",
      file_url: track.file_url,
      duration_sec: track.duration_sec ?? 0,
      is_active: track.is_active,
      sort_order: track.sort_order ?? 0,
      notes: track.notes ?? "",
    });
    setAudioFile(null);
  };

  const handleFileChange = async (file: File | null) => {
    setAudioFile(file);
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|aac|wav)$/i.test(file.name)) {
      toast.error("Please choose an audio file (MP3, M4A, AAC, or WAV)");
      setAudioFile(null);
      return;
    }
    const duration = await readAudioDuration(file);
    if (duration > 0) {
      setForm((f) => ({ ...f, duration_sec: duration }));
    }
    if (!form.title.trim()) {
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setForm((f) => ({ ...f, title: base }));
    }
  };

  const ensureFileUrl = async (): Promise<string | null> => {
    if (form.file_url.trim()) return form.file_url.trim();
    if (!audioFile) {
      toast.error("Upload an audio file or paste a file URL");
      return null;
    }
    setUploading(true);
    try {
      const url = await uploadAdminMusicFile(audioFile);
      setForm((f) => ({ ...f, file_url: url }));
      toast.success("Audio uploaded");
      return url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const fileUrl = await ensureFileUrl();
      if (!fileUrl) {
        setSaving(false);
        return;
      }
      await createMusicTrack({
        title: form.title.trim(),
        category: form.category,
        file_url: fileUrl,
        duration_sec: form.duration_sec || undefined,
        is_active: form.is_active,
        sort_order: form.sort_order,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Track added");
      setIsCreateOpen(false);
      resetForm();
      await fetchTracks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create track");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTrack) return;
    const id = musicTrackId(editingTrack);
    if (!id) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      let fileUrl = form.file_url.trim();
      if (audioFile) {
        setUploading(true);
        try {
          fileUrl = await uploadAdminMusicFile(audioFile);
        } finally {
          setUploading(false);
        }
      }
      if (!fileUrl) {
        toast.error("Track needs a file URL");
        setSaving(false);
        return;
      }
      await updateMusicTrack(id, {
        title: form.title.trim(),
        category: form.category,
        file_url: fileUrl,
        duration_sec: form.duration_sec,
        is_active: form.is_active,
        sort_order: form.sort_order,
        notes: form.notes.trim(),
      });
      toast.success("Track updated");
      setEditingTrack(null);
      resetForm();
      await fetchTracks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update track");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = musicTrackId(deleteTarget);
    if (!id) return;
    try {
      await deleteMusicTrack(id);
      toast.success("Track deleted");
      setDeleteTarget(null);
      await fetchTracks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const toggleActive = async (track: MusicTrack) => {
    const id = musicTrackId(track);
    if (!id) return;
    try {
      await updateMusicTrack(id, { is_active: !track.is_active });
      await fetchTracks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const trackFormFields = (mode: "create" | "edit") => (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-title`}>Title</Label>
        <Input
          id={`${mode}-title`}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Meskeny Luxury Estate"
        />
      </div>
      <div className="grid gap-2">
        <Label>Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {MUSIC_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Slideshow picks music by property type (luxury, land, etc.), then falls back to default.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-audio`}>Audio file</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${mode}-audio`}
            type="file"
            accept="audio/*,.mp3,.m4a,.aac,.wav"
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
          />
          {audioFile && (
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {audioFile.name}
            </span>
          )}
        </div>
        {form.file_url && !audioFile && (
          <audio controls preload="none" className="w-full h-9 mt-1" src={form.file_url}>
            Your browser does not support audio.
          </audio>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-duration`}>Duration (sec)</Label>
          <Input
            id={`${mode}-duration`}
            type="number"
            min={0}
            step={0.1}
            value={form.duration_sec || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                duration_sec: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-sort`}>Sort order</Label>
          <Input
            id={`${mode}-sort`}
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sort_order: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${mode}-active`}
          checked={form.is_active}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, is_active: v === true }))
          }
        />
        <Label htmlFor={`${mode}-active`}>Active (used in slideshow generation)</Label>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-notes`}>Notes</Label>
        <Input
          id={`${mode}-notes`}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional internal note"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Music className="h-7 w-7" />
            Listing music library
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload royalty-free tracks for auto-generated property slideshow videos.
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add track
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add music track</DialogTitle>
              <DialogDescription>
                Upload an MP3 (or M4A/AAC). It will be stored on the CDN and used when generating listing videos.
              </DialogDescription>
            </DialogHeader>
            {trackFormFields("create")}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleCreate()} disabled={saving || uploading}>
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading…
                  </>
                ) : saving ? (
                  "Saving…"
                ) : (
                  "Create track"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracks</CardTitle>
          <CardDescription>
            {tracks.length} track{tracks.length === 1 ? "" : "s"} — inactive tracks are skipped by the slideshow worker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : tracks.length === 0 ? (
            <p className="text-muted-foreground">
              No tracks yet. Add one or run server seed for placeholder rows.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Title</th>
                    <th className="pb-2 pr-4 font-medium">Category</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Duration</th>
                    <th className="pb-2 pr-4 font-medium">Preview</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((track) => {
                    const id = musicTrackId(track);
                    const hasFile = Boolean(track.file_url?.trim());
                    return (
                      <tr key={id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{track.title}</div>
                          {track.notes && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {track.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 capitalize">{track.category}</td>
                        <td className="py-3 pr-4">
                          {track.is_active && hasFile ? (
                            <Badge variant="default">Active</Badge>
                          ) : !hasFile ? (
                            <Badge variant="outline">Missing file</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {track.duration_sec ? `${track.duration_sec}s` : "—"}
                        </td>
                        <td className="py-3 pr-4 min-w-[180px]">
                          {hasFile ? (
                            <audio
                              controls
                              preload="none"
                              className="h-8 w-full max-w-[200px]"
                              src={track.file_url}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void toggleActive(track)}
                            disabled={!hasFile}
                          >
                            {track.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(track)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(track)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingTrack}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTrack(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit track</DialogTitle>
            <DialogDescription>
              Update metadata or upload a new audio file to replace the CDN URL.
            </DialogDescription>
          </DialogHeader>
          {trackFormFields("edit")}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTrack(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleUpdate()} disabled={saving || uploading}>
              {uploading ? "Uploading…" : saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete track?</DialogTitle>
            <DialogDescription>
              Remove &quot;{deleteTarget?.title}&quot; from the library. Existing generated videos are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
