"use client";

/**
 * Pharmacy Staff — Stock Check
 */

import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STOCK = [
  { name: "Amoxicillin 500mg Caps", category: "Antibiotic", stock: 450, status: "In Stock" },
  { name: "Paracetamol 500mg Tabs", category: "Analgesic", stock: 1200, status: "In Stock" },
  { name: "Metformin 500mg Tabs", category: "Antidiabetic", stock: 80, status: "Low Stock" },
  { name: "Artemether + Lumefantrine", category: "Antimalarial", stock: 320, status: "In Stock" },
  { name: "Omeprazole 20mg Caps", category: "Antacid", stock: 15, status: "Critical" },
];

export default function PharmacyStockPage() {
  return (
    <HospitalSidebarWrapper currentPath="/hospital/pharmacy/stock" role={UserRole.PHARMACY}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-5xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" /> Pharmacy Stock Inventory
          </h1>
          <p className="text-sm text-muted-foreground">Monitor pharmaceutical inventory and reorder thresholds</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {STOCK.map((item) => (
            <Card key={item.name} className="data-visualization">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{item.stock} units</span>
                  <Badge variant="outline" className={item.status === "In Stock" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                    {item.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
