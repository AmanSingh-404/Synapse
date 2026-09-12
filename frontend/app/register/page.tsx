"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import AuthLeftPanel from "@/components/AuthLeftPanel";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.register(email, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 min-h-screen" style={{ background: "#fff" }}>
      <AuthLeftPanel />

      <div className="flex flex-col justify-center items-center px-6 py-16 relative">
        <p className="absolute top-8 right-8 text-sm" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--purple)" }}>
            Sign in
          </Link>
        </p>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>Create your account</h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Start exploring your codebase with AI.
          </p>

          {error && (
            <p className="text-sm mb-4 px-3 py-2 rounded-md" style={{ color: "#DC2626", background: "#FEF2F2" }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type="email"
                  placeholder="aman@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm"
                  style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm"
                  style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-medium text-sm mt-2"
              style={{ background: "#0d1832", color: "#fff" }}
            >
              Create account →
            </button>
          </form>

          <p className="text-xs mt-6" style={{ color: "var(--muted)" }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}