/* ════════════════════════════════════════════════════════════════════
   হিসাব বই — Cinematic Ad (Director-Grade Timeline)
   9:16 Reels · 1080×1920 · 2 minutes · One scene at a time.
   ════════════════════════════════════════════════════════════════════ */

(() => {
"use strict";

/* ════════════════════════════════════════════════════════════════════
   UTILS
   ════════════════════════════════════════════════════════════════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, cls = "", html = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const ease = {
  out: "cubic-bezier(.16,1,.3,1)",
  spring: "cubic-bezier(.34,1.56,.64,1)"
};

/* ════════════════════════════════════════════════════════════════════
   BRAND
   ════════════════════════════════════════════════════════════════════ */

const BRAND = {
  emerald: "#10b981",
  emerald2: "#34d399",
  emeraldInk: "#022c22",
  emeraldDeep: "#064e3b"
};

/* ════════════════════════════════════════════════════════════════════
   TYPOGRAPHY ENGINE
   ONE headline. Strict enter/hold/exit. Never overlap.
   ════════════════════════════════════════════════════════════════════ */

const Typography = {
  layer: null,
  current: null,

  init() { this.layer = $("#textLayer"); },

  /**
   * Show a headline with kinetic word-by-word reveal.
   * @param {string} text - headline text
   * @param {object} opts - {cls: 'serif'|'big'|'med'|'micro', pos: 'center'|'top'|'bottom', twoLine: 'em' element}
   * @returns {Promise<number>} resolves when reveal is complete
   */
  show(text, opts = {}) {
    return new Promise(resolve => {
      this.clear();
      const cls = ["headline"];
      if (opts.cls) cls.push(opts.cls);
      if (opts.size) cls.push(opts.size);

      const stack = el("div", "stack");
      const h = el("div", cls.join(" "), text);
      stack.appendChild(h);
      this.layer.innerHTML = "";
      this.layer.appendChild(stack);
      this.current = h;

      // Word-by-word reveal — only wrap text nodes, preserve inline tags like <span>/<br/>
      const wrap = (root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const targets = [];
        while (walker.nextNode()) targets.push(walker.currentNode);
        targets.forEach(t => {
          const text = t.nodeValue;
          if (!text || !text.trim()) return;
          const frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach(seg => {
            if (!seg) return;
            if (/^\s+$/.test(seg)) {
              frag.appendChild(document.createTextNode(seg));
            } else {
              const w = document.createElement("span");
              w.className = "word";
              w.textContent = seg;
              frag.appendChild(w);
            }
          });
          t.parentNode.replaceChild(frag, t);
        });
      };
      wrap(h);

      // Reveal
      const words = $$(".word", h);
      words.forEach((w, i) => {
        setTimeout(() => w.classList.add("in"), i * 80 + (opts.delay || 0));
      });

      // Position class on layer
      this.layer.className = "text-layer " + (opts.pos ? "pos-" + opts.pos : "");

      const totalIn = words.length * 80 + 600;
      setTimeout(() => resolve(totalIn), totalIn);
    });
  },

  /** Fade out the current headline. */
  fadeOut(duration = 600) {
    if (!this.current) return Promise.resolve();
    return new Promise(resolve => {
      const h = this.current;
      h.style.transition = `opacity ${duration}ms ${ease.out}, transform ${duration}ms ${ease.out}`;
      h.style.opacity = "0";
      h.style.transform = "translateY(-12px)";
      setTimeout(() => {
        h.remove();
        this.current = null;
        resolve();
      }, duration);
    });
  },

  clear() {
    this.layer.innerHTML = "";
    this.current = null;
  }
};

/* ════════════════════════════════════════════════════════════════════
   CURTAIN — cinematic cuts
   ════════════════════════════════════════════════════════════════════ */

const Curtain = {
  el: null,
  init() { this.el = $("#curtain"); },
  /** Black-out then visible. Used between scenes. */
  async cut(down = 400, up = 500) {
    this.el.style.transition = `opacity ${down}ms linear`;
    this.el.style.opacity = 1;
    await wait(down);
    this.el.style.transition = `opacity ${up}ms linear`;
    this.el.style.opacity = 0;
    await wait(up);
  },
  setOpacity(o) { this.el.style.opacity = o; this.el.style.transition = "opacity .4s linear"; }
};

/* ════════════════════════════════════════════════════════════════════
   CUE LOG — surface sound design markers
   ════════════════════════════════════════════════════════════════════ */

const Cue = {
  el: null,
  init() { this.el = $("#cues"); this.el.textContent = ""; },
  mark(label, t) {
    const s = el("span", "", `[${t.toFixed(1)}s] ${label} | `);
    this.el.appendChild(s);
  }
};

/* ════════════════════════════════════════════════════════════════════
   SHARED ICONS (lucide-style, inline SVG)
   ════════════════════════════════════════════════════════════════════ */

const ICONS = {
  cart: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  package: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 16l9 5 9-5M3 12l9 5 9-5"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>',
  user: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
  userplus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
  home: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  bag: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  coins: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.1 16.2a6 6 0 0 1-7.9-7.9"/><path d="M22 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  trend: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M17 13h2"/></svg>',
  downcircle: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
  hand: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.4L3 14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.72 3a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l2.08-2.08a2 2 0 0 1 2.11-.45c.93.35 1.95.59 3 .72A2 2 0 0 1 22 16.92z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
};

/* ════════════════════════════════════════════════════════════════════
   SHARED ANIMATION HELPERS
   ════════════════════════════════════════════════════════════════════ */

function animateNumber(el, target, duration = 1500, prefix = "৳") {
  return new Promise(resolve => {
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(target * eased);
      el.textContent = prefix + v.toLocaleString("en-IN");
      if (p < 1) requestAnimationFrame(tick);
      else { el.textContent = prefix + target.toLocaleString("en-IN"); resolve(); }
    };
    requestAnimationFrame(tick);
  });
}

function animateCounters(root, duration = 1500) {
  const els = $$("[data-counter]", root);
  els.forEach(e => animateNumber(e, +e.dataset.counter, duration));
}

function drawCharts(root) {
  $$("svg.chart", root).forEach(svg => svg.classList.add("drawn"));
}

function showPage(root, pageName) {
  $$(".page", root).forEach(p => p.classList.toggle("on", p.dataset.page === pageName));
}

function setStyle(el, props, dur = 600, easeStr = ease.out) {
  const keys = Object.keys(props).filter(k => k !== "transition");
  const t = props.transition || keys.map(k => `${k} ${dur}ms ${easeStr}`).join(", ");
  Object.assign(el.style, props);
  el.style.transition = t;
}

/**
 * Animate from initial styles → final styles with a transition.
 * Initial styles are applied synchronously, then a reflow is forced
 * before the final styles are applied. This guarantees the transition runs.
 */
function animateFromTo(el, fromStyles, toStyles, dur = 800, easeStr = ease.out) {
  Object.assign(el.style, fromStyles);
  // Force reflow so the browser registers the initial values.
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight;
  requestAnimationFrame(() => {
    const keys = Object.keys(toStyles);
    el.style.transition = keys.map(k => `${k} ${dur}ms ${easeStr}`).join(", ");
    Object.assign(el.style, toStyles);
  });
}

/* ════════════════════════════════════════════════════════════════════
   SCENE FACTORY — every scene follows this contract:
     { root: HTMLElement, play: async (tl)=>void, cleanup: ()=>void }
   Only ONE scene exists in the DOM at any time. cleanup() removes it.
   ════════════════════════════════════════════════════════════════════ */

const SCENE_ROOT = () => $("#sceneRoot");

function mountScene(rootEl) {
  SCENE_ROOT().innerHTML = "";
  SCENE_ROOT().appendChild(rootEl);
}

/* ════════════════════════════════════════════════════════════════════
   APP UI BUILDER — real Hisab Boi surfaces (used inside phone scenes)
   ════════════════════════════════════════════════════════════════════ */

function buildAppShell(opts = {}) {
  const { active = "dashboard" } = opts;
  return `
  <div class="app">
    <div class="statusbar"><span>9:41</span><span style="opacity:.6">${ICONS.bag} ${ICONS.coins}</span></div>
    <div class="notch"></div>
    <div class="ab">
      ${buildPage("dashboard", buildDashboardPage(), active)}
      ${buildPage("customers", buildCustomersPage(), active)}
      ${buildPage("sales", buildSalesPage(), active)}
      ${buildPage("expenses", buildExpensesPage(), active)}
      ${buildPage("addtxn", buildAddTxnPage(), active)}
    </div>
    <div class="nav">
      <div class="nb ${active === 'dashboard' ? 'on' : ''}">${ICONS.home}<span>হোম</span></div>
      <div class="nb ${active === 'sales' || active === 'addtxn' ? 'on' : ''}">${ICONS.bag}<span>বিক্রি</span></div>
      <div class="nb ${active === 'customers' ? 'on' : ''}">${ICONS.coins}<span>বাকি</span></div>
      <div class="nb">${ICONS.chart}<span>রিপোর্ট</span></div>
      <div class="nb ${active === 'expenses' ? 'on' : ''}">${ICONS.settings}<span>আরও</span></div>
    </div>
    <div class="home-ind"></div>
  </div>`;
}

function buildPage(name, body, active) {
  return `<div class="page ${name === active ? 'on' : ''}" data-page="${name}">${body}</div>`;
}

function buildDashboardPage() {
  return `
    <div class="ph">
      <h3>করিম ট্রেডার্স</h3>
      <div class="cta">${ICONS.plus} নতুন</div>
    </div>
    <div class="pb">
      <div class="tile" style="border-left: 4px solid ${BRAND.emerald}">
        <div class="ic" style="background:rgba(16,185,129,.15); color:${BRAND.emerald2}">${ICONS.cart}</div>
        <div><div class="lab">আজকের বিক্রি</div><div class="val" data-counter="12500">৳০</div><div class="delta up">▲ ১২% গতকালের চেয়ে</div></div>
      </div>
      <div class="grid2">
        <div class="tile" style="border-left: 4px solid ${BRAND.emerald}">
          <div class="ic" style="background:rgba(16,185,129,.15); color:${BRAND.emerald2}">${ICONS.cart}</div>
          <div><div class="lab">মাসিক বিক্রি</div><div class="val" data-counter="325000">৳০</div></div>
        </div>
        <div class="tile" style="border-left: 4px solid #ef4444">
          <div class="ic" style="background:rgba(239,68,68,.15); color:#fca5a5">${ICONS.receipt}</div>
          <div><div class="lab">মাসিক খরচ</div><div class="val" data-counter="80500">৳০</div></div>
        </div>
      </div>
      <div class="grid2">
        <div class="tile" style="border-left: 4px solid #8b5cf6">
          <div class="ic" style="background:rgba(139,92,246,.15); color:#c4b5fd">${ICONS.coins}</div>
          <div><div class="lab">পাওনা</div><div class="val" data-counter="24500">৳০</div></div>
        </div>
        <div class="tile" style="border-left: 4px solid #f59e0b">
          <div class="ic" style="background:rgba(245,158,11,.15); color:#fcd34d">${ICONS.hand}</div>
          <div><div class="lab">দেনা</div><div class="val" data-counter="6200">৳০</div></div>
        </div>
      </div>
      <div class="chart-card">
        <h4>সাপ্তাহিক বিক্রি</h4>
        <div class="ch">
          <svg class="chart" viewBox="0 0 320 110" preserveAspectRatio="none" style="width:100%;height:100%">
            <defs>
              <linearGradient id="arDash" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#34d399" stop-opacity=".6"/><stop offset="100%" stop-color="#34d399" stop-opacity="0"/></linearGradient>
            </defs>
            <path class="area" d="M0,80 L40,60 L80,70 L120,40 L160,55 L200,30 L240,42 L280,22 L320,18 L320,110 L0,110 Z" fill="url(#arDash)"/>
            <path class="line" d="M0,80 L40,60 L80,70 L120,40 L160,55 L200,30 L240,42 L280,22 L320,18"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="fab">${ICONS.plus}</div>`;
}

function buildCustomersPage() {
  const cs = [
    { n: "রহিম",   phone: "০১৭১২-XXXXXX", due: 5000 },
    { n: "করিম",   phone: "০১৮১৫-XXXXXX", due: 3200 },
    { n: "সোহাগ",  phone: "০১৯৩৩-XXXXXX", due: 0 },
    { n: "জসিম",   phone: "০১৭৫০-XXXXXX", due: 1500 },
    { n: "মিজান",  phone: "০১৯১১-XXXXXX", due: 850 },
    { n: "সালাম",  phone: "০১৭৭৭-XXXXXX", due: 2100 }
  ];
  return `
    <div class="ph">
      <h3>কাস্টমার</h3>
      <div class="cta">+ নতুন</div>
    </div>
    <div class="search">${ICONS.search}<span style="margin-left:8px;">নাম বা নম্বর খুঁজুন…</span></div>
    <div class="pb">
      <div class="list custlist">
        ${cs.map(c => `
          <div class="row">
            <div class="av">${c.n.charAt(0)}</div>
            <div style="flex:1">
              <div class="nm">${c.n}</div>
              <div class="sub">${c.phone}</div>
            </div>
            <div class="amt ${c.due > 0 ? 'red' : 'green'}">${c.due > 0 ? '৳' + c.due.toLocaleString('en-IN') + ' বাকি' : 'পরিশোধিত'}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function buildSalesPage() {
  return `
    <div class="ph">
      <h3>বিক্রি</h3>
      <div class="cta">+ নতুন</div>
    </div>
    <div class="pb">
      <div class="list salelist">
        <div class="row"><div class="av">র</div><div style="flex:1"><div class="nm">রহিম মিয়া</div><div class="sub">চাল ৫০ কেজি · আজ ১০:২০</div></div><div class="v">৳২,৫০০</div></div>
        <div class="row"><div class="av">ক</div><div style="flex:1"><div class="nm">করিম সাহেব</div><div class="sub">তেল ১০ লিটার · আজ ১১:৪৫</div></div><div class="v">৳৪,৮০০</div></div>
        <div class="row"><div class="av">স</div><div style="flex:1"><div class="nm">সোহাগ</div><div class="sub">ডাল ১০ কেজি · আজ ১২:৩০</div></div><div class="v">৳১,২০০</div></div>
        <div class="row"><div class="av">জ</div><div style="flex:1"><div class="nm">জসিম</div><div class="sub">চিনি ২০ কেজি · গতকাল</div></div><div class="v">৳৩,৩০০</div></div>
        <div class="row"><div class="av">ম</div><div style="flex:1"><div class="nm">মিজান</div><div class="sub">পেঁয়াজ ১৫ কেজি · গতকাল</div></div><div class="v">৳৮৫০</div></div>
        <div class="row"><div class="av">স</div><div style="flex:1"><div class="nm">সালাম</div><div class="sub">ময়দা ২৫ কেজি · গতকাল</div></div><div class="v">৳২,১০০</div></div>
      </div>
    </div>
    <div class="fab">${ICONS.plus}</div>`;
}

function buildExpensesPage() {
  const items = [
    { lab: "দোকান ভাড়া", val: 8000, ic: "home", col: "#3b82f6" },
    { lab: "বিদ্যুৎ বিল", val: 1200, ic: "bolt", col: "#f59e0b" },
    { lab: "যাতায়াত",   val: 850,  ic: "truck", col: "#10b981" },
    { lab: "মোবাইল রিচার্জ", val: 300, ic: "phone", col: "#8b5cf6" },
    { lab: "বিবিধ",      val: 460,  ic: "receipt", col: "#ef4444" }
  ];
  const ic = (k) => ({ home: ICONS.home, bolt: ICONS.bolt, phone: ICONS.phone, receipt: ICONS.receipt, truck: ICONS.truck }[k] || ICONS.receipt);
  return `
    <div class="ph">
      <h3>খরচ</h3>
      <div class="cta">+ নতুন</div>
    </div>
    <div class="pb">
      <div class="tile" style="background:rgba(239,68,68,.08); border-color:rgba(239,68,68,.2)">
        <div class="ic" style="background:rgba(239,68,68,.15); color:#fca5a5">${ICONS.receipt}</div>
        <div><div class="lab">এই মাসের মোট</div><div class="val" data-counter="10810" style="color:#fca5a5">৳০</div></div>
      </div>
      <div class="list">
        ${items.map(i => `
          <div class="row">
            <div class="av" style="background:${i.col}22; color:${i.col}">${ic(i.ic)}</div>
            <div style="flex:1"><div class="nm">${i.lab}</div><div class="sub">আজ</div></div>
            <div class="v" style="color:#fca5a5; font-weight:800; font-family:'DM Serif Display', serif; font-size:17px;">৳${i.val.toLocaleString('en-IN')}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function buildAddTxnPage() {
  return `
    <div class="ph">
      <h3>লেনদেন যোগ</h3>
      <div class="cta">${ICONS.check}</div>
    </div>
    <div class="pb">
      <div class="form-field">
        <div class="lbl">ধরন</div>
        <div class="chip-row">
          <div class="chip on">বিক্রি</div>
          <div class="chip">কেনা</div>
          <div class="chip">খরচ</div>
        </div>
      </div>
      <div class="form-field">
        <div class="lbl">কাস্টমার</div>
        <div class="inp">
          <div style="width:34px; height:34px; border-radius:50%; background:rgba(16,185,129,.2); color:${BRAND.emerald2}; display:flex; align-items:center; justify-content:center; font-weight:700;">র</div>
          <div style="font-weight:700; color:#fff;">রহিম মিয়া</div>
        </div>
      </div>
      <div class="form-field">
        <div class="lbl">পরিমাণ</div>
        <div class="inp big">৳ ২,৫০০</div>
      </div>
      <div class="save-btn">${ICONS.check} সংরক্ষণ করুন</div>
    </div>`;
}

/* Phone — a DOM node already positioned. */
function buildPhone(pw, ph, activePage) {
  const node = el("div", "phone");
  node.style.setProperty("--pw", pw + "px");
  node.style.setProperty("--ph", ph + "px");
  node.innerHTML = `
    <div class="body"></div>
    <div class="glass">${buildAppShell({ active: activePage })}</div>
    <div class="reflect"></div>
  `;
  return node;
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 01 — CINEMATIC HOOK (0:00–0:08)
   ════════════════════════════════════════════════════════════════════ */

function scene01_hook() {
  const root = el("div", "scene-base shop-scene");
  const camera = el("div", "camera");
  camera.innerHTML = `
    <div class="shop-backwall"></div>
    <div class="shop-shelf left"></div>
    <div class="shop-shelf right"></div>
    <div class="shop-counter">
      <div class="shop-notebook">
        <div class="page">
          <div>রহিম মিয়া ......... <span class="ink-hi">৳২,৫০০</span></div>
          <div>করিম সাহেব ........ <span class="ink-hi">৳৪,৮০০</span></div>
          <div>সোহাগ .............. <span class="ink-hi">৳১,২০০</span></div>
          <div>জসিম ............... <span class="ink-hi">৳৩,৩০০</span></div>
          <div>মিজান ............... <span class="ink-hi">৳৮৫০</span></div>
        </div>
        <div class="shop-hand" style="left:62%; top:72%;">
          <div class="shop-pen" style="position:absolute; left:60%; top:-50%;"></div>
        </div>
      </div>
    </div>
    <div class="shop-floor"></div>
  `;
  root.appendChild(camera);

  let timeline__start = 0;

  const play = async (tl) => {
    Cue.mark("S01 enter", tl);
    // Camera slow push-in
    camera.style.transition = "transform 4s cubic-bezier(.16,1,.3,1)";
    camera.style.transform = "scale(1.10)";
    // Pen wiggle — handwriting feel
    const hand = $(".shop-hand", camera);
    const pen  = $(".shop-pen", hand);
    let i = 0;
    const writeInt = setInterval(() => {
      pen.style.transform = `rotate(${(-22 + (Math.random() - .5) * 6)}deg) translateY(${Math.random() * 4}px)`;
      i++;
      if (i > 80) clearInterval(writeInt);
    }, 80);

    // Pause to let the scene establish.
    await wait(3500);
    Cue.mark("S01 headline", tl);

    // One headline ONLY.
    await Typography.show("হিসাব রাখতে<br/><span style='font-family:DM Serif Display,serif; font-style:italic; font-weight:400; color:#34d399;'>এখনও খাতা-কলম?</span>", { size: "hero", pos: "mid" });
    await wait(2400);
    await Typography.fadeOut();
    await wait(500);
  };

  const cleanup = () => { root.innerHTML = ""; };

  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 02 — CHAOS (0:08–0:17, 9s)
   ════════════════════════════════════════════════════════════════════ */

function scene02_chaos() {
  const root = el("div", "scene-base chaos-scene");
  // One paper appears, lines build up sequentially — then chaos.
  root.innerHTML = `
    <div class="chaos-paper" id="chaosPaper" style="left:50%; top:50%; transform: translate(-50%, -50%) rotate(-2deg);">
      <div id="chaosLine" style="opacity:0">রহিম &nbsp; <span class="crossed">২,৫০০</span></div>
      <div id="chaosLine2" style="opacity:0">করিম &nbsp; <span class="crossed">৪,৮০০</span></div>
      <div id="chaosLine3" style="opacity:0">সোহাগ &nbsp; <span class="crossed">১,২০০</span></div>
      <div id="chaosLine4" style="opacity:0">জসিম &nbsp; <span class="crossed">৩,৩০০</span></div>
      <div id="chaosLine5" style="opacity:0">মিজান &nbsp; <span class="crossed">৮৫০</span></div>
      <div id="chaosLine6" style="opacity:0">সালাম &nbsp; <span class="crossed">২,১০০</span></div>
      <div id="chaosLine7" style="opacity:0">ফারুক &nbsp; <span class="crossed">১,৭৫০</span></div>
    </div>`;
  const paper = $("#chaosPaper", root);

  const play = async (tl) => {
    Cue.mark("S02 enter", tl);
    // Paper fades in (opacity only — transform already matches initial state)
    setStyle(paper, { opacity: 1 }, 500);
    await wait(500);
    // Lines reveal in sequence — slow then quick
    const lines = ["#chaosLine","#chaosLine2","#chaosLine3","#chaosLine4","#chaosLine5","#chaosLine6","#chaosLine7"];
    for (let i = 0; i < lines.length; i++) {
      const l = $(lines[i], root);
      l.style.transition = "opacity .4s ease";
      l.style.opacity = "1";
      await wait(420);
    }
    Cue.mark("S02 freeze", tl);
    // Brief pause
    await wait(700);

    // Freeze: shake paper briefly, then settle
    paper.style.transition = "transform .15s ease";
    for (let s = 0; s < 3; s++) {
      paper.style.transform = `translate(-50%, -50%) translateX(${(s % 2 ? 4 : -4)}px) rotate(-2deg)`;
      await wait(140);
    }
    paper.style.transform = "translate(-50%, -50%) rotate(-2deg)";

    Cue.mark("S02 headline", tl);
    await Typography.show("<span style='font-family:DM Serif Display,serif; font-style:italic; font-weight:400; color:#34d399;'>হিসাব গুলিয়ে যাচ্ছে?</span>", { size: "big", pos: "mid" });
    await wait(2200);
    await Typography.fadeOut();
    await wait(400);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 03 — SILENCE → PRODUCT REVEAL (0:17–0:27, 10s)
   ════════════════════════════════════════════════════════════════════ */

function scene03_reveal() {
  const root = el("div", "scene-base reveal-scene");
  root.innerHTML = `
    <div class="reveal-glow"></div>
    <div class="reveal-logo" id="rLogo"><span class="mark">৳</span></div>
  `;
  const logo = $("#rLogo", root);

  const play = async (tl) => {
    Cue.mark("S03 enter", tl);
    // Glow pulse
    const glow = $(".reveal-glow", root);
    setStyle(glow, { opacity: 1 }, 600);
    // Logo pop in
    setStyle(logo, { transform: "translate(-50%, -50%) scale(1)" }, 1000, ease.spring);
    await wait(2200);

    // Hero text below logo
    await Typography.show("হিসাব হোক<br/><span style='font-family:DM Serif Display,serif; font-style:italic; font-weight:400; color:#34d399;'>স্মার্ট।</span>", { size: "hero", pos: "bottom" });
    await wait(2400);
    await Typography.fadeOut();
    await wait(400);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 04 — APP INTRO (0:27–0:37, 10s)
   ════════════════════════════════════════════════════════════════════ */

function scene04_appIntro() {
  const root = el("div", "scene-base intro-scene");
  const phone = buildPhone(440, 880, "dashboard");
  root.appendChild(phone);
  const phoneEl = phone;

  const play = async (tl) => {
    Cue.mark("S04 enter", tl);
    // Phone enters from small scale with a slight Y rotation
    animateFromTo(phoneEl,
      { transform: "translate(-50%, -50%) scale(0.55) rotateY(-12deg)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(1) rotateY(0deg)", opacity: 1 },
      1600, ease.spring);

    // Brief pause — let the viewer register the app
    await wait(1800);
    // First line
    await Typography.show("আপনার ব্যবসার হিসাব", { size: "big", pos: "top" });
    await wait(1400);
    // Remove first before second appears
    await Typography.fadeOut(400);
    await wait(200);
    // Second line
    await Typography.show("এক জায়গায়।", { size: "big", pos: "top" });
    await wait(1500);
    await Typography.fadeOut(400);
    await wait(400);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 05 — CUSTOMER DUE (0:37–0:49, 12s)
   ════════════════════════════════════════════════════════════════════ */

function scene05_customerDue() {
  const root = el("div", "scene-base due-scene");
  root.innerHTML = `
    <div class="due-hero">
      <div class="num" id="dueNum" data-counter="5000">৳০</div>
      <div class="lab">বাকি</div>
    </div>
  `;
  const num = $("#dueNum", root);

  const play = async (tl) => {
    Cue.mark("S05 enter", tl);

    // First — phone briefly shows customer list (soft, small), then hides
    // We won't show phone here — keep ONE focus: the number.
    await wait(300);

    // Big number counts up to 5000
    await animateNumber(num, 5000, 1500);
    await wait(1200);

    Cue.mark("S05 pay1", tl);
    // Pay sequence: 5000 → 4000 → 3000 → 2000 → 1000 → 0
    for (const v of [4500, 3500, 2500, 1500, 500]) {
      num.style.transition = "all .35s ease";
      num.textContent = "৳" + v.toLocaleString("en-IN");
      await wait(450);
    }
    num.textContent = "৳০";
    await wait(400);

    Cue.mark("S05 headline", tl);
    await Typography.show("কে কত টাকা দেবে?", { size: "big", pos: "top" });
    await wait(1600);
    await Typography.fadeOut(400);
    await wait(200);
    await Typography.show("এক নজরেই জানুন।", { size: "big", pos: "top" });
    await wait(1800);
    await Typography.fadeOut(400);
    await wait(300);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 06 — TRANSACTION (0:49–0:59, 10s)
   ════════════════════════════════════════════════════════════════════ */

function scene06_transaction() {
  const root = el("div", "scene-base txn-scene");
  const phone = buildPhone(380, 760, "addtxn");
  root.appendChild(phone);
  phone.style.left = "25%";

  const card = el("div", "txn-card", `
    <h4>লেনদেন সংরক্ষিত ${ICONS.check}</h4>
    <div class="line"><span>কাস্টমার</span><strong>রহিম মিয়া</strong></div>
    <div class="line"><span>ধরন</span><strong>বিক্রি</strong></div>
    <div class="line"><span>পণ্য</span><strong>চাল ৫০ কেজি</strong></div>
    <div class="total"><span>মোট</span><span>৳২,৫০০</span></div>
  `);
  card.style.left = "auto";
  card.style.right = "8%";
  card.style.top = "50%";
  card.style.transform = "translate(0, -50%) scale(0.9)";
  card.style.opacity = "0";
  root.appendChild(card);

  const play = async (tl) => {
    Cue.mark("S06 enter", tl);
    setStyle(card, { opacity: 1, transform: "translate(0, -50%) scale(1)" }, 700, ease.spring);
    await wait(1800);
    Cue.mark("S06 hl1", tl);
    await Typography.show("লেনদেন লিখুন।", { size: "big", pos: "top" });
    await wait(1600);
    await Typography.fadeOut(400);
    await wait(200);
    await Typography.show("হিসাব রাখুন।", { size: "big", pos: "top" });
    await wait(1800);
    await Typography.fadeOut(400);
    await wait(300);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 07 — EXPENSE (0:59–1:09, 10s)
   ════════════════════════════════════════════════════════════════════ */

function scene07_expense() {
  const root = el("div", "scene-base expense-scene");
  root.innerHTML = `
    <div class="expense-bill" id="bill">
      <h4>বিদ্যুৎ বিল — জুন ২০২৬</h4>
      <div class="ln"><span>ইউনিট</span><strong>১৪২ kWh</strong></div>
      <div class="ln"><span>ভ্যাট</span><strong>১৫%</strong></div>
      <div class="ln"><span>সারভিস চার্জ</span><strong>৳৫০</strong></div>
      <div class="total"><span>মোট</span><span>৳১,২০০</span></div>
    </div>
  `;
  const bill = $("#bill", root);

  const play = async (tl) => {
    Cue.mark("S07 enter", tl);
    await wait(600);
    Cue.mark("S07 morph", tl);
    // Bill shrinks and morphs to a phone showing expense
    bill.style.transition = "opacity .6s ease, transform .6s ease";
    bill.style.opacity = "0";
    bill.style.transform = "translate(-50%, -50%) scale(.4)";
    await wait(700);

    // Replace bill with a phone showing expenses
    root.innerHTML = "";
    const phone = buildPhone(460, 920, "expenses");
    root.appendChild(phone);
    animateFromTo(phone,
      { transform: "translate(-50%, -50%) scale(.9)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
      800, ease.spring);

    await wait(1200);
    // Count up the monthly expense number (NOT simultaneously with text — text comes after)
    const els = $$("[data-counter]", root);
    await Promise.all(els.map(e => animateNumber(e, +e.dataset.counter, 1500)));
    await wait(800);

    Cue.mark("S07 hl1", tl);
    await Typography.show("বিক্রি যেমন দেখবেন,", { size: "big", pos: "top" });
    await wait(1500);
    await Typography.fadeOut(400);
    await wait(200);
    await Typography.show("খরচও থাকবে নজরে।", { size: "big", pos: "top" });
    await wait(1700);
    await Typography.fadeOut(400);
    await wait(300);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 08 — BUSINESS OVERVIEW (1:09–1:21, 12s)
   ════════════════════════════════════════════════════════════════════ */

function scene08_overview() {
  const root = el("div", "scene-base biz-scene");
  // Start with empty, just phone shell — then metric appears one at a time
  const phone = buildPhone(520, 1000, "dashboard");
  root.appendChild(phone);
  phone.style.opacity = "0";

  const play = async (tl) => {
    Cue.mark("S08 enter", tl);
    setStyle(phone, { opacity: 1, transform: "translate(-50%, -50%) scale(.94)" }, 800);
    await wait(800);

    // ONE BIG METRIC appears first (top of phone's view)
    const m1 = el("div", "biz-metric", `
      <div class="lab">মাসিক বিক্রি</div>
      <div class="val" id="m1v">৳০</div>
    `);
    m1.style.right = "8%";
    m1.style.top = "30%";
    m1.style.opacity = "0";
    root.appendChild(m1);
    setStyle(m1, { opacity: 1, transform: "translateX(0)" }, 700);
    await animateNumber($("#m1v", m1), 325000, 1600);

    Cue.mark("S08 m2", tl);
    await wait(1400);

    // Replace metric 1 with metric 2 in a different position
    setStyle(m1, { opacity: 0 }, 400);
    await wait(500);
    m1.remove();
    const m2 = el("div", "biz-metric", `
      <div class="lab">মাসিক খরচ</div>
      <div class="val" id="m2v" style="color:#fca5a5">৳০</div>
    `);
    m2.style.left = "8%";
    m2.style.bottom = "32%";
    root.appendChild(m2);
    setStyle(m2, { opacity: 1 }, 600);
    await animateNumber($("#m2v", m2), 80500, 1600);

    await wait(1400);
    Cue.mark("S08 m3", tl);
    setStyle(m2, { opacity: 0 }, 400);
    await wait(400);
    m2.remove();

    // Draw the chart in the phone
    drawCharts(phone);

    // Final headline
    await Typography.show("ব্যবসার অবস্থা বুঝুন<br/><span style='font-family:DM Serif Display,serif; font-style:italic; font-weight:400; color:#34d399;'>এক নজরে।</span>", { size: "big", pos: "top" });
    await wait(2400);
    await Typography.fadeOut(400);
    await wait(400);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 09 — FAST MONTAGE (1:21–1:33, 12s)
   ════════════════════════════════════════════════════════════════════ */

function scene09_montage() {
  const root = el("div", "scene-base montage-scene");
  const shots = [
    { headline: "সহজ।",     page: "addtxn" },
    { headline: "দ্রুত।",    page: "sales" },
    { headline: "গোছানো।",  page: "customers" },
    { headline: "স্মার্ট।",  page: "dashboard" }
  ];

  const play = async (tl) => {
    Cue.mark("S09 enter", tl);
    for (const s of shots) {
      Cue.mark(`S09: ${s.headline}`, tl);
      root.innerHTML = "";
      // Smaller phone, positioned higher to leave room for the word
      const phone = buildPhone(320, 640, s.page);
      root.appendChild(phone);
      animateFromTo(phone,
        { transform: "translate(-50%, -60%) scale(.85)", opacity: 0 },
        { transform: "translate(-50%, -60%) scale(1)", opacity: 1 },
        600, ease.spring);

      await wait(900);
      // Headline appears at the bottom, well below the phone
      await Typography.show("<span style='font-family:DM Serif Display,serif; font-style:italic; font-weight:400; color:#34d399;'>" + s.headline + "</span>", { size: "hero", pos: "bottom" });
      await wait(1300);
      await Typography.fadeOut(250);
      await wait(150);
    }
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 10 — PAPER → DIGITAL MORPH (1:33–1:45, 12s)
   ════════════════════════════════════════════════════════════════════ */

function scene10_morph() {
  const root = el("div", "scene-base morph-scene");
  root.innerHTML = `
    <div class="morph-paper" id="mPaper">
      <h4>দোকানের হিসাব</h4>
      <div>রহিম — <span class="crossed">২,৫০০</span></div>
      <div>করিম — <span class="crossed">৪,৮০০</span></div>
      <div>সোহাগ — <span class="crossed">১,২০০</span></div>
      <div>জসিম — <span class="crossed">৩,৩০০</span></div>
      <div>মিজান — <span class="crossed">৮৫০</span></div>
      <div>সালাম — <span class="crossed">২,১০০</span></div>
      <div>ফারুক — <span class="crossed">১,৭৫০</span></div>
    </div>
  `;
  const paper = $("#mPaper", root);

  const play = async (tl) => {
    Cue.mark("S10 enter", tl);
    // Camera reveals the page (already visible from enter)
    await wait(900);

    // First headline — BEFORE morph (sequential text)
    await Typography.show("খাতার হিসাব থেকে", { size: "big", pos: "top" });
    await wait(1700);
    await Typography.fadeOut(400);
    await wait(200);

    // Morph: paper shrinks and a phone appears
    paper.style.transition = "opacity .7s ease, transform .7s ease";
    paper.style.opacity = "0";
    paper.style.transform = "translate(-50%, -50%) scale(.4)";
    await wait(800);
    root.innerHTML = "";
    const phone = buildPhone(440, 880, "dashboard");
    root.appendChild(phone);
    animateFromTo(phone,
      { transform: "translate(-50%, -50%) scale(.85)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
      800, ease.spring);
    await wait(1500);

    // Second headline — AFTER morph
    await Typography.show("ডিজিটাল হিসাবের পথে।", { size: "big", pos: "top" });
    await wait(2000);
    await Typography.fadeOut(400);
    await wait(400);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 11 — EMOTIONAL PAYOFF (1:45–1:53, 8s)
   ════════════════════════════════════════════════════════════════════ */

function scene11_peace() {
  const root = el("div", "scene-base peace-scene");
  root.innerHTML = `
    <div class="peace-counter"></div>
    <div class="peace-owner"></div>
    <div class="peace-phone">${buildAppShell({ active: "customers" })}</div>
    <div class="peace-check" id="pCheck">✓</div>
  `;

  const play = async (tl) => {
    Cue.mark("S11 enter", tl);
    await wait(800);

    // Phone content activates, data counts up
    animateCounters(root, 1500);
    drawCharts(root);

    Cue.mark("S11 check", tl);
    // Calm beat — small pause to let the scene register
    await wait(1500);
    // Big check appears
    const checkEl = $("#pCheck", root);
    checkEl.style.transition = "transform .7s cubic-bezier(.34,1.56,.64,1)";
    checkEl.style.transform = "translate(-50%, -50%) scale(1)";
    await wait(1200);

    Cue.mark("S11 hl1", tl);
    await Typography.show("হিসাব নিয়ে চিন্তা নয়।", { size: "big", pos: "top" });
    await wait(1700);
    await Typography.fadeOut(400);
    await wait(200);
    await Typography.show("ব্যবসায় মন দিন।", { size: "big", pos: "top" });
    await wait(1800);
    await Typography.fadeOut(400);
    await wait(300);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   SCENE 12 — HERO PRODUCT / BRAND (1:53–2:00, 7s+)
   ════════════════════════════════════════════════════════════════════ */

function scene12_hero() {
  const root = el("div", "scene-base hero-scene");
  root.innerHTML = `
    <div class="hero-beam"></div>
    <div class="hero-glow"></div>
    <div class="hero-logo" id="hLogo">৳</div>
    <div class="hero-cta" id="hCta">আজই ব্যবহার শুরু করুন</div>
    <div class="hero-badge" id="hBadge">
      <span style="font-size:24px">▶</span>
      <div style="text-align:left">
        <div class="ti">GET IT ON</div>
        <div class="tt">Hisab Boi</div>
      </div>
    </div>
  `;
  const logo = $("#hLogo", root);

  const play = async (tl) => {
    Cue.mark("S12 enter", tl);
    await wait(300);

    // Logo pop
    logo.style.transition = "transform .9s cubic-bezier(.34,1.56,.64,1)";
    logo.style.transform = "translate(-50%, -50%) scale(1)";
    await wait(1100);

    // Brand name headline
    await Typography.show("<span style='font-family:DM Serif Display,serif;'>হিসাব বই</span>", { size: "hero", pos: "bottom" });
    await wait(1100);
    await Typography.fadeOut(300);
    await wait(150);

    // Two-line headline sequence (compressed)
    await Typography.show("আপনার ব্যবসার হিসাব,", { size: "big", pos: "top" });
    await wait(1000);
    await Typography.fadeOut(300);
    await wait(150);
    await Typography.show("এখন আরও সহজ।", { size: "big", pos: "top" });
    await wait(1300);
    await Typography.fadeOut(300);
    await wait(300);

    // CTA button
    const cta = $("#hCta", root);
    cta.style.transition = "transform .6s cubic-bezier(.34,1.56,.64,1), opacity .6s ease";
    cta.style.opacity = "1";
    cta.style.transform = "translate(-50%, -50%) scale(1)";

    const badge = $("#hBadge", root);
    badge.style.transition = "transform .6s cubic-bezier(.34,1.56,.64,1) .2s, opacity .6s ease .2s";
    badge.style.opacity = "1";
    badge.style.transform = "translate(-50%, -50%) scale(1)";
    await wait(1600);

    // Fade out
    Cue.mark("S12 fade", tl);
    Curtain.setOpacity(1);
    await wait(1200);
  };

  const cleanup = () => { root.innerHTML = ""; };
  return { root, play, cleanup };
}

/* ════════════════════════════════════════════════════════════════════
   MASTER TIMELINE — runs scenes back-to-back, full cleanup between.
   ════════════════════════════════════════════════════════════════════ */

async function runShow() {
  const scenes = [
    scene01_hook,
    scene02_chaos,
    scene03_reveal,
    scene04_appIntro,
    scene05_customerDue,
    scene06_transaction,
    scene07_expense,
    scene08_overview,
    scene09_montage,
    scene10_morph,
    scene11_peace,
    scene12_hero
  ];

  let t = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]();
    mountScene(scene.root);

    // Black curtain cut between scenes
    if (i > 0) {
      await Curtain.cut(380, 480);
    }

    // Ensure stage is visible after curtain
    Curtain.setOpacity(0);

    await scene.play(t);

    // Clean scene DOM before next
    scene.cleanup();
    Typography.clear();
  }

  // Final curtain holds — keeps the screen black for ~1.5s for post credits.
  await wait(1500);

  // Final hold & fade already done by scene12; we are done.
}

window.addEventListener("load", async () => {
  Typography.init();
  Curtain.init();
  Cue.init();

  // Brief black opening — 800ms of pure black before the first scene reveals.
  Curtain.setOpacity(1);
  await wait(800);
  Curtain.setOpacity(0);
  await wait(400);

  runShow();
});

})();
