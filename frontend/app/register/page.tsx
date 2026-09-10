"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.register(email, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8 border border-neutral-800 rounded-lg">
        <h1 className="text-2xl font-semibold">Create your account</h1>
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
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
          minLength={8}
          required
        />
        <button type="submit" className="w-full py-2 bg-white text-black rounded font-medium">
          Register
        </button>
        <p className="text-sm text-neutral-400">
          Already have an account? <a href="/login" className="underline">Log in</a>
        </p>
      </form>
    </div>
  );
}