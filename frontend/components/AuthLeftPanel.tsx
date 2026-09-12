import { FileText, Database, Box } from "lucide-react";

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

function FloatingCard({
  icon: Icon,
  label,
  sub,
  style,
}: {
  icon: typeof FileText;
  label: string;
  sub: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="absolute flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
      style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "0 10px 30px -10px rgba(80,54,232,0.2)", ...style }}
    >
      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--soft)" }}>
        <Icon size={13} style={{ color: "var(--purple)" }} />
      </div>
      <div>
        <div className="font-medium" style={{ color: "var(--ink)" }}>{label}</div>
        <div style={{ color: "var(--muted)" }}>{sub}</div>
      </div>
    </div>
  );
}

export default function AuthLeftPanel() {
  return (
    <div
      className="relative hidden lg:flex flex-col justify-center px-16 h-screen overflow-hidden"
      style={{ background: "linear-gradient(160deg, var(--soft), #fff 60%)" }}
    >
      <div className="flex items-center gap-2 text-lg font-semibold mb-10 absolute top-10 left-16" style={{ color: "var(--ink)" }}>
        <Logo />
        Synapse
      </div>

      <p className="text-xs font-medium tracking-widest mb-4" style={{ color: "var(--purple)" }}>
        YOUR CODEBASE, A QUERYABLE BRAIN
      </p>
      <h1 className="text-4xl font-bold leading-[1.1] mb-5 max-w-sm" style={{ color: "var(--ink)" }}>
        Turn your codebase into <span style={{ color: "var(--purple)" }}>knowledge.</span>
      </h1>
      <p className="text-sm leading-relaxed mb-16 max-w-xs" style={{ color: "var(--muted)" }}>
        Connect your repositories, build a knowledge graph, and let an AI agent answer complex
        questions about your code.
      </p>

      <div className="relative h-56 w-full max-w-md">
        <div
          className="absolute rounded-xl p-4 text-xs font-mono w-52"
          style={{ background: "var(--ink)", color: "#E5E7EB", top: 20, left: 0, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.4)" }}
        >
          <div className="mb-1" style={{ color: "#9CA3AF" }}>main.py</div>
          <div><span style={{ color: "#C084FC" }}>def</span> <span style={{ color: "#93C5FD" }}>process</span>():</div>
          <div className="pl-3">data = load()</div>
          <div className="pl-3">result = analyze(data)</div>
          <div className="pl-3"><span style={{ color: "#C084FC" }}>return</span> result</div>
        </div>
        <FloatingCard icon={FileText} label="analyze()" sub="utils/analysis.py" style={{ top: 0, right: 20 }} />
        <FloatingCard icon={Database} label="load()" sub="data/loader.py" style={{ top: 70, right: 0 }} />
        <FloatingCard icon={Box} label="process()" sub="main.py" style={{ bottom: 0, left: 60 }} />
      </div>
    </div>
  );
}