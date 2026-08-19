"use client";

import { useMemo, useState } from "react";

type ModelOption = {
  name: string;
  note: string;
  cost: number;
};

type Film = {
  title: string;
  meta: string;
  className: string;
  prompt: string;
};

type StudioMode = "Image to video" | "Text to video" | "Video extend";
type PackageId = "starter" | "creator" | "studio";

const models: ModelOption[] = [
  { name: "Kling 2.1", note: "Expressive motion", cost: 30 },
  { name: "Veo 3", note: "Photoreal scenes", cost: 46 },
  { name: "Runway Gen-4", note: "Creative direction", cost: 35 },
  { name: "Sora 2", note: "Cinematic worlds", cost: 42 },
  { name: "Seedance", note: "Fast iteration", cost: 24 },
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

export function StudioShell() {
  const [menu, setMenu] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [mode, setMode] = useState<StudioMode>("Image to video");
  const [model, setModel] = useState<ModelOption>(models[0]);
  const [prompt, setPrompt] = useState(seedPrompt);
  const [ratio, setRatio] = useState("16:9");
  const [duration, setDuration] = useState("5s");
  const [quality, setQuality] = useState("Pro");
  const [generated, setGenerated] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "loading" | "ready" | "setup"
  >("idle");

  const credits = useMemo(
    () =>
      model.cost +
      (duration === "10s" ? 12 : 0) +
      (quality === "Pro" ? 8 : 0),
    [duration, model.cost, quality],
  );

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
    if (packageId === "starter") {
      openStudio();
      return;
    }

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
                  key={item.name}
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
              Start free. Upgrade when you want more generations, higher
              quality, and priority processing.
            </p>
          </div>
          <div className="priceGrid">
            <article>
              <span>Starter</span>
              <h3>$19</h3>
              <p>Explore the studio and make your first ideas move.</p>
              <ul>
                <li>120 credits</li>
                <li>Standard queue</li>
                <li>720p exports</li>
              </ul>
              <button
                type="button"
                onClick={() => void handleCheckout("starter")}
              >
                Start creating
              </button>
            </article>
            <article className="recommended">
              <div className="best">Most popular</div>
              <span>Creator</span>
              <h3>
                $49<small>/pack</small>
              </h3>
              <p>For creators producing polished content every week.</p>
              <ul>
                <li>420 credits</li>
                <li>Priority generation</li>
                <li>1080p and watermark-free</li>
              </ul>
              <button
                type="button"
                disabled={checkoutState === "loading"}
                onClick={() => void handleCheckout("creator")}
              >
                {checkoutState === "loading" ? "Preparing…" : "Choose Creator"}
              </button>
            </article>
            <article>
              <span>Studio</span>
              <h3>
                $119<small>/pack</small>
              </h3>
              <p>Higher-volume generation for teams and client work.</p>
              <ul>
                <li>1,100 credits</li>
                <li>Fastest queue</li>
                <li>Shared workspace-ready</li>
              </ul>
              <button
                type="button"
                disabled={checkoutState === "loading"}
                onClick={() => void handleCheckout("studio")}
              >
                {checkoutState === "loading" ? "Preparing…" : "Choose Studio"}
              </button>
            </article>
          </div>
          {checkoutState === "setup" ? (
            <p className="setupNote" role="status">
              Shopify checkout is built but not connected yet. Add the store
              domain, Storefront token, and variant IDs to activate live credit
              purchases.
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
                    value={model.name}
                    onChange={(event) => {
                      const selected =
                        models.find((item) => item.name === event.target.value) ??
                        models[0];
                      setModel(selected);
                    }}
                  >
                    {models.map((item) => (
                      <option key={item.name}>{item.name}</option>
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
                    {["Fast", "Pro"].map((item) => (
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
                        <b>Generation ready</b>
                        <span>
                          {model.name} · {duration} · {ratio}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="dropTarget">
                      <div>+</div>
                      <b>
                        {mode === "Text to video"
                          ? "Text-only generation ready"
                          : "Drop your starting image here"}
                      </b>
                      <span>
                        {mode === "Text to video"
                          ? "Describe your scene below to begin."
                          : "JPG, PNG or WEBP"}
                      </span>
                      {mode !== "Text to video" ? (
                        <button type="button">Choose image</button>
                      ) : null}
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
                    <span>{credits} credits</span>
                    <button
                      className="generateBtn"
                      type="button"
                      onClick={() => setGenerated(true)}
                    >
                      Generate <b>↑</b>
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
