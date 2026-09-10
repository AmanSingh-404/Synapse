"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { userId, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userId) {
      router.push("/login");
    }
  }, [loading, userId, router]);

  if (loading) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading...</div>;
  if (!userId) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <h1 className="text-2xl font-semibold">Dashboard (placeholder)</h1>
      <p className="text-neutral-400 mt-2">Logged in as user {userId}</p>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-neutral-800 rounded">Log out</button>
    </div>
  );
}