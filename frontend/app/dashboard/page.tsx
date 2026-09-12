"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, FolderGit2, RefreshCw, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import AccountMenu from "@/components/AccountMenu";

function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="7" cy="7" r="3" fill="var(--purple)" />
      <circle cx="21" cy="7" r="3" fill="var(--purple)" />
      <circle cx="14" cy="21" r="3" fill="var(--purple)" />
      <path d="M9 9L12 18M19 9L16 18M10 7H18" stroke="var(--purple)" strokeWidth="1.5" />
    </svg>
  );
}

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
  const { userId, loading } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !userId) router.push("/login");
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

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen" style={{ background: "#fff" }}>
      <header className="flex items-center justify-between px-10 py-6" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--ink)" }}>
          <Logo />
          Synapse
        </div>
        <div className="flex items-center gap-4">
          <HelpCircle size={18} style={{ color: "var(--muted)" }} />
          <AccountMenu />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>Your repositories</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{repos.length} connected</p>
          </div>
          <Link
            href="/onboarding"
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--ink)", color: "#fff" }}
          >
            Connect a repo
          </Link>
        </div>

        {error && (
          <p className="text-sm mb-6 px-3 py-2 rounded-md" style={{ color: "#DC2626", background: "#FEF2F2" }}>
            {error}
          </p>
        )}

        {repos.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ border: "1px dashed var(--line)" }}>
            <FolderGit2 size={32} style={{ color: "var(--muted)" }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: "var(--muted)" }}>No repos connected yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repos.map((repo) => (
              <div
                key={repo.repo_id}
                className="flex items-center justify-between p-5 rounded-xl"
                style={{ border: "1px solid var(--line)" }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--soft)" }}>
                    <FolderGit2 size={18} style={{ color: "var(--purple)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: "var(--ink)" }}>{repo.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      <span style={{ color: repo.status === "indexed" ? "#10B981" : "var(--muted)" }}>{repo.status}</span>
                      {" · "}{repo.node_count} nodes · {repo.edge_count} edges
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {repo.status === "indexed" && (
                    <Link
                      href={`/chat/${repo.repo_id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "var(--purple)", color: "#fff" }}
                    >
                      <MessageSquare size={14} /> Open chat
                    </Link>
                  )}
                  <button
                    onClick={() => handleResync(repo.repo_id)}
                    disabled={resyncingId === repo.repo_id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                  >
                    <RefreshCw size={14} className={resyncingId === repo.repo_id ? "animate-spin" : ""} />
                    {resyncingId === repo.repo_id ? "Syncing..." : "Re-sync"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}