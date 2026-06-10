import { NextResponse } from "next/server";
import { contentTypeFor, readGeneratedImage } from "@/lib/imageStorage";

export const runtime = "nodejs";

type ImageRouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

export async function GET(_request: Request, context: ImageRouteContext) {
  try {
    const { filename } = await context.params;
    const buffer = await readGeneratedImage(filename);

    return new NextResponse(buffer, {
      headers: {
        "content-type": contentTypeFor(filename),
        "cache-control": "private, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
