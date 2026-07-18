"use client";

import { useEffect, useState } from "react";
import { listAdminUsers, AdminUser } from "@/lib/api";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
  // moved detailed review to its own page

  async function fetchData(p = page) {
    setLoading(true); setError(null);
    try {
      const res = await listAdminUsers({ page: p, per_page: perPage, role, q });
      setUsers(res.data);
      setTotal(res.meta.total);
      setPage(res.meta.page);
      setPerPage(res.meta.per_page);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, [role, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") fetchData(1); }} className="w-64" />
          <Select onValueChange={(v) => setRole(v === "all" ? undefined : v)} value={role || "all"}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="host">host</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="super_admin">super_admin</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => fetchData(1)} disabled={loading}>Filter</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={4} className="text-red-600">{error}</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No users found</TableCell></TableRow>
            ) : (
              users.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || `User #${u.ID}`;
                const avatar = u.avatarURL || "/avatar-placeholder.png";
                return (
                  <TableRow key={u.ID}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                          <Image src={avatar} alt={name} width={32} height={32} className="h-8 w-8 object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{name}</span>
                          <span className="text-xs text-muted-foreground">#{u.ID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">{u.role || "user"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${u.verificationStatus === 'verified' ? 'text-green-600' : u.verificationStatus === 'rejected' ? 'text-red-600' : 'text-muted-foreground'}`}>{u.verificationStatus || 'pending'}</span>
                        <Link href={`/dashboard/users/${u.ID}/verification`} className="text-xs underline">Review</Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => fetchData(page - 1)}>Prev</Button>
          <div className="text-sm">Page {page} / {totalPages}</div>
          <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => fetchData(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}


