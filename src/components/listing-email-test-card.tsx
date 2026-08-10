"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAdminLandmarks,
  listAdminProperties,
  listAdminPropertySales,
  sendAdminListingTestEmail,
  type AdminLandmark,
  type AdminProperty,
  type AdminPropertySale,
  type ListingEmailTestKind,
} from "@/lib/api";

type ListingOption = {
  id: number;
  label: string;
};

function listingLabel(id: number, title: string, city?: string) {
  const place = city?.trim();
  return place ? `#${id} · ${title} (${place})` : `#${id} · ${title}`;
}

export function ListingEmailTestCard() {
  const [kind, setKind] = useState<ListingEmailTestKind>("property_sale");
  const [listingId, setListingId] = useState<string>("");
  const [toEmail, setToEmail] = useState("");
  const [options, setOptions] = useState<ListingOption[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const kindLabel = useMemo(() => {
    switch (kind) {
      case "rent":
        return "Rent listing";
      case "land":
        return "Land for sale";
      default:
        return "Property for sale";
    }
  }, [kind]);

  const loadListings = useCallback(async (nextKind: ListingEmailTestKind) => {
    setLoadingList(true);
    setError(null);
    setSuccess(null);
    try {
      let next: ListingOption[] = [];
      if (nextKind === "property_sale") {
        const res = await listAdminPropertySales();
        next = (res.properties || []).map((p: AdminPropertySale) => ({
          id: p.id,
          label: listingLabel(p.id, p.title, p.city),
        }));
      } else if (nextKind === "rent") {
        const res = await listAdminProperties({ page: 1, per_page: 100 });
        next = (res.data || []).map((p: AdminProperty) => ({
          id: p.ID,
          label: listingLabel(p.ID, p.title, p.city),
        }));
      } else {
        const res = await listAdminLandmarks();
        next = (res.landmarks || []).map((l: AdminLandmark) => ({
          id: l.id,
          label: listingLabel(l.id, l.title, l.district || l.region),
        }));
      }
      next.sort((a, b) => b.id - a.id);
      setOptions(next);
      setListingId(next[0] ? String(next[0].id) : "");
    } catch (e: unknown) {
      setOptions([]);
      setListingId("");
      setError(e instanceof Error ? e.message : "Failed to load listings");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadListings(kind);
  }, [kind, loadListings]);

  const sendTest = async () => {
    const id = Number(listingId);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Choose a listing");
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await sendAdminListingTestEmail({
        to: toEmail.trim() || undefined,
        listing_kind: kind,
        listing_id: id,
      });
      setSuccess(`Test email sent to ${res.to} for “${res.listing.title}”.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing email test</CardTitle>
        <CardDescription>
          Send a sample new-listing alert via Gmail. Pick a listing to include in the
          email body. Leave recipient blank to use the server&apos;s{" "}
          <code className="text-xs">ADMIN_NOTIFY_EMAIL</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Listing type
            </label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as ListingEmailTestKind)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="property_sale">Property for sale</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="land">Land for sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {kindLabel}
            </label>
            <Select
              value={listingId}
              onValueChange={setListingId}
              disabled={loadingList || options.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingList ? "Loading…" : "Choose listing"}
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Recipient (optional)
          </label>
          <Input
            type="email"
            placeholder="Defaults to ADMIN_NOTIFY_EMAIL on server"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => void sendTest()}
            disabled={sending || loadingList || !listingId}
          >
            {sending ? "Sending…" : "Send test email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadListings(kind)}
            disabled={loadingList}
          >
            Refresh list
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
