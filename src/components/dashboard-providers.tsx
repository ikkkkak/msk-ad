"use client";

import { PendingModerationProvider } from "@/components/pending-moderation-provider";
import { Toaster } from "@/components/ui/sonner";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <PendingModerationProvider>
      {children}
      <Toaster
        position="top-right"
        closeButton
        visibleToasts={3}
        gap={12}
        offset={{ top: 16, right: 16 }}
        toastOptions={{
          className: "border-border/80 shadow-lg",
        }}
      />
    </PendingModerationProvider>
  );
}
