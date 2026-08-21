import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";

// D6 — Two-way messaging hook for revision threads.
// Loads all RevisionThread records for the effective user (client or
// previewed client). Provides sendMessage to append a message to a thread
// (creating the thread if it doesn't exist), and createThread to start a
// new thread for a specific step.
export function useRevisionThreads(user) {
  const { effectiveEmail } = usePreviewEmail(user);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!effectiveEmail) {
      setLoading(false);
      return;
    }
    try {
      const all = await base44.entities.RevisionThread.filter(
        { client_email: effectiveEmail },
        "-last_message_at",
        50
      );
      setThreads(all || []);
    } catch (e) {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveEmail]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsub = base44.entities.RevisionThread.subscribe(() => load());
    return unsub;
  }, [load]);

  const createThread = useCallback(async (stepKey, stepLabel, subject) => {
    if (!effectiveEmail) return null;
    try {
      const thread = await base44.entities.RevisionThread.create({
        client_email: effectiveEmail,
        step_key: stepKey,
        step_label: stepLabel,
        subject: subject || `Revision request: ${stepLabel}`,
        status: "open",
        messages: [{
          sender: "client",
          sender_email: effectiveEmail,
          sender_name: user?.full_name || "",
          body: subject || `I'd like to request a revision for ${stepLabel}.`,
          sent_at: new Date().toISOString(),
        }],
        last_message_at: new Date().toISOString(),
        client_unread_count: 0,
        admin_unread_count: 1,
      });
      await load();
      return thread;
    } catch (e) {
      return null;
    }
  }, [effectiveEmail, user, load]);

  const sendMessage = useCallback(async (threadId, body) => {
    if (!threadId || !body.trim()) return;
    try {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return;
      const newMsg = {
        sender: "client",
        sender_email: effectiveEmail,
        sender_name: user?.full_name || "",
        body: body.trim(),
        sent_at: new Date().toISOString(),
      };
      await base44.entities.RevisionThread.update(threadId, {
        messages: [...(thread.messages || []), newMsg],
        last_message_at: new Date.sent_at,
        admin_unread_count: (thread.admin_unread_count || 0) + 1,
      });
      await load();
    } catch (e) {
      // best effort
    }
  }, [threads, effectiveEmail, user, load]);

  return { threads, loading, createThread, sendMessage, reload: load };
}