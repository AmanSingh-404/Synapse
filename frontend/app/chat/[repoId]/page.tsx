"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

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
        {
          role: "assistant",
          content: result.answer,
          intent: result.intent,
          touchedNodeIds: result.touched_node_ids,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setAsking(false);
    }
  };

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-lg font-medium">Chat with your codebase</h1>
        <p className="text-xs text-neutral-500">repo: {repoId}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <p className="text-neutral-500 text-sm">
            Ask something about this repo — e.g. &quot;What does the Session class do?&quot; or &quot;Who calls forge_tool?&quot;
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === "user" ? "bg-white text-black" : "bg-neutral-900 border border-neutral-800"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" && msg.intent && (
              <p className="text-xs text-neutral-600 mt-1">
                intent: {msg.intent}
                {msg.touchedNodeIds && msg.touchedNodeIds.length > 0 && (
                  <> · touched: {msg.touchedNodeIds.join(", ")}</>
                )}
              </p>
            )}
          </div>
        ))}
        {asking && <p className="text-neutral-500 text-sm">Thinking...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleAsk} className="border-t border-neutral-800 p-4 flex gap-2 max-w-3xl mx-auto w-full">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this codebase..."
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
          disabled={asking}
        />
        <button
          type="submit"
          disabled={asking || !input.trim()}
          className="px-4 py-2 bg-white text-black rounded font-medium disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}