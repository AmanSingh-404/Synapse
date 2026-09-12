import { Sparkles } from "lucide-react";

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

const STEPS = [
  { n: 1, title: "Connect GitHub", body: "Give Synapse access to your repositories" },
  { n: 2, title: "Select Repository", body: "Choose which repo to index" },
  { n: 3, title: "Indexing", body: "We'll analyze and build your code graph" },
  { n: 4, title: "Done", body: "Start chatting with your codebase" },
];

export default function OnboardingSidebar({ currentStep }: { currentStep: number }) {
  return (
    <aside className="relative hidden lg:flex flex-col w-80 shrink-0 px-8 pt-8 h-screen sticky top-0 overflow-y-auto" style={{ borderRight: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 text-lg font-semibold mb-14" style={{ color: "var(--ink)" }}>
        <Logo />
        Synapse
      </div>

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const state = step.n < currentStep ? "done" : step.n === currentStep ? "active" : "pending";
          return (
            <div key={step.n} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                  style={
                    state === "active"
                      ? { background: "var(--purple)", color: "#fff" }
                      : state === "done"
                      ? { background: "var(--soft)", color: "var(--purple)", border: "1px solid var(--purple)" }
                      : { background: "#fff", color: "var(--muted)", border: "1px solid var(--line)" }
                  }
                >
                  {state === "done" ? "✓" : step.n}
                </div>
                {i < STEPS.length - 1 && <div className="w-px flex-1" style={{ background: "var(--line)", minHeight: 44 }} />}
              </div>
              <div className="pb-9">
                <p className="text-sm font-semibold" style={{ color: state === "pending" ? "var(--muted)" : "var(--ink)" }}>
                  {step.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{step.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pb-10">
        <Sparkles size={20} style={{ color: "var(--purple)" }} className="mb-3" />
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Your codebase,
          <br />
          now searchable.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Understand, explore, and build faster with AI.
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-24 -z-10"
        style={{ background: "linear-gradient(180deg, transparent, var(--soft))" }}
      />
    </aside>
  );
}