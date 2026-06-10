import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedImageName = /^image-\d+\.(png|jpe?g|webp)$/i;

export function generatedDir() {
  return process.env.IMAGE_STORAGE_DIR
    ? path.resolve(process.env.IMAGE_STORAGE_DIR)
    : path.join(process.cwd(), "storage", "generated");
}

export function imageUrl(filename: string) {
  return `/api/images/${encodeURIComponent(filename)}`;
}

export function assertSafeImageName(filename: string) {
  if (!allowedImageName.test(filename) || path.basename(filename) !== filename) {
    throw new Error("Invalid image filename");
  }
}

export function contentTypeFor(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "image/png";
}

export async function writeGeneratedImage(filename: string, buffer: Buffer) {
  assertSafeImageName(filename);
  const dir = generatedDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
}

export async function readGeneratedImage(filename: string) {
  assertSafeImageName(filename);
  return readFile(path.join(generatedDir(), filename));
}

export async function listGeneratedImages() {
  const dir = generatedDir();

  try {
    const files = await readdir(dir);
    const images = await Promise.all(
      files
        .filter((file) => allowedImageName.test(file))
        .map(async (file) => {
          const info = await stat(path.join(dir, file));
          return {
            filename: file,
            url: imageUrl(file),
            createdAt: info.mtimeMs
          };
        })
    );

    images.sort((a, b) => b.createdAt - a.createdAt);
    return images;
  } catch {
    return [];
  }
}
