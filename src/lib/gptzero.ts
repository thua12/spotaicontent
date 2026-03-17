export interface GPTZeroResult {
  aiScore: number;
  humanScore: number;
  sentences: Array<{ sentence: string; generated_prob: number }>;
}

export async function detectText(text: string): Promise<GPTZeroResult> {
  const key = process.env.GPTZERO_API_KEY;
  if (!key) throw new Error("GPTZERO_API_KEY is not configured");

  const res = await fetch("https://api.gptzero.me/v2/predict/text", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ document: text }),
  });

  if (!res.ok) throw new Error(`GPTZero API error: ${res.status}`);

  const data = await res.json();
  const doc = data?.documents?.[0];
  if (!doc) throw new Error("Unexpected GPTZero response format");

  const aiScore: number = doc.completely_generated_prob ?? 0;
  return {
    aiScore,
    humanScore: 1 - aiScore,
    sentences: doc.sentences ?? [],
  };
}
