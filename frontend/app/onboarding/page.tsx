"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type GithubRepo = { name: string; url: string; private: boolean; updated_at: string };

export default function OnboardingPage() {
  const { userId, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [githubConnected, setGithubConnected] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selectedRepoUrl, setSelectedRepoUrl] = useState<string | null>(null);
  const [connectedRepoId, setConnectedRepoId] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !userId) router.push("/login");
  }, [loading, userId, router]);

  useEffect(() => {
    if (loading || !userId) return; // wait for auth to resolve first

    const githubParam = searchParams.get("github");
    if (githubParam === "connected") {
      setGithubConnected(true);
      loadRepos();
    } else {
      checkGithubStatus();
    }
  }, [loading, userId, searchParams]);
  
  const checkGithubStatus = async () => {
    try {
      const data = await api.listGithubRepos();
      setRepos(data);
      setGithubConnected(true);
    } catch {
      // Not connected yet — leave githubConnected false, show the Connect button
    }
  };

  const loadRepos = async () => {
    try {
      const data = await api.listGithubRepos();
      setRepos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repos");
    }
  };

  const handleConnectGithub = async () => {
    const data = await api.githubLogin();
    window.location.href = data.authorize_url;
  };

  const handleSelectRepo = async (url: string) => {
    setError("");
    setSelectedRepoUrl(url);
    try {
      const connectData = await api.connectRepo(url);
      setConnectedRepoId(connectData.repo_id);
      setIngestStatus("cloned");

      // Kick off ingestion
      setIngestStatus("parsing");
      const ingestData = await api.ingestRepo(connectData.repo_id);
      setIngestStatus(ingestData.status);

      // Once indexed, move to the chat page
      if (ingestData.status === "indexed") {
        router.push(`/chat/${connectData.repo_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion failed");
      setIngestStatus("failed");
    }
  };

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Connect your codebase</h1>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!githubConnected ? (
        <button
          onClick={handleConnectGithub}
          className="px-6 py-3 bg-white text-black rounded font-medium"
        >
          Connect GitHub
        </button>
      ) : (
        <div>
          <h2 className="text-lg font-medium mb-3">Select a repository</h2>
          {repos.length === 0 && <p className="text-neutral-400">Loading repos...</p>}
          <ul className="space-y-2">
            {repos.map((repo) => (
              <li key={repo.url}>
                <button
                  onClick={() => handleSelectRepo(repo.url)}
                  disabled={!!selectedRepoUrl}
                  className={`w-full text-left px-4 py-3 rounded border ${
                    selectedRepoUrl === repo.url
                      ? "border-white bg-neutral-900"
                      : "border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <span className="font-medium">{repo.name}</span>
                  {repo.private && <span className="ml-2 text-xs text-neutral-500">(private)</span>}
                </button>
              </li>
            ))}
          </ul>

          {ingestStatus && (
            <div className="mt-6 p-4 border border-neutral-800 rounded">
              <p className="text-sm text-neutral-400">
                Status: <span className="text-white">{ingestStatus}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}