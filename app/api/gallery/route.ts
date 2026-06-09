import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const outputDir = path.join(process.cwd(), "public", "generated");

  try {
    const files = await readdir(outputDir);
    const images = await Promise.all(
      files
        .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
        .map(async (file) => {
          const fullPath = path.join(outputDir, file);
          const info = await stat(fullPath);
          return {
            filename: file,
            url: `/generated/${file}`,
            createdAt: info.mtimeMs
          };
        })
    );

    images.sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
