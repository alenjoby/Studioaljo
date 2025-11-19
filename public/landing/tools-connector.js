// JS module to draw responsive Bezier connectors and sync card border animations
const NARROW_MQ = "(max-width: 1100px)";
const PREFERS_REDUCED = "(prefers-reduced-motion: reduce)";

// Speeds in px per ms
const SPEEDS = { path: 0.45, border: 0.55 };
const PULSE_FRAC = 0.14; // fraction of path visible as pulse

const state = { initialized: false, observers: [], animations: [] };

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
const prefersReduced = () => matchMedia(PREFERS_REDUCED).matches;
const isNarrow = () => matchMedia(NARROW_MQ).matches;
const raf = () => new Promise((r) => requestAnimationFrame(r));

async function initToolsConnector() {
  if (state.initialized) return;
  if (prefersReduced() || isNarrow()) return;

  const src = qs("#generate-bar");
  const svg = qs("#tools-connector");
  const cards = qsa(".tools-grid .tool-card");
  if (!src || !svg || cards.length < 1) return;

  document.body.classList.add("connector-enhanced");
  state.initialized = true;
  setupObservers(src, cards, svg);
  await computeAndAnimate(src, cards, svg);
}

function teardown() {
  state.animations.forEach((a) => {
    try {
      a.cancel();
    } catch (_) {}
  });
  state.animations = [];
  state.observers.forEach((o) => {
    try {
      o.disconnect();
    } catch (_) {}
  });
  state.observers = [];
  state.initialized = false;
  const svg = qs("#tools-connector");
  if (svg) svg.innerHTML = "";
  document.body.classList.remove("connector-enhanced");
}

function setupObservers(src, cards, svg) {
  const ro = new ResizeObserver(debounceRecompute(src, cards, svg));
  [src, svg, ...cards].forEach((el) => el && ro.observe(el));
  state.observers.push(ro);

  const mqNarrow = matchMedia(NARROW_MQ);
  const mqPRM = matchMedia(PREFERS_REDUCED);
  const onChange = () => {
    prefersReduced() || isNarrow() ? teardown() : initToolsConnector();
  };
  mqNarrow.addEventListener("change", onChange);
  mqPRM.addEventListener("change", onChange);
  state.observers.push({
    disconnect() {
      mqNarrow.removeEventListener("change", onChange);
      mqPRM.removeEventListener("change", onChange);
    },
  });
}

function debounceRecompute(src, cards, svg) {
  let pending = false;
  return async () => {
    if (pending) return;
    pending = true;
    await raf();
    await raf();
    pending = false;
    await computeAndAnimate(src, cards, svg);
  };
}

async function computeAndAnimate(src, cards, svg) {
  // cancel previous
  state.animations.forEach((a) => {
    try {
      a.cancel();
    } catch (_) {}
  });
  state.animations = [];
  svg.innerHTML = "";

  const srcRect = src.getBoundingClientRect();
  const grid = qs(".tools-grid");
  const gridRect = grid.getBoundingClientRect();

  const vbLeft = Math.min(srcRect.left, gridRect.left) - 20;
  const vbRight = Math.max(srcRect.right, gridRect.right) + 20;
  const vbTop = srcRect.bottom - 10;
  const vbBottom = gridRect.top + 140;
  const vbW = vbRight - vbLeft;
  const vbH = Math.max(160, vbBottom - vbTop);
  svg.setAttribute("viewBox", `0 0 ${vbW} ${vbH}`);

  const toLocal = (x, y) => ({ x: x - vbLeft, y: y - vbTop });
  const srcPoint = toLocal(srcRect.left + srcRect.width / 2, srcRect.bottom);

  const orange =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--orange")
      .trim() || "#ff6b00";

  const selCards = cards.slice(0, 3);
  const items = selCards.map((card) => {
    const r = card.getBoundingClientRect();
    const dst = toLocal(r.left + r.width / 2, r.top);
    const d = cubicFromTo(srcPoint, dst);
    const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
    base.setAttribute("d", d);
    base.setAttribute("class", "connector-base");
    svg.appendChild(base);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "connector-path");
    path.style.setProperty("--connector-color", orange);
    svg.appendChild(path);
    return { path, card };
  });

  items.forEach(({ path, card }, idx) => {
    const len = path.getTotalLength();
    const pulseLen = Math.max(24, Math.min(60, len * PULSE_FRAC));
    path.style.strokeDasharray = `${pulseLen} ${len}`;
    path.style.strokeDashoffset = String(len);

    // size card border overlay and color
    const cardSvg = card.querySelector(".card-border-svg");
    const rect = cardSvg?.querySelector(".card-border-rect");
    if (cardSvg && rect) {
      cardSvg.setAttribute(
        "viewBox",
        `0 0 ${card.clientWidth} ${card.clientHeight}`
      );
      rect.setAttribute("x", "1");
      rect.setAttribute("y", "1");
      rect.setAttribute("width", String(Math.max(0, card.clientWidth - 2)));
      rect.setAttribute("height", String(Math.max(0, card.clientHeight - 2)));
      rect.style.stroke = orange;
    }

    const travelMs = len / SPEEDS.path;
    const borderMs = Math.max(
      900,
      (2 * (card.clientWidth + card.clientHeight)) / SPEEDS.border
    );
    const startDelay = idx * 150;

    const a1 = path.animate(
      [
        { strokeDashoffset: len, opacity: 1 },
        { strokeDashoffset: 0, opacity: 1 },
      ],
      {
        duration: travelMs,
        easing: "linear",
        delay: startDelay,
        iterations: Infinity,
      }
    );
    state.animations.push(a1);

    if (rect) {
      rect.style.strokeDasharray = "100 100";
      rect.style.strokeDashoffset = "100";
      const a2 = rect.animate(
        [
          { strokeDashoffset: 100, opacity: 1 },
          { strokeDashoffset: 0, opacity: 1 },
        ],
        {
          duration: borderMs,
          easing: "linear",
          delay: startDelay + travelMs,
          iterations: Infinity,
        }
      );
      state.animations.push(a2);
    }
  });
}

function cubicFromTo(src, dst) {
  const dy = Math.max(40, Math.min(160, (dst.y - src.y) * 0.6));
  const dx = dst.x - src.x;
  const hx = Math.min(140, Math.abs(dx) * 0.25);
  const s = Math.sign(dx) || 1;
  const c1 = { x: src.x + s * hx * 0.5, y: src.y + dy };
  const c2 = { x: dst.x - s * hx * 0.5, y: dst.y - dy };
  return `M ${src.x} ${src.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${dst.x} ${dst.y}`;
}

(function start() {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  )
    initToolsConnector();
  else
    document.addEventListener("DOMContentLoaded", initToolsConnector, {
      once: true,
    });
})();

window.__toolsConnectorTeardown = teardown;
