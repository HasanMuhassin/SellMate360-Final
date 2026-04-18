import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { generateObject, generateText } from "npm:ai";
import { z } from "npm:zod";
import {
  INTENT_SYSTEM_PROMPT,
  QUERY_RESPONSE_SYSTEM_PROMPT,
  FALLBACK_SYSTEM_PROMPT,
} from "./prompts.ts";

// ─── Gemini client ────────────────────────────────────────────────────────────
// The GOOGLE_GENERATIVE_AI_API_KEY secret must be set in Supabase Edge Function secrets.
const google = createGoogleGenerativeAI({
  apiKey: Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")!,
});

// ─── Schema: Intent Detection Output ─────────────────────────────────────────
export const IntentSchema = z.object({
  intent:           z.enum(["QUERY", "ORDER", "CASUAL", "UNKNOWN"]),
  isQuery:          z.boolean(),
  isOrderPlacement: z.boolean(),
  isOrderConfirmed: z.boolean(),
  productName:      z.string().nullable(),
  quantity:         z.number().nullable(),
  location:         z.string().nullable(),
  paymentMethod:    z.enum(["cod", "card", "online"]).nullable(),
  confidence:       z.number().min(0).max(1),
  missingFields:    z.array(z.string()),
});

export type IntentResult = z.infer<typeof IntentSchema>;

// ─── Helper: Build conversation context string ────────────────────────────────
export function buildConversationContext(
  history: Array<{ body: string | null; from_phone: string; created_at: string }>,
  currentPhone: string
): string {
  return history
    .map((m) => {
      const role = m.from_phone === currentPhone ? "Customer" : "Agent";
      return `${role}: ${m.body ?? "[non-text message]"}`;
    })
    .join("\n");
}

// ─── Function 1: Detect Intent ────────────────────────────────────────────────
/**
 * Calls Gemini with the structured IntentSchema to classify the customer message.
 * Uses generateObject which enforces the schema, preventing hallucinated fields.
 * Falls back to UNKNOWN on any parsing or AI error.
 */
export async function detectIntent(
  customerMessage: string,
  conversationHistory: string
): Promise<IntentResult> {
  try {
    const { object } = await generateObject({
      model:  google("gemini-1.5-flash"),   // Fast model for low-latency classification
      schema: IntentSchema,
      system: INTENT_SYSTEM_PROMPT,
      prompt: `Conversation so far:\n${conversationHistory}\n\nLatest message: ${customerMessage}`,
    });
    return object;
  } catch (err) {
    console.error("Intent detection error:", err);
    // Safe fallback — routes to the graceful UNKNOWN handler
    return {
      intent:           "UNKNOWN",
      isQuery:          false,
      isOrderPlacement: false,
      isOrderConfirmed: false,
      productName:      null,
      quantity:         null,
      location:         null,
      paymentMethod:    null,
      confidence:       0,
      missingFields:    [],
    };
  }
}

// ─── Function 2: Generate Query Response ─────────────────────────────────────
/**
 * Generates a product-aware conversational response.
 * productDataJson is fetched from DB and injected as context —
 * the AI CANNOT make up prices or stock levels.
 */
export async function generateQueryResponse(
  customerMessage: string,
  productDataJson: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model:  google("gemini-1.5-flash"),
      system: `${QUERY_RESPONSE_SYSTEM_PROMPT}\n\nAvailable product data:\n${productDataJson}`,
      prompt: customerMessage,
    });
    return text.trim();
  } catch (err) {
    console.error("Query response error:", err);
    return "Sorry, I had trouble retrieving product information. Please try again in a moment.";
  }
}

// ─── Function 3: Generate Fallback Response ───────────────────────────────────
/**
 * Generates a warm, casual reply for CASUAL or UNKNOWN intents.
 */
export async function generateFallbackResponse(
  customerMessage: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model:  google("gemini-1.5-flash"),
      system: FALLBACK_SYSTEM_PROMPT,
      prompt: customerMessage,
    });
    return text.trim();
  } catch {
    return "Hi! 👋 Welcome to SellMate. You can ask me about our products or place an order anytime.";
  }
}
