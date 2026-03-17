const AIORNOT_BASE_URL = "https://api.aiornot.com/v2/image/sync";

export interface HiveResult {
  aiScore: number;
  humanScore: number;
  classes: Array<{ class: string; score: number }>;
}

export async function detectImageFromUrl(imageUrl: string): Promise<HiveResult> {
  // AI or Not only supports file upload — fetch the image ourselves then submit as buffer
  const imgRes = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SpotAIContent/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (imgRes.status === 401 || imgRes.status === 403) {
    throw new Error("This image URL is blocking external access. Please download the image and upload it directly instead.");
  }
  if (!imgRes.ok) throw new Error(`Could not fetch image (${imgRes.status}). Try uploading the file directly instead.`);

  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = await imgRes.arrayBuffer();
  const filename = imageUrl.split("/").pop()?.split("?")[0] ?? "image.jpg";
  return detectImageFromBuffer(buffer, filename, contentType);
}

export async function detectImageFromBuffer(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<HiveResult> {
  const key = process.env.AIORNOT_API_KEY;
  if (!key) throw new Error("AIORNOT_API_KEY is not configured");

  const formData = new FormData();
  formData.append("image", new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch(AIORNOT_BASE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`AI or Not error ${res.status}:`, body);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Image analysis is unavailable (invalid API key). Check AIORNOT_API_KEY in your environment variables.");
    }
    throw new Error(`Image analysis error: ${res.status}`);
  }

  const data = await res.json();
  return parseAiornotResponse(data);
}

function parseAiornotResponse(data: Record<string, unknown>): HiveResult {
  const report = data?.report as Record<string, unknown> | undefined;
  const ai = report?.ai as { is_detected?: boolean; confidence?: number } | undefined;
  const human = report?.human as { confidence?: number } | undefined;
  const nsfw = report?.nsfw as { is_detected?: boolean; confidence?: number } | undefined;

  // Block explicit content
  if (nsfw?.is_detected && (nsfw.confidence ?? 0) > 0.7) {
    throw new Error("This content contains explicit material and cannot be analyzed.");
  }

  const aiScore = ai?.confidence ?? 0;
  const humanScore = human?.confidence ?? 1 - aiScore;

  return {
    aiScore,
    humanScore,
    classes: [
      { class: "ai_generated", score: aiScore },
      { class: "not_ai_generated", score: humanScore },
    ],
  };
}
