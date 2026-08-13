"use client";

import {
  BadgeDollarSign,
  Bell,
  Check,
  ChevronDown,
  Clapperboard,
  Clock3,
  Download,
  Film,
  ImagePlus,
  Layers3,
  Library,
  Menu,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type Mode = "video" | "image";
type ModelKey = "flux" | "wan" | "veo" | "studio";
type QualityKey = "draft" | "social" | "studio";
type PackageId = "starter" | "creator" | "studio";

const modelCards: Array<{
  key: ModelKey;
  label: string;
  description: string;
  cost: number;
  accent: string;
}> = [
  {
    key: "flux",
    label: "Flux Image",
    description: "Portraits, fashion, product frames",
    cost: 2,
    accent: "mint",
  },
  {
    key: "wan",
    label: "Open Video",
    description: "Fast clips from prompt or reference",
    cost: 8,
    accent: "cyan",
  },
  {
    key: "veo",
    label: "Premium Motion",
    description: "High-end cinematic generation slot",
    cost: 18,
    accent: "gold",
  },
  {
    key: "studio",
    label: "Studio Blend",
    description: "Image plus motion plus upscaling",
    cost: 28,
    accent: "rose",
  },
];

const qualityOptions: Array<{
  key: QualityKey;
  label: string;
  meta: string;
  multiplier: number;
}> = [
  { key: "draft", label: "Draft", meta: "720p", multiplier: 1 },
  { key: "social", label: "Social", meta: "1080p", multiplier: 1.6 },
  { key: "studio", label: "Studio", meta: "4K upscale", multiplier: 2.4 },
];

const creditPackages: Array<{
  id: PackageId;
  name: string;
  credits: number;
  price: string;
  tone: string;
  note: string;
}> = [
  {
    id: "starter",
    name: "Starter",
    credits: 120,
    price: "$19",
    tone: "mint",
    note: "Exploration pack",
  },
  {
    id: "creator",
    name: "Creator",
    credits: 420,
    price: "$49",
    tone: "gold",
    note: "Most balanced",
  },
  {
    id: "studio",
    name: "Studio",
    credits: 1100,
    price: "$119",
    tone: "rose",
    note: "High-volume runs",
  },
];

const timelineItems = [
  "Reference locked",
  "Prompt expanded",
  "Motion pass",
  "Face detail repair",
  "Shopify credit sync",
];

const galleryItems = [
  {
    title: "Neon rain editorial",
    meta: "9:16 video",
    status: "ready",
    className: "preview-a",
  },
  {
    title: "Luxury serum launch",
    meta: "1:1 image",
    status: "upscaled",
    className: "preview-b",
  },
  {
    title: "Runway mirror pass",
    meta: "16:9 video",
    status: "queued",
    className: "preview-c",
  },
];

const seedPrompt =
  "Cinematic fashion portrait, glossy black studio floor, emerald rim light, slow camera push, premium commercial styling";

export function StudioShell() {
  const [mode, setMode] = useState<Mode>("video");
  const [selectedModel, setSelectedModel] = useState<ModelKey>("wan");
  const [quality, setQuality] = useState<QualityKey>("social");
  const [duration, setDuration] = useState(8);
  const [prompt, setPrompt] = useState(seedPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "loading" | "ready" | "setup"
  >("idle");

  const selectedModelCard = modelCards.find(
    (model) => model.key === selectedModel,
  )!;
  const selectedQuality = qualityOptions.find((item) => item.key === quality)!;
  const creditCost = Math.ceil(
    selectedModelCard.cost *
      selectedQuality.multiplier *
      (mode === "video" ? duration / 4 : 1),
  );

  const promptStrength = useMemo(() => {
    const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
    return Math.min(100, Math.max(28, wordCount * 4));
  }, [prompt]);

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(() => setIsGenerating(false), 2200);
  }

  async function handleCheckout(packageId: PackageId) {
    setCheckoutState("loading");

    try {
      const response = await fetch("/api/shopify/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = (await response.json()) as {
        checkoutUrl?: string;
        setupRequired?: boolean;
      };

      if (data.checkoutUrl) {
        setCheckoutState("ready");
        window.location.assign(data.checkoutUrl);
        return;
      }

      setCheckoutState(data.setupRequired ? "setup" : "idle");
    } catch {
      setCheckoutState("setup");
    }
  }

  return (
    <main className="studio-app">
      <div className="flow-field" aria-hidden="true" />
      <aside className="sidebar glass-panel">
        <a
          className="brand-lockup"
          href="#studio"
          aria-label="AI Video Generation Platform home"
        >
          <span className="brand-mark">
            <Clapperboard size={22} strokeWidth={2.2} />
          </span>
          <span>
            <strong>AOV Studio</strong>
            <small>AI Video Platform</small>
          </span>
        </a>

        <nav className="nav-stack" aria-label="Primary navigation">
          <a className="nav-item active" href="#studio">
            <WandSparkles size={18} />
            Generate
          </a>
          <a className="nav-item" href="#library">
            <Library size={18} />
            Library
          </a>
          <a className="nav-item" href="#credits">
            <BadgeDollarSign size={18} />
            Credits
          </a>
          <a className="nav-item" href="#shopify">
            <ShoppingBag size={18} />
            Shopify
          </a>
          <a className="nav-item" href="#settings">
            <Settings size={18} />
            Settings
          </a>
        </nav>

        <section className="credit-meter" aria-label="Credit balance">
          <div>
            <small>Balance</small>
            <strong>842 credits</strong>
          </div>
          <div className="meter-track">
            <span style={{ width: "67%" }} />
          </div>
          <p>Enough for 31 social clips at the current quality.</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar glass-panel">
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <label className="search-shell" aria-label="Search generations">
            <Search size={17} />
            <input placeholder="Search prompts, references, models" />
          </label>
          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            <button className="profile-chip" type="button" aria-label="Open profile">
              <span>KM</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <section className="studio-hero" id="studio">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={15} />
              Premium creator workspace
            </p>
            <h1>Generate cinematic content with credit-based AI flows.</h1>
            <p>
              A dark, fluid studio for image-to-video, text-to-video, image
              generation, quality upgrades, and Shopify-powered token packs.
            </p>
          </div>
          <div className="hero-controls glass-panel" aria-label="Generation modes">
            <button
              className={mode === "video" ? "mode-button active" : "mode-button"}
              type="button"
              onClick={() => setMode("video")}
            >
              <Film size={18} />
              Video
            </button>
            <button
              className={mode === "image" ? "mode-button active" : "mode-button"}
              type="button"
              onClick={() => setMode("image")}
            >
              <ImagePlus size={18} />
              Image
            </button>
          </div>
        </section>

        <section className="studio-grid">
          <form
            className="generator-panel glass-panel"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Create</p>
                <h2>Prompt Studio</h2>
              </div>
              <span className="cost-pill">
                <Zap size={15} />
                {creditCost} credits
              </span>
            </div>

            <label className="reference-drop" htmlFor="reference-upload">
              <input id="reference-upload" type="file" accept="image/*,video/*" />
              <span className="upload-orbit">
                <Upload size={22} />
              </span>
              <span>
                <strong>Add a face, product, or scene reference</strong>
                <small>Image or short clip. This build stores the UI flow only.</small>
              </span>
            </label>

            <label className="prompt-box">
              <span>Prompt</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
              />
            </label>

            <div className="model-grid" aria-label="Model options">
              {modelCards.map((model) => (
                <button
                  className={
                    selectedModel === model.key
                      ? `model-card active ${model.accent}`
                      : `model-card ${model.accent}`
                  }
                  key={model.key}
                  type="button"
                  onClick={() => setSelectedModel(model.key)}
                >
                  <span>
                    <strong>{model.label}</strong>
                    <small>{model.description}</small>
                  </span>
                  <em>{model.cost}c</em>
                </button>
              ))}
            </div>

            <div className="control-row">
              <div className="segmented" aria-label="Quality">
                {qualityOptions.map((item) => (
                  <button
                    className={quality === item.key ? "active" : ""}
                    key={item.key}
                    type="button"
                    onClick={() => setQuality(item.key)}
                  >
                    {item.label}
                    <small>{item.meta}</small>
                  </button>
                ))}
              </div>
              {mode === "video" ? (
                <label className="duration-control">
                  <span>{duration}s</span>
                  <input
                    min="4"
                    max="16"
                    step="2"
                    type="range"
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                  />
                </label>
              ) : null}
            </div>

            <div className="prompt-strength">
              <span>Prompt strength</span>
              <div>
                <i style={{ width: `${promptStrength}%` }} />
              </div>
            </div>

            <button
              className="generate-button"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCcw className="spin" size={19} />
              ) : (
                <Play size={19} />
              )}
              {isGenerating ? "Generating" : "Generate"}
            </button>
          </form>

          <section className="preview-panel glass-panel" aria-label="Generation preview">
            <div className="preview-stage">
              <div className={`cinema-frame ${isGenerating ? "is-rendering" : ""}`}>
                <div className="scanline" />
                <div className="subject-silhouette" />
                <div className="timeline-scrub">
                  <span />
                </div>
                <button className="play-float" type="button" aria-label="Preview playback">
                  {isGenerating ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </div>
            </div>
            <div className="preview-meta">
              <div>
                <p className="eyebrow">Now rendering</p>
                <h2>{selectedModelCard.label}</h2>
                <span>{selectedQuality.meta} output with reference consistency</span>
              </div>
              <div className="quick-actions">
                <button className="icon-button" type="button" aria-label="Share render">
                  <Share2 size={17} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Download render"
                >
                  <Download size={17} />
                </button>
              </div>
            </div>
            <ol className="render-timeline" aria-label="Render timeline">
              {timelineItems.map((item, index) => (
                <li
                  className={index < (isGenerating ? 3 : 5) ? "complete" : ""}
                  key={item}
                >
                  <span>{index < (isGenerating ? 3 : 5) ? <Check size={13} /> : index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </section>
        </section>

        <section className="lower-grid">
          <section className="glass-panel library-panel" id="library">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Library</p>
                <h2>Recent Outputs</h2>
              </div>
              <button className="ghost-button" type="button">
                <Plus size={16} />
                New folder
              </button>
            </div>
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <article className="asset-card" key={item.title}>
                  <div className={`asset-preview ${item.className}`}>
                    <span>{item.status}</span>
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel commerce-panel" id="credits">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Commerce</p>
                <h2>Credit Packs</h2>
              </div>
              <ShoppingBag size={22} />
            </div>
            <div className="package-stack">
              {creditPackages.map((pack) => (
                <article className={`package-card ${pack.tone}`} key={pack.id}>
                  <div>
                    <strong>{pack.name}</strong>
                    <small>{pack.note}</small>
                  </div>
                  <span>{pack.credits}c</span>
                  <button
                    type="button"
                    onClick={() => void handleCheckout(pack.id)}
                    disabled={checkoutState === "loading"}
                  >
                    {checkoutState === "loading" ? "..." : pack.price}
                  </button>
                </article>
              ))}
            </div>
            <p className="commerce-note" id="shopify">
              Shopify checkout route is built. Add the store domain, Storefront
              token, and variant IDs to activate live credit purchases.
            </p>
            {checkoutState === "setup" ? (
              <p className="setup-alert" role="status">
                Shopify keys are not connected yet. Use the included env template
                before turning on live checkout.
              </p>
            ) : null}
          </section>

          <section className="glass-panel operations-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Flow</p>
                <h2>Queue Health</h2>
              </div>
              <Clock3 size={22} />
            </div>
            <div className="health-row">
              <span>Provider routing</span>
              <strong>Ready</strong>
            </div>
            <div className="health-row">
              <span>Free model lane</span>
              <strong>3 slots</strong>
            </div>
            <div className="health-row">
              <span>Premium model lane</span>
              <strong>Waiting keys</strong>
            </div>
            <div className="message-strip">
              <MessageSquareText size={17} />
              Customer-facing copy is ready for Shopify purchase completion
              webhooks.
            </div>
          </section>

          <section className="glass-panel settings-panel" id="settings">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Stack</p>
                <h2>Launch Checklist</h2>
              </div>
              <Layers3 size={22} />
            </div>
            <ul className="checklist">
              <li>
                <Check size={15} />
                Fresh repo and app shell
              </li>
              <li>
                <Check size={15} />
                Shopify cart route
              </li>
              <li>
                <Check size={15} />
                Webhook verification helper
              </li>
              <li>
                <Clock3 size={15} />
                Add real AI provider keys
              </li>
            </ul>
          </section>
        </section>
      </section>
    </main>
  );
}
