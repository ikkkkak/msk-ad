"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminUpdateLandmarkCoordinates, listAdminCities, listAdminZones, type AdminLandmark } from "@/lib/api";
import type { AdminCity, AdminZone } from "@/lib/api";

interface LandmarkMapEditorProps {
  landmarks: AdminLandmark[];
  onUpdate: () => void;
}

interface DraggingState {
  landmarkId: number;
  originalPoints: Array<{ lat: number; lng: number }>;
  newPoints: Array<{ lat: number; lng: number }>;
  isMovingPolygon: boolean; // true if moving entire polygon, false if editing vertex
  vertexIndex?: number; // which vertex is being edited (0-3)
}

interface PolygonData {
  polygon: any;
  vertexMarkers: any[];
  centerMarker: any;
  landmarkId: number;
  points: Array<{ lat: number; lng: number }>;
}

export function LandmarkMapEditor({ landmarks, onUpdate }: LandmarkMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [polygonData, setPolygonData] = useState<Map<number, PolygonData>>(new Map());
  const [draggingState, setDraggingState] = useState<DraggingState | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [zoneBoundaries, setZoneBoundaries] = useState<any>(null);

  const LRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const dragStateRef = useRef<{ originalPoints: Array<{ lat: number; lng: number }>; landmarkId: number } | null>(null);

  // Load cities and zones
  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await listAdminCities();
        setCities(res.data || []);
      } catch (error) {
        console.error("Failed to load cities:", error);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    if (!selectedCity) {
      setZones([]);
      setSelectedZone("");
      return;
    }

    const loadZones = async () => {
      try {
        const res = await listAdminZones();
        const cityZones = (res.data || []).filter((z: AdminZone) => z.city_id === parseInt(selectedCity));
        setZones(cityZones);
      } catch (error) {
        console.error("Failed to load zones:", error);
      }
    };
    loadZones();
  }, [selectedCity]);

  // Calculate map center from all polygon points
  const mapCenter = useMemo(() => {
    const allPoints: Array<{ lat: number; lng: number }> = [];

    landmarks.forEach((landmark) => {
      if (
        landmark.point1_lat && landmark.point1_lng &&
        landmark.point2_lat && landmark.point2_lng &&
        landmark.point3_lat && landmark.point3_lng &&
        landmark.point4_lat && landmark.point4_lng
      ) {
        allPoints.push(
          { lat: landmark.point1_lat, lng: landmark.point1_lng },
          { lat: landmark.point2_lat, lng: landmark.point2_lng },
          { lat: landmark.point3_lat, lng: landmark.point3_lng },
          { lat: landmark.point4_lat, lng: landmark.point4_lng }
        );
      }
    });

    if (allPoints.length === 0) return { lat: 18.0735, lng: -15.9582 };

    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);

    return {
      lat: (Math.max(...lats) + Math.min(...lats)) / 2,
      lng: (Math.max(...lngs) + Math.min(...lngs)) / 2,
    };
  }, [landmarks]);

  // Initialize map with Leaflet (only once)
  useEffect(() => {
    if (!mapRef.current || mapLoaded || mapInstanceRef.current) return;

    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        // Dynamically load Leaflet CSS
        if (typeof window !== "undefined" && !document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          link.crossOrigin = "";
          document.head.appendChild(link);
        }
        LRef.current = L;

        // Fix default icon issue with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Check if container already has a map
        if (mapRef.current && (mapRef.current as any)._leaflet_id) {
          return;
        }

        // Initialize map
        const leafletMap = L.map(mapRef.current!, { preferCanvas: true }).setView([mapCenter.lat, mapCenter.lng], 12);

        // Add satellite tile layer
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 19,
        }).addTo(leafletMap);

        mapInstanceRef.current = leafletMap;
        setMap(leafletMap);
        setMapLoaded(true);

        // Cleanup on unmount
        return () => {
          if (leafletMap) {
            leafletMap.remove();
            mapInstanceRef.current = null;
          }
        };
      } catch (error) {
        console.error("Failed to load map:", error);
      }
    };

    loadMap();
  }, [mapCenter]);

  // Load zone boundaries when zone is selected
  useEffect(() => {
    if (!map || !selectedZone || !LRef.current) {
      if (zoneBoundaries) {
        map?.removeLayer(zoneBoundaries);
        setZoneBoundaries(null);
      }
      return;
    }

    const L = LRef.current;
    const zone = zones.find((z) => z.id === parseInt(selectedZone));
    
    if (zone && (zone as any).coordinates) {
      // Remove existing boundaries
      if (zoneBoundaries) {
        map.removeLayer(zoneBoundaries);
      }

      const coordinates = (zone as any).coordinates;
      if (Array.isArray(coordinates) && coordinates.length > 0) {
        const polygon = L.polygon(coordinates as any, {
          color: "#10B981",
          fillColor: "#10B981",
          fillOpacity: 0.15,
          weight: 3,
          opacity: 0.8,
        });

        polygon.bindPopup(`<strong>${zone.name}</strong>`);
        polygon.addTo(map);
        setZoneBoundaries(polygon);
        map.fitBounds(polygon.getBounds());
      }
    }

    return () => {
      if (zoneBoundaries) {
        map.removeLayer(zoneBoundaries);
      }
    };
  }, [map, selectedZone, zones, LRef]);

  // Create draggable polygon with vertex markers
  const createEditablePolygon = (landmark: AdminLandmark, L: any, mapInstance: any) => {
    const points = [
      { lat: landmark.point1_lat!, lng: landmark.point1_lng! },
      { lat: landmark.point2_lat!, lng: landmark.point2_lng! },
      { lat: landmark.point3_lat!, lng: landmark.point3_lng! },
      { lat: landmark.point4_lat!, lng: landmark.point4_lng! },
    ];

    // Create polygon
    const polygonCoordinates = [
      ...points.map((p) => [p.lat, p.lng]),
      [points[0].lat, points[0].lng], // Close polygon
    ];

    const polygon = L.polygon(polygonCoordinates as any, {
      color: "#3B82F6",
      fillColor: "#3B82F6",
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.8,
    });

    polygon.bindPopup(`<strong>${landmark.title}</strong><br/>${landmark.description || ""}`);

    // Calculate center for moving the entire polygon
    const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;

    // Create center marker for moving entire polygon
    const centerIcon = L.divIcon({
      className: "center-marker",
      html: `<div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #3B82F6;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        cursor: move;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const centerMarker = L.marker([centerLat, centerLng], {
      icon: centerIcon,
      draggable: true,
      zIndexOffset: 500,
    });

    // Create vertex markers (smaller, different color)
    const vertexMarkers: any[] = [];
    points.forEach((point, index) => {
      const vertexIcon = L.divIcon({
        className: "vertex-marker",
        html: `<div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #EF4444;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: move;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const vertexMarker = L.marker([point.lat, point.lng], {
        icon: vertexIcon,
        draggable: true,
        zIndexOffset: 1000, // Always on top
      });

      // Vertex drag handlers
      let vertexStartPoints: Array<{ lat: number; lng: number }> = [...points];
      
      vertexMarker.on("dragstart", () => {
        vertexStartPoints = [...points];

        setDraggingState({
          landmarkId: landmark.id,
          originalPoints: [...points],
          newPoints: [...points],
          isMovingPolygon: false,
          vertexIndex: index,
        });
      });

      vertexMarker.on("drag", (e: any) => {
        const latlng = e.target.getLatLng();

        const updatedPoints = [...vertexStartPoints];
        updatedPoints[index] = { lat: latlng.lat, lng: latlng.lng };

        // Update polygon directly (no React state - this is fast!)
        const newCoords = [
          ...updatedPoints.map((p) => [p.lat, p.lng]),
          [updatedPoints[0].lat, updatedPoints[0].lng],
        ];
        polygon.setLatLngs(newCoords);

        // Update center marker directly
        const newCenterLat = updatedPoints.reduce((sum, p) => sum + p.lat, 0) / updatedPoints.length;
        const newCenterLng = updatedPoints.reduce((sum, p) => sum + p.lng, 0) / updatedPoints.length;
        centerMarker.setLatLng([newCenterLat, newCenterLng]);
      });

      vertexMarker.on("dragend", (e: any) => {
        const finalLatlng = e.target.getLatLng();
        const finalPoints = [...vertexStartPoints];
        finalPoints[index] = { lat: finalLatlng.lat, lng: finalLatlng.lng };

        const hasChanged = finalPoints.some((p, i) => 
          Math.abs(p.lat - vertexStartPoints[i].lat) > 0.0001 ||
          Math.abs(p.lng - vertexStartPoints[i].lng) > 0.0001
        );

        if (hasChanged) {
          setDraggingState({
            landmarkId: landmark.id,
            originalPoints: [...vertexStartPoints],
            newPoints: finalPoints,
            isMovingPolygon: false,
            vertexIndex: index,
          });
          setShowConfirmDialog(true);
        }
      });

      vertexMarker.addTo(mapInstance);
      vertexMarkers.push(vertexMarker);
    });

    // Center marker drag handlers (move entire polygon)
    let centerStartPoints: Array<{ lat: number; lng: number }> = [...points];
    let centerStartPosition = { lat: centerLat, lng: centerLng };

    centerMarker.on("dragstart", () => {
      centerStartPoints = [...points];
      centerStartPosition = { lat: centerLat, lng: centerLng };

      setDraggingState({
        landmarkId: landmark.id,
        originalPoints: [...points],
        newPoints: [...points],
        isMovingPolygon: true,
      });
    });

    centerMarker.on("drag", (e: any) => {
      const latlng = e.target.getLatLng();

      // Calculate delta
      const deltaLat = latlng.lat - centerStartPosition.lat;
      const deltaLng = latlng.lng - centerStartPosition.lng;

      // Move all points by the same delta
      const newPoints = centerStartPoints.map((p) => ({
        lat: p.lat + deltaLat,
        lng: p.lng + deltaLng,
      }));

      // Update polygon directly (no React state - this is fast!)
      const newCoords = [
        ...newPoints.map((p) => [p.lat, p.lng]),
        [newPoints[0].lat, newPoints[0].lng],
      ];
      polygon.setLatLngs(newCoords);

      // Update vertex markers directly
      vertexMarkers.forEach((vm, i) => {
        vm.setLatLng([newPoints[i].lat, newPoints[i].lng]);
      });
    });

    centerMarker.on("dragend", (e: any) => {
      const finalLatlng = e.target.getLatLng();
      const deltaLat = finalLatlng.lat - centerStartPosition.lat;
      const deltaLng = finalLatlng.lng - centerStartPosition.lng;
      const finalPoints = centerStartPoints.map((p) => ({
        lat: p.lat + deltaLat,
        lng: p.lng + deltaLng,
      }));

      const hasChanged = finalPoints.some((p, i) => 
        Math.abs(p.lat - centerStartPoints[i].lat) > 0.0001 ||
        Math.abs(p.lng - centerStartPoints[i].lng) > 0.0001
      );

      if (hasChanged) {
        setDraggingState({
          landmarkId: landmark.id,
          originalPoints: [...centerStartPoints],
          newPoints: finalPoints,
          isMovingPolygon: true,
        });
        setShowConfirmDialog(true);
      }
    });

    centerMarker.addTo(mapInstance);
    polygon.addTo(mapInstance);

    return { polygon, vertexMarkers, centerMarker, points };
  };

  // Update polygons when landmarks or map changes
  useEffect(() => {
    if (!map || !mapLoaded || !LRef.current) return;

    const L = LRef.current;

    // Remove existing polygons, vertices, and center markers
    polygonData.forEach((data) => {
      if (map.hasLayer(data.polygon)) {
        map.removeLayer(data.polygon);
      }
      data.vertexMarkers.forEach((vm) => {
        if (map.hasLayer(vm)) {
          map.removeLayer(vm);
        }
      });
      if (data.centerMarker && map.hasLayer(data.centerMarker)) {
        map.removeLayer(data.centerMarker);
      }
    });

    const newPolygonData = new Map<number, PolygonData>();

    landmarks.forEach((landmark) => {
      const hasAllPoints =
        landmark.point1_lat && landmark.point1_lng &&
        landmark.point2_lat && landmark.point2_lng &&
        landmark.point3_lat && landmark.point3_lng &&
        landmark.point4_lat && landmark.point4_lng &&
        landmark.point1_lat !== 0 && landmark.point1_lng !== 0;

      if (!hasAllPoints) return;

      const { polygon, vertexMarkers, centerMarker, points } = createEditablePolygon(landmark, L, map);
      newPolygonData.set(landmark.id, { polygon, vertexMarkers, centerMarker, landmarkId: landmark.id, points });
    });

    setPolygonData(newPolygonData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapLoaded, landmarks]);

  // Handle confirmation - save new position
  const handleConfirm = useCallback(async () => {
    if (!draggingState) return;

    setIsUpdating(true);
    try {
      const newPoints = draggingState.newPoints;
      
      // Update all 4 points via API (we'll need to extend the endpoint)
      await adminUpdateLandmarkCoordinates(draggingState.landmarkId, {
        point1_lat: newPoints[0].lat,
        point1_lng: newPoints[0].lng,
        point2_lat: newPoints[1].lat,
        point2_lng: newPoints[1].lng,
        point3_lat: newPoints[2].lat,
        point3_lng: newPoints[2].lng,
        point4_lat: newPoints[3].lat,
        point4_lng: newPoints[3].lng,
      });

      setDraggingState(null);
      setShowConfirmDialog(false);
      onUpdate();
    } catch (error: any) {
      console.error("Failed to update landmark coordinates:", error);
      alert(error?.message || "Failed to update landmark position. Please try again.");
      setDraggingState(null);
      setShowConfirmDialog(false);
      onUpdate(); // Refresh to revert
    } finally {
      setIsUpdating(false);
    }
  }, [draggingState, onUpdate]);

  // Handle cancellation - revert position
  const handleCancel = useCallback(() => {
    if (!draggingState || !map) {
      setDraggingState(null);
      setShowConfirmDialog(false);
      return;
    }

    const currentPolygonData = polygonData.get(draggingState.landmarkId);
    if (!currentPolygonData) {
      setDraggingState(null);
      setShowConfirmDialog(false);
      return;
    }

    // Revert polygon
    const originalCoords = [
      ...draggingState.originalPoints.map((p) => [p.lat, p.lng]),
      [draggingState.originalPoints[0].lat, draggingState.originalPoints[0].lng],
    ];
    currentPolygonData.polygon.setLatLngs(originalCoords);

    // Revert vertex markers
    currentPolygonData.vertexMarkers.forEach((vm, i) => {
      vm.setLatLng([draggingState.originalPoints[i].lat, draggingState.originalPoints[i].lng]);
    });

    // Revert local state
    setPolygonData((prev) => {
      const newMap = new Map(prev);
      const data = newMap.get(draggingState.landmarkId);
      if (data) {
        newMap.set(draggingState.landmarkId, { ...data, points: draggingState.originalPoints });
      }
      return newMap;
    });

    setDraggingState(null);
    setShowConfirmDialog(false);
  }, [draggingState, polygonData, map]);

  // Get landmark by ID
  const draggedLandmark = useMemo(() => {
    if (!draggingState) return null;
    return landmarks.find((l) => l.id === draggingState.landmarkId);
  }, [landmarks, draggingState]);

  return (
    <>
      <div className="space-y-4">
        {/* Zone/Quartier Selector */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">City</label>
            <Select value={selectedCity || undefined} onValueChange={(value) => setSelectedCity(value || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Zone</label>
            <Select value={selectedZone || undefined} onValueChange={(value) => setSelectedZone(value || "")} disabled={!selectedCity}>
              <SelectTrigger>
                <SelectValue placeholder={selectedCity ? "Select a zone" : "Select a city first"} />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(selectedCity || selectedZone) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCity("");
                setSelectedZone("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="w-full h-[calc(100vh-300px)] border rounded-lg overflow-hidden relative">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>
              {draggingState?.isMovingPolygon ? "Confirm Polygon Move" : "Confirm Vertex Update"}
            </DialogTitle>
            <DialogDescription>
              {draggingState?.isMovingPolygon
                ? `Move landmark "${draggedLandmark?.title}" to the new location?`
                : `Update landmark "${draggedLandmark?.title}" vertex position?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3 text-sm">
              {draggingState && draggingState.originalPoints.map((point, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-muted-foreground">Point {index + 1}:</span>
                  <div className="flex gap-4">
                    <span className="font-mono text-xs">
                      {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono text-xs text-blue-600">
                      {draggingState.newPoints[index]?.lat.toFixed(6)}, {draggingState.newPoints[index]?.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Confirm & Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
