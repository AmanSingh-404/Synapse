"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 p-8 rounded-lg"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
          Log in to Synapse
        </h1>
        {error && <p className="text-sm" style={{ color: "#E5484D" }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
          required
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-md font-medium"
          style={{ background: "var(--color-accent)", color: "var(--color-accent-text)", fontFamily: "var(--font-display)" }}
        >
          Log in
        </button>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "var(--color-accent)" }}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}