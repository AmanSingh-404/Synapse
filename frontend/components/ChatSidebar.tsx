"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, FolderGit2 } from "lucide-react";
import { api } from "@/lib/api";
import AccountMenu from "@/components/AccountMenu";

function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="7" cy="7" r="3" fill="var(--purple)" />
      <circle cx="21" cy="7" r="3" fill="var(--purple)" />
      <circle cx="14" cy="21" r="3" fill="var(--purple)" />
      <path d="M9 9L12 18M19 9L16 18M10 7H18" stroke="var(--purple)" strokeWidth="1.5" />
    </svg>
  );
}

type RepoSummary = { repo_id: string; name: string; status: string };

export default function ChatSidebar({ activeRepoId }: { activeRepoId?: string }) {
  const [repos, setRepos] = useState<RepoSummary[]>([]);

  useEffect(() => {
    api.listRepos().then(setRepos).catch(() => {});
  }, []);

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col" style={{ borderRight: "1px solid var(--line)" }}>
      <div className="px-5 py-5 flex items-center gap-2 text-base font-semibold" style={{ color: "var(--ink)", borderBottom: "1px solid var(--line)" }}>
        <Logo />
        Synapse
      </div>

      <nav className="px-3 py-4 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--soft)", color: "var(--purple)" }}>
          <MessageSquare size={16} /> Chat
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ color: "var(--muted)" }}>
          <FolderGit2 size={16} /> Repositories
        </Link>
      </nav>

      <div className="px-5 pt-2 pb-2 text-xs font-semibold tracking-wide" style={{ color: "var(--muted)" }}>
        YOUR REPOS
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {repos.map((repo) => (
          <Link
            key={repo.repo_id}
            href={`/chat/${repo.repo_id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={
              repo.repo_id === activeRepoId
                ? { background: "var(--soft)", color: "var(--ink)", fontWeight: 500 }
                : { color: "var(--muted)" }
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: repo.status === "indexed" ? "#10B981" : "var(--line)" }}
            />
            <span className="truncate">{repo.name}</span>
          </Link>
        ))}
      </div>

      <div className="p-4" style={{ borderTop: "1px solid var(--line)" }}>
        <AccountMenu />
      </div>
    </aside>
  );
}