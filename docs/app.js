(() => {
  "use strict";

  const stage = document.querySelector("#stage");
  const readmeScene = document.querySelector("#readmeScene");
  const mascotButton = document.querySelector("#mascotButton");
  const mascotMouth = document.querySelector("#mascotMouth");
  const mascotHint = document.querySelector("#mascotHint");
  const skipButton = document.querySelector("#skipButton");
  const revealLayer = document.querySelector("#revealLayer");
  const revealCard = document.querySelector("#revealCard");
  const replayButton = document.querySelector("#replayButton");
  const liveStatus = document.querySelector("#liveStatus");
  const canvas = document.querySelector("#effectsCanvas");

  if (
    !stage ||
    !readmeScene ||
    !mascotButton ||
    !mascotMouth ||
    !skipButton ||
    !revealLayer ||
    !revealCard ||
    !replayButton ||
    !liveStatus ||
    !canvas
  ) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const suckables = [...document.querySelectorAll("[data-suck]")].sort(
    (a, b) => Number(a.dataset.order) - Number(b.dataset.order),
  );

  const activeAnimations = new Set();
  let state = "idle";
  let runId = 0;

  const wait = (milliseconds) =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  const registerAnimation = (animation) => {
    activeAnimations.add(animation);
    animation.finished
      .catch(() => undefined)
      .finally(() => activeAnimations.delete(animation));
    return animation;
  };

  const getCenter = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const getStagePoint = (viewportPoint) => {
    const rect = stage.getBoundingClientRect();
    return {
      x: viewportPoint.x - rect.left,
      y: viewportPoint.y - rect.top,
    };
  };

  const setStatus = (message) => {
    liveStatus.textContent = message;
  };

  class EffectsEngine {
    constructor(targetCanvas, host) {
      this.canvas = targetCanvas;
      this.host = host;
      this.context = targetCanvas.getContext("2d");
      this.particles = [];
      this.raf = 0;
      this.mode = "idle";
      this.target = { x: 0, y: 0 };
      this.spawnAccumulator = 0;
      this.lastTime = performance.now();
      this.colors = ["#65f4b0", "#78a9ff", "#9f7aea", "#f08a68", "#e6edf3"];

      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(host);
      this.resize();
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = rect.width;
      this.height = rect.height;
    }

    startVortex(target) {
      this.mode = "vortex";
      this.target = target;
      this.ensureLoop();
    }

    stopVortex() {
      if (this.mode === "vortex") {
        this.mode = "settle";
      }
    }

    spit(from, to) {
      this.mode = "spit";
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / distance;
      const ny = dy / distance;

      for (let index = 0; index < 72; index += 1) {
        const spread = (Math.random() - 0.5) * 2.5;
        const speed = 4.5 + Math.random() * 7;
        this.particles.push({
          x: from.x + (Math.random() - 0.5) * 8,
          y: from.y + (Math.random() - 0.5) * 8,
          vx: nx * speed - ny * spread,
          vy: ny * speed + nx * spread,
          size: 1.2 + Math.random() * 3.2,
          life: 48 + Math.random() * 45,
          maxLife: 90,
          color: this.colors[index % this.colors.length],
          kind: "spit",
          target: to,
        });
      }

      this.ensureLoop();
      window.setTimeout(() => {
        if (this.mode === "spit") {
          this.mode = "settle";
        }
      }, 900);
    }

    burst(center) {
      for (let index = 0; index < 58; index += 1) {
        const angle = (Math.PI * 2 * index) / 58 + Math.random() * 0.2;
        const speed = 1.6 + Math.random() * 5.2;
        this.particles.push({
          x: center.x,
          y: center.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.2 + Math.random() * 3.4,
          life: 34 + Math.random() * 42,
          maxLife: 76,
          color: this.colors[index % this.colors.length],
          kind: "burst",
        });
      }
      this.ensureLoop();
    }

    clear() {
      this.mode = "idle";
      this.particles.length = 0;
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      this.context.clearRect(0, 0, this.width, this.height);
    }

    ensureLoop() {
      if (!this.raf) {
        this.lastTime = performance.now();
        this.raf = requestAnimationFrame(this.tick);
      }
    }

    spawnVortexParticle() {
      const edge = Math.floor(Math.random() * 4);
      let x;
      let y;

      if (edge === 0) {
        x = Math.random() * this.width;
        y = -8;
      } else if (edge === 1) {
        x = this.width + 8;
        y = Math.random() * this.height;
      } else if (edge === 2) {
        x = Math.random() * this.width;
        y = this.height + 8;
      } else {
        x = -8;
        y = Math.random() * this.height;
      }

      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 1 + Math.random() * 2.4,
        life: 180 + Math.random() * 130,
        maxLife: 310,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        kind: "vortex",
        spin: Math.random() > 0.5 ? 1 : -1,
      });
    }

    tick(now) {
      const delta = Math.min(2.2, Math.max(0.45, (now - this.lastTime) / 16.667));
      this.lastTime = now;
      this.context.clearRect(0, 0, this.width, this.height);

      if (this.mode === "vortex") {
        this.spawnAccumulator += 4.2 * delta;
        while (this.spawnAccumulator >= 1) {
          this.spawnVortexParticle();
          this.spawnAccumulator -= 1;
        }
      }

      const nextParticles = [];

      for (const particle of this.particles) {
        particle.life -= delta;

        if (particle.kind === "vortex") {
          const dx = this.target.x - particle.x;
          const dy = this.target.y - particle.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const pull = Math.min(1.3, 12 / Math.sqrt(distance));
          const tangent = Math.min(1.1, distance / 330) * particle.spin;

          particle.vx += (dx / distance) * pull * delta + (-dy / distance) * tangent * 0.23 * delta;
          particle.vy += (dy / distance) * pull * delta + (dx / distance) * tangent * 0.23 * delta;
          particle.vx *= 0.955;
          particle.vy *= 0.955;
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;

          if (distance < 13) {
            particle.life = 0;
          }
        } else if (particle.kind === "spit") {
          particle.vx *= 0.985;
          particle.vy *= 0.985;
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
        } else {
          particle.vx *= 0.97;
          particle.vy *= 0.97;
          particle.vy += 0.025 * delta;
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
        }

        if (particle.life > 0) {
          nextParticles.push(particle);
          const alpha = Math.max(0, Math.min(1, particle.life / Math.min(particle.maxLife, 70)));
          this.context.globalAlpha = alpha;
          this.context.fillStyle = particle.color;
          this.context.shadowColor = particle.color;
          this.context.shadowBlur = particle.size * 4;
          this.context.beginPath();
          this.context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          this.context.fill();
        }
      }

      this.context.globalAlpha = 1;
      this.context.shadowBlur = 0;
      this.particles = nextParticles;

      if (this.mode !== "idle" || this.particles.length > 0) {
        this.raf = requestAnimationFrame(this.tick);
      } else {
        this.raf = 0;
      }
    }
  }

  const effects = new EffectsEngine(canvas, stage);

  const animateSuckable = (element, index, mouthPoint, currentRunId) => {
    const rect = element.getBoundingClientRect();
    const start = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const dx = mouthPoint.x - start.x;
    const dy = mouthPoint.y - start.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const direction = index % 2 === 0 ? 1 : -1;
    const curve = Math.min(145, Math.max(42, distance * 0.18)) * direction;
    const midX = dx * 0.58 + normalX * curve;
    const midY = dy * 0.58 + normalY * curve;
    const rotate = direction * (22 + (index % 4) * 13);
    const duration = Math.min(1080, 710 + distance * 0.22);
    const delay = index * 72;

    element.style.willChange = "transform, opacity, filter";

    const animation = registerAnimation(
      element.animate(
        [
          {
            offset: 0,
            transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px)",
          },
          {
            offset: 0.18,
            transform: `translate3d(${normalX * curve * 0.18}px, ${normalY * curve * 0.18}px, 0) scale(1.03) rotate(${-rotate * 0.12}deg)`,
            opacity: 1,
            filter: "blur(0px)",
          },
          {
            offset: 0.66,
            transform: `translate3d(${midX}px, ${midY}px, 0) scale(0.48) rotate(${rotate}deg)`,
            opacity: 0.82,
            filter: "blur(1.2px)",
          },
          {
            offset: 1,
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.025) rotate(${rotate * 2.2}deg)`,
            opacity: 0,
            filter: "blur(4px)",
          },
        ],
        {
          duration,
          delay,
          easing: "cubic-bezier(0.5, 0.02, 0.34, 1)",
          fill: "forwards",
        },
      ),
    );

    return animation.finished
      .catch(() => undefined)
      .then(() => {
        if (currentRunId === runId && state !== "idle") {
          element.style.visibility = "hidden";
        }
      });
  };

  const revealProfile = async (currentRunId) => {
    if (currentRunId !== runId) {
      return;
    }

    state = "spitting";
    stage.classList.remove("is-gulping");
    stage.classList.add("is-spitting");
    setStatus("Byte Blob이 프로필을 다시 꺼내고 있습니다.");

    revealLayer.setAttribute("aria-hidden", "false");
    revealCard.style.opacity = "0";
    revealCard.style.visibility = "visible";

    await wait(80);

    const mouthViewport = getCenter(mascotMouth);
    const cardViewport = getCenter(revealCard);
    const mouthStage = getStagePoint(mouthViewport);
    const cardStage = getStagePoint(cardViewport);
    effects.spit(mouthStage, cardStage);

    const dx = mouthViewport.x - cardViewport.x;
    const dy = mouthViewport.y - cardViewport.y;

    const cardAnimation = registerAnimation(
      revealCard.animate(
        [
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.035) rotate(-22deg)`,
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            offset: 0.5,
            transform: `translate3d(${dx * 0.46}px, ${dy * 0.46}px, 0) scale(0.4) rotate(11deg)`,
            opacity: 1,
            filter: "blur(3px)",
          },
          {
            offset: 0.83,
            transform: "translate3d(0, 0, 0) scale(1.07) rotate(-2deg)",
            opacity: 1,
            filter: "blur(0px)",
          },
          {
            transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px)",
          },
        ],
        {
          duration: 1180,
          easing: "cubic-bezier(0.16, 0.88, 0.28, 1.16)",
          fill: "forwards",
        },
      ),
    );

    await cardAnimation.finished.catch(() => undefined);

    if (currentRunId !== runId) {
      return;
    }

    effects.burst(cardStage);
    stage.classList.remove("is-spitting");
    stage.classList.add("is-revealed");
    state = "revealed";
    setStatus("곽성재의 프로필이 공개되었습니다.");
    replayButton.focus({ preventScroll: true });
  };

  const runSequence = async ({ skip = false } = {}) => {
    if (state !== "idle") {
      return;
    }

    runId += 1;
    const currentRunId = runId;
    state = "sucking";
    stage.classList.add("is-running");
    mascotButton.setAttribute("aria-expanded", "true");
    mascotHint.setAttribute("aria-hidden", "true");
    setStatus("Byte Blob이 README의 내용을 빨아들이기 시작했습니다.");

    if (skip || prefersReducedMotion.matches) {
      for (const element of suckables) {
        element.style.visibility = "hidden";
      }
      readmeScene.style.opacity = "0";
      stage.classList.add("is-gulping");
      await wait(80);
      await revealProfile(currentRunId);
      return;
    }

    const mouthViewport = getCenter(mascotMouth);
    effects.startVortex(getStagePoint(mouthViewport));

    await Promise.all(
      suckables.map((element, index) =>
        animateSuckable(element, index, mouthViewport, currentRunId),
      ),
    );

    if (currentRunId !== runId) {
      return;
    }

    effects.stopVortex();
    readmeScene.style.opacity = "0";
    stage.classList.add("is-gulping");
    setStatus("README를 모두 삼켰습니다.");

    await wait(650);
    await revealProfile(currentRunId);
  };

  const resetSequence = () => {
    runId += 1;
    state = "idle";

    for (const animation of activeAnimations) {
      animation.cancel();
    }
    activeAnimations.clear();
    effects.clear();

    stage.classList.remove(
      "is-running",
      "is-gulping",
      "is-spitting",
      "is-revealed",
    );

    readmeScene.removeAttribute("style");
    revealLayer.setAttribute("aria-hidden", "true");
    revealCard.removeAttribute("style");

    for (const element of suckables) {
      element.removeAttribute("style");
    }

    mascotButton.setAttribute("aria-expanded", "false");
    mascotHint.removeAttribute("aria-hidden");
    setStatus("처음 상태로 돌아왔습니다.");
    mascotButton.focus({ preventScroll: true });
  };

  mascotButton.addEventListener("click", () => runSequence());
  skipButton.addEventListener("click", () => runSequence({ skip: true }));
  replayButton.addEventListener("click", resetSequence);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state !== "idle") {
      resetSequence();
    }

    if ((event.key === "r" || event.key === "R") && state === "revealed") {
      resetSequence();
    }
  });

  window.addEventListener("pagehide", () => effects.clear());
})();
