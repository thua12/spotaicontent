/**
 * Hugging Face Inference API — free tier, 1000 req/day
 * Model: openai-community/roberta-base-openai-detector
 * LABEL_1 = AI generated, LABEL_0 = human written
 */

const HF_MODEL = "openai-community/roberta-base-openai-detector";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const MAX_CHARS = 512 * 4; // RoBERTa token limit ~512 tokens ≈ 2048 chars

export interface HFResult {
  aiScore: number;   // 0-1
  humanScore: number; // 0-1
}

export async function detectTextHF(text: string): Promise<HFResult> {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key || key === "your_hf_key_here") {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  // Truncate to model limit
  const input = text.slice(0, MAX_CHARS);

  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: input }),
    signal: AbortSignal.timeout(15000),
  });

  if (res.status === 503) {
    // Model loading — throw so caller can fallback
    throw new Error("HF model loading, try again shortly");
  }

  if (!res.ok) {
    throw new Error(`HF API error: ${res.status}`);
  }

  const data = await res.json();
  // Response: [{ label: "LABEL_1", score: 0.95 }, { label: "LABEL_0", score: 0.05 }]
  const results = Array.isArray(data[0]) ? data[0] : data;
  const aiEntry = results.find((r: { label: string; score: number }) => r.label === "LABEL_1");
  const humanEntry = results.find((r: { label: string; score: number }) => r.label === "LABEL_0");

  const aiScore = aiEntry?.score ?? 0.5;
  const humanScore = humanEntry?.score ?? (1 - aiScore);

  return { aiScore, humanScore };
}
