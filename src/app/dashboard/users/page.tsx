"use client";

import { useEffect, useState } from "react";
import {
  listAdminUsers,
  adminUpdateUser,
  adminContactUser,
  AdminUser,
  type AdminUserListMetrics,
} from "@/lib/api";
import { AdminUsersMetricsOverview } from "@/components/admin-users-metrics";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editTrueBroker, setEditTrueBroker] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminUserListMetrics>({});
  const [contactUser, setContactUser] = useState<AdminUser | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  async function fetchData(p = page) {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminUsers({ page: p, per_page: perPage, role, q });
      setUsers(res.data);
      setTotal(res.meta.total);
      setPage(res.meta.page);
      setPerPage(res.meta.per_page);
      setMetrics(res.meta.metrics || {});
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(1); /* eslint-disable-next-line */
  }, [role, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function openEdit(u: AdminUser) {
    setEditUser(u);
    setEditTrueBroker(
      !!(u.trueBroker ?? (u as { true_broker?: boolean }).true_broker),
    );
  }
  function closeEdit() {
    setEditUser(null);
  }
  async function saveEdit() {
    if (!editUser) return;
    setEditLoading(true);
    try {
      await adminUpdateUser(editUser.ID, { trueBroker: editTrueBroker });
      closeEdit();
      fetchData(page);
    } catch (e: any) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  }

  function openContact(u: AdminUser) {
    setContactUser(u);
    setContactMessage("");
    setContactError(null);
    setContactSuccess(null);
  }

  function closeContact() {
    setContactUser(null);
    setContactMessage("");
    setContactError(null);
    setContactSuccess(null);
  }

  async function sendContact() {
    if (!contactUser) return;
    const text = contactMessage.trim();
    if (!text) {
      setContactError("Please enter a message.");
      return;
    }
    setContactLoading(true);
    setContactError(null);
    setContactSuccess(null);
    try {
      await adminContactUser(contactUser.ID, text);
      setContactSuccess("Message sent. The user will see it from Meskeny Team in their inbox.");
      setContactMessage("");
    } catch (e: any) {
      setContactError(e?.message || "Failed to send message");
    } finally {
      setContactLoading(false);
    }
  }

  const listFiltered = !!(q.trim() || role);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse accounts, review verification, and see how signups are trending.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchData(1);
            }}
            className="w-full sm:w-64"
          />
          <Select
            onValueChange={(v) => setRole(v === "all" ? undefined : v)}
            value={role || "all"}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="host">host</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="super_admin">super_admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            onClick={() => fetchData(1)}
            disabled={loading}
          >
            Apply filters
          </Button>
        </div>
      </div>

      <AdminUsersMetricsOverview
        metrics={metrics}
        listTotal={total}
        listFiltered={listFiltered}
      />

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          User directory
        </h2>
        <p className="text-sm text-muted-foreground mb-3 max-w-2xl leading-relaxed">
          The numbers above are for the whole app. This table only changes when
          you search or pick a role — use &quot;Apply filters&quot; to update the
          list.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>TrueBroker</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-red-600">
                  {error}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No users found</TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const name =
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  `User #${u.ID}`;
                const avatar = u.avatarURL || "/avatar-placeholder.png";
                return (
                  <TableRow key={u.ID}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                          <Image
                            src={avatar}
                            alt={name}
                            width={32}
                            height={32}
                            className="h-8 w-8 object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">
                            {name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{u.ID}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phoneNumber || "—"}</TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">
                      {u.role || "user"}
                    </TableCell>
                    <TableCell>
                      {(u.trueBroker ??
                      (u as { true_broker?: boolean }).true_broker) ? (
                        <span className="text-xs font-medium text-blue-600">
                          ✓ TrueBroker
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${u.verificationStatus === "verified" ? "text-green-600" : u.verificationStatus === "rejected" ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          {u.verificationStatus || "pending"}
                        </span>
                        <Link
                          href={`/dashboard/users/${u.ID}/verification`}
                          className="text-xs underline"
                        >
                          Review
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openContact(u)}
                        >
                          Contact
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — TrueBroker</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground">
                {[editUser.firstName, editUser.lastName]
                  .filter(Boolean)
                  .join(" ") || `User #${editUser.ID}`}{" "}
                — {editUser.email}
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-4">
                <Checkbox
                  id="trueBroker"
                  checked={editTrueBroker}
                  onCheckedChange={(c) => setEditTrueBroker(c === true)}
                />
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="trueBroker"
                    className="cursor-pointer font-medium"
                  >
                    TrueBroker
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, all properties listed by this user (or their
                    organization) will show the TrueBroker badge.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEdit}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editLoading}>
              {editLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contactUser} onOpenChange={(open) => !open && closeContact()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact user — Meskeny Team</DialogTitle>
          </DialogHeader>
          {contactUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This sends an official direct message from{" "}
                <strong>Meskeny Team</strong> to{" "}
                {[contactUser.firstName, contactUser.lastName]
                  .filter(Boolean)
                  .join(" ") || `User #${contactUser.ID}`}
                . It appears in their Messages inbox with the verified Meskeny badge.
              </p>
              <Textarea
                placeholder="Write your message to the user…"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={6}
                maxLength={4000}
              />
              {contactError ? (
                <p className="text-sm text-red-600">{contactError}</p>
              ) : null}
              {contactSuccess ? (
                <p className="text-sm text-green-700">{contactSuccess}</p>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeContact} disabled={contactLoading}>
              Close
            </Button>
            <Button onClick={sendContact} disabled={contactLoading || !contactMessage.trim()}>
              {contactLoading ? "Sending…" : "Send as Meskeny Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Rows in this view:{" "}
          <span className="font-medium text-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => fetchData(page - 1)}
          >
            Prev
          </Button>
          <div className="text-sm">
            Page {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => fetchData(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
