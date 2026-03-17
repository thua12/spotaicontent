import { NextRequest, NextResponse } from "next/server";
import { generateBadgeToken, clampScore, BadgeData, ContentType } from "@/lib/badge";
import { randomUUID } from "crypto";

const VALID_CONTENT_TYPES: ContentType[] = ["image", "video", "text"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentType, contentIdentifier, humanScore, aiScore } = body as {
      contentType: ContentType;
      contentIdentifier: string;
      humanScore: number;
      aiScore: number;
    };

    if (!contentType || !contentIdentifier || humanScore == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    if (typeof humanScore !== "number" || typeof aiScore !== "number") {
      return NextResponse.json({ error: "Scores must be numbers" }, { status: 400 });
    }

    if (contentIdentifier.length > 500) {
      return NextResponse.json({ error: "Content identifier too long" }, { status: 400 });
    }

    const data: BadgeData = {
      id: randomUUID(),
      contentType,
      contentIdentifier,
      humanScore: clampScore(humanScore),
      aiScore: clampScore(aiScore),
      issuedAt: Date.now(),
    };

    const token = generateBadgeToken(data);
    // Use the configured app URL rather than trusting the origin header
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotaicontent.com";
    const verifyUrl = `${appUrl}/verify?token=${token}`;

    return NextResponse.json({ token, verifyUrl, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Badge generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
