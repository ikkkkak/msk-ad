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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedPropertyCategories,
  AdminCategory,
} from "@/lib/api";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Sparkles, FileJson } from "lucide-react";

const ICONS = [
  "Buildings",
  "House",
  "HouseLine",
  "Tree",
  "Users",
  "Waves",
  "Tent",
  "Briefcase",
  "GraduationCap",
  "MapPin",
  "Car",
];

export default function PropertyTypesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"property" | "experience">(
    "property"
  );
  const [seeding, setSeeding] = useState(false);

  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);

  const [form, setForm] = useState({
    name_en: "",
    name_fr: "",
    name_ar: "",
    icon: "Buildings",
    description_en: "",
    description_fr: "",
    description_ar: "",
    sort_order: 0,
  });
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listAdminCategories({ type: activeTab });
      setCategories(res.data || []);
    } catch (error) {
      toast.error("Failed to load property types");
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
      icon: "Buildings",
      description_en: "",
      description_fr: "",
      description_ar: "",
      sort_order: 0,
    });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name_en.trim()) {
      toast.error("Name (English) is required");
      return;
    }

    try {
      if (editing) {
        await updateCategory(editing.id, {
          name_en: form.name_en.trim(),
          name_fr: form.name_fr.trim() || form.name_en.trim(),
          name_ar: form.name_ar.trim() || form.name_en.trim(),
          icon: form.icon,
          description_en: form.description_en.trim(),
          description_fr: form.description_fr.trim(),
          description_ar: form.description_ar.trim(),
          sort_order: form.sort_order,
        });
        toast.success("Property type updated");
      } else {
        await createCategory({
          type: activeTab,
          name_en: form.name_en.trim(),
          name_fr: form.name_fr.trim() || form.name_en.trim(),
          name_ar: form.name_ar.trim() || form.name_en.trim(),
          icon: form.icon,
          description_en: form.description_en.trim(),
          description_fr: form.description_fr.trim(),
          description_ar: form.description_ar.trim(),
          sort_order: form.sort_order,
        });
        toast.success("Property type created");
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save");
      console.error(error);
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (
      !confirm(
        `Deactivate "${
          cat.name?.en || cat.name?.fr
        }"? It will no longer appear in the Add Property form.`
      )
    )
      return;

    try {
      await deleteCategory(cat.id);
      toast.success("Property type deactivated");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
      console.error(error);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await seedPropertyCategories();
      toast.success(res?.message || "Property types seeded successfully");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to seed");
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  const loadExampleJson = () => {
    const example = [
      {
        name_en: "Apartment",
        name_fr: "Appartement",
        name_ar: "شقة",
        icon: "Buildings",
        description_en: "Modern apartments in Nouakchott and other cities",
        description_fr: "Appartements modernes à Nouakchott et autres villes",
        description_ar: "شقق حديثة في نواكشوط ومدن أخرى",
        sort_order: 1,
      },
      {
        name_en: "House",
        name_fr: "Maison",
        name_ar: "منزل",
        icon: "House",
        description_en: "Traditional and modern houses",
        description_fr: "Maisons traditionnelles et modernes",
        description_ar: "منازل تقليدية وحديثة",
        sort_order: 2,
      },
      {
        name_en: "Villa",
        name_fr: "Villa",
        name_ar: "فيلا",
        icon: "HouseLine",
        description_en: "Luxury villas with gardens and pools",
        description_fr: "Villas de luxe avec jardins et piscines",
        description_ar: "فيلات فاخرة مع حدائق ومسابح",
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

      try {
        await createCategory({
          type: activeTab,
          name_en,
          name_fr: (item.name_fr ?? name_en).toString().trim(),
          name_ar: (item.name_ar ?? name_en).toString().trim(),
          icon: (item.icon ?? "Buildings").toString().trim(),
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
        `Created ${successCount} type(s)${
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

  const startEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setForm({
      name_en: cat.name?.en || "",
      name_fr: cat.name?.fr || "",
      name_ar: cat.name?.ar || "",
      icon: cat.icon || "Buildings",
      description_en: (cat.description as any)?.en || "",
      description_fr: (cat.description as any)?.fr || "",
      description_ar: (cat.description as any)?.ar || "",
      sort_order: cat.sort_order || 0,
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
          <h1 className="text-3xl font-bold">Property Types</h1>
          <p className="text-muted-foreground">
            Manage property and experience categories used in Add Property / Add
            Listing
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "property" | "experience")}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="property">Property Types</TabsTrigger>
          <TabsTrigger value="experience">Experience Types</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {activeTab === "property" && categories.length === 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  No property types in database
                </CardTitle>
                <CardDescription>
                  Run the seed to add default types (Apartment, House, Villa,
                  etc.) so they appear in the Add Property screen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSeed} disabled={seeding}>
                  {seeding ? "Seeding..." : "Seed Default Property Types"}
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
                    {editing ? "Edit" : "Add"}{" "}
                    {activeTab === "property" ? "Property" : "Experience"} Type
                  </CardTitle>
                  <CardDescription>
                    {editing
                      ? "Update category information"
                      : "Create a new category"}
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
                      <Label>JSON Data (array of {activeTab} types)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadExampleJson}
                      >
                        Load Example
                      </Button>
                    </div>
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder={`[\n  {\n    "name_en": "Apartment",\n    "name_fr": "Appartement",\n    "name_ar": "شقة",\n    "icon": "Buildings",\n    "description_en": "Modern apartments",\n    "sort_order": 1\n  }\n]`}
                      className="font-mono text-sm min-h-[200px]"
                      rows={14}
                    />
                    <div className="text-sm text-muted-foreground space-y-1 rounded-md bg-muted p-3">
                      <p className="font-semibold">
                        JSON structure (each item):
                      </p>
                      <p>
                        <code className="text-xs">name_en</code> (required) —
                        English name
                      </p>
                      <p>
                        <code className="text-xs">name_fr</code> — French name
                        (falls back to name_en)
                      </p>
                      <p>
                        <code className="text-xs">name_ar</code> — Arabic name
                        (falls back to name_en)
                      </p>
                      <p>
                        <code className="text-xs">icon</code> — Phosphor icon:
                        Buildings, House, HouseLine, Tree, Users, Waves, Tent,
                        Briefcase, GraduationCap, MapPin, Car
                      </p>
                      <p>
                        <code className="text-xs">description_en</code>,{" "}
                        <code className="text-xs">description_fr</code>,{" "}
                        <code className="text-xs">description_ar</code> —
                        Optional descriptions
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
                        placeholder="e.g., Apartment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (French)</Label>
                      <Input
                        value={form.name_fr}
                        onChange={(e) =>
                          setForm({ ...form, name_fr: e.target.value })
                        }
                        placeholder="e.g., Appartement"
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
                      placeholder="e.g., شقة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon (Phosphor name)</Label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map((ico) => (
                        <Button
                          key={ico}
                          type="button"
                          variant={form.icon === ico ? "default" : "outline"}
                          size="sm"
                          onClick={() => setForm({ ...form, icon: ico })}
                        >
                          {ico}
                        </Button>
                      ))}
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
              <CardTitle>
                All {activeTab === "property" ? "Property" : "Experience"} Types
              </CardTitle>
              <CardDescription>
                These appear in Add Property / Add Listing when users create
                listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        {cat.name?.en || cat.name?.fr || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {cat.icon}
                      </TableCell>
                      <TableCell>{cat.sort_order}</TableCell>
                      <TableCell>
                        <Badge
                          variant={cat.is_active ? "default" : "secondary"}
                        >
                          {cat.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(cat)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cat)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {categories.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">
                  No {activeTab} types yet. Add one above or seed defaults
                  (property only).
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
