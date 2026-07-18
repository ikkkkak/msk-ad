"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAdminAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  seedAmenities,
  AdminAmenity,
} from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Sparkles, FileJson } from "lucide-react";

const CATEGORIES = [
  "essential",
  "safety",
  "kitchen",
  "bathroom",
  "bedroom",
  "outdoor",
  "entertainment",
  "mauritania_specific",
];

const ICONS = [
  "WifiHigh",
  "Snowflake",
  "Thermometer",
  "Car",
  "Warning",
  "FirstAid",
  "Camera",
  "Shield",
  "CookingPot",
  "Refrigerator",
  "Microwave",
  "Coffee",
  "Drop",
  "Bathtub",
  "Wind",
  "Bed",
  "Shirt",
  "Notebook",
  "Balcony",
  "Tree",
  "SwimmingPool",
  "Fire",
  "Television",
  "SpeakerHigh",
  "GameController",
  "Lightning",
  "ForkKnife",
  "Mountains",
  "Armchair",
];

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<AdminAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [seeding, setSeeding] = useState(false);
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);

  const [form, setForm] = useState({
    name_en: "",
    name_fr: "",
    name_ar: "",
    icon: "WifiHigh",
    category: "essential",
    description_en: "",
    description_fr: "",
    description_ar: "",
    sort_order: 0,
  });
  const [editing, setEditing] = useState<AdminAmenity | null>(null);

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listAdminAmenities(
        categoryFilter ? { category: categoryFilter } : undefined
      );
      setAmenities(res.data || []);
    } catch (error) {
      toast.error("Failed to load amenities");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name_en: "",
      name_fr: "",
      name_ar: "",
      icon: "WifiHigh",
      category: "essential",
      description_en: "",
      description_fr: "",
      description_ar: "",
      sort_order: 0,
    });
    setEditing(null);
  };

  const loadExampleJson = () => {
    const example = [
      {
        name_en: "WiFi",
        name_fr: "WiFi",
        name_ar: "واي فاي",
        icon: "WifiHigh",
        category: "essential",
        description_en: "High-speed internet connection",
        description_fr: "Connexion internet haut débit",
        description_ar: "اتصال إنترنت عالي السرعة",
        sort_order: 1,
      },
      {
        name_en: "Air Conditioning",
        name_fr: "Climatisation",
        name_ar: "تكييف هواء",
        icon: "Snowflake",
        category: "essential",
        description_en: "Air conditioning for hot weather",
        description_fr: "Climatisation pour temps chaud",
        description_ar: "تكييف هواء للطقس الحار",
        sort_order: 2,
      },
      {
        name_en: "Kitchen",
        name_fr: "Cuisine",
        name_ar: "مطبخ",
        icon: "CookingPot",
        category: "kitchen",
        description_en: "Fully equipped kitchen",
        description_fr: "Cuisine entièrement équipée",
        description_ar: "مطبخ مجهز بالكامل",
        sort_order: 3,
      },
    ];
    setJsonInput(JSON.stringify(example, null, 2));
  };

  const handleBulkImport = async () => {
    if (!jsonInput.trim()) {
      toast.error("Please provide JSON data");
      return;
    }

    let data: any[];
    try {
      const parsed = JSON.parse(jsonInput.trim());
      data = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e: any) {
      toast.error(`Invalid JSON: ${e?.message || "Parse error"}`);
      return;
    }

    if (data.length === 0) {
      toast.error("JSON array is empty");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    setBulkImporting(true);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item || typeof item !== "object") {
        errors.push(`Item ${i + 1}: invalid object`);
        errorCount++;
        continue;
      }

      const name_en = (item.name_en ?? item.name ?? "").toString().trim();
      if (!name_en) {
        errors.push(`Item ${i + 1}: name_en is required`);
        errorCount++;
        continue;
      }

      const category = (item.category ?? "essential").toString().trim();
      if (!category) {
        errors.push(`Item ${i + 1}: category is required`);
        errorCount++;
        continue;
      }

      try {
        await createAmenity({
          name_en,
          name_fr: (item.name_fr ?? name_en).toString().trim(),
          name_ar: (item.name_ar ?? name_en).toString().trim(),
          icon: (item.icon ?? "WifiHigh").toString().trim(),
          category,
          description_en: (item.description_en ?? "").toString().trim(),
          description_fr: (item.description_fr ?? "").toString().trim(),
          description_ar: (item.description_ar ?? "").toString().trim(),
          sort_order:
            typeof item.sort_order === "number" ? item.sort_order : i + 1,
        });
        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push(`"${name_en}": ${err?.message || "Failed"}`);
      }
    }

    setBulkImporting(false);

    if (successCount > 0) {
      toast.success(
        `Created ${successCount} amenity(ies)${
          errorCount > 0 ? `, ${errorCount} failed` : ""
        }`
      );
      setJsonInput("");
      setShowJsonInput(false);
      loadData();
    } else {
      toast.error(
        `All failed. ${errors.slice(0, 3).join("; ")}${
          errors.length > 3 ? "..." : ""
        }`
      );
    }

    if (errors.length > 0) console.error("Bulk import errors:", errors);
  };

  const handleSave = async () => {
    if (!form.name_en.trim()) {
      toast.error("Name (English) is required");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Category is required");
      return;
    }

    try {
      if (editing) {
        await updateAmenity(editing.id, {
          name_en: form.name_en.trim(),
          name_fr: form.name_fr.trim() || form.name_en.trim(),
          name_ar: form.name_ar.trim() || form.name_en.trim(),
          icon: form.icon,
          category: form.category,
          description_en: form.description_en.trim(),
          description_fr: form.description_fr.trim(),
          description_ar: form.description_ar.trim(),
          sort_order: form.sort_order,
        });
        toast.success("Amenity updated");
      } else {
        await createAmenity({
          name_en: form.name_en.trim(),
          name_fr: form.name_fr.trim() || form.name_en.trim(),
          name_ar: form.name_ar.trim() || form.name_en.trim(),
          icon: form.icon,
          category: form.category,
          description_en: form.description_en.trim(),
          description_fr: form.description_fr.trim(),
          description_ar: form.description_ar.trim(),
          sort_order: form.sort_order,
        });
        toast.success("Amenity created");
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save");
      console.error(error);
    }
  };

  const handleDelete = async (a: AdminAmenity) => {
    if (
      !confirm(
        `Deactivate "${
          a.name?.en || a.name?.fr
        }"? It will no longer appear in property forms.`
      )
    )
      return;

    try {
      await deleteAmenity(a.id);
      toast.success("Amenity deactivated");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
      console.error(error);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await seedAmenities();
      toast.success(res?.message || "Amenities seeded successfully");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to seed");
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  const startEdit = (a: AdminAmenity) => {
    setEditing(a);
    setForm({
      name_en: a.name?.en || "",
      name_fr: a.name?.fr || "",
      name_ar: a.name?.ar || "",
      icon: a.icon || "WifiHigh",
      category: a.category || "essential",
      description_en: (a.description as any)?.en || "",
      description_fr: (a.description as any)?.fr || "",
      description_ar: (a.description as any)?.ar || "",
      sort_order: a.sort_order || 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Property Amenities</h1>
          <p className="text-muted-foreground">
            Manage amenities (WiFi, Kitchen, Pool, etc.) shown when creating
            property listings
          </p>
        </div>
      </div>

      {amenities.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              No amenities in database
            </CardTitle>
            <CardDescription>
              Run the seed to add default amenities (WiFi, AC, Kitchen, etc.) or
              add them manually / via JSON bulk import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding ? "Seeding..." : "Seed Default Amenities"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editing ? "Edit" : "Add"} Amenity
              </CardTitle>
              <CardDescription>
                {editing
                  ? "Update amenity information"
                  : "Create a new amenity for property listings"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowJsonInput(!showJsonInput);
                if (!showJsonInput) loadExampleJson();
              }}
            >
              <FileJson className="h-4 w-4 mr-2" />
              {showJsonInput ? "Use Form" : "Bulk Import (JSON)"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showJsonInput ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>JSON Data (array of amenities)</Label>
                  <Button variant="ghost" size="sm" onClick={loadExampleJson}>
                    Load Example
                  </Button>
                </div>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[\n  {\n    "name_en": "WiFi",\n    "name_fr": "WiFi",\n    "name_ar": "واي فاي",\n    "icon": "WifiHigh",\n    "category": "essential",\n    "description_en": "High-speed internet",\n    "sort_order": 1\n  }\n]`}
                  className="font-mono text-sm min-h-[200px]"
                  rows={14}
                />
                <div className="text-sm text-muted-foreground space-y-1 rounded-md bg-muted p-3">
                  <p className="font-semibold">JSON structure (each item):</p>
                  <p>
                    <code className="text-xs">name_en</code> (required) —
                    English name
                  </p>
                  <p>
                    <code className="text-xs">name_fr</code>,{" "}
                    <code className="text-xs">name_ar</code> — Fall back to
                    name_en if empty
                  </p>
                  <p>
                    <code className="text-xs">icon</code> — Phosphor icon:
                    WifiHigh, Snowflake, CookingPot, Car, Television, etc.
                  </p>
                  <p>
                    <code className="text-xs">category</code> (required) —
                    essential, safety, kitchen, bathroom, bedroom, outdoor,
                    entertainment, mauritania_specific
                  </p>
                  <p>
                    <code className="text-xs">description_en</code>,{" "}
                    <code className="text-xs">description_fr</code>,{" "}
                    <code className="text-xs">description_ar</code> — Optional
                  </p>
                  <p>
                    <code className="text-xs">sort_order</code> — Number
                    (default: index + 1)
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBulkImport}
                disabled={bulkImporting || !jsonInput.trim()}
              >
                {bulkImporting ? "Importing..." : "Import from JSON"}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (English) *</Label>
                  <Input
                    value={form.name_en}
                    onChange={(e) =>
                      setForm({ ...form, name_en: e.target.value })
                    }
                    placeholder="e.g., WiFi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (French)</Label>
                  <Input
                    value={form.name_fr}
                    onChange={(e) =>
                      setForm({ ...form, name_fr: e.target.value })
                    }
                    placeholder="e.g., WiFi"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={form.name_ar}
                  onChange={(e) =>
                    setForm({ ...form, name_ar: e.target.value })
                  }
                  placeholder="e.g., واي فاي"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  >
                    {ICONS.map((ico) => (
                      <option key={ico} value={ico}>
                        {ico}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Input
                  value={form.description_en}
                  onChange={(e) =>
                    setForm({ ...form, description_en: e.target.value })
                  }
                  placeholder="Short description"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sort_order: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                {editing && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>All Amenities</CardTitle>
            <select
              className="p-2 border rounded-md text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <CardDescription>
            These appear when creating property and property sale listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amenities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.name?.en || a.name?.fr || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{a.icon}</TableCell>
                  <TableCell>{a.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={a.is_active ? "default" : "secondary"}>
                      {a.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(a)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(a)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {amenities.length === 0 && (
            <p className="text-muted-foreground py-8 text-center">
              No amenities yet. Add one above, use bulk JSON import, or seed
              defaults.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
