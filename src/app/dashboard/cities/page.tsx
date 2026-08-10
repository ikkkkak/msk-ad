"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminCity,
  AdminCountry,
  AdminZone,
  AdminQuartier,
  listAdminCountries,
  listAdminCities,
  listAdminZones,
  listAdminQuartiers,
  createCountry,
  updateCountry,
  deleteCountry,
  createCity,
  updateCity,
  deleteCity,
  createZone,
  updateZone,
  deleteZone,
  createQuartier,
  updateQuartier,
  deleteQuartier,
} from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, Building, Layers, FileJson, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationBulkImport } from "@/components/location-bulk-import";
import { bulkImportLocations } from "@/lib/api";
import { LOCATION_BULK_QUARTIERS_ONLY_EXAMPLE } from "@/lib/locationBulkFormat";

function defaultCountryRow(countries: AdminCountry[]): AdminCountry | undefined {
  return countries.find((c) => c.code === "MR") ?? countries[0];
}

function emptyCityForm(countries: AdminCountry[]) {
  const c = defaultCountryRow(countries);
  return {
    name: "",
    name_ar: "",
    country_id: c?.id ?? 0,
    country: c?.name ?? "Mauritania",
    country_ar: c?.name_ar ?? "موريتانيا",
  };
}

export default function CitiesPage() {
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [quartiers, setQuartiers] = useState<AdminQuartier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("countries");

  const [countryForm, setCountryForm] = useState({
    code: "",
    name: "",
    name_ar: "",
    name_fr: "",
    sort_order: 0,
    is_active: true,
  });
  const [editingCountry, setEditingCountry] = useState<AdminCountry | null>(null);

  // City form state
  const [cityForm, setCityForm] = useState(emptyCityForm([]));
  const [editingCity, setEditingCity] = useState<AdminCity | null>(null);

  // Zone form state
  const [zoneForm, setZoneForm] = useState({
    city_id: 0,
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
  });
  const [editingZone, setEditingZone] = useState<AdminZone | null>(null);

  // Quartier form state
  const [quartierForm, setQuartierForm] = useState({
    zone_id: 0,
    parent_quartier_id: 0,
    name: "",
    name_ar: "",
  });
  const [editingQuartier, setEditingQuartier] = useState<AdminQuartier | null>(null);
  const [quartierJsonInput, setQuartierJsonInput] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [countriesRes, citiesRes, zonesRes, quartiersRes] = await Promise.all([
        listAdminCountries(),
        listAdminCities(),
        listAdminZones(),
        listAdminQuartiers(),
      ]);
      setCountries(countriesRes.data);
      setCities(citiesRes.data);
      setZones(zonesRes.data);
      setQuartiers(quartiersRes.data);
      if (!editingCity && cityForm.country_id === 0 && countriesRes.data.length > 0) {
        setCityForm(emptyCityForm(countriesRes.data));
      }
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCountry = async () => {
    try {
      if (!countryForm.code.trim() || !countryForm.name || !countryForm.name_ar) {
        toast.error("Code, English name, and Arabic name are required");
        return;
      }
      await createCountry({
        code: countryForm.code.trim().toUpperCase(),
        name: countryForm.name.trim(),
        name_ar: countryForm.name_ar.trim(),
        name_fr: countryForm.name_fr.trim() || undefined,
        is_active: countryForm.is_active,
        sort_order: countryForm.sort_order,
      });
      toast.success("Country created successfully");
      setCountryForm({
        code: "",
        name: "",
        name_ar: "",
        name_fr: "",
        sort_order: 0,
        is_active: true,
      });
      loadData();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create country",
      );
      console.error(error);
    }
  };

  const handleUpdateCountry = async () => {
    try {
      if (!editingCountry || !countryForm.code.trim() || !countryForm.name || !countryForm.name_ar) {
        toast.error("Code, English name, and Arabic name are required");
        return;
      }
      await updateCountry(editingCountry.id, {
        code: countryForm.code.trim().toUpperCase(),
        name: countryForm.name.trim(),
        name_ar: countryForm.name_ar.trim(),
        name_fr: countryForm.name_fr.trim(),
        is_active: countryForm.is_active,
        sort_order: countryForm.sort_order,
      });
      toast.success("Country updated successfully");
      setEditingCountry(null);
      setCountryForm({
        code: "",
        name: "",
        name_ar: "",
        name_fr: "",
        sort_order: 0,
        is_active: true,
      });
      loadData();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update country",
      );
      console.error(error);
    }
  };

  const handleDeleteCountry = async (country: AdminCountry) => {
    if (!confirm(`Delete country "${country.name}" (${country.code})?`)) return;
    try {
      await deleteCountry(country.id);
      toast.success("Country deleted successfully");
      loadData();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete country",
      );
      console.error(error);
    }
  };

  const startEditCountry = (country: AdminCountry) => {
    setEditingCountry(country);
    setCountryForm({
      code: country.code,
      name: country.name,
      name_ar: country.name_ar,
      name_fr: country.name_fr || "",
      sort_order: country.sort_order ?? 0,
      is_active: country.is_active,
    });
  };

  const applyCountryToCityForm = (countryId: number) => {
    const c = countries.find((x) => x.id === countryId);
    if (!c) return;
    setCityForm((prev) => ({
      ...prev,
      country_id: c.id,
      country: c.name,
      country_ar: c.name_ar,
    }));
  };

  const handleCreateCity = async () => {
    try {
      if (!cityForm.name || !cityForm.name_ar) {
        toast.error("Name and Arabic name are required");
        return;
      }
      if (!cityForm.country_id) {
        toast.error("Please select a country");
        return;
      }

      await createCity({
        name: cityForm.name,
        name_ar: cityForm.name_ar,
        country: cityForm.country,
        country_ar: cityForm.country_ar,
        country_id: cityForm.country_id,
      });
      toast.success("City created successfully");
      setCityForm(emptyCityForm(countries));
      loadData();
    } catch (error) {
      toast.error("Failed to create city");
      console.error(error);
    }
  };

  const handleUpdateCity = async () => {
    try {
      if (!editingCity || !cityForm.name || !cityForm.name_ar) {
        toast.error("Name and Arabic name are required");
        return;
      }

      await updateCity(editingCity.id, {
        name: cityForm.name,
        name_ar: cityForm.name_ar,
        country: cityForm.country,
        country_ar: cityForm.country_ar,
        country_id: cityForm.country_id || undefined,
      });
      toast.success("City updated successfully");
      setEditingCity(null);
      setCityForm(emptyCityForm(countries));
      loadData();
    } catch (error) {
      toast.error("Failed to update city");
      console.error(error);
    }
  };

  const handleDeleteCity = async (city: AdminCity) => {
    if (!confirm(`Are you sure you want to delete "${city.name}"?`)) return;

    try {
      await deleteCity(city.id);
      toast.success("City deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete city");
      console.error(error);
    }
  };

  const handleCreateZone = async () => {
    try {
      if (!zoneForm.city_id || !zoneForm.name || !zoneForm.name_ar) {
        toast.error("City, name and Arabic name are required");
        return;
      }

      await createZone(zoneForm);
      toast.success("Zone created successfully");
      setZoneForm({ city_id: 0, name: "", name_ar: "", description: "", description_ar: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to create zone");
      console.error(error);
    }
  };

  const handleUpdateZone = async () => {
    try {
      if (!editingZone || !zoneForm.city_id || !zoneForm.name || !zoneForm.name_ar) {
        toast.error("City, name and Arabic name are required");
        return;
      }

      await updateZone(editingZone.id, zoneForm);
      toast.success("Zone updated successfully");
      setEditingZone(null);
      setZoneForm({ city_id: 0, name: "", name_ar: "", description: "", description_ar: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to update zone");
      console.error(error);
    }
  };

  const handleDeleteZone = async (zone: AdminZone) => {
    if (!confirm(`Are you sure you want to delete "${zone.name}"?`)) return;

    try {
      await deleteZone(zone.id);
      toast.success("Zone deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete zone");
      console.error(error);
    }
  };

  const startEditCity = (city: AdminCity) => {
    setEditingCity(city);
    setCityForm({
      name: city.name,
      name_ar: city.name_ar,
      country_id: city.country_id ?? city.countryRef?.id ?? 0,
      country: city.country,
      country_ar: city.country_ar,
    });
  };

  const startEditZone = (zone: AdminZone) => {
    setEditingZone(zone);
    setZoneForm({
      city_id: zone.city_id,
      name: zone.name,
      name_ar: zone.name_ar,
      description: zone.description || "",
      description_ar: zone.description_ar || "",
    });
  };

  const handleCreateQuartier = async () => {
    try {
      if (!quartierForm.zone_id || !quartierForm.name || !quartierForm.name_ar) {
        toast.error("Zone, name and Arabic name are required");
        return;
      }

      const body: any = {
        zone_id: quartierForm.zone_id,
        name: quartierForm.name,
        name_ar: quartierForm.name_ar,
      };
      if (quartierForm.parent_quartier_id > 0) {
        body.parent_quartier_id = quartierForm.parent_quartier_id;
      }

      await createQuartier(body);
      toast.success("Quartier created successfully");
      setQuartierForm({ zone_id: 0, parent_quartier_id: 0, name: "", name_ar: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to create quartier");
      console.error(error);
    }
  };

  const handleBulkCreateQuartiers = async () => {
    try {
      if (!quartierForm.zone_id || quartierForm.zone_id === 0) {
        toast.error("Please select a zone first");
        return;
      }
      if (!quartierJsonInput.trim()) {
        toast.error("Please provide JSON data");
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(quartierJsonInput.trim());
      } catch (error: unknown) {
        toast.error(
          `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}`,
        );
        return;
      }

      let quartiersList: Record<string, unknown>[];
      if (Array.isArray(parsed)) {
        quartiersList = parsed as Record<string, unknown>[];
      } else if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { quartiers?: unknown }).quartiers)
      ) {
        quartiersList = (parsed as { quartiers: Record<string, unknown>[] }).quartiers;
      } else {
        toast.error("JSON must be an array of quartiers or { version: 1, quartiers: [...] }");
        return;
      }

      const normalized = quartiersList.map((q) => ({
        name: q.name,
        name_ar: q.name_ar,
        parent_index:
          q.parent_index ??
          (typeof q.parent_quartier_id === "number" ? q.parent_quartier_id : null),
        key: q.key,
        parent_key: q.parent_key,
        sub_quartiers: q.sub_quartiers,
      }));

      const res = await bulkImportLocations({
        version: 1,
        skip_existing: true,
        zone_id: quartierForm.zone_id,
        quartiers: normalized,
      });

      const d = res.data;
      toast.success(
        `Created ${d.quartiers_created} quartier(s), skipped ${d.quartiers_skipped}`,
      );
      if (d.errors?.length) {
        console.warn(d.errors);
        toast.warning(`${d.errors.length} warning(s) — see console`);
      }

      setQuartierJsonInput("");
      setShowJsonInput(false);
      loadData();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import quartiers",
      );
    }
  };

  const loadExampleJson = () => {
    const example = {
      ...LOCATION_BULK_QUARTIERS_ONLY_EXAMPLE,
      zone_id: quartierForm.zone_id > 0 ? quartierForm.zone_id : 0,
    };
    setQuartierJsonInput(JSON.stringify(example, null, 2));
  };

  const handleUpdateQuartier = async () => {
    try {
      if (!editingQuartier || !quartierForm.zone_id || !quartierForm.name || !quartierForm.name_ar) {
        toast.error("Zone, name and Arabic name are required");
        return;
      }

      const body: any = {
        zone_id: quartierForm.zone_id,
        name: quartierForm.name,
        name_ar: quartierForm.name_ar,
      };
      if (quartierForm.parent_quartier_id > 0) {
        body.parent_quartier_id = quartierForm.parent_quartier_id;
      } else {
        body.parent_quartier_id = null;
      }

      await updateQuartier(editingQuartier.id, body);
      toast.success("Quartier updated successfully");
      setEditingQuartier(null);
      setQuartierForm({ zone_id: 0, parent_quartier_id: 0, name: "", name_ar: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to update quartier");
      console.error(error);
    }
  };

  const handleDeleteQuartier = async (quartier: AdminQuartier) => {
    if (!confirm(`Are you sure you want to delete "${quartier.name}"?`)) return;

    try {
      await deleteQuartier(quartier.id);
      toast.success("Quartier deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete quartier");
      console.error(error);
    }
  };

  const startEditQuartier = (quartier: AdminQuartier) => {
    setEditingQuartier(quartier);
    setQuartierForm({
      zone_id: quartier.zone_id,
      parent_quartier_id: quartier.parent_quartier_id || 0,
      name: quartier.name,
      name_ar: quartier.name_ar,
    });
  };

  const cancelEdit = () => {
    setEditingCountry(null);
    setEditingCity(null);
    setEditingZone(null);
    setEditingQuartier(null);
    setCountryForm({
      code: "",
      name: "",
      name_ar: "",
      name_fr: "",
      sort_order: 0,
      is_active: true,
    });
    setCityForm(emptyCityForm(countries));
    setZoneForm({ city_id: 0, name: "", name_ar: "", description: "", description_ar: "" });
    setQuartierForm({ zone_id: 0, parent_quartier_id: 0, name: "", name_ar: "" });
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
          <h1 className="text-3xl font-bold">Countries, Cities, Zones & Quartiers</h1>
          <p className="text-muted-foreground">
            Location hierarchy: Country → City → Zone → Quartier (used in listings and search filters)
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Cities
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="quartiers" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Quartiers
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Bulk import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingCountry ? "Edit Country" : "Add New Country"}
              </CardTitle>
              <CardDescription>
                {editingCountry
                  ? "Update country used in app filters and listing origin"
                  : "Add a country before creating its cities (use ISO-style codes: MR, SN, MA…)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="country-code">Code</Label>
                  <Input
                    id="country-code"
                    value={countryForm.code}
                    onChange={(e) =>
                      setCountryForm({
                        ...countryForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="MR"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country-sort">Sort order</Label>
                  <Input
                    id="country-sort"
                    type="number"
                    value={countryForm.sort_order}
                    onChange={(e) =>
                      setCountryForm({
                        ...countryForm,
                        sort_order: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={countryForm.is_active}
                      onChange={(e) =>
                        setCountryForm({
                          ...countryForm,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    Active (visible in app)
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country-name">Name (English)</Label>
                  <Input
                    id="country-name"
                    value={countryForm.name}
                    onChange={(e) =>
                      setCountryForm({ ...countryForm, name: e.target.value })
                    }
                    placeholder="Mauritania"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country-name-ar">Name (Arabic)</Label>
                  <Input
                    id="country-name-ar"
                    value={countryForm.name_ar}
                    onChange={(e) =>
                      setCountryForm({ ...countryForm, name_ar: e.target.value })
                    }
                    placeholder="موريتانيا"
                  />
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="country-name-fr">Name (French, optional)</Label>
                <Input
                  id="country-name-fr"
                  value={countryForm.name_fr}
                  onChange={(e) =>
                    setCountryForm({ ...countryForm, name_fr: e.target.value })
                  }
                  placeholder="Mauritanie"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingCountry ? handleUpdateCountry : handleCreateCountry}
                >
                  {editingCountry ? "Update Country" : "Create Country"}
                </Button>
                {editingCountry && (
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Countries</CardTitle>
              <CardDescription>
                Delete is blocked while cities are still linked to a country
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Arabic</TableHead>
                    <TableHead>French</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell className="font-mono font-medium">
                        {country.code}
                      </TableCell>
                      <TableCell>{country.name}</TableCell>
                      <TableCell>{country.name_ar}</TableCell>
                      <TableCell>{country.name_fr || "—"}</TableCell>
                      <TableCell>{country.sort_order}</TableCell>
                      <TableCell>
                        <Badge variant={country.is_active ? "default" : "secondary"}>
                          {country.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditCountry(country)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCountry(country)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingCity ? "Edit City" : "Add New City"}
              </CardTitle>
              <CardDescription>
                {editingCity ? "Update city information" : "Create a new city for property listings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-name">Name (English)</Label>
                  <Input
                    id="city-name"
                    value={cityForm.name}
                    onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                    placeholder="e.g., Nouakchott"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city-name-ar">Name (Arabic)</Label>
                  <Input
                    id="city-name-ar"
                    value={cityForm.name_ar}
                    onChange={(e) => setCityForm({ ...cityForm, name_ar: e.target.value })}
                    placeholder="e.g., نواكشوط"
                  />
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <Label>Country</Label>
                <Select
                  value={
                    cityForm.country_id > 0
                      ? String(cityForm.country_id)
                      : undefined
                  }
                  onValueChange={(v) => applyCountryToCityForm(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {countries.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add a country in the Countries tab first.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={editingCity ? handleUpdateCity : handleCreateCity}>
                  {editingCity ? "Update City" : "Create City"}
                </Button>
                {editingCity && (
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Cities</CardTitle>
              <CardDescription>Manage existing cities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Arabic Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>{city.name_ar}</TableCell>
                      <TableCell>
                        {city.countryRef
                          ? `${city.countryRef.name} (${city.countryRef.code})`
                          : city.country}
                      </TableCell>
                      <TableCell>
                        <Badge variant={city.is_active ? "default" : "secondary"}>
                          {city.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{city.zones?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditCity(city)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCity(city)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingZone ? "Edit Zone" : "Add New Zone"}
              </CardTitle>
              <CardDescription>
                {editingZone ? "Update zone information" : "Create a new zone within a city"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone-city">City</Label>
                <select
                  id="zone-city"
                  className="w-full p-2 border rounded-md"
                  value={zoneForm.city_id}
                  onChange={(e) => setZoneForm({ ...zoneForm, city_id: parseInt(e.target.value) })}
                >
                  <option value={0}>Select a city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.name_ar})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone-name">Name (English)</Label>
                  <Input
                    id="zone-name"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                    placeholder="e.g., Downtown"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone-name-ar">Name (Arabic)</Label>
                  <Input
                    id="zone-name-ar"
                    value={zoneForm.name_ar}
                    onChange={(e) => setZoneForm({ ...zoneForm, name_ar: e.target.value })}
                    placeholder="e.g., وسط المدينة"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone-description">Description (English)</Label>
                  <Input
                    id="zone-description"
                    value={zoneForm.description}
                    onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                    placeholder="e.g., Commercial district"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone-description-ar">Description (Arabic)</Label>
                  <Input
                    id="zone-description-ar"
                    value={zoneForm.description_ar}
                    onChange={(e) => setZoneForm({ ...zoneForm, description_ar: e.target.value })}
                    placeholder="e.g., المنطقة التجارية"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={editingZone ? handleUpdateZone : handleCreateZone}>
                  {editingZone ? "Update Zone" : "Create Zone"}
                </Button>
                {editingZone && (
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Zones</CardTitle>
              <CardDescription>Manage existing zones</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Arabic Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>{zone.name_ar}</TableCell>
                      <TableCell>{zone.city?.name || "Unknown"}</TableCell>
                      <TableCell>{zone.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={zone.is_active ? "default" : "secondary"}>
                          {zone.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditZone(zone)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteZone(zone)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quartiers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {editingQuartier ? "Edit Quartier" : "Add New Quartier"}
                  </CardTitle>
                  <CardDescription>
                    {editingQuartier ? "Update quartier information" : "Create a new quartier within a zone"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowJsonInput(!showJsonInput);
                    if (!showJsonInput) {
                      loadExampleJson();
                    }
                  }}
                >
                  {showJsonInput ? "Use Form" : "Bulk Import (JSON)"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showJsonInput ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quartier-zone-json">Zone (Required - All quartiers will be added to this zone)</Label>
                    <select
                      id="quartier-zone-json"
                      className="w-full p-2 border rounded-md"
                      value={quartierForm.zone_id}
                      onChange={(e) => setQuartierForm({ ...quartierForm, zone_id: parseInt(e.target.value), parent_quartier_id: 0 })}
                    >
                      <option value={0}>Select a zone</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} ({zone.name_ar}) - {zone.city?.name || "Unknown"}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {quartierForm.zone_id > 0 && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="quartier-json">JSON Data (Array of Quartiers)</Label>
                          <Button variant="ghost" size="sm" onClick={loadExampleJson}>
                            Load Example
                          </Button>
                        </div>
                        <Textarea
                          id="quartier-json"
                          value={quartierJsonInput}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuartierJsonInput(e.target.value)}
                          placeholder={`[\n  {\n    "name": "Downtown Center",\n    "name_ar": "وسط المدينة",\n    "parent_quartier_id": null\n  },\n  {\n    "name": "Shopping Area",\n    "name_ar": "منطقة التسوق",\n    "parent_quartier_id": null\n  },\n  {\n    "name": "Main Market",\n    "name_ar": "السوق الرئيسي",\n    "parent_quartier_id": 3\n  }\n]`}
                          className="font-mono text-sm"
                          rows={20}
                        />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <strong>Format:</strong> Use the{" "}
                            <button
                              type="button"
                              className="underline text-primary"
                              onClick={() => setActiveTab("bulk")}
                            >
                              Bulk import
                            </button>{" "}
                            tab for full docs, or a quartiers array here.
                          </p>
                          <p><strong>Required:</strong> name, name_ar</p>
                          <p><strong>Parent:</strong> parent_index (1-based in array) or parent_key / sub_quartiers</p>
                          <p className="text-xs mt-2">
                            Or paste{" "}
                            <code className="bg-muted px-1 rounded">{`{ "version": 1, "quartiers": [...] }`}</code>
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleBulkCreateQuartiers} 
                        className="w-full"
                        disabled={!quartierJsonInput.trim()}
                      >
                        Import Quartiers from JSON
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
              <div className="space-y-2">
                <Label htmlFor="quartier-zone">Zone</Label>
                <select
                  id="quartier-zone"
                  className="w-full p-2 border rounded-md"
                  value={quartierForm.zone_id}
                  onChange={(e) => setQuartierForm({ ...quartierForm, zone_id: parseInt(e.target.value), parent_quartier_id: 0 })}
                >
                  <option value={0}>Select a zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.name_ar}) - {zone.city?.name || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>
              {quartierForm.zone_id > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="quartier-parent">Parent Quartier (Optional)</Label>
                  <select
                    id="quartier-parent"
                    className="w-full p-2 border rounded-md"
                    value={quartierForm.parent_quartier_id}
                    onChange={(e) => setQuartierForm({ ...quartierForm, parent_quartier_id: parseInt(e.target.value) })}
                  >
                    <option value={0}>None (Top-level quartier)</option>
                    {quartiers
                      .filter(q => q.zone_id === quartierForm.zone_id && !q.parent_quartier_id)
                      .map((quartier) => (
                        <option key={quartier.id} value={quartier.id}>
                          {quartier.name} ({quartier.name_ar})
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quartier-name">Name (English)</Label>
                  <Input
                    id="quartier-name"
                    value={quartierForm.name}
                    onChange={(e) => setQuartierForm({ ...quartierForm, name: e.target.value })}
                    placeholder="e.g., Downtown Center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quartier-name-ar">Name (Arabic)</Label>
                  <Input
                    id="quartier-name-ar"
                    value={quartierForm.name_ar}
                    onChange={(e) => setQuartierForm({ ...quartierForm, name_ar: e.target.value })}
                    placeholder="e.g., وسط المدينة"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={editingQuartier ? handleUpdateQuartier : handleCreateQuartier}>
                  {editingQuartier ? "Update Quartier" : "Create Quartier"}
                </Button>
                {editingQuartier && (
                  <Button variant="outline" onClick={cancelEdit}>
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
              <CardTitle>All Quartiers</CardTitle>
              <CardDescription>Manage existing quartiers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Arabic Name</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quartiers.map((quartier) => (
                    <TableRow key={quartier.id}>
                      <TableCell className="font-medium">{quartier.name}</TableCell>
                      <TableCell>{quartier.name_ar}</TableCell>
                      <TableCell>{quartier.zone?.name || "Unknown"}</TableCell>
                      <TableCell>{quartier.zone?.city?.name || "Unknown"}</TableCell>
                      <TableCell>{quartier.parent_quartier?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={quartier.is_active ? "default" : "secondary"}>
                          {quartier.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditQuartier(quartier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuartier(quartier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <LocationBulkImport
            cities={cities.map((c) => ({
              id: c.id,
              name: c.name,
              name_ar: c.name_ar,
            }))}
            zones={zones.map((z) => ({
              id: z.id,
              name: z.name,
              name_ar: z.name_ar,
              city: z.city,
            }))}
            onSuccess={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
