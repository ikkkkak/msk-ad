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
import { AdminCity, AdminZone, AdminQuartier, listAdminCities, listAdminZones, listAdminQuartiers, createCity, updateCity, deleteCity, createZone, updateZone, deleteZone, createQuartier, updateQuartier, deleteQuartier } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, Building, Layers } from "lucide-react";

export default function CitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [quartiers, setQuartiers] = useState<AdminQuartier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cities");

  // City form state
  const [cityForm, setCityForm] = useState({
    name: "",
    name_ar: "",
    country: "Mauritania",
    country_ar: "موريتانيا",
  });
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
      const [citiesRes, zonesRes, quartiersRes] = await Promise.all([
        listAdminCities(),
        listAdminZones(),
        listAdminQuartiers(),
      ]);
      setCities(citiesRes.data);
      setZones(zonesRes.data);
      setQuartiers(quartiersRes.data);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    try {
      if (!cityForm.name || !cityForm.name_ar) {
        toast.error("Name and Arabic name are required");
        return;
      }

      await createCity(cityForm);
      toast.success("City created successfully");
      setCityForm({ name: "", name_ar: "", country: "Mauritania", country_ar: "موريتانيا" });
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

      await updateCity(editingCity.id, cityForm);
      toast.success("City updated successfully");
      setEditingCity(null);
      setCityForm({ name: "", name_ar: "", country: "Mauritania", country_ar: "موريتانيا" });
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

      let quartiersData;
      try {
        // Trim the input to remove any leading/trailing whitespace
        const trimmedInput = quartierJsonInput.trim();
        quartiersData = JSON.parse(trimmedInput);
      } catch (error: any) {
        toast.error(`Invalid JSON format: ${error.message || 'Unknown parsing error'}`);
        console.error("JSON Parse Error:", error);
        console.error("JSON Input length:", quartierJsonInput.length);
        console.error("First 200 chars of JSON:", quartierJsonInput.substring(0, 200));
        return;
      }

      if (!Array.isArray(quartiersData)) {
        toast.error(`JSON must be an array. Received type: ${typeof quartiersData}`);
        console.error("Parsed data (not an array):", quartiersData);
        return;
      }

      if (quartiersData.length === 0) {
        toast.error("JSON array is empty");
        return;
      }

      // Debug: Log first item structure
      console.log("First quartier item:", quartiersData[0]);
      console.log("First quartier keys:", quartiersData[0] ? Object.keys(quartiersData[0]) : 'null/undefined');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const createdQuartiers: { id: number; name: string }[] = [];

      for (let i = 0; i < quartiersData.length; i++) {
        const quartier = quartiersData[i];
        try {
          // Validate that quartier is an object
          if (!quartier || typeof quartier !== 'object') {
            errors.push(`Quartier at index ${i} is not a valid object: ${JSON.stringify(quartier)}`);
            errorCount++;
            continue;
          }

          // Validate and trim fields
          const name = quartier.name && typeof quartier.name === 'string' ? quartier.name.trim() : '';
          const nameAr = quartier.name_ar && typeof quartier.name_ar === 'string' ? quartier.name_ar.trim() : '';
          
          if (!name || !nameAr) {
            const debugInfo = {
              index: i,
              hasName: !!quartier.name,
              nameType: typeof quartier.name,
              nameValue: quartier.name,
              hasNameAr: !!quartier.name_ar,
              nameArType: typeof quartier.name_ar,
              nameArValue: quartier.name_ar,
              fullObject: JSON.stringify(quartier),
            };
            errors.push(`Quartier at index ${i} is missing required fields (name, name_ar). Debug: ${JSON.stringify(debugInfo)}`);
            errorCount++;
            continue;
          }

          const body: any = {
            zone_id: quartierForm.zone_id, // Use selected zone_id from form
            name: name,
            name_ar: nameAr,
          };
          
          // Handle parent_quartier_id - can be:
          // 1. null or undefined (top-level quartier)
          // 2. A number (index in array + 1, referencing a previously created quartier in this batch)
          // 3. A string like "1" (index reference)
          if (quartier.parent_quartier_id !== undefined && quartier.parent_quartier_id !== null) {
            let parentId: number | null = null;
            
            // If it's a number, treat it as an index reference (1-based)
            if (typeof quartier.parent_quartier_id === 'number' && quartier.parent_quartier_id > 0) {
              const parentIndex = quartier.parent_quartier_id - 1;
              if (parentIndex >= 0 && parentIndex < createdQuartiers.length) {
                parentId = createdQuartiers[parentIndex].id;
              } else {
                errors.push(`Quartier "${quartier.name}": Invalid parent_quartier_id reference (${quartier.parent_quartier_id}). Must reference a quartier created earlier in the array (use 1-based index).`);
              }
            }
            
            if (parentId) {
              body.parent_quartier_id = parentId;
            }
          }

          const result = await createQuartier(body);
          const createdId = result?.data?.id || result?.id;
          if (createdId) {
            createdQuartiers.push({ id: createdId, name: name });
          }
          successCount++;
        } catch (error: any) {
          errorCount++;
          const errorName = quartier?.name || quartier?.name_ar || `at index ${i}`;
          errors.push(`Failed to create "${errorName}": ${error.message || 'Unknown error'}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} quartier(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      } else {
        toast.error(`Failed to create all quartiers. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
      }

      if (errors.length > 0) {
        console.error("Quartier creation errors:", errors);
      }

      setQuartierJsonInput("");
      setShowJsonInput(false);
      loadData();
    } catch (error: any) {
      toast.error(`Failed to process JSON: ${error.message}`);
      console.error(error);
    }
  };

  const loadExampleJson = () => {
    const example = [
      {
        "name": "Downtown Center",
        "name_ar": "وسط المدينة",
        "parent_quartier_id": null
      },
      {
        "name": "Commercial District",
        "name_ar": "المنطقة التجارية",
        "parent_quartier_id": null
      },
      {
        "name": "Shopping Area",
        "name_ar": "منطقة التسوق",
        "parent_quartier_id": null
      },
      {
        "name": "Main Market",
        "name_ar": "السوق الرئيسي",
        "parent_quartier_id": 3
      },
      {
        "name": "Small Shops",
        "name_ar": "المحلات الصغيرة",
        "parent_quartier_id": 3
      }
    ];
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
    setEditingCity(null);
    setEditingZone(null);
    setEditingQuartier(null);
    setCityForm({ name: "", name_ar: "", country: "Mauritania", country_ar: "موريتانيا" });
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
          <h1 className="text-3xl font-bold">Cities, Zones & Quartiers Management</h1>
          <p className="text-muted-foreground">Manage cities, zones and quartiers for property listings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
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
        </TabsList>

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-country">Country (English)</Label>
                  <Input
                    id="city-country"
                    value={cityForm.country}
                    onChange={(e) => setCityForm({ ...cityForm, country: e.target.value })}
                    placeholder="e.g., Mauritania"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city-country-ar">Country (Arabic)</Label>
                  <Input
                    id="city-country-ar"
                    value={cityForm.country_ar}
                    onChange={(e) => setCityForm({ ...cityForm, country_ar: e.target.value })}
                    placeholder="e.g., موريتانيا"
                  />
                </div>
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
                      <TableCell>{city.country}</TableCell>
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
                          <p><strong>Format:</strong> Array of quartier objects</p>
                          <p><strong>Required fields:</strong> name (string), name_ar (string)</p>
                          <p><strong>Optional fields:</strong> parent_quartier_id (number | null)</p>
                          <div className="mt-2 p-3 bg-muted rounded-md space-y-1">
                            <p className="font-semibold mb-1">Example Structure:</p>
                            <p className="text-xs">• <strong>Parent quartier:</strong> Set parent_quartier_id to null or omit it</p>
                            <p className="text-xs">• <strong>Child quartier:</strong> Set parent_quartier_id to the 1-based index of the parent quartier in your array (e.g., 3 = 3rd quartier in the array)</p>
                            <p className="text-xs mt-2">• <strong>Note:</strong> All quartiers will be added to the selected zone above. Do NOT include zone_id in the JSON.</p>
                          </div>
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
      </Tabs>
    </div>
  );
}
