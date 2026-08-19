"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type ModelOption = {
  id: string;
  name: string;
  note: string;
  cost: number;
  provider?: string;
  providerReady?: boolean;
  missingProviderKeys?: string[];
};

type Film = {
  title: string;
  meta: string;
  className: string;
  prompt: string;
};

type StudioMode = "Image to video" | "Text to video" | "Video extend";
type PackageId = "starter" | "creator" | "studio";
type QualityChoice = "Fast" | "Pro" | "Ultra";

type CreditPack = {
  id: PackageId;
  name: string;
  credits: number;
  amountCents: number;
  description: string;
};

type UploadedAsset = {
  id: string;
  kind: "image" | "video";
  fileName: string;
  publicUrl?: string;
};

type GenerationJob = {
  id: string;
  status: string;
  provider?: string;
  providerJobId?: string;
  resultUrl?: string;
  error?: string;
};

const defaultModels: ModelOption[] = [
  {
    id: "kling-2-1",
    name: "Kling 2.1",
    note: "Expressive motion",
    cost: 30,
    provider: "kling",
  },
  {
    id: "veo-3",
    name: "Veo 3",
    note: "Photoreal scenes",
    cost: 46,
    provider: "vercel-ai-gateway",
  },
  {
    id: "runway-gen-4",
    name: "Runway Gen-4",
    note: "Creative direction",
    cost: 35,
    provider: "runway",
  },
  {
    id: "sora-2",
    name: "Sora 2",
    note: "Cinematic worlds",
    cost: 42,
    provider: "openai",
  },
  {
    id: "seedance",
    name: "Seedance",
    note: "Fast iteration",
    cost: 24,
    provider: "seedance",
  },
];

const defaultPacks: CreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 120,
    amountCents: 1900,
    description: "Explore the studio and make your first ideas move.",
  },
  {
    id: "creator",
    name: "Creator",
    credits: 420,
    amountCents: 4900,
    description: "For creators producing polished content every week.",
  },
  {
    id: "studio",
    name: "Studio",
    credits: 1100,
    amountCents: 11900,
    description: "Higher-volume generation for teams and client work.",
  },
];

const films: Film[] = [
  {
    title: "Afterlight",
    meta: "Veo 3 · Cinematic",
    className: "film-one",
    prompt:
      "A lone sports car moving through foggy alpine roads at blue hour, cinematic tracking shot.",
  },
  {
    title: "Violet City",
    meta: "Sora 2 · Dreamscape",
    className: "film-two",
    prompt:
      "A futuristic city suspended above violet clouds, slow aerial approach, atmospheric haze.",
  },
  {
    title: "Form / 01",
    meta: "Kling 2.1 · Product",
    className: "film-three",
    prompt:
      "Premium titanium headphones rotating in a black studio, sculpted rim light, luxury commercial.",
  },
  {
    title: "Midnight Run",
    meta: "Runway Gen-4 · Fashion",
    className: "film-four",
    prompt:
      "Editorial fashion film at night in Tokyo, wet street reflections, controlled handheld movement.",
  },
  {
    title: "Casa Verde",
    meta: "Veo 3 · Architecture",
    className: "film-five",
    prompt:
      "Modern tropical villa at sunrise, curtains moving softly, slow cinematic dolly through living space.",
  },
  {
    title: "Pulse",
    meta: "Seedance · Music",
    className: "film-six",
    prompt:
      "Abstract chrome sculpture responding to music, deep shadows, pulses of refracted light.",
  },
];

const studioModes: StudioMode[] = [
  "Image to video",
  "Text to video",
  "Video extend",
];

const seedPrompt =
  "A cinematic close-up with subtle natural movement, realistic depth, soft directional light, premium film finish.";

function Logo() {
  return (
    <div className="logo">
      <span className="logoMark">M</span>
      <span>MotionForge</span>
    </div>
  );
}

function modeToApiMode(mode: StudioMode): string {
  if (mode === "Image to video") return "image-to-video";
  if (mode === "Text to video") return "text-to-video";

  return "video-extend";
}

function parseDurationSeconds(duration: string): number {
  const parsed = Number.parseInt(duration.replace(/\D/g, ""), 10);

  return Number.isFinite(parsed) ? parsed : 5;
}

function formatMoney(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);
}

function jobStatusMessage(job: GenerationJob): string {
  if (job.status === "completed") {
    return "Generation completed.";
  }

  if (job.status === "awaiting_provider") {
    return job.error ?? "Generation is queued with the provider.";
  }

  if (job.status === "processing" || job.status === "queued") {
    return "Generation is being processed.";
  }

  return job.error ?? "Generation job was created.";
}

export function StudioShell() {
  const [menu, setMenu] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [mode, setMode] = useState<StudioMode>("Image to video");
  const [models, setModels] = useState<ModelOption[]>(defaultModels);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>(defaultPacks);
  const [model, setModel] = useState<ModelOption>(defaultModels[1] ?? defaultModels[0]);
  const [prompt, setPrompt] = useState(seedPrompt);
  const [ratio, setRatio] = useState("16:9");
  const [duration, setDuration] = useState("5s");
  const [quality, setQuality] = useState<QualityChoice>("Pro");
  const [generated, setGenerated] = useState(false);
  const [balance, setBalance] = useState<number | undefined>();
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | undefined>();
  const [generationJob, setGenerationJob] = useState<GenerationJob | undefined>();
  const [quotedCredits, setQuotedCredits] = useState<number | undefined>();
  const [studioStatus, setStudioStatus] = useState(
    "Upload a source asset or use a text-only prompt.",
  );
  const [generationState, setGenerationState] = useState<
    "idle" | "uploading" | "generating" | "ready" | "setup" | "payment"
  >("idle");
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "loading" | "ready" | "setup"
  >("idle");

  const estimatedCredits = useMemo(
    () =>
      model.cost +
      (duration === "10s" ? 12 : 0) +
      (quality === "Pro" ? 8 : 0) +
      (quality === "Ultra" ? 22 : 0),
    [duration, model.cost, quality],
  );
  const credits = quotedCredits ?? estimatedCredits;

  useEffect(() => {
    let active = true;

    async function hydrateBackendState() {
      try {
        const [catalogResponse, accountResponse] = await Promise.all([
          fetch("/api/models", { headers: { accept: "application/json" } }),
          fetch("/api/me", { headers: { accept: "application/json" } }),
        ]);

        if (catalogResponse.ok) {
          const catalog = (await catalogResponse.json()) as {
            models?: Array<{
              id: string;
              displayName: string;
              description: string;
              baseCredits: number;
              provider: string;
              providerReady?: boolean;
              missingProviderKeys?: string[];
            }>;
            creditPackages?: CreditPack[];
          };
          const nextModels =
            catalog.models?.map((item) => ({
              id: item.id,
              name: item.displayName,
              note: item.description,
              cost: item.baseCredits,
              provider: item.provider,
              providerReady: item.providerReady,
              missingProviderKeys: item.missingProviderKeys,
            })) ?? [];

          if (active && nextModels.length > 0) {
            setModels(nextModels);
            setModel((current) =>
              nextModels.find((item) => item.id === current.id) ?? nextModels[0],
            );
          }

          if (active && catalog.creditPackages?.length) {
            setCreditPacks(catalog.creditPackages);
          }
        }

        if (accountResponse.ok) {
          const account = (await accountResponse.json()) as { balance?: number };
          if (active && typeof account.balance === "number") {
            setBalance(account.balance);
          }
        }
      } catch {
        if (active) {
          setStudioStatus("Backend is not reachable from this browser session yet.");
        }
      }
    }

    void hydrateBackendState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshQuote() {
      try {
        const response = await fetch("/api/generations/quote", {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            mode: modeToApiMode(mode),
            modelId: model.id,
            durationSeconds: parseDurationSeconds(duration),
            quality: quality.toLowerCase(),
            aspectRatio: ratio,
          }),
        });
        const data = (await response.json()) as {
          quote?: { creditCost?: number };
        };

        if (active && response.ok && typeof data.quote?.creditCost === "number") {
          setQuotedCredits(data.quote.creditCost);
        }
      } catch {
        if (active) setQuotedCredits(undefined);
      }
    }

    void refreshQuote();

    return () => {
      active = false;
    };
  }, [duration, mode, model.id, quality, ratio]);

  function setModalBodyState(open: boolean) {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("modalOpen", open);
  }

  function openStudio(seed = "") {
    if (seed) {
      setPrompt(seed);
    }

    setGenerated(false);
    setStudioOpen(true);
    setModalBodyState(true);
  }

  function closeStudio() {
    setStudioOpen(false);
    setModalBodyState(false);
  }

  async function handleCheckout(packageId: PackageId) {
    setCheckoutState("loading");

    try {
      const response = await fetch("/api/stripe/checkout", {
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

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setGenerationState("uploading");
    setGenerated(false);
    setGenerationJob(undefined);
    setStudioStatus(`Uploading ${file.name}…`);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        asset?: UploadedAsset;
        error?: string;
      };

      if (!response.ok || !data.asset) {
        throw new Error(data.error ?? "Upload failed.");
      }

      setUploadedAsset(data.asset);
      setStudioStatus(`Uploaded ${data.asset.fileName}. Ready to generate.`);
      setGenerationState("idle");
    } catch (error) {
      setStudioStatus(
        error instanceof Error ? error.message : "Unable to upload this file.",
      );
      setGenerationState("idle");
    }
  }

  async function handleGenerate() {
    setGenerationState("generating");
    setGenerated(false);
    setGenerationJob(undefined);
    setStudioStatus("Submitting generation job…");

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          mode: modeToApiMode(mode),
          modelId: model.id,
          durationSeconds: parseDurationSeconds(duration),
          quality: quality.toLowerCase(),
          aspectRatio: ratio,
          inputAssetId: uploadedAsset?.id,
        }),
      });
      const data = (await response.json()) as {
        job?: GenerationJob;
        balance?: number;
        error?: string;
        providerSetupRequired?: boolean;
        paymentRequired?: boolean;
        missing?: string[];
        creditCost?: number;
      };

      if (typeof data.balance === "number") {
        setBalance(data.balance);
      }

      if (!response.ok || !data.job) {
        if (data.providerSetupRequired) {
          setGenerationState("setup");
          setStudioStatus(
            `Provider setup required: add ${data.missing?.join(", ") ?? "the provider key"} in Railway.`,
          );
          return;
        }

        if (data.paymentRequired) {
          setGenerationState("payment");
          setStudioStatus(
            `Need ${data.creditCost ?? credits} credits; current balance is ${
              data.balance ?? balance ?? 0
            }.`,
          );
          return;
        }

        throw new Error(data.error ?? "Generation failed.");
      }

      setGenerationJob(data.job);
      setGenerated(true);
      setGenerationState("ready");
      setStudioStatus(jobStatusMessage(data.job));
    } catch (error) {
      setGenerationState("idle");
      setStudioStatus(
        error instanceof Error
          ? error.message
          : "Unable to submit this generation.",
      );
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="nav shell">
          <button className="brandBtn" type="button" aria-label="MotionForge home">
            <Logo />
          </button>
          <nav className={`navlinks ${menu ? "show" : ""}`} aria-label="Primary">
            <a href="#discover" onClick={() => setMenu(false)}>
              Discover
            </a>
            <a href="#models" onClick={() => setMenu(false)}>
              Models
            </a>
            <a href="#workflow" onClick={() => setMenu(false)}>
              How it works
            </a>
            <a href="#pricing" onClick={() => setMenu(false)}>
              Pricing
            </a>
          </nav>
          <div className="navRight">
            <button className="textBtn" type="button">
              Sign in
            </button>
            <button className="pillBtn" type="button" onClick={() => openStudio()}>
              Create video
            </button>
            <button
              className="menuBtn"
              type="button"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="heroBackdrop" aria-hidden="true">
            <div className="cinemaLayer layerA" />
            <div className="cinemaLayer layerB" />
            <div className="cinemaLayer layerC" />
            <div className="heroShade" />
          </div>
          <div className="heroContent shell">
            <div className="heroBadge">A new way to create with motion</div>
            <h1>
              Imagine it.
              <br />
              Direct it.
              <br />
              <span>Bring it to life.</span>
            </h1>
            <p>
              One beautifully simple studio for creating cinematic AI video
              with the world&apos;s leading generation models.
            </p>
            <div className="heroCtas">
              <button
                className="heroPrimary"
                type="button"
                onClick={() => openStudio()}
              >
                Start creating <span>›</span>
              </button>
              <a className="heroSecondary" href="#discover">
                Watch what&apos;s possible <span>↓</span>
              </a>
            </div>
          </div>
          <div className="heroCaption shell">
            <span>Featured creation</span>
            <b>“Solstice” · generated with Veo 3</b>
          </div>
        </section>

        <section id="discover" className="section shell discover">
          <div className="sectionLead">
            <div>
              <span className="eyebrow">Discover</span>
              <h2>Made with imagination.</h2>
            </div>
            <p>
              Explore what creators are making, then use any idea as the
              starting point for your own.
            </p>
          </div>
          <div className="featuredRail">
            {films.slice(0, 3).map((film, index) => (
              <button
                className={`featureCard ${film.className}`}
                key={film.title}
                type="button"
                onClick={() => openStudio(film.prompt)}
              >
                <div className="cardShade" />
                <div className="playButton">▶</div>
                <div className="cardCopy">
                  <span>{index === 0 ? "Featured" : "Creation"}</span>
                  <h3>{film.title}</h3>
                  <p>{film.meta}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="compactRail">
            {films.slice(3).map((film) => (
              <button
                className={`compactCard ${film.className}`}
                key={film.title}
                type="button"
                onClick={() => openStudio(film.prompt)}
              >
                <span />
                <div>
                  <b>{film.title}</b>
                  <small>{film.meta}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="models" className="modelsBand">
          <div className="shell">
            <div className="centerIntro">
              <span className="eyebrow">One studio, many models</span>
              <h2>
                The right creative engine.
                <br />
                <span>Every time.</span>
              </h2>
              <p>
                Move between leading video models without learning a new
                workflow or rebuilding your project.
              </p>
            </div>
            <div className="modelShelf">
              {models.map((item, index) => (
                <button
                  className="modelTile"
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setModel(item);
                    openStudio();
                  }}
                >
                  <div className={`modelArt m${index + 1}`}>
                    <span>{item.name.charAt(0)}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.note}</p>
                  <small>Open model ›</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="productStory shell">
          <article className="storyBlock storyDark">
            <div className="storyCopy">
              <span className="eyebrow">Start with anything</span>
              <h2>A thought. A frame. A film.</h2>
              <p>
                Write a scene, upload an image, or continue an existing clip.
                MotionForge keeps the beginning simple so you can spend your
                time directing.
              </p>
              <button type="button" onClick={() => openStudio()}>
                Open studio ›
              </button>
            </div>
            <div className="storyVisual imageStage" aria-hidden="true">
              <div className="floatingFrame">
                <span>Image</span>
                <div className="portraitGlow" />
              </div>
              <div className="motionTrail t1" />
              <div className="motionTrail t2" />
            </div>
          </article>

          <article className="storyBlock storyLight">
            <div className="storyCopy">
              <span className="eyebrow">Direct, don&apos;t configure</span>
              <h2>
                Powerful controls.
                <br />
                Quietly out of the way.
              </h2>
              <p>
                Choose the model, format, and length when you need them.
                Everything else stays focused on the scene you want to create.
              </p>
              <button type="button" onClick={() => openStudio()}>
                See the controls ›
              </button>
            </div>
            <div className="storyVisual uiStage" aria-hidden="true">
              <div className="glassPanel">
                <div className="miniTabs">
                  <b>Image to video</b>
                  <span>Text to video</span>
                </div>
                <div className="miniCanvas">
                  <div className="miniSun" />
                </div>
                <div className="miniPrompt">
                  Slow dolly forward. Natural wind. Golden-hour light.
                </div>
                <div className="miniBottom">
                  <span>Kling 2.1</span>
                  <b>Generate</b>
                </div>
              </div>
            </div>
          </article>

          <article className="storyBlock storyBlue">
            <div className="storyCopy">
              <span className="eyebrow">Create everywhere</span>
              <h2>
                Built for the screen
                <br />
                you&apos;re already on.
              </h2>
              <p>
                Designed to feel natural on desktop, tablet, and mobile—with
                projects, previews, and generations always within reach.
              </p>
              <button type="button" onClick={() => openStudio()}>
                Create now ›
              </button>
            </div>
            <div className="storyVisual deviceStage" aria-hidden="true">
              <div className="device laptop">
                <div />
              </div>
              <div className="device phone">
                <div />
              </div>
            </div>
          </article>
        </section>

        <section id="pricing" className="pricing shell">
          <div className="centerIntro">
            <span className="eyebrow">Simple pricing</span>
            <h2>Create at your pace.</h2>
            <p>
              Buy credits through Stripe. Each generation reserves credits
              based on model, duration, mode, and quality.
            </p>
          </div>
          <div className="priceGrid">
            {creditPacks.map((pack) => (
              <article
                className={pack.id === "creator" ? "recommended" : ""}
                key={pack.id}
              >
                {pack.id === "creator" ? (
                  <div className="best">Most popular</div>
                ) : null}
                <span>{pack.name}</span>
                <h3>
                  {formatMoney(pack.amountCents)}
                  <small>/pack</small>
                </h3>
                <p>{pack.description}</p>
                <ul>
                  <li>{pack.credits.toLocaleString()} credits</li>
                  <li>Stripe-secured checkout</li>
                  <li>Model-cost routing ledger</li>
                </ul>
                <button
                  type="button"
                  disabled={checkoutState === "loading"}
                  onClick={() => void handleCheckout(pack.id)}
                >
                  {checkoutState === "loading"
                    ? "Preparing…"
                    : `Buy ${pack.name}`}
                </button>
              </article>
            ))}
          </div>
          {checkoutState === "setup" ? (
            <p className="setupNote" role="status">
              Stripe checkout is built but not connected yet. Add
              STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Railway to activate
              live credit purchases.
            </p>
          ) : null}
        </section>

        <section className="finalCta">
          <div className="finalArt" aria-hidden="true">
            <div className="finalOrb a" />
            <div className="finalOrb b" />
          </div>
          <div className="shell finalCopy">
            <span className="eyebrow">Your next shot</span>
            <h2>
              There&apos;s nothing to learn.
              <br />
              Just something to make.
            </h2>
            <button type="button" onClick={() => openStudio()}>
              Create your first video
            </button>
          </div>
        </section>
      </main>

      <footer>
        <div className="shell footerInner">
          <Logo />
          <p>AI video creation, made beautifully simple.</p>
          <div className="footerLinks">
            <a href="#discover">Discover</a>
            <a href="#models">Models</a>
            <a href="#pricing">Pricing</a>
            <button type="button">Privacy</button>
            <button type="button">Terms</button>
          </div>
          <small>© 2026 MotionForge AI</small>
        </div>
      </footer>

      {studioOpen ? (
        <div className="studioModal" role="dialog" aria-modal="true">
          <button
            className="modalBackdrop"
            type="button"
            onClick={closeStudio}
            aria-label="Close studio"
          />
          <div className="studioWindow">
            <div className="studioHeader">
              <div>
                <Logo />
                <span>Studio</span>
              </div>
              <button type="button" onClick={closeStudio} aria-label="Close">
                ×
              </button>
            </div>
            <div className="studioBody">
              <div className="studioSidebar">
                <div className="studioModes">
                  {studioModes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={mode === item ? "selected" : ""}
                      onClick={() => setMode(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="sideDivider" />
                <label>
                  Model
                  <select
                    value={model.id}
                    onChange={(event) => {
                      const selected =
                        models.find((item) => item.id === event.target.value) ??
                        models[0];
                      setModel(selected);
                    }}
                  >
                    {models.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.providerReady === false ? " · setup needed" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Aspect
                  <select
                    value={ratio}
                    onChange={(event) => setRatio(event.target.value)}
                  >
                    <option>16:9</option>
                    <option>9:16</option>
                    <option>1:1</option>
                    <option>4:5</option>
                  </select>
                </label>
                <label>
                  Duration
                  <div className="toggleRow">
                    {["5s", "10s"].map((item) => (
                      <button
                        className={duration === item ? "selected" : ""}
                        onClick={() => setDuration(item)}
                        key={item}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </label>
                <label>
                  Quality
                  <div className="toggleRow">
                    {(["Fast", "Pro", "Ultra"] as QualityChoice[]).map((item) => (
                      <button
                        className={quality === item ? "selected" : ""}
                        onClick={() => setQuality(item)}
                        key={item}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <div className="studioWorkspace">
                <div className={`workspaceCanvas ${generated ? "generated" : ""}`}>
                  {generated ? (
                    <>
                      <div className="generatedScene">
                        <div className="sceneMoon" />
                        <div className="sceneRoad" />
                      </div>
                      <button className="centerPlay" type="button">
                        ▶
                      </button>
                      <div className="generationLabel">
                        <b>
                          {generationJob?.status === "awaiting_provider"
                            ? "Generation queued"
                            : "Generation ready"}
                        </b>
                        <span>
                          {model.name} · {duration} · {ratio}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="dropTarget">
                      <div>{generationState === "uploading" ? "…" : "+"}</div>
                      <b>
                        {mode === "Text to video"
                          ? "Text-only generation ready"
                          : uploadedAsset
                            ? uploadedAsset.fileName
                            : mode === "Video extend"
                              ? "Upload the clip to extend"
                              : "Upload your starting image"}
                      </b>
                      <span>
                        {mode === "Text to video"
                          ? "Describe your scene below to begin."
                          : uploadedAsset
                            ? `${uploadedAsset.kind} source attached`
                            : mode === "Video extend"
                              ? "MP4, WEBM or MOV"
                              : "JPG, PNG, WEBP or short clip"}
                      </span>
                      {mode !== "Text to video" ? (
                        <label className="uploadButton">
                          Choose {mode === "Video extend" ? "video" : "image"}
                          <input
                            type="file"
                            accept={
                              mode === "Video extend"
                                ? "video/*"
                                : "image/*,video/*"
                            }
                            onChange={(event) => void handleFileUpload(event)}
                          />
                        </label>
                      ) : null}
                      <small>{studioStatus}</small>
                    </div>
                  )}
                </div>
                <div className="promptDock">
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Describe your shot…"
                  />
                  <div className="dockBottom">
                    <button className="enhance" type="button">
                      ✦ Enhance
                    </button>
                    <span>
                      {credits} credits ·{" "}
                      {typeof balance === "number"
                        ? `${balance} balance`
                        : "syncing balance"}
                    </span>
                    <button
                      className="generateBtn"
                      type="button"
                      disabled={
                        generationState === "generating" ||
                        generationState === "uploading"
                      }
                      onClick={() => void handleGenerate()}
                    >
                      {generationState === "generating" ? "Submitting" : "Generate"}{" "}
                      <b>↑</b>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
