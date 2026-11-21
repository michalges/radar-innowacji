import "server-only";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;

export function getModels() {
  return {
    primary: process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-5.5",
    escalation: process.env.OPENROUTER_ESCALATION_MODEL ?? null,
  };
}

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

type ChatMessage = { role: "system" | "user"; content: string };

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

export async function getChatCompletion(model: string, messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Brak OPENROUTER_API_KEY w .env.local");
  }
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Radar Innowacji",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = (await response.json()) as ChatResponse;
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${payload.error?.message ?? "nieznany błąd"}`);
  }
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter zwrócił pustą odpowiedź");
  }
  return content;
}

export function getJsonFromText(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("Odpowiedź modelu nie zawiera JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
}
