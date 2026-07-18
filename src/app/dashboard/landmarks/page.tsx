"use client";

import { useEffect, useState } from "react";
import { listAdminLandmarks, adminVerifyLandmark, type AdminLandmark } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { LandmarkMapEditor } from "@/components/landmark-map-editor";

export default function AdminLandmarksPage() {
  const [items, setItems] = useState<AdminLandmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<AdminLandmark | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching admin landmarks...");
      const res = await listAdminLandmarks();
      console.log("Landmarks response:", res);
      setItems(res.landmarks || []);
    } catch (e: any) {
      console.error("Error fetching landmarks:", e);
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function onVerify(landmark: AdminLandmark, isVerified: boolean) {
    setIsVerifying(true);
    try {
      await adminVerifyLandmark(landmark.id, {
        is_verified: isVerified,
        verification_notes: verificationNotes || (isVerified ? "Approved by admin" : "Rejected by admin"),
      });
      setVerificationNotes("");
      setSelectedLandmark(null);
      fetchData();
    } catch (e: any) {
      setError(e?.message || "Failed to verify landmark");
    } finally {
      setIsVerifying(false);
    }
  }

  const getStatusBadge = (landmark: AdminLandmark) => {
    if (landmark.is_verified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    if (landmark.status === "pending_verification") {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    if (landmark.status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const getOrganizationName = (landmark: AdminLandmark) => {
    const name = landmark.organization?.name?.trim();
    return name && name.length > 0 ? name : "Not provided";
  };

  const filteredItems = items.filter(landmark => {
    if (filter === 'all') return true;
    if (filter === 'pending') return landmark.status === 'pending_verification';
    if (filter === 'verified') return landmark.is_verified;
    if (filter === 'rejected') return landmark.status === 'rejected';
    return true;
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Landmark Management</h1>
        <p className="text-sm text-muted-foreground">
          Review, verify, and manage landmark submissions from property owners
        </p>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="map">Map Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('pending')}
        >
          Pending ({items.filter(l => l.status === 'pending_verification').length})
        </Button>
        <Button 
          variant={filter === 'verified' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('verified')}
        >
          Verified ({items.filter(l => l.is_verified).length})
        </Button>
        <Button 
          variant={filter === 'rejected' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('rejected')}
        >
          Rejected ({items.filter(l => l.status === 'rejected').length})
          </Button>
          </div>

          <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Landmark</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-red-600">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No landmarks found for the selected filter</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((landmark) => (
                <TableRow key={landmark.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {landmark.images && landmark.images.length > 0 && (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                          <Image
                            src={landmark.images[0]}
                            alt={landmark.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkwxOCAyMEgzMEwyNCAxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4IDIwVjI4SDMwVjIwSDE4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">{landmark.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {landmark.description?.substring(0, 100)}
                          {landmark.description && landmark.description.length > 100 && "..."}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {landmark.images && landmark.images.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              📷 {landmark.images.length}
                            </Badge>
                          )}
                          {landmark.property_papers && landmark.property_papers.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              📄 {landmark.property_papers.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getOrganizationName(landmark)}</TableCell>
                  <TableCell>
                    {landmark.area} {landmark.area_unit}
                  </TableCell>
                  <TableCell>{landmark.land_type}</TableCell>
                  <TableCell>{getStatusBadge(landmark)}</TableCell>
                  <TableCell>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLandmark(landmark)}
                        >
                          Review
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[540px] max-h-screen overflow-hidden flex flex-col">
                        <SheetHeader className="flex-shrink-0">
                          <SheetTitle>Review Landmark: {landmark.title}</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Organization</label>
                              <p className="text-sm text-muted-foreground">{getOrganizationName(landmark)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Area</label>
                              <p className="text-sm text-muted-foreground">
                                {landmark.area} {landmark.area_unit}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Land Type</label>
                              <p className="text-sm text-muted-foreground">{landmark.land_type}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Zoning</label>
                              <p className="text-sm text-muted-foreground">{landmark.zoning}</p>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <p className="text-sm text-muted-foreground mt-1">{landmark.description}</p>
                          </div>

                          {/* Landmark Images */}
                          {landmark.images && landmark.images.length > 0 && (
                            <div>
                              <label className="text-sm font-medium">Landmark Images</label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {landmark.images.map((imageUrl, index) => (
                                  <div key={index} className="relative cursor-pointer" onClick={() => setSelectedImage(imageUrl)}>
                                    <Image
                                      src={imageUrl}
                                      alt={`Landmark image ${index + 1}`}
                                      width={150}
                                      height={100}
                                      className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA0MEw2NSA1MEg4NUw3NSA0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTY1IDUwVjcwSDg1VjUwSDY1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                      }}
                                      unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                                      <span className="text-white text-xs opacity-0 hover:opacity-100">Click to enlarge</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Property Papers */}
                          {landmark.property_papers && landmark.property_papers.length > 0 && (
                            <div>
                              <label className="text-sm font-medium">Property Papers</label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {landmark.property_papers.map((paperUrl, index) => (
                                  <div key={index} className="relative cursor-pointer" onClick={() => setSelectedImage(paperUrl)}>
                                    <Image
                                      src={paperUrl}
                                      alt={`Property paper ${index + 1}`}
                                      width={150}
                                      height={100}
                                      className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAyMEg5MFY4MEg2MFYyMFoiIGZpbGw9IndoaXRlIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNNjUgMjVIOThWNzVINjVWMjVaIiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4K';
                                      }}
                                      unoptimized
                                    />
                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                      Paper {index + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                                      <span className="text-white text-xs opacity-0 hover:opacity-100">Click to enlarge</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium">Verification Notes</label>
                            <textarea
                              placeholder="Add verification notes..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Fixed action buttons at bottom */}
                        <div className="flex-shrink-0 border-t pt-4 mt-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => onVerify(landmark, true)}
                              disabled={isVerifying || landmark.is_verified}
                              className="bg-green-600 hover:bg-green-700 flex-1"
                            >
                              {isVerifying ? "Verifying..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => onVerify(landmark, false)}
                              disabled={isVerifying}
                              variant="destructive"
                              className="flex-1"
                            >
                              {isVerifying ? "Verifying..." : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>
        </TabsContent>

        <TabsContent value="map">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-1">Map Editor Instructions</h3>
              <p className="text-sm text-blue-800">
                Drag any landmark marker to a new position on the map. You&apos;ll be asked to confirm before the change is saved.
              </p>
            </div>
            <LandmarkMapEditor landmarks={items} onUpdate={fetchData} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Full-screen image viewer */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
            >
              ✕
            </button>
            <Image
              src={selectedImage}
              alt="Full size view"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MDAgMjQwTDMwMCAzMDBINTAwTDQwMCAyNDBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0zMDAgMzAwVjQ1MEg1MDBWMzAwSDMwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
              }}
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
