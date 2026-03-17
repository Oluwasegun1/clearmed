"use client";

/**
 * Find Providers: search and view in-network providers. Placeholder following project design system.
 */

import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Stethoscope } from "lucide-react";

export default function FindProvidersPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/providers">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Find Providers
            </h1>
            <p className="text-sm text-muted-foreground">
              Search in-network doctors and facilities
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Search providers
              </CardTitle>
              <CardDescription>
                By specialty, location, or name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Specialty, doctor name, or location"
                    className="pl-9"
                  />
                </div>
                <Button>Search</Button>
              </div>
              <div className="rounded-lg border border-border/50 bg-card/50 p-8 text-center">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Enter a search term to find in-network providers near you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
