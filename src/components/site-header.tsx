"use client";

import Link from "next/link";
import { IconBell } from "@tabler/icons-react";
import { usePendingModeration } from "@/components/pending-moderation-provider";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/mode-toggle";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  const { counts } = usePendingModeration();
  const total = counts.total;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-1 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) lg:gap-2 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mx-2 data-[orientation=vertical]:h-4"
      />
      <h1 className="text-base font-medium">Admin</h1>
      {total > 0 ? (
        <Link
          href="/dashboard"
          className="ml-2 inline-flex items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-xs transition-colors hover:bg-muted"
        >
          <IconBell className="size-3.5 text-muted-foreground" stroke={1.75} />
          <span className="font-medium text-foreground">
            {total} pending review
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            · {counts.rent} rent · {counts.sale} sale · {counts.land} land
          </span>
          <Badge variant="secondary" className="ml-0.5 hidden h-5 px-1.5 text-[10px] sm:inline-flex">
            Queue
          </Badge>
        </Link>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  );
}
