import { NextRequest, NextResponse } from "next/server";
import { detectImageFromUrl, detectImageFromBuffer } from "@/lib/hive";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let result;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      const buffer = await file.arrayBuffer();
      result = await detectImageFromBuffer(buffer, file.name, file.type);
    } else {
      const { url } = await req.json();
      if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });
      result = await detectImageFromUrl(url);
    }

    const humanScore = Math.round(result.humanScore * 100);
    const aiScore = Math.round(result.aiScore * 100);

    return NextResponse.json({ humanScore, aiScore, raw: result.classes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
