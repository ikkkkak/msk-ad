"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBuilding,
  IconHome,
  IconMapPin,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  moderationPendingHref,
  type ModerationPendingItem,
  type ModerationPendingKind,
} from "@/lib/api";

const MODERATION_TOAST_ID = "moderation-queue-alert";

function kindMeta(kind: ModerationPendingKind) {
  switch (kind) {
    case "rent":
      return {
        label: "Rent",
        Icon: IconHome,
        badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
      };
    case "sale":
      return {
        label: "For sale",
        Icon: IconBuilding,
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "land":
      return {
        label: "Land",
        Icon: IconMapPin,
        badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      };
    default:
      return {
        label: "Listing",
        Icon: IconHome,
        badge: "bg-muted text-muted-foreground",
      };
  }
}

function ListingRow({
  item,
  onOpen,
}: {
  item: ModerationPendingItem;
  onOpen: () => void;
}) {
  const meta = kindMeta(item.kind);
  const img = item.image_url?.trim();
  const Icon = meta.Icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-left transition-colors hover:bg-muted/60"
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
        {img ? (
          <Image src={img} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="size-4 text-muted-foreground" stroke={1.5} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">
          {item.title || `Listing #${item.id}`}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              meta.badge,
            )}
          >
            {meta.label}
          </span>
          {item.city ? <span className="truncate">· {item.city}</span> : null}
        </p>
      </div>
    </button>
  );
}

export type ModerationAlertReason = "load" | "new";

function ModerationAlertCard({
  items,
  totalInQueue,
  reason,
  onDismiss,
}: {
  items: ModerationPendingItem[];
  totalInQueue: number;
  reason: ModerationAlertReason;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const previewCount = items.length;
  const total = Math.max(totalInQueue, previewCount);
  const headline =
    reason === "load"
      ? total === 1
        ? "1 listing awaiting review"
        : `${total} listings awaiting review`
      : previewCount === 1
        ? "New listing needs review"
        : `${previewCount} new listings need review`;

  const openItem = (item: ModerationPendingItem) => {
    onDismiss();
    router.push(moderationPendingHref(item.kind, item.id));
  };

  return (
    <div className="pointer-events-auto w-[min(100vw-2rem,380px)] overflow-hidden rounded-lg border border-border/80 border-l-4 border-l-amber-500 bg-card text-card-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-start gap-3 border-b border-border/60 bg-amber-500/5 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <IconBuilding className="size-4" stroke={1.75} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <span className="mb-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200">
            Important
          </span>
          <p className="text-sm font-semibold leading-tight">{headline}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {reason === "load"
              ? total > previewCount
                ? `${total} in queue · rent, sale, and land — review from the dashboard.`
                : "Pending moderation — approve or reject when ready."
              : totalInQueue > previewCount
                ? `${totalInQueue} total in queue · showing the latest ${Math.min(previewCount, 2)}`
                : "Submitted while you were away — open to approve or reject."}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <IconX className="size-4" />
        </button>
      </div>

      <div className="space-y-2 px-4 py-3">
        {items.slice(0, 2).map((item) => (
          <ListingRow
            key={`${item.kind}:${item.id}`}
            item={item}
            onOpen={() => openItem(item)}
          />
        ))}
        {previewCount > 2 ? (
          <p className="text-center text-xs text-muted-foreground">
            +{previewCount - 2} more shown in this alert
          </p>
        ) : null}
        {reason === "load" && total > previewCount && previewCount > 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            +{total - previewCount} more in the full queue
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-3">
        {previewCount === 1 ? (
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => openItem(items[0])}
          >
            Review listing
          </Button>
        ) : previewCount === 0 && total > 0 ? (
          <Button type="button" size="sm" className="flex-1" asChild>
            <Link href="/dashboard" onClick={onDismiss}>
              Open moderation queue
            </Link>
          </Button>
        ) : (
          <Button type="button" size="sm" className="flex-1" asChild>
            <Link href="/dashboard" onClick={onDismiss}>
              Open dashboard
            </Link>
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          Later
        </Button>
      </div>
    </div>
  );
}

/** One polished alert — on dashboard load (pending queue) or when new items arrive. */
export function showModerationBatchToast(
  items: ModerationPendingItem[],
  totalInQueue: number,
  reason: ModerationAlertReason = "new",
) {
  if (totalInQueue <= 0) return;
  if (reason === "new" && items.length === 0) return;

  toast.custom(
    (t) => (
      <ModerationAlertCard
        items={items}
        totalInQueue={totalInQueue}
        reason={reason}
        onDismiss={() => toast.dismiss(t)}
      />
    ),
    {
      id: MODERATION_TOAST_ID,
      duration: 14_000,
      position: "top-right",
      unstyled: true,
    },
  );
}
