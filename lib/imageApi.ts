import { imageUrl, writeGeneratedImage } from "@/lib/imageStorage";

type GenerateImageInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  size: string;
  quality: string;
  referenceImage?: ReferenceImageInput | null;
};

type ImageResponseItem = {
  b64_json?: string;
  url?: string;
};

export type ReferenceImageInput = {
  dataUrl: string;
  name: string;
  type: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function extensionFromContentType(contentType: string | null) {
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  return "png";
}

async function imageBufferFromItem(item: ImageResponseItem) {
  if (item.b64_json) {
    return {
      buffer: Buffer.from(item.b64_json, "base64"),
      extension: "png"
    };
  }

  if (item.url) {
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`Image download failed with ${response.status}`);
    }
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      extension: extensionFromContentType(response.headers.get("content-type"))
    };
  }

  throw new Error("Image response did not include b64_json or url");
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Reference image must be a base64 data URL");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

async function postGeneration(input: GenerateImageInput) {
  const endpoint = `${normalizeBaseUrl(input.baseUrl)}/images/generations`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      size: input.size,
      quality: input.quality,
      n: 1
    })
  });

  return parseImageResponse(response);
}

async function postEdit(input: GenerateImageInput) {
  if (!input.referenceImage) {
    throw new Error("Missing reference image");
  }

  const endpoint = `${normalizeBaseUrl(input.baseUrl)}/images/edits`;
  const parsed = parseDataUrl(input.referenceImage.dataUrl);
  const form = new FormData();
  const filename = input.referenceImage.name || "reference.png";
  const type = input.referenceImage.type || parsed.contentType || "image/png";
  const blob = new Blob([parsed.buffer], { type });

  form.append("model", input.model);
  form.append("prompt", input.prompt);
  form.append("size", input.size);
  form.append("quality", input.quality);
  form.append("n", "1");
  form.append("image", blob, filename);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`
    },
    body: form
  });

  return parseImageResponse(response);
}

async function parseImageResponse(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Image API failed with ${response.status}`;
    throw new Error(message);
  }

  const item = payload?.data?.[0] as ImageResponseItem | undefined;
  if (!item) {
    throw new Error("Image API returned no image data");
  }

  return item;
}

export async function generateImage(input: GenerateImageInput) {
  const item = input.referenceImage ? await postEdit(input) : await postGeneration(input);
  const { buffer, extension } = await imageBufferFromItem(item);
  const filename = `image-${Date.now()}.${extension}`;
  await writeGeneratedImage(filename, buffer);

  return {
    url: imageUrl(filename),
    filename
  };
}
