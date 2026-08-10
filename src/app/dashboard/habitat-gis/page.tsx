"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HabitatBulkImport } from "@/components/habitat-bulk-import";
import { listHabitatPlans, type HabitatPlanRow } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HabitatGISPage() {
  const [plans, setPlans] = useState<HabitatPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHabitatPlans();
      setPlans(res.data ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Habitat cadastre (GIS)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plans, sectors, and land plots for Nouakchott — bulk import via JSON.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadPlans()}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Bulk import</TabsTrigger>
          <TabsTrigger value="plans">Plans ({plans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4">
          <HabitatBulkImport onSuccess={loadPlans} />
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No plans yet. Use Bulk import → “Load 9 Nouakchott plans” to seed districts.
            </p>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Arabic</TableHead>
                    <TableHead>Sectors</TableHead>
                    <TableHead>Plots</TableHead>
                    <TableHead>Area (m²)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.name_ar}</TableCell>
                      <TableCell>{p.sector_count}</TableCell>
                      <TableCell>{Number(p.plot_count).toLocaleString()}</TableCell>
                      <TableCell>
                        {Math.round(p.total_area_m2 || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
