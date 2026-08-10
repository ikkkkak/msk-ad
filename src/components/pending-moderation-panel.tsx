"use client";

import Image from "next/image";
import Link from "next/link";
import { IconBell, IconRefresh } from "@tabler/icons-react";
import { usePendingModeration } from "@/components/pending-moderation-provider";
import { moderationPendingHref } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function kindLabel(kind: string) {
  switch (kind) {
    case "rent":
      return "Rent";
    case "sale":
      return "For sale";
    case "land":
      return "Land";
    default:
      return kind;
  }
}

export function PendingModerationPanel() {
  const { counts, items, loading, refresh } = usePendingModeration();

  if (!loading && counts.total === 0) {
    return null;
  }

  return (
    <Card className="mx-4 border-l-4 border-l-primary shadow-sm lg:mx-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBell className="size-4 text-muted-foreground" stroke={1.75} />
            Moderation queue
          </CardTitle>
          <CardDescription>
            {counts.total} listing{counts.total === 1 ? "" : "s"} need review — rent{" "}
            {counts.rent}, sale {counts.sale}, land {counts.land}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {(items.length ? items : []).slice(0, 8).map((item) => {
          const href = moderationPendingHref(item.kind, item.id);
          const img = item.image_url?.trim();
          return (
            <Link
              key={`${item.kind}:${item.id}`}
              href={href}
              className="flex items-center gap-3 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {img ? (
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.title || `Listing #${item.id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {kindLabel(item.kind)}
                  {item.city ? ` · ${item.city}` : ""}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                Review
              </Badge>
            </Link>
          );
        })}
        {counts.total > 8 ? (
          <p className="text-center text-xs text-muted-foreground pt-1">
            +{counts.total - 8} more in the sidebar queues
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
