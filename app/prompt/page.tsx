"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clipboard,
  Image as ImageIcon,
  LoaderCircle,
  Send,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";
import { skillPresets } from "@/lib/skills";

type ReferenceImageState = {
  dataUrl: string;
  name: string;
  type: string;
};

type PromptPackage = {
  title?: string;
  main_prompt?: string;
  negative_prompt?: string;
  reference_usage?: string;
  composition?: string;
  style_notes?: string;
  generation_mode?: string;
  tips?: string[];
};

const legacyConfigStorageKey = "private-image-studio-config";
const configStorageKey = "private-image-studio-prompt-config";
const draftStorageKey = "private-image-studio-draft-prompt";

export default function PromptPage() {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://www.lingxiapi.com/v1");
  const [model, setModel] = useState("gpt-5.4");
  const [presetId, setPresetId] = useState(skillPresets[0].id);
  const [mode, setMode] = useState("image-to-prompt");
  const [text, setText] = useState("");
  const [lockInstruction, setLockInstruction] = useState("");
  const [referenceImage, setReferenceImage] = useState<ReferenceImageState | null>(null);
  const [result, setResult] = useState<PromptPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const activePreset = useMemo(
    () => skillPresets.find((preset) => preset.id === presetId) ?? skillPresets[0],
    [presetId]
  );

  useEffect(() => {
    const stored =
      window.localStorage.getItem(configStorageKey) ??
      window.localStorage.getItem(legacyConfigStorageKey);

    if (stored) {
      try {
        const value = JSON.parse(stored) as {
          apiKey?: string;
          baseUrl?: string;
          model?: string;
          presetId?: string;
          mode?: string;
        };
        setApiKey(value.apiKey ?? "");
        setBaseUrl(value.baseUrl ?? "https://www.lingxiapi.com/v1");
        setModel(value.model ?? "gpt-5.4");
        setPresetId(value.presetId ?? skillPresets[0].id);
        setMode(value.mode ?? "image-to-prompt");
      } catch {
        window.localStorage.removeItem(configStorageKey);
      }
    }

    setConfigLoaded(true);
  }, []);

  useEffect(() => {
    if (!configLoaded) return;

    window.localStorage.setItem(
      configStorageKey,
      JSON.stringify({
        apiKey,
        baseUrl,
        model,
        presetId,
        mode
      })
    );
  }, [apiKey, baseUrl, configLoaded, mode, model, presetId]);

  async function selectReferenceImage(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("只能上传图片文件");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("参考图不能超过 10MB");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("读取参考图失败"));
      reader.readAsDataURL(file);
    });

    setReferenceImage({
      dataUrl,
      name: file.name,
      type: file.type
    });
    setError("");
  }

  async function generatePrompt() {
    setBusy(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          model,
          mode,
          presetId,
          text,
          lockInstruction,
          referenceImage
        })
      });

      const data = (await response.json()) as {
        promptPackage?: PromptPackage;
        error?: string;
      };

      if (!response.ok || !data.promptPackage) {
        throw new Error(data.error || "生成 prompt 失败");
      }

      setResult(data.promptPackage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成 prompt 失败");
    } finally {
      setBusy(false);
    }
  }

  function outputText() {
    if (!result) return "";
    return [
      `Title: ${result.title ?? ""}`,
      "",
      `Main prompt:\n${result.main_prompt ?? ""}`,
      "",
      `Negative prompt:\n${result.negative_prompt ?? ""}`,
      "",
      `Reference usage:\n${result.reference_usage ?? ""}`,
      "",
      `Composition:\n${result.composition ?? ""}`,
      "",
      `Style notes:\n${result.style_notes ?? ""}`,
      "",
      `Generation mode: ${result.generation_mode ?? ""}`,
      "",
      `Tips:\n${(result.tips ?? []).map((tip) => `- ${tip}`).join("\n")}`
    ].join("\n");
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(outputText());
    setCopied(true);
  }

  function sendToImageStudio() {
    if (!result?.main_prompt) return;
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        prompt: result.main_prompt,
        presetId
      })
    );
    window.location.href = "/";
  }

  const canGenerate = Boolean(apiKey.trim() && baseUrl.trim() && model.trim() && (text.trim() || referenceImage));

  return (
    <main className="shell">
      <div className="workspace">
        <section className="panel control-panel" aria-label="prompt controls">
          <div className="topbar">
            <div className="brand">
              <div className="mark">
                <Sparkles size={18} />
              </div>
              <div>
                <h1>Prompt 生成器</h1>
                <p className="subtle">{activePreset.shortName} · {mode}</p>
              </div>
            </div>
            <Link className="ghost-button" href="/">
              文生图
            </Link>
          </div>

          <div className="form">
            <div className="field">
              <label htmlFor="baseUrl">中转地址</label>
              <input
                id="baseUrl"
                onChange={(event) => setBaseUrl(event.target.value)}
                spellCheck={false}
                value={baseUrl}
              />
            </div>

            <div className="field">
              <label htmlFor="apiKey">API key</label>
              <input
                id="apiKey"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                spellCheck={false}
                type="password"
                value={apiKey}
              />
              <p className="subtle">Prompt 生成器配置会单独保存在此浏览器</p>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="model">Prompt 模型</label>
                <input
                  id="model"
                  onChange={(event) => setModel(event.target.value)}
                  spellCheck={false}
                  value={model}
                />
              </div>
              <div className="field">
                <label htmlFor="mode">模式</label>
                <select id="mode" onChange={(event) => setMode(event.target.value)} value={mode}>
                  <option value="text-to-prompt">文本转 Prompt</option>
                  <option value="image-to-prompt">图片转 Prompt</option>
                  <option value="locked-reference-prompt">图片 + 锁定要求</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Skill</label>
              <div className="preset-grid">
                {skillPresets.map((preset) => (
                  <button
                    className={`preset-button ${preset.id === presetId ? "active" : ""}`}
                    key={preset.id}
                    onClick={() => setPresetId(preset.id)}
                    type="button"
                  >
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-desc">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="referenceImage">参考图</label>
              {referenceImage ? (
                <div className="reference-preview">
                  <img alt="Reference preview" src={referenceImage.dataUrl} />
                  <div className="reference-meta">
                    <strong>{referenceImage.name}</strong>
                    <span>用于分析构图、主体、风格和锁定要求</span>
                  </div>
                  <button
                    aria-label="移除参考图"
                    className="icon-button"
                    onClick={() => setReferenceImage(null)}
                    title="移除参考图"
                    type="button"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <label className="upload-zone" htmlFor="referenceImage">
                  <Upload size={18} />
                  <span>添加参考图</span>
                  <small>PNG / JPG / WebP，最大 10MB</small>
                </label>
              )}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="file-input"
                id="referenceImage"
                onChange={(event) => {
                  void selectReferenceImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
                type="file"
              />
            </div>

            <div className="field">
              <label htmlFor="text">文本需求</label>
              <textarea
                id="text"
                onChange={(event) => setText(event.target.value)}
                placeholder="例如：想保留参考图构图，改成新中式清冷文人风，人物脸型不变，衣服换成素色盘扣长衫。"
                value={text}
              />
            </div>

            <div className="field">
              <label htmlFor="lockInstruction">锁定要求</label>
              <textarea
                id="lockInstruction"
                onChange={(event) => setLockInstruction(event.target.value)}
                placeholder="例如：人脸不变，主体位置不动，保留右侧花瓶，背景水墨化。"
                value={lockInstruction}
              />
            </div>

            <button
              className="primary-button"
              disabled={!canGenerate || busy}
              onClick={generatePrompt}
              type="button"
            >
              {busy ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
              生成 Prompt
            </button>
          </div>
        </section>

        <section className="panel output-panel" aria-label="prompt output">
          <div className="topbar">
            <div>
              <h2>Prompt 指令包</h2>
              <p className="subtle">{model}</p>
            </div>
            <div className="actions no-margin">
              <button className="ghost-button" disabled={!result} onClick={copyOutput} type="button">
                <Clipboard size={16} />
                {copied ? "已复制" : "复制"}
              </button>
              <button
                className="ghost-button"
                disabled={!result?.main_prompt}
                onClick={sendToImageStudio}
                type="button"
              >
                <ArrowRight size={16} />
                发送到文生图
              </button>
            </div>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          {result ? (
            <div className="prompt-output">
              <section>
                <h3>{result.title || "生成的 Prompt"}</h3>
                <p className="output-label">Main prompt</p>
                <pre>{result.main_prompt}</pre>
              </section>
              <section>
                <p className="output-label">Negative prompt</p>
                <pre>{result.negative_prompt}</pre>
              </section>
              <section>
                <p className="output-label">Reference usage</p>
                <pre>{result.reference_usage}</pre>
              </section>
              <section className="output-grid">
                <div>
                  <p className="output-label">Composition</p>
                  <pre>{result.composition}</pre>
                </div>
                <div>
                  <p className="output-label">Style notes</p>
                  <pre>{result.style_notes}</pre>
                </div>
              </section>
              <section>
                <p className="output-label">Tips</p>
                <ul>
                  {(result.tips ?? []).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="hero-output compact-output">
              <div className="empty-state">
                <ImageIcon size={42} />
                <p>等待生成 Prompt</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
