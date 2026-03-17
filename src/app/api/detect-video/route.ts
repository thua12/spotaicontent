import { NextRequest, NextResponse } from "next/server";

const HIVE_ASYNC_URL = "https://api.thehive.ai/api/v2/task/async";
const HIVE_STATUS_URL = "https://api.thehive.ai/api/v2/task";

async function pollForResult(taskId: string, apiKey: string): Promise<Record<string, unknown>> {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${HIVE_STATUS_URL}/${taskId}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    const status = data?.status?.[0]?.status?.code;
    if (status === "completed") return data;
    if (status === "failed") throw new Error("Video analysis failed on Hive servers");
  }
  throw new Error("Video analysis timed out (30s). Try a shorter clip.");
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    const key = process.env.HIVE_API_KEY;
    if (!key) throw new Error("HIVE_API_KEY is not configured");

    const submitRes = await fetch(HIVE_ASYNC_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!submitRes.ok) throw new Error(`Hive API error: ${submitRes.status}`);

    const submitData = await submitRes.json();
    const taskId = submitData?.status?.[0]?.task_id;
    if (!taskId) throw new Error("No task ID returned from Hive");

    const result = await pollForResult(taskId, key);

    type HiveClass = { class: string; score: number };
    type HiveResult = { status?: Array<{ response?: { output?: Array<{ classes?: HiveClass[] }> } }> };
    const typed = result as HiveResult;
    const classes: HiveClass[] = typed?.status?.[0]?.response?.output?.[0]?.classes ?? [];
    const aiClass = classes.find((c) => c.class === "ai_generated");
    const humanClass = classes.find((c) => c.class === "not_ai_generated");

    const aiScore = Math.round((aiClass?.score ?? 0) * 100);
    const humanScore = Math.round((humanClass?.score ?? 1 - (aiClass?.score ?? 0)) * 100);

    return NextResponse.json({ humanScore, aiScore, raw: classes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
