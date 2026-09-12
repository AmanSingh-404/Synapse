"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function displayNameFromEmail(email: string | null): string {
  if (!email) return "Account";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function AccountMenu() {
  const { email, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const name = displayNameFromEmail(email);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: "var(--soft)", color: "var(--purple)" }}
        >
          {name[0]}
        </div>
        <span style={{ color: "var(--ink)" }}>{name}</span>
        <ChevronDown size={14} style={{ color: "var(--muted)" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-lg py-1 z-20"
          style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)" }}
        >
          <div className="px-3 py-2 text-xs truncate" style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
            {email}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left"
            style={{ color: "var(--ink)" }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}