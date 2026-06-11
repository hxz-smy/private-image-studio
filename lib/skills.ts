export type SkillPreset = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  defaultPrompt: string;
  promptTemplate: string;
  promptGuide: string;
  negativePrompt?: string;
  modelHint?: string;
};

export const skillPresets: SkillPreset[] = [
  {
    id: "neo-chinese-qingleng",
    name: "新中式写真 · 清冷文人风",
    shortName: "新中式",
    description: "竹影、水墨、留白、素色衣袍、半身人像",
    defaultPrompt: "一张清冷文人风的新中式女性写真，竹影、水墨背景、半身构图",
    promptGuide:
      "新中式人像写真。强调清冷文人气质、竹影、水墨留白、宣纸质感、素色棉麻/绸缎、盘扣、旗袍/马面裙/宽袍大袖、柔和散射光、克制构图。避免堆叠过多中式元素，保持人脸自然、手部准确、背景干净。",
    negativePrompt:
      "text, watermark, logo, extra fingers, distorted hands, unnatural face, overdecorated background, anime, cartoon, low quality",
    promptTemplate: `Use case: portrait-photography
Asset type: ai-photography portrait
Primary request: {{prompt}}
Style: qingleng-wenren
Scene/backdrop: quiet ink-wash inspired studio backdrop, soft bamboo shadows, subtle 宣纸 texture, clean layered background with large negative space
Subject: elegant adult Chinese woman in a plain ivory linen long robe with delicate 盘扣 details, low neat bun, calm distant gaze, restrained expression, refined natural makeup
Composition/framing: half-body portrait, subject placed slightly on the right third, generous empty space above and to the left, no close-up crop
Lighting/mood: soft diffused daylight, low contrast, quiet and contemplative mood, slightly misty matte atmosphere
Color palette: ink black, ivory white, blue-gray, pale ochre, tiny cinnabar accent
Style elements: 竹影, 水墨留白, 宣纸 texture, restrained scholar-aesthetic mood
Photography language: editorial portrait photography, 85mm lens, shallow depth of field, soft matte finish, subtle film grain, high-end natural retouching
Constraints: clear natural face, accurate eyes, accurate hands, elegant posture, refined skin texture, coherent clothing, no text, no watermark, no logo`
  },
  {
    id: "plain-photography",
    name: "写实摄影",
    shortName: "写实",
    description: "自然光、真实质感、摄影语言",
    defaultPrompt: "一张自然光下的写实人物摄影",
    promptGuide:
      "写实摄影。强调真实光线、自然皮肤、可信空间、相机镜头语言、主体清晰、背景有层次。适合人物、生活方式、产品和环境摄影。",
    negativePrompt:
      "text, watermark, logo, distorted anatomy, extra fingers, plastic skin, low resolution, oversaturated colors",
    promptTemplate: `Use case: photorealistic-natural
Asset type: ai-photography
Primary request: {{prompt}}
Scene/backdrop: realistic environment with coherent depth and clean background
Subject: natural human subject, believable posture and expression
Composition/framing: balanced professional photography composition
Lighting/mood: natural soft light, realistic shadows, refined atmosphere
Photography language: professional photography, shallow depth of field, high-end natural retouching
Constraints: accurate anatomy, clear face, accurate hands, no text, no watermark, no logo`
  }
];

export function buildPrompt(presetId: string, prompt: string) {
  const preset = skillPresets.find((item) => item.id === presetId) ?? skillPresets[0];
  return preset.promptTemplate.replaceAll("{{prompt}}", prompt.trim());
}

export function getSkillPreset(presetId: string) {
  return skillPresets.find((item) => item.id === presetId) ?? skillPresets[0];
}
