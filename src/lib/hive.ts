const HIVE_BASE_URL = "https://api.thehive.ai/api/v2/task/sync";

export interface HiveResult {
  aiScore: number;
  humanScore: number;
  classes: Array<{ class: string; score: number }>;
}

export async function detectImageFromUrl(imageUrl: string): Promise<HiveResult> {
  const key = process.env.HIVE_API_KEY;
  if (!key) throw new Error("HIVE_API_KEY is not configured");

  const res = await fetch(HIVE_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (res.status === 403 || res.status === 401) {
    throw new Error("This image URL is blocking external access. Please download the image and upload it directly instead.");
  }
  if (!res.ok) throw new Error(`Hive API error: ${res.status}`);
  return parseHiveResponse(await res.json());
}

export async function detectImageFromBuffer(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<HiveResult> {
  const key = process.env.HIVE_API_KEY;
  if (!key) throw new Error("HIVE_API_KEY is not configured");

  const formData = new FormData();
  formData.append("image", new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch(HIVE_BASE_URL, {
    method: "POST",
    headers: { Authorization: `Token ${key}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Hive API error: ${res.status}`);
  return parseHiveResponse(await res.json());
}

const EXPLICIT_CLASSES = ["sexual", "explicit_nudity", "graphic_violence", "very_graphic_violence"];

function parseHiveResponse(data: Record<string, unknown>): HiveResult {
  const status = data?.status as Array<{ response?: { output?: Array<{ classes?: Array<{ class: string; score: number }> }> } }>;
  const classes = status?.[0]?.response?.output?.[0]?.classes ?? [];

  // Block explicit content
  for (const cls of classes) {
    if (EXPLICIT_CLASSES.includes(cls.class) && cls.score > 0.7) {
      throw new Error("This content contains explicit material and cannot be analyzed.");
    }
  }

  const aiClass = classes.find((c) => c.class === "ai_generated");
  const humanClass = classes.find((c) => c.class === "not_ai_generated");
  const aiScore = aiClass?.score ?? 0;
  const humanScore = humanClass?.score ?? 1 - aiScore;
  return { aiScore, humanScore, classes };
}
