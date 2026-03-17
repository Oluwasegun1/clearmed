"use client";

/**
 * Telemedicine: virtual visits and video consultations. Placeholder following project design system.
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
import { Phone, Video } from "lucide-react";

export default function TelemedicinePage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/telemedicine">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Telemedicine
            </h1>
            <p className="text-sm text-muted-foreground">
              Virtual visits and video consultations
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Video className="h-5 w-5" />
                Start a visit
              </CardTitle>
              <CardDescription>
                Connect with a provider from home
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full sm:w-auto">
                <Phone className="h-4 w-4 mr-2" />
                Schedule video visit
              </Button>
              <p className="text-xs text-muted-foreground">
                You can start a scheduled visit from your appointments or request a same-day visit when available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
