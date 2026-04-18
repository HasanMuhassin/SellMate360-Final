import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Constants ────────────────────────────────────────────────────────────────
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const SUPABASE_URL = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MetaMessageEntry {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses the raw Meta webhook payload and extracts the first message entry.
 * Returns null if the payload is a status update (read receipts, deliveries)
 * rather than an incoming message — we ignore those.
 */
function extractMessage(payload: Record<string, unknown>): {
  messageId: string;
  fromPhone: string;
  messageType: string;
  body: string | null;
  buttonPayload: string | null;
} | null {
  try {
    const entry    = (payload.entry as unknown[])[0] as Record<string, unknown>;
    const change   = (entry.changes as unknown[])[0] as Record<string, unknown>;
    const value    = change.value as Record<string, unknown>;
    const messages = value.messages as MetaMessageEntry[] | undefined;

    // Ignore delivery/read status webhooks — they have no messages array
    if (!messages || messages.length === 0) return null;

    const msg   = messages[0];
    const body  = msg.text?.body ?? null;
    const btnId = msg.interactive?.button_reply?.id ?? null;

    return {
      messageId:     msg.id,
      fromPhone:     msg.from,
      messageType:   msg.type,
      body,
      buttonPayload: btnId,
    };
  } catch {
    return null;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // ── GET: Meta webhook verification challenge ─────────────────────────────
  if (req.method === "GET") {
    const url    = new URL(req.url);
    const mode   = url.searchParams.get("hub.mode");
    const token  = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified by Meta");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Incoming message from WhatsApp ──────────────────────────────────
  if (req.method === "POST") {
    // CRITICAL: Return 200 to Meta immediately to prevent retries.
    // All processing happens asynchronously via the Database Webhook.

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      // Even on bad JSON, return 200 to stop Meta from retrying
      return new Response("ok", { status: 200 });
    }

    const msg = extractMessage(payload);
    if (!msg) {
      // It's a status update (not a message) — acknowledge and ignore
      return new Response("ok", { status: 200 });
    }

    // Upsert to whatsapp_messages.
    // ON CONFLICT (message_id) DO NOTHING ensures Meta retries are idempotent.
    const db = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await db.from("whatsapp_messages").upsert(
      {
        message_id:     msg.messageId,
        from_phone:     msg.fromPhone,
        message_type:   msg.messageType,
        body:           msg.body,
        button_payload: msg.buttonPayload,
        raw_payload:    payload,
        processed:      false,
      },
      { onConflict: "message_id", ignoreDuplicates: true }
    );

    if (error) {
      // Log but still return 200 — do not let Meta spam our endpoint
      console.error("DB insert error:", error.message);
    }

    // Supabase Database Webhook fires automatically on INSERT,
    // triggering whatsapp-processor asynchronously.
    return new Response("ok", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
