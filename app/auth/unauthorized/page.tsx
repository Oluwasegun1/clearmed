"use client";

/**
 * Shown when a user tries to access a route their role is not allowed to view.
 */
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 rounded-lg border border-border bg-card shadow-sm max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access denied</h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to access this page. Contact your
          administrator if you believe this is an error.
        </p>
        <div className="flex flex-col space-y-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go back
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
          >
            Go to home
          </Button>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            variant="destructive"
            className="w-full"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
