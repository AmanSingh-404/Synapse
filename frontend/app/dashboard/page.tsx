"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type RepoSummary = {
  repo_id: string;
  name: string;
  github_url: string;
  status: string;
  node_count: number;
  edge_count: number;
  created_at: string;
};

export default function DashboardPage() {
  const { userId, loading, logout } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !userId) {
      router.push("/login");
    }
  }, [loading, userId, router]);

  useEffect(() => {
    if (userId) loadRepos();
  }, [userId]);

  const loadRepos = async () => {
    try {
      const data = await api.listRepos();
      setRepos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repos");
    }
  };

  const handleResync = async (repoId: string) => {
    setResyncingId(repoId);
    setError("");
    try {
      await api.resyncRepo(repoId);
      await loadRepos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-sync failed");
    } finally {
      setResyncingId(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading...</div>;
  if (!userId) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Your repos</h1>
        <div className="flex gap-3">
          <Link href="/onboarding" className="px-4 py-2 bg-white text-black rounded font-medium">
            Connect a repo
          </Link>
          <button onClick={logout} className="px-4 py-2 bg-neutral-800 rounded">
            Log out
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {repos.length === 0 ? (
        <p className="text-neutral-500">No repos connected yet.</p>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.repo_id}
              className="border border-neutral-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{repo.name}</p>
                <p className="text-xs text-neutral-500">
                  {repo.status} · {repo.node_count} nodes · {repo.edge_count} edges
                </p>
              </div>
              <div className="flex gap-2">
                {repo.status === "indexed" && (
                  <Link
                    href={`/chat/${repo.repo_id}`}
                    className="px-3 py-1.5 text-sm bg-white text-black rounded"
                  >
                    Open chat
                  </Link>
                )}
                <button
                  onClick={() => handleResync(repo.repo_id)}
                  disabled={resyncingId === repo.repo_id}
                  className="px-3 py-1.5 text-sm bg-neutral-800 rounded disabled:opacity-50"
                >
                  {resyncingId === repo.repo_id ? "Syncing..." : "Re-sync"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}