"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8 border border-neutral-800 rounded-lg">
        <h1 className="text-2xl font-semibold">Log in to Synapse</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
          required
        />
        <button type="submit" className="w-full py-2 bg-white text-black rounded font-medium">
          Log in
        </button>
        <p className="text-sm text-neutral-400">
          No account? <a href="/register" className="underline">Register</a>
        </p>
      </form>
    </div>
  );
}