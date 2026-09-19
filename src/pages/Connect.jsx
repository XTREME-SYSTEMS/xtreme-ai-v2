import React, { useState } from "react";
import { Copy, Check, ExternalLink, MessageSquare, Code, Bot, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLIENTS = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    icon: MessageSquare,
    steps: [
      "Open ChatGPT and go to Settings → Apps.",
      "Enable Developer mode (repeat the risk warning ChatGPT shows).",
      "Click \"Create app\", name it (e.g. \"Xtreme AI\"), and paste the server URL below.",
      "Click Create, then enable the app from the chat composer before prompting it.",
      "When prompted, sign in with your Xtreme AI account and approve access on the consent page.",
    ],
  },
  {
    key: "claude",
    label: "Claude",
    icon: Bot,
    steps: [
      "Open Claude and go to profile menu → Settings → Connectors.",
      "Click \"Add custom connector\".",
      "Name it (e.g. \"Xtreme AI\"), paste the server URL below, and click Add.",
      "When prompted, sign in with your Xtreme AI account and approve access on the consent page.",
    ],
  },
  {
    key: "cursor",
    label: "Cursor",
    icon: Code,
    steps: [
      "Open Cursor → Settings → Tools & Integrations.",
      "Click \"New MCP Server\" — this opens mcp.json.",
      "Add an entry with \"url\" set to the server URL below, save, and toggle it on.",
      "When prompted, sign in with your Xtreme AI account and approve access on the consent page.",
    ],
  },
  {
    key: "custom",
    label: "Custom",
    icon: Cog,
    steps: [
      "Copy the server URL below.",
      "Add it as a streamable HTTP MCP server in your AI client.",
      "Name + URL is all most clients need — then reload the client.",
      "When prompted, sign in with your Xtreme AI account and approve access on the consent page.",
    ],
  },
];

export default function Connect() {
  const [activeTab, setActiveTab] = useState("chatgpt");
  const [copied, setCopied] = useState(false);

  const serverUrl = new URL("/api/mcp", window.location.origin).toString();

  const copyUrl = () => {
    navigator.clipboard.writeText(serverUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeClient = CLIENTS.find((c) => c.key === activeTab);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Connect Your AI Assistant</h1>
          <p className="mt-2 text-sm text-black/60">
            Connect ChatGPT, Claude, Cursor, or any MCP-compatible AI client to operate your Xtreme AI system directly from the chat. Your AI assistant can read and write data, trigger builds, discover leads, deploy sites, run simulations, and manage every part of the platform.
          </p>
        </div>

        {/* Server URL */}
        <div className="mb-8 rounded-xl border border-black/15 bg-white p-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-black/50">MCP Server URL</label>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm font-mono text-black">
              {serverUrl}
            </code>
            <Button onClick={copyUrl} variant="outline" size="sm" className="shrink-0 border-black/15">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-black/40">
            This URL exposes your app's database, backend functions, and AI agents to any MCP-compatible client via OAuth.
          </p>
        </div>

        {/* Client tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CLIENTS.map((client) => {
            const Icon = client.icon;
            return (
              <button
                key={client.key}
                onClick={() => setActiveTab(client.key)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === client.key
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black hover:bg-black/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {client.label}
              </button>
            );
          })}
        </div>

        {/* Steps */}
        <div className="rounded-xl border border-black/15 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black">
            <activeClient.icon className="h-5 w-5" />
            {activeClient.label} Setup
          </h2>
          <ol className="space-y-4">
            {activeClient.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/15 bg-black/5 text-sm font-bold text-black">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm text-black/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-black/10 bg-black/5 p-4">
            <p className="text-sm text-black/70">
              <strong className="text-black">OAuth sign-in:</strong> Each AI client operates as you — it can only access what your Xtreme AI account permissions allow. The consent page lists exactly which tools it will get before you approve.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/5 p-4">
            <p className="text-sm text-black/70">
              <strong className="text-black">After we ship changes:</strong> Refresh the connector in your AI client — assistants cache the tool list, so new tools won't appear until you reload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}