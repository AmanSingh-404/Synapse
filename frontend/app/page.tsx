import Link from "next/link";

function HeroGraph() {
  return (
    <svg viewBox="0 0 400 340" className="w-full h-auto max-w-md">
      <g stroke="#D4D4D8" strokeWidth="1.5" fill="none">
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
      <g stroke="#4338CA" strokeWidth="2" fill="none">
        <line x1="200" y1="40" x2="190" y2="160" />
        <line x1="190" y1="160" x2="180" y2="290" />
      </g>
      {[
        [80, 60], [200, 40], [320, 90], [60, 170],
        [300, 200], [100, 280], [260, 300],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#FFFFFF" stroke="#A1A1AA" strokeWidth="1.5" />
      ))}
      <circle cx="190" cy="160" r="7" fill="#4338CA" />
      <circle cx="180" cy="290" r="7" fill="#4338CA" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 800px 400px at 70% -10%, var(--color-accent-soft), transparent)",
          }}
        />
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--color-accent)" }}>
              Agentic GraphRAG for your own codebase
            </p>
            <h1
              className="text-4xl md:text-5xl leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Your codebase, wired into a queryable brain.
            </h1>
            <p className="text-base leading-relaxed mb-10 max-w-md" style={{ color: "var(--color-text-muted)" }}>
              Synapse connects to your GitHub repos, builds a live knowledge graph of how your
              code actually fits together, and lets an AI agent answer questions no plain
              chatbot-over-docs can — with a graph that lights up as it reasons.
            </p>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="inline-block px-7 py-3 rounded-lg font-medium"
                style={{ background: "var(--color-accent)", color: "var(--color-accent-text)", fontFamily: "var(--font-display)" }}
              >
                Connect GitHub
              </Link>
              <Link
                href="/login"
                className="inline-block px-7 py-3 rounded-lg font-medium"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text)" }}
              >
                Log in
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroGraph />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          Most &quot;chat with your codebase&quot; tools are just embeddings wrappers.
        </h2>
        <p className="leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          They can tell you what a function&apos;s docstring says. They can&apos;t tell you what
          breaks if you change its signature, trace a request end to end across files, or
          spot the same pattern reused across three different repos. That requires an actual
          call graph — not just semantic similarity over text.
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20" style={{ borderTop: "1px solid var(--color-border)" }}>
        <h2 className="text-2xl mb-12" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              title: "Connect a repo",
              body: "GitHub OAuth, pick a repo, and Synapse clones and parses it — building both a call/import graph and a semantic index.",
            },
            {
              n: "02",
              title: "Ask anything",
              body: "An agent decides per-question whether to traverse the graph, search semantically, or both — then multi-hops if it isn't confident yet.",
            },
            {
              n: "03",
              title: "Watch it reason",
              body: "The graph highlights exactly which functions, classes, and files the answer was built from — in real time.",
            },
          ].map((step) => (
            <div key={step.n} className="p-6 rounded-xl" style={{ background: "var(--color-surface)" }}>
              <div className="text-sm mb-3" style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)" }}>
                {step.n}
              </div>
              <h3 className="font-medium mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech showcase */}
      <section className="max-w-5xl mx-auto px-6 py-20" style={{ borderTop: "1px solid var(--color-border)" }}>
        <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          A real call graph, not a vector index pretending to be one
        </h2>
        <p className="mb-10 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Neo4j for structure, Weaviate for semantics, LangGraph for routing between them.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {["Neo4j", "Weaviate", "LangGraph", "FastAPI"].map((tech) => (
            <div
              key={tech}
              className="px-4 py-6 rounded-xl text-center text-sm font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
            >
              {tech}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-24 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
        <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          Wire up your first repo
        </h2>
        <Link
          href="/register"
          className="inline-block px-7 py-3 rounded-lg font-medium"
          style={{ background: "var(--color-accent)", color: "var(--color-accent-text)", fontFamily: "var(--font-display)" }}
        >
          Connect GitHub
        </Link>
      </section>
    </div>
  );
}