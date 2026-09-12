import Link from "next/link";
import { Caveat } from "next/font/google";
import {
  Sparkles,
  ChevronDown,
  Play,
  Home,
  MessageSquare,
  FolderGit2,
  Share2,
  Settings,
  FileText,
  GitBranch,
  Send,
  Search,
  ZoomIn,
  Maximize2,
  Database,
  Code2,
  Network,
  FileCode,
  ArrowUpRight,
} from "lucide-react";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
});

const features = [
  { icon: Network, title: "Knowledge Graph", body: "Understand real\ncode relationships" },
  { icon: Sparkles, title: "AI Agent", body: "Plans, searches, and\nreasons across your code" },
  { icon: Database, title: "Multi-Repo Support", body: "Work across all your\nprojects" },
  { icon: FileText, title: "Source-Backed Answers", body: "Citations to files, functions,\nand commits" },
  { icon: Code2, title: "Built for Developers", body: "Modern, fast, and\nopen source friendly" },
];

function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="4.2" fill="#4F39E8" />
      <circle cx="26" cy="8" r="4.2" fill="#4F39E8" />
      <circle cx="17" cy="26" r="4.2" fill="#4F39E8" />
      <path
        d="M10.6 10.7 14.9 22M23.4 10.7 19.1 22M12.2 8H21.8"
        stroke="#4F39E8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="30.5" cy="3.5" r="3" fill="#4F39E8" />
      <path d="M27.7 5.7 24.8 7.2" stroke="#4F39E8" strokeWidth="1.8" />
    </svg>
  );
}

function Arrow({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <marker id={flip ? "arrow-tip-r" : "arrow-tip"} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8" fill="none" stroke="#5141E9" strokeWidth="1.7" />
        </marker>
      </defs>
      <path
        d="M5 8 C48 4, 70 28, 92 65"
        stroke="#5141E9"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd={`url(#${flip ? "arrow-tip-r" : "arrow-tip"})`}
      />
    </svg>
  );
}

function GraphNode({
  label,
  sub,
  tone,
  x,
  y,
}: {
  label: string;
  sub: string;
  tone: "blue" | "purple" | "green" | "orange" | "red";
  x: number;
  y: number;
}) {
  const tones = {
    blue: { border: "#78A8FF", bg: "#EFF6FF", dot: "#3B82F6" },
    purple: { border: "#9870FF", bg: "#F5F0FF", dot: "#7C3AED" },
    green: { border: "#62D5B0", bg: "#EDFCF5", dot: "#10B981" },
    orange: { border: "#FDB46D", bg: "#FFF6EB", dot: "#F97316" },
    red: { border: "#FF969C", bg: "#FFF0F1", dot: "#EF4444" },
  }[tone];

  return (
    <div
      className="graph-node"
      style={{
        left: x,
        top: y,
        borderColor: tones.border,
        background: tones.bg,
      }}
    >
      <div className="graph-node-title">
        <span className="node-dot" style={{ background: tones.dot }} />
        <FileCode size={10} strokeWidth={2.2} />
        <span>{label}</span>
      </div>
      <div className="graph-node-sub">{sub}</div>
    </div>
  );
}

function Graph() {
  return (
    <div className="graph-canvas">
      <svg className="graph-lines" viewBox="0 0 330 292" preserveAspectRatio="none">
        <defs>
          <marker id="graph-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#98A5BF" />
          </marker>
        </defs>

        <path className="graph-line graph-draw-1" d="M166 57 C166 72 166 77 166 96" markerEnd="url(#graph-arrow)" />
        <path className="graph-line graph-draw-2" d="M166 137 C135 157 100 168 78 177" markerEnd="url(#graph-arrow)" />
        <path className="graph-line graph-draw-3" d="M166 137 C196 157 232 168 252 177" markerEnd="url(#graph-arrow)" />
        <path className="graph-line graph-draw-4" d="M76 207 C83 230 94 241 107 252" markerEnd="url(#graph-arrow)" />
        <path className="graph-line graph-draw-5" d="M252 207 C246 230 237 241 224 252" markerEnd="url(#graph-arrow)" />
        <path className="graph-line graph-draw-6" d="M84 196 C132 218 198 219 247 196" markerEnd="url(#graph-arrow)" />
      </svg>

      <GraphNode label="upload.py" sub="/api" tone="blue" x={111} y={12} />
      <GraphNode label="process_video.py" sub="/services" tone="purple" x={78} y={78} />
      <GraphNode label="extract_audio.py" sub="/utils" tone="green" x={12} y={148} />
      <GraphNode label="transcribe.py" sub="/models" tone="orange" x={199} y={148} />
      <GraphNode label="format.py" sub="/utils" tone="blue" x={12} y={226} />
      <GraphNode label="save_to_db.py" sub="/database" tone="red" x={199} y={226} />
    </div>
  );
}

function PreviewPanel() {
  const nav = [
    { icon: Home, label: "Home", active: true },
    { icon: MessageSquare, label: "Chat" },
    { icon: FolderGit2, label: "Repositories" },
    { icon: Share2, label: "Graph Explorer" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="preview-wrap">
      <div className={`${caveat.className} callout callout-left`}>
        <span>Ask complex<br />questions</span>
        <Arrow className="callout-arrow-left" />
      </div>

      <div className={`${caveat.className} callout callout-right`}>
        <span>Visualize how<br />your code works</span>
        <Arrow flip className="callout-arrow-right" />
      </div>

      <div className="preview-card">
        <aside className="preview-sidebar">
          <div className="preview-brand">
            <Logo size={24} />
            <span>Synapse</span>
          </div>

          <div className="preview-nav">
            {nav.map(({ icon: Icon, label, active }) => (
              <div key={label} className={`preview-nav-item ${active ? "active" : ""}`}>
                <Icon size={15} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="preview-chat">
          <div className="repo-bar">
            <FileText size={13} />
            <span>synapse</span>
            <span className="repo-separator">·</span>
            <GitBranch size={13} />
            <span>main</span>
            <ChevronDown size={12} />
          </div>

          <div className="question-bubble">
            How does the video-transcription<br />
            pipeline work end to end?
          </div>

          <div className="answer-card">
            <div className="answer-title">Here&apos;s how it works:</div>
            <ol>
              <li><b>Upload:</b> Video is uploaded via FastAPI route <code>/upload</code></li>
              <li><b>Processing:</b> Passed to process_video()</li>
              <li><b>Transcription:</b> Audio extracted and sent to Whisper model</li>
              <li><b>Post-processing:</b> Results cleaned using format.py</li>
              <li><b>Storage:</b> Final transcript saved to database</li>
            </ol>

            <div className="related">
              <span><FolderGit2 size={11} /> Related files (5)</span>
              <ChevronDown size={11} />
            </div>
          </div>

          <div className="chat-input">
            <span>Ask anything about your codebase...</span>
            <button aria-label="Send"><Send size={14} /></button>
          </div>
        </main>

        <section className="preview-graph">
          <div className="graph-tabs">
            <div className="graph-tab-list">
              <span className="selected">Code Graph</span>
              <span>Files</span>
              <span>References</span>
            </div>
            <div className="graph-actions">
              <ZoomIn size={13} />
              <Search size={13} />
              <Maximize2 size={13} />
            </div>
          </div>
          <Graph />
        </section>
      </div>

      <div className={`${caveat.className} callout callout-bottom`}>
        <Arrow className="callout-arrow-bottom" />
        <span>Get accurate,<br />source-backed answers</span>
      </div>
    </div>
  );
}

function TrustedLogo({
  children,
  type,
}: {
  children: React.ReactNode;
  type: string;
}) {
  return (
    <div className="trusted-logo">
      <span className={`trusted-symbol ${type}`} aria-hidden="true">
        {type === "github" && "●"}
        {type === "vercel" && "▲"}
        {type === "linear" && "◉"}
        {type === "cursor" && "◇"}
        {type === "anthropic" && "AI"}
        {type === "openai" && "◎"}
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <main className="synapse-page">
        <div className="page-glow" />

        <header className="site-header">
          <Link href="/" className="brand">
            <Logo />
            <span>Synapse</span>
          </Link>

          <nav className="main-nav">
            <Link href="#product">Product <ChevronDown size={14} /></Link>
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#docs">Docs</Link>
            <Link href="#blog">Blog</Link>
          </nav>

          <div className="header-actions">
            <Link href="/login" className="signin">Sign in</Link>
            <Link href="/register" className="dark-button">
              Get Started <span>→</span>
            </Link>
          </div>
        </header>

        <section className="hero" id="product">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={13} />
              Turn Your Codebase into Knowledge
            </div>

            <h1>
              Chat with
              <br />
              your <span>codebase</span>,
              <br />
              like never before.
            </h1>

            <p>
              Synapse connects to your GitHub repos, builds a live knowledge
              graph, and lets an AI agent answer deep questions about your
              code with real context — not just text search.
            </p>

            <div className="hero-actions">
              <Link href="/register" className="dark-button hero-button">
                Get Started <span>→</span>
              </Link>

              <button className="demo-button">
                <span className="play-circle"><Play size={13} fill="currentColor" /></span>
                Watch Demo
              </button>
            </div>

            <div className="fine-print">Free for individual developers. No credit card required.</div>
          </div>

          <div className="hero-preview">
            <PreviewPanel />
          </div>
        </section>

        <section className="feature-strip" id="features">
          {features.map(({ icon: Icon, title, body }) => (
            <div className="feature" key={title}>
              <Icon className="feature-icon" size={28} strokeWidth={1.9} />
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </section>

        <section className="trusted">
          <p>Trusted by developers, from indie hackers to engineering teams</p>
          <div className="trusted-row">
            <TrustedLogo type="github">GitHub</TrustedLogo>
            <TrustedLogo type="vercel">Vercel</TrustedLogo>
            <TrustedLogo type="linear">Linear</TrustedLogo>
            <TrustedLogo type="cursor">Cursor</TrustedLogo>
            <TrustedLogo type="anthropic">Anthropic</TrustedLogo>
            <TrustedLogo type="openai">OpenAI</TrustedLogo>
          </div>
        </section>
      </main>


    </>
  );
}
