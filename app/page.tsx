"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Send,
  Settings2,
  Sparkles
} from "lucide-react";
import { skillPresets } from "@/lib/skills";

type GalleryImage = {
  filename: string;
  url: string;
  createdAt: number;
};

type GenerateResponse = {
  image?: {
    url: string;
    filename: string;
  };
  finalPrompt?: string;
  error?: string;
};

const storageKey = "private-image-studio-config";

const sizes = ["1024x1024", "1024x1536", "1536x1024", "2048x2048"];
const qualities = ["low", "medium", "high", "auto"];

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://www.lingxiapi.com/v1");
  const [model, setModel] = useState("gpt-image-2");
  const [size, setSize] = useState("1024x1536");
  const [quality, setQuality] = useState("high");
  const [presetId, setPresetId] = useState(skillPresets[0].id);
  const [prompt, setPrompt] = useState(skillPresets[0].defaultPrompt);
  const [remember, setRemember] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("就绪");
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  const activePreset = useMemo(
    () => skillPresets.find((preset) => preset.id === presetId) ?? skillPresets[0],
    [presetId]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const value = JSON.parse(stored) as {
          apiKey?: string;
          baseUrl?: string;
          model?: string;
          size?: string;
          quality?: string;
          presetId?: string;
          remember?: boolean;
        };
        setApiKey(value.apiKey ?? "");
        setBaseUrl(value.baseUrl ?? "https://www.lingxiapi.com/v1");
        setModel(value.model ?? "gpt-image-2");
        setSize(value.size ?? "1024x1536");
        setQuality(value.quality ?? "high");
        setPresetId(value.presetId ?? skillPresets[0].id);
        setRemember(Boolean(value.remember));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    void loadGallery();
  }, []);

  useEffect(() => {
    if (!remember) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        apiKey,
        baseUrl,
        model,
        size,
        quality,
        presetId,
        remember
      })
    );
  }, [apiKey, baseUrl, model, presetId, quality, remember, size]);

  async function loadGallery() {
    const response = await fetch("/api/gallery", { cache: "no-store" });
    const data = (await response.json()) as { images: GalleryImage[] };
    setGallery(data.images);
    if (!currentImage && data.images[0]) {
      setCurrentImage(data.images[0].url);
    }
  }

  function selectPreset(nextPresetId: string) {
    const nextPreset = skillPresets.find((preset) => preset.id === nextPresetId);
    if (!nextPreset) return;
    setPresetId(nextPreset.id);
    setPrompt(nextPreset.defaultPrompt);
  }

  async function generateImage() {
    setError("");
    setIsGenerating(true);
    setStatus("生成中");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          model,
          prompt,
          presetId,
          size,
          quality
        })
      });

      const data = (await response.json()) as GenerateResponse;
      if (!response.ok || !data.image) {
        throw new Error(data.error || "生成失败");
      }

      setCurrentImage(data.image.url);
      setStatus("已完成");
      await loadGallery();
    } catch (caught) {
      setStatus("出错");
      setError(caught instanceof Error ? caught.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const canGenerate = apiKey.trim() && baseUrl.trim() && model.trim() && prompt.trim();

  return (
    <main className="shell">
      <div className="workspace">
        <section className="panel control-panel" aria-label="generation controls">
          <div className="topbar">
            <div className="brand">
              <div className="mark">
                <Sparkles size={18} />
              </div>
              <div>
                <h1>Private Image Studio</h1>
                <p className="subtle">{activePreset.shortName} · {size}</p>
              </div>
            </div>
            <div className={`status ${error ? "error" : currentImage ? "ok" : ""}`}>
              {isGenerating ? <LoaderCircle className="spin" size={14} /> : <Settings2 size={14} />}
              {status}
            </div>
          </div>
          <button className="ghost-button compact-button" onClick={logout} type="button">
            <LogOut size={16} />
            退出
          </button>

          <div className="form">
            <div className="field">
              <label htmlFor="baseUrl">中转地址</label>
              <input
                id="baseUrl"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://example.com/v1"
                spellCheck={false}
              />
            </div>

            <div className="field">
              <label htmlFor="apiKey">API key</label>
              <div className="key-row">
                <input
                  id="apiKey"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="sk-..."
                  type={showKey ? "text" : "password"}
                  spellCheck={false}
                />
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setShowKey((value) => !value)}
                  aria-label={showKey ? "隐藏 API key" : "显示 API key"}
                  title={showKey ? "隐藏 API key" : "显示 API key"}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="save-line">
                <label className="check">
                  <input
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    type="checkbox"
                  />
                  本机记住
                </label>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="model">模型</label>
                <input
                  id="model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className="field">
                <label htmlFor="quality">质量</label>
                <select
                  id="quality"
                  value={quality}
                  onChange={(event) => setQuality(event.target.value)}
                >
                  {qualities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="size">尺寸</label>
              <select id="size" value={size} onChange={(event) => setSize(event.target.value)}>
                {sizes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Skill</label>
              <div className="preset-grid">
                {skillPresets.map((preset) => (
                  <button
                    className={`preset-button ${preset.id === presetId ? "active" : ""}`}
                    key={preset.id}
                    onClick={() => selectPreset(preset.id)}
                    type="button"
                  >
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-desc">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="prompt">Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </div>

            <button
              className="primary-button"
              disabled={!canGenerate || isGenerating}
              onClick={generateImage}
              type="button"
            >
              {isGenerating ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
              生成
            </button>
          </div>
        </section>

        <section className="panel output-panel" aria-label="image output">
          <div className="topbar">
            <div>
              <h2>结果</h2>
              <p className="subtle">{model}</p>
            </div>
            <button className="ghost-button" onClick={loadGallery} type="button">
              <RefreshCw size={16} />
              刷新
            </button>
          </div>

          <div className="hero-output">
            {currentImage ? (
              <img alt="Generated result" src={currentImage} />
            ) : (
              <div className="empty-state">
                <ImageIcon size={42} />
                <p>等待生成</p>
              </div>
            )}
          </div>

          {currentImage ? (
            <div className="actions">
              <a className="ghost-button" download href={currentImage}>
                <Download size={16} />
                下载
              </a>
              <a className="ghost-button" href={currentImage} rel="noreferrer" target="_blank">
                <ImageIcon size={16} />
                打开
              </a>
            </div>
          ) : null}

          {error ? <div className="error-box">{error}</div> : null}

          <div className="gallery-section">
            <div className="gallery-head">
              <h2>历史</h2>
              <p className="subtle">{gallery.length} 张</p>
            </div>
            <div className="gallery">
              {gallery.map((image) => (
                <button
                  className="thumb"
                  key={image.filename}
                  onClick={() => setCurrentImage(image.url)}
                  type="button"
                  title={image.filename}
                >
                  <img alt={image.filename} src={image.url} />
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
