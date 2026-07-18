"use client";

import { useEffect, useState } from "react";
import { listAdminPropertySales, adminVerifyPropertySale, publishPropertySale, adminDeactivatePropertySale, adminReactivatePropertySale, type AdminPropertySale } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AdminPropertySalesPage() {
  const [items, setItems] = useState<AdminPropertySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const res = await listAdminPropertySales();
      setItems(res.properties || []);
    } catch (e: any) { setError(e?.message || "Failed to load"); } finally { setLoading(false); }
  }
  useEffect(() => { fetchData(); }, []);

  async function onApprove(p: AdminPropertySale) {
    await adminVerifyPropertySale(p.id, { is_verified: true, verification_notes: "Approved" });
    fetchData();
  }
  async function onReject(p: AdminPropertySale) {
    await adminVerifyPropertySale(p.id, { is_verified: false, verification_notes: "Rejected" });
    fetchData();
  }
  async function onPublish(p: AdminPropertySale) {
    await publishPropertySale(p.id);
    fetchData();
  }
  async function onDeactivate(p: AdminPropertySale) {
    await adminDeactivatePropertySale(p.id);
    fetchData();
  }
  async function onReactivate(p: AdminPropertySale) {
    await adminReactivatePropertySale(p.id);
    fetchData();
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Property Sales</h1>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={4} className="text-red-600">{error}</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No listings</TableCell></TableRow>
            ) : (
              items.map((p) => {
                const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : "/property-placeholder.jpg";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded-md bg-muted">
                          <Image src={img} alt={p.title} width={64} height={48} className="h-12 w-16 object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{p.title}</span>
                          <span className="text-xs text-muted-foreground">{p.property_type}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{[p.city, p.state, p.country].filter(Boolean).join(", ")}</TableCell>
                    <TableCell className="text-xs uppercase tracking-wide">
                      {p.is_deactivated ? "deactivated" : p.is_published ? "published" : p.is_verified ? "verified" : (p.status || "draft")}
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => onApprove(p)} disabled={p.is_verified}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => onReject(p)}>Reject</Button>
                      <Button size="sm" variant="default" onClick={() => onPublish(p)} disabled={!p.is_verified || p.is_published}>Publish</Button>
                      {p.is_deactivated ? (
                        <Button size="sm" variant="outline" onClick={() => onReactivate(p)}>Reactivate</Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => onDeactivate(p)} disabled={!p.is_published}>Deactivate</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


