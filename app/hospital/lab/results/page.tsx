"use client";

/**
 * Lab Staff — Results Upload
 */

import { useState } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LabResultsUploadPage() {
  const [authCode, setAuthCode] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      setAuthCode("");
      setNotes("");
    }, 1000);
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/lab/results" role={UserRole.LAB}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-3xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" /> Upload Laboratory Test Results
          </h1>
          <p className="text-sm text-muted-foreground">Attach test results to a pre-authorized lab request</p>
        </div>

        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Results Saved!</AlertTitle>
            <AlertDescription>The lab investigation result has been uploaded to the patient's record.</AlertDescription>
          </Alert>
        )}

        <Card className="data-visualization">
          <CardHeader>
            <CardTitle className="text-base">Upload Investigation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authCode">Authorization / Specimen Code</Label>
                <Input
                  id="authCode"
                  placeholder="e.g. AUTH-982341"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="results">Test Findings & Values</Label>
                <Textarea
                  id="results"
                  rows={5}
                  placeholder="e.g. Full Blood Count: Hb 13.5 g/dL, WBC 6.2 x10^9/L, Platelets 250 x10^9/L. All parameters within normal reference ranges..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={uploading} className="w-full gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Save Lab Results
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </HospitalSidebarWrapper>
  );
}
