import { NextResponse } from "next/server";
import { generatePromptPackage } from "@/lib/promptApi";
import { skillPresets } from "@/lib/skills";

export const runtime = "nodejs";
export const maxDuration = 120;

type PromptRequest = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  mode?: string;
  presetId?: string;
  text?: string;
  lockInstruction?: string;
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
    const body = (await request.json()) as PromptRequest;
    const apiKey = cleanText(body.apiKey);
    const baseUrl = cleanText(body.baseUrl);
    const model = cleanText(body.model) || "gpt-5.4";
    const text = cleanText(body.text);
    const lockInstruction = cleanText(body.lockInstruction);
    const presetId = cleanText(body.presetId) || skillPresets[0].id;
    const mode = cleanText(body.mode) || "text-to-prompt";
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

    if (!text && !referenceImage) {
      return NextResponse.json({ error: "Missing text or reference image" }, { status: 400 });
    }

    const promptPackage = await generatePromptPackage({
      apiKey,
      baseUrl,
      model,
      mode,
      presetId,
      text,
      lockInstruction,
      referenceImage
    });

    return NextResponse.json({ promptPackage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown prompt generation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
