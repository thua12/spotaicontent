import { NextRequest, NextResponse } from "next/server";
import { detectText } from "@/lib/gptzero";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of text." },
        { status: 400 }
      );
    }

    const result = await detectText(text);
    const humanScore = Math.round(result.humanScore * 100);
    const aiScore = Math.round(result.aiScore * 100);

    return NextResponse.json({ humanScore, aiScore, sentences: result.sentences });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
