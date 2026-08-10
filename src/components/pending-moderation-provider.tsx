"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getAdminModerationPending,
  getAdminWhatsAppShareBadge,
  type ModerationPendingItem,
} from "@/lib/api";
import { showModerationBatchToast } from "@/components/moderation-alert-toast";
import type { NavBadgeKey } from "@/lib/nav";

const POLL_MS = 30_000;

type Counts = {
  rent: number;
  sale: number;
  land: number;
  total: number;
  whatsapp: number;
};

type Ctx = {
  counts: Counts;
  items: ModerationPendingItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  badgeFor: (key?: NavBadgeKey) => number;
};

const PendingModerationContext = createContext<Ctx | null>(null);

function itemKey(item: ModerationPendingItem) {
  return `${item.kind}:${item.id}`;
}

export function PendingModerationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const seenRef = useRef<Set<string>>(new Set());
  const lastPollAtRef = useRef<string | null>(null);
  const bootstrappedRef = useRef(false);
  const [counts, setCounts] = useState<Counts>({
    rent: 0,
    sale: 0,
    land: 0,
    total: 0,
    whatsapp: 0,
  });
  const [items, setItems] = useState<ModerationPendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const since = lastPollAtRef.current ?? undefined;
      const [moderationRes, whatsappBadgeRes] = await Promise.all([
        getAdminModerationPending(since),
        getAdminWhatsAppShareBadge().catch(() => ({
          data: { count: 0 },
        })),
      ]);
      const data = moderationRes.data;
      const total = Number(data.counts.total ?? 0);
      setCounts({
        rent: Number(data.counts.rent ?? 0),
        sale: Number(data.counts.sale ?? 0),
        land: Number(data.counts.land ?? 0),
        total,
        whatsapp: Number(whatsappBadgeRes.data.count ?? 0),
      });
      setItems(data.items ?? []);

      const incoming = data.items ?? [];

      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        incoming.forEach((it) => seenRef.current.add(itemKey(it)));
        if (total > 0 && document.visibilityState === "visible") {
          showModerationBatchToast(incoming, total, "load");
        }
      } else {
        const newlyArrived = incoming.filter(
          (it) => !seenRef.current.has(itemKey(it)),
        );
        if (
          newlyArrived.length > 0 &&
          document.visibilityState === "visible"
        ) {
          showModerationBatchToast(newlyArrived, total, "new");
          newlyArrived.forEach((it) => seenRef.current.add(itemKey(it)));
        }
      }

      lastPollAtRef.current = new Date().toISOString();
    } catch {
      /* offline / auth */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const badgeFor = useCallback(
    (key?: NavBadgeKey) => {
      if (!key) return 0;
      return counts[key] ?? 0;
    },
    [counts],
  );

  const value = useMemo(
    () => ({ counts, items, loading, refresh, badgeFor }),
    [counts, items, loading, refresh, badgeFor],
  );

  return (
    <PendingModerationContext.Provider value={value}>
      {children}
    </PendingModerationContext.Provider>
  );
}

export function usePendingModeration() {
  const ctx = useContext(PendingModerationContext);
  if (!ctx) {
    throw new Error("usePendingModeration requires PendingModerationProvider");
  }
  return ctx;
}
