"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Shield,
  Database,
  Zap,
  Info,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Search as SearchIcon,
  Check,
  Loader2,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import OnboardingSidebar from "@/components/OnboardingSidebar";
import AccountMenu from "@/components/AccountMenu";

function GithubIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

type GithubRepo = { name: string; url: string; private: boolean; updated_at: string };

function TopBar() {
  return (
    <div className="flex items-center justify-end gap-4 px-10 py-6">
      <HelpCircle size={18} style={{ color: "var(--muted)" }} />
      <AccountMenu />
    </div>
  );
}

function StepEyebrow({ step }: { step: number }) {
  return (
    <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--purple)" }}>
      STEP {step} OF 4
    </p>
  );
}

// ---------- Step 1 ----------
function ConnectGithubStep({ onConnect }: { onConnect: () => void }) {
  const perks = [
    { icon: Lock, color: "#10B981", bg: "#ECFDF5", title: "Read-only access", body: "We only read your repositories. No code is modified." },
    { icon: Shield, color: "var(--purple)", bg: "var(--soft)", title: "Secure & encrypted", body: "Your data is encrypted and never used to train models." },
    { icon: Database, color: "#3B82F6", bg: "#EFF6FF", title: "Private by default", body: "Your repos and embeddings are isolated to your account." },
    { icon: Zap, color: "#F97316", bg: "#FFF7ED", title: "Quick setup", body: "Connect in seconds and start exploring." },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-8 mb-3">
        <div>
          <StepEyebrow step={1} />
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--ink)" }}>
            Connect your GitHub account
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-3 pt-2 shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--ink)" }}>
            <GithubIcon size={24} />
          </div>
          <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "var(--soft)", border: "1px solid var(--purple)" }}>
            <ShieldCheck size={18} style={{ color: "var(--purple)" }} />
          </div>
          <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--soft)", border: "1px solid var(--purple)" }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <circle cx="7" cy="7" r="3" fill="var(--purple)" />
              <circle cx="21" cy="7" r="3" fill="var(--purple)" />
              <circle cx="14" cy="21" r="3" fill="var(--purple)" />
              <path d="M9 9L12 18M19 9L16 18M10 7H18" stroke="var(--purple)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-10 max-w-lg" style={{ color: "var(--muted)" }}>
        Give Synapse access to your repositories to build a knowledge graph of your codebase.
        Your data stays secure and private.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {perks.map((p) => (
          <div key={p.title} className="p-4 rounded-xl" style={{ border: "1px solid var(--line)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: p.bg }}>
              <p.icon size={16} style={{ color: p.color }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>{p.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{p.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6" style={{ border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "var(--ink)" }}>
              <GithubIcon size={20} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>Connect with GitHub</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>You&apos;ll be redirected to GitHub to authorize Synapse.</p>
            </div>
          </div>
          <button
            onClick={onConnect}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--ink)", color: "#fff" }}
          >
            Connect GitHub <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex items-start gap-2 mt-5 p-3 rounded-lg text-xs" style={{ background: "var(--soft)" }}>
          <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--purple)" }} />
          <p style={{ color: "var(--ink)" }}>
            We request access to: public and private repositories (read-only), commit data, and metadata.
          </p>
        </div>
      </div>

      <p className="text-xs text-center mt-8" style={{ color: "var(--muted)" }}>
        By connecting, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

// ---------- Step 2 ----------
function SelectRepoStep({
  repos,
  selectedUrl,
  onSelect,
  onContinue,
}: {
  repos: GithubRepo[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = repos.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-3xl">
      <StepEyebrow step={2} />
      <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--ink)" }}>
        Select a repository
      </h1>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted)" }}>
        Choose the repository you want to index. You can connect more later.
      </p>

      <div className="relative mb-4">
        <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
          style={{ border: "1px solid var(--line)" }}
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
        {filtered.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>Loading repositories...</p>}
        {filtered.map((repo) => {
          const active = selectedUrl === repo.url;
          return (
            <button
              key={repo.url}
              onClick={() => onSelect(repo.url)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left"
              style={{ border: active ? "1px solid var(--purple)" : "1px solid var(--line)", background: active ? "var(--soft)" : "#fff" }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ border: `1px solid ${active ? "var(--purple)" : "var(--line)"}`, background: active ? "var(--purple)" : "#fff" }}
              >
                {active && <Check size={13} color="#fff" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{repo.name}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{repo.private ? "Private" : "Public"}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={!selectedUrl}
        className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: "var(--ink)", color: "#fff" }}
      >
        Continue to Indexing <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ---------- Step 3 ----------
const INDEX_STAGES = ["Cloning repository", "Parsing code (AST)", "Building knowledge graph", "Generating embeddings", "Finalizing"];

function IndexingStep({ repoName }: { repoName: string }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // Visual feedback only — the real /ingest call is a single synchronous
    // request; this animates through the stages we know actually happen,
    // it isn't reading real progress events (that's a known deferred upgrade).
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, INDEX_STAGES.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl">
      <StepEyebrow step={3} />
      <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--ink)" }}>
        Indexing {repoName}
      </h1>
      <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--muted)" }}>
        We&apos;re cloning your repository, analyzing the code, building a knowledge graph, and
        creating embeddings. This may take a moment.
      </p>

      <div className="rounded-xl p-6" style={{ border: "1px solid var(--line)" }}>
        {INDEX_STAGES.map((stage, i) => {
          const state = i < stageIndex ? "done" : i === stageIndex ? "active" : "pending";
          return (
            <div key={stage} className="flex items-center gap-3 py-2.5">
              {state === "done" && <CheckCircle2 size={16} style={{ color: "#10B981" }} />}
              {state === "active" && <Loader2 size={16} className="animate-spin" style={{ color: "var(--purple)" }} />}
              {state === "pending" && <Circle size={16} style={{ color: "var(--line)" }} />}
              <span className="text-sm" style={{ color: state === "pending" ? "var(--muted)" : "var(--ink)" }}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Step 4 ----------
function DoneStep({ repoId, nodeCount, edgeCount }: { repoId: string; nodeCount: number; edgeCount: number }) {
  const router = useRouter();
  return (
    <div className="max-w-3xl">
      <StepEyebrow step={4} />
      <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--ink)" }}>
        Your codebase is ready
      </h1>
      <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--muted)" }}>
        Indexed {nodeCount} nodes and {edgeCount} relationships. Start asking questions about your code.
      </p>
      <button
        onClick={() => router.push(`/chat/${repoId}`)}
        className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
        style={{ background: "var(--purple)", color: "#fff" }}
      >
        Start chatting <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ---------- Page ----------
export default function OnboardingPage() {

  const router = useRouter();
  const { userId, loading, email } = useAuth();

  const [step, setStep] = useState(1);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [repoId, setRepoId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !userId) return;
    checkGithubStatus();
  }, [loading, userId]);

  const checkGithubStatus = async () => {
    try {
      const data = await api.listGithubRepos();
      setRepos(data);
      setStep(2);
    } catch {
      setStep(1);
    }
  };

  const handleConnectGithub = async () => {
    const data = await api.githubLogin();
    window.location.href = data.authorize_url;
  };

  const handleSelectRepo = (url: string) => setSelectedUrl(url);

  const handleContinueToIndexing = async () => {
    if (!selectedUrl) return;
    setError("");
    setRepoName(selectedUrl.split("/").pop() || selectedUrl);
    setStep(3);
    try {
      const connectData = await api.connectRepo(selectedUrl);
      setRepoId(connectData.repo_id);
      const ingestData = await api.ingestRepo(connectData.repo_id);
      setNodeCount(ingestData.node_count);
      setEdgeCount(ingestData.edge_count);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion failed");
      setStep(2);
    }
  };

  if (loading || !userId) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "#fff" }}>
      <OnboardingSidebar currentStep={step} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 px-10 pb-16">
          {error && (
            <p className="text-sm mb-4 px-3 py-2 rounded-md max-w-3xl" style={{ color: "#DC2626", background: "#FEF2F2" }}>
              {error}
            </p>
          )}
          {step === 1 && <ConnectGithubStep onConnect={handleConnectGithub} />}
          {step === 2 && (
            <SelectRepoStep repos={repos} selectedUrl={selectedUrl} onSelect={handleSelectRepo} onContinue={handleContinueToIndexing} />
          )}
          {step === 3 && <IndexingStep repoName={repoName} />}
          {step === 4 && repoId && <DoneStep repoId={repoId} nodeCount={nodeCount} edgeCount={edgeCount} />}
        </div>
      </div>
    </div>
  );
}