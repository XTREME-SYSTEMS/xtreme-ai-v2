import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus, Search, Library, FolderOpen, MessageSquare, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LOGO_ICON } from "@/lib/brandAssets";
import { Image } from "@/components/ui/image";

// Left sidebar — narrow nav rail with logo, icons, recent sessions, profile.
export default function StudioSidebar({ user, sessions, activeSessionId, onSelectSession, onNewChat }) {
  const [hovered, setHovered] = useState(null);

  const initials = (user?.full_name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const navIcons = [
    { icon: Plus, label: "New chat", action: onNewChat },
    { icon: Search, label: "Search" },
    { icon: Library, label: "Library" },
    { icon: FolderOpen, label: "Projects" },
  ];

  return (
    <div className="flex w-16 shrink-0 flex-col bg-[#0d0d0d] border-r border-white/5">
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b border-white/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-black">
          AB
        </div>
      </div>

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-1 py-3">
        {navIcons.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.action}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                hovered === i ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
              title={item.label}
            >
              <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            </button>
          );
        })}
      </div>

      <div className="mx-3 h-px bg-white/5" />

      {/* Recent sessions */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/20">
          Recent
        </div>
        {sessions.length === 0 ? (
          <div className="px-2 py-2 text-[10px] text-white/20">No sessions yet</div>
        ) : (
          sessions.slice(0, 8).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s)}
              className={cn(
                "mx-1 flex w-[calc(100%-8px)] items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors",
                activeSessionId === s.id ? "bg-white/10" : "hover:bg-white/5"
              )}
              title={s.user_email || "Session"}
            >
              <MessageSquare className="h-3 w-3 shrink-0 text-white/30" />
              <span className="truncate text-[10px] text-white/50">
                {s.status === "onboarding" ? "Onboarding" :
                 s.status === "strategy_locked" ? "Strategy" :
                 s.status === "pack_approved" ? "Approved" :
                 s.status === "complete" ? "Complete" : "Session"}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Profile */}
      <div className="border-t border-white/5 p-2">
        <div className="flex items-center gap-2 rounded-lg px-1 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden min-w-0 xl:block">
            <div className="truncate text-[10px] font-semibold text-white/80">
              {user?.full_name || "User"}
            </div>
            <div className="truncate text-[9px] text-white/30">
              {user?.email || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}