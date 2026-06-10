import { NextResponse } from "next/server";
import { listGeneratedImages } from "@/lib/imageStorage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ images: await listGeneratedImages() });
}
