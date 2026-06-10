import { NextResponse } from "next/server";
import { generateImage } from "@/lib/imageApi";
import { buildPrompt, skillPresets } from "@/lib/skills";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateRequest = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  prompt?: string;
  presetId?: string;
  size?: string;
  quality?: string;
  referenceImage?: {
    dataUrl?: string;
    name?: string;
    type?: string;
  } | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const apiKey = cleanText(body.apiKey);
    const baseUrl = cleanText(body.baseUrl);
    const model = cleanText(body.model) || process.env.DEFAULT_IMAGE_MODEL || "gpt-image-2";
    const prompt = cleanText(body.prompt);
    const presetId = cleanText(body.presetId) || skillPresets[0].id;
    const size = cleanText(body.size) || "1024x1536";
    const quality = cleanText(body.quality) || "high";
    const referenceImage = body.referenceImage?.dataUrl
      ? {
          dataUrl: body.referenceImage.dataUrl,
          name: cleanText(body.referenceImage.name) || "reference.png",
          type: cleanText(body.referenceImage.type) || "image/png"
        }
      : null;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    if (!baseUrl) {
      return NextResponse.json({ error: "Missing base URL" }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const finalPrompt = buildPrompt(presetId, prompt);
    const image = await generateImage({
      apiKey,
      baseUrl,
      model,
      prompt: finalPrompt,
      size,
      quality,
      referenceImage
    });

    return NextResponse.json({
      image,
      finalPrompt,
      model,
      size,
      quality
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
