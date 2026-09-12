"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import GraphPanel from "@/components/GraphPanel";
import ChatSidebar from "@/components/ChatSidebar";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  touchedNodeIds?: string[];
};

export default function ChatPage() {
  const { repoId } = useParams<{ repoId: string }>();
  const { userId, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [latestTouchedNodes, setLatestTouchedNodes] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !userId) router.push("/login");
  }, [loading, userId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || asking) return;

    const question = input.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setAsking(true);

    try {
      const result = await api.query(repoId, question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, intent: result.intent, touchedNodeIds: result.touched_node_ids },
      ]);
      setLatestTouchedNodes(result.touched_node_ids);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setAsking(false);
    }
  };

  if (loading || !userId) return null;

  return (
    <div className="flex h-screen" style={{ background: "#fff" }}>
      <ChatSidebar activeRepoId={repoId} />

      <div className="flex-1 flex min-w-0">
        <div className="w-1/2 flex flex-col min-w-0" style={{ borderRight: "1px solid var(--line)" }}>
          <header className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <h1 className="text-base font-semibold" style={{ color: "var(--ink)" }}>Chat with your codebase</h1>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Ask something about this repo — e.g. &quot;What does the Session class do?&quot; or &quot;Who calls forge_tool?&quot;
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                                <div
                  className="inline-block max-w-[90%] px-4 py-2.5 rounded-xl text-sm text-left"
                  style={
                    msg.role === "user"
                      ? { background: "var(--purple)", color: "#fff" }
                      : { background: "var(--soft)", color: "var(--ink)" }
                  }
                >
                  {msg.role === "assistant" ? (
                    <div className="prose-chat">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "assistant" && msg.intent && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    intent: {msg.intent}
                    {msg.touchedNodeIds && msg.touchedNodeIds.length > 0 && (
                      <> · touched: {msg.touchedNodeIds.join(", ")}</>
                    )}
                  </p>
                )}
              </div>
            ))}
            {asking && <p className="text-sm" style={{ color: "var(--muted)" }}>Thinking...</p>}
            {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleAsk} className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--line)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this codebase..."
              className="flex-1 px-3 py-2.5 rounded-lg text-sm"
              style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
              disabled={asking}
            />
            <button
              type="submit"
              disabled={asking || !input.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: "var(--ink)", color: "#fff" }}
            >
              <Send size={14} /> Ask
            </button>
          </form>
        </div>

        <div className="w-1/2">
          <GraphPanel repoId={repoId} touchedNodeIds={latestTouchedNodes} />
        </div>
      </div>
    </div>
  );
}