import Link from "next/link";
import { Space_Grotesk, Inter } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});

function HeroGraph() {
  return (
    <svg viewBox="0 0 400 340" className="w-full h-auto max-w-md">
      <g stroke="#2A3040" strokeWidth="1.5" fill="none">
        <line x1="80" y1="60" x2="200" y2="40" />
        <line x1="200" y1="40" x2="320" y2="90" />
        <line x1="80" y1="60" x2="60" y2="170" />
        <line x1="200" y1="40" x2="190" y2="160" />
        <line x1="320" y1="90" x2="300" y2="200" />
        <line x1="190" y1="160" x2="60" y2="170" />
        <line x1="190" y1="160" x2="300" y2="200" />
        <line x1="60" y1="170" x2="100" y2="280" />
        <line x1="190" y1="160" x2="180" y2="290" />
        <line x1="300" y1="200" x2="260" y2="300" />
        <line x1="100" y1="280" x2="180" y2="290" />
        <line x1="180" y1="290" x2="260" y2="300" />
      </g>
      <g stroke="#F5B942" strokeWidth="1.5" fill="none" opacity="0.9">
        <line x1="200" y1="40" x2="190" y2="160" />
        <line x1="190" y1="160" x2="180" y2="290" />
      </g>
      {[
        [80, 60], [200, 40], [320, 90], [60, 170],
        [300, 200], [100, 280], [260, 300],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#0A0E14" stroke="#4A5264" strokeWidth="1.5" />
      ))}
      <circle cx="190" cy="160" r="7" fill="#F5B942" />
      <circle cx="180" cy="290" r="7" fill="#F5B942" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} min-h-screen`}
      style={{ background: "#0A0E14", color: "#E8E6E1", fontFamily: "var(--font-body)" }}
    >
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1
            className="text-4xl md:text-5xl leading-[1.1] mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Your codebase, wired into a queryable brain.
          </h1>
          <p className="text-base leading-relaxed mb-10 max-w-md" style={{ color: "#8B8F98" }}>
            Synapse connects to your GitHub repos, builds a live knowledge graph of how your
            code actually fits together, and lets an AI agent answer questions no plain
            chatbot-over-docs can — with a graph that lights up as it reasons.
          </p>
          <Link
            href="/register"
            className="inline-block px-7 py-3 rounded-md font-medium"
            style={{ background: "#F5B942", color: "#0A0E14", fontFamily: "var(--font-display)" }}
          >
            Connect GitHub
          </Link>
        </div>
        <div className="flex justify-center md:justify-end">
          <HeroGraph />
        </div>
      </section>

      {/* Problem */}
      <section
        className="max-w-2xl mx-auto px-6 py-16"
        style={{ borderTop: "1px solid #1C2230" }}
      >
        <h2
          className="text-2xl mb-4"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Most &quot;chat with your codebase&quot; tools are just embeddings wrappers.
        </h2>
        <p className="leading-relaxed" style={{ color: "#8B8F98" }}>
          They can tell you what a function&apos;s docstring says. They can&apos;t tell you what
          breaks if you change its signature, trace a request end to end across files, or
          spot the same pattern reused across three different repos. That requires an actual
          call graph — not just semantic similarity over text.
        </p>
      </section>

      {/* How it works */}
      <section
        className="max-w-5xl mx-auto px-6 py-20"
        style={{ borderTop: "1px solid #1C2230" }}
      >
        <h2
          className="text-2xl mb-12"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          How it works
        </h2>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          <div
            className="hidden md:block absolute top-3 left-0 right-0 h-px"
            style={{ background: "#1C2230" }}
          />
          {[
            {
              n: "1",
              title: "Connect a repo",
              body: "GitHub OAuth, pick a repo, and Synapse clones and parses it — building both a call/import graph and a semantic index.",
            },
            {
              n: "2",
              title: "Ask anything",
              body: "An agent decides per-question whether to traverse the graph, search semantically, or both — then multi-hops if it isn't confident yet.",
            },
            {
              n: "3",
              title: "Watch it reason",
              body: "The graph highlights exactly which functions, classes, and files the answer was built from — in real time.",
            },
          ].map((step) => (
            <div key={step.n} className="relative">
              <div
                className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs mb-4"
                style={{ background: "#0A0E14", border: "1px solid #F5B942", color: "#F5B942" }}
              >
                {step.n}
              </div>
              <h3 className="font-medium mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8B8F98" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="max-w-2xl mx-auto px-6 py-24 text-center"
        style={{ borderTop: "1px solid #1C2230" }}
      >
        <Link
          href="/register"
          className="inline-block px-7 py-3 rounded-md font-medium"
          style={{ background: "#F5B942", color: "#0A0E14", fontFamily: "var(--font-display)" }}
        >
          Connect GitHub
        </Link>
      </section>
    </div>
  );
}