"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithEmailPassword } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setError(null); setLoading(true);
    try {
      const { accessToken } = await loginWithEmailPassword(email, password);
      document.cookie = `accessToken=${accessToken}; path=/`;
      localStorage.setItem("accessToken", accessToken);
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 space-y-4">
        <h1 className="text-lg font-semibold">Admin Login</h1>
        <p className="text-sm text-muted-foreground">Sign in with your email and password.</p>
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button onClick={onLogin} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      </div>
    </div>
  );
}


