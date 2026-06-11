import { getSkillPreset } from "@/lib/skills";

export type PromptReferenceImage = {
  dataUrl: string;
  name: string;
  type: string;
};

export type GeneratePromptInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
  mode: string;
  presetId: string;
  text: string;
  lockInstruction: string;
  referenceImage?: PromptReferenceImage | null;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function buildUserInstruction(input: GeneratePromptInput) {
  const skill = getSkillPreset(input.presetId);
  const hasImage = Boolean(input.referenceImage);

  return `你是专业 AI 生图 prompt 设计师。请根据用户输入、参考图和 skill 规则，输出可直接用于生图模型的高质量 prompt 指令包。

模式：${input.mode}
Skill：${skill.name}
Skill 规则：${skill.promptGuide}
用户文本需求：${input.text || "无"}
参考图：${hasImage ? "已提供，请分析主体、构图、姿态、服装/物品、材质、光线、配色、背景和风格。" : "未提供"}
锁定要求：${input.lockInstruction || "无"}

重要规则：
1. 如果有参考图，不要只描述图片内容，要把图片转换成可复现的生图 prompt。
2. 如果用户要求某个人脸、物品、位置、构图不动，要在“reference_usage”里写清楚需要保留什么，并说明仅靠纯文本 prompt 无法像素级保证，建议图生图/参考图/局部编辑使用。
3. 输出要兼容通用图片生成模型，主 prompt 以英文为主，关键中文文化元素可保留中文名。
4. 不要输出 Markdown 代码块。只输出 JSON。

JSON schema：
{
  "title": "一句中文标题",
  "main_prompt": "英文为主、可直接用于生图的完整 prompt",
  "negative_prompt": "负面 prompt",
  "reference_usage": "如果有参考图/锁定要求，说明如何使用参考图和哪些部分要保持；没有则写无",
  "composition": "构图、镜头、画幅、主体位置",
  "style_notes": "风格、光线、色彩、材质关键词",
  "generation_mode": "text-to-image 或 image-to-image 或 image-edit",
  "tips": ["简短建议1", "简短建议2"]
}`;
}

function parsePromptPayload(content: string) {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return {
      title: "生成的 Prompt",
      main_prompt: content,
      negative_prompt: "",
      reference_usage: "",
      composition: "",
      style_notes: "",
      generation_mode: "text-to-image",
      tips: []
    };
  }
}

export async function generatePromptPackage(input: GeneratePromptInput) {
  const endpoint = `${normalizeBaseUrl(input.baseUrl)}/chat/completions`;
  const textInstruction = buildUserInstruction(input);
  const userContent: Array<Record<string, unknown>> = [{ type: "text", text: textInstruction }];

  if (input.referenceImage) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: input.referenceImage.dataUrl
      }
    });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content:
            "你是严谨的 AI 生图提示词设计师，擅长从文字和图片中提取可复现的视觉结构，并输出 JSON。"
        },
        {
          role: "user",
          content: input.referenceImage ? userContent : textInstruction
        }
      ],
      temperature: 0.4
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Prompt API failed with ${response.status}`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Prompt API returned no text content");
  }

  return parsePromptPayload(content);
}
