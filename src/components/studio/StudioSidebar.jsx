import React, { useState } from "react";
import {
  Plus, Search, Library, FolderOpen, MessageSquare, MoreHorizontal, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AMBER = "#FF8C00";

// Left sidebar — wider nav rail with logo, labeled actions, recent sessions, profile.
export default function StudioSidebar({ user, sessions, activeSessionId, onSelectSession, onNewChat }) {
  const [hovered, setHovered] = useState(null);

  const initials = (user?.full_name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const navItems = [
    { icon: Plus, label: "New chat", action: onNewChat, primary: true },
    { icon: Search, label: "Search Google" },
    { icon: Library, label: "Library" },
    { icon: FolderOpen, label: "Projects" },
  ];

  return (
    <div className="flex w-56 shrink-0 flex-col bg-[#121212] border-r border-white/5">
      {/* Header — logo + title + dropdown */}
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white"
          style={{ background: AMBER }}>
          D2
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-bold uppercase tracking-wider text-white">Digital Dominance 2.0</div>
        </div>
        <button className="text-white/30 hover:text-white/60">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Primary actions */}
      <div className="flex flex-col gap-0.5 px-2 py-2.5">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <button
                key={i}
                onClick={item.action}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: AMBER }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          }
          return (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                hovered === i ? "bg-white/5 text-white" : "text-white/50 hover:text-white/70"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mx-3 h-px bg-white/5" />

      {/* Recent sessions */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white/20">
          Recent
        </div>
        {sessions.length === 0 ? (
          <div className="px-3 py-2 text-[10px] text-white/20">No sessions yet</div>
        ) : (
          sessions.slice(0, 10).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s)}
              className={cn(
                "mx-1.5 flex w-[calc(100%-12px)] items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                activeSessionId === s.id ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <MessageSquare className="h-3 w-3 shrink-0 text-white/30" />
              <span className="truncate text-[11px] text-white/50">
                {s.status === "onboarding" ? "Onboarding session" :
                 s.status === "strategy_locked" ? "Strategy locked" :
                 s.status === "pack_approved" ? "Pack approved" :
                 s.status === "complete" ? "Complete" : "Session"}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Profile card */}
      <div className="border-t border-white/5 p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-white/5 cursor-pointer">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: AMBER }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-semibold text-white/80">
              {user?.full_name || "User"}
            </div>
            <div className="truncate text-[9px] text-white/30">
              {user?.email || ""}
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 shrink-0 text-white/30" />
        </div>
      </div>
    </div>
  );
}