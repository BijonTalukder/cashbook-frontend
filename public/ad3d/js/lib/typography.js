/* ============================================================
   Typography engine — ONE headline at a time.
   Strict enter (word-by-word) → hold → exit (full fade).
   ============================================================ */

(function (global) {
  const EASE_EMPHASIZED = "cubic-bezier(0.2, 0, 0, 1)";

  function wrapWords(rootEl) {
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (!text || !text.trim()) continue;
      targets.push(node);
    }
    for (const textNode of targets) {
      const text = textNode.nodeValue;
      const frag = document.createDocumentFragment();
      const tokens = text.split(/(\s+)/);
      for (const tok of tokens) {
        if (!tok) continue;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
        } else {
          const span = document.createElement("span");
          span.className = "w";
          span.textContent = tok;
          frag.appendChild(span);
        }
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  class Typography {
    constructor(layerEl) {
      this.layer = layerEl;
      this.currentEl = null;
      this._busy = false;
      this._resolveShow = null;
    }

    clear() {
      this.layer.classList.remove("pos-top", "pos-bottom", "pos-mid");
      this.layer.innerHTML = "";
      this.currentEl = null;
      this._busy = false;
    }

    show(html, opts = {}) {
      if (this._busy) {
        console.warn("[Typography] Busy — show() called while previous headline still active.");
        return Promise.resolve();
      }
      const { size = "big", pos = "mid", wordDelay = 70 } = opts;

      this.layer.classList.remove("pos-top", "pos-bottom", "pos-mid");
      this.layer.classList.add(`pos-${pos}`);

      const el = document.createElement("h1");
      el.className = `headline ${size}`;
      el.innerHTML = html;
      this.layer.innerHTML = "";
      this.layer.appendChild(el);
      this.currentEl = el;

      wrapWords(el);

      const words = Array.from(el.querySelectorAll(".w"));
      if (!words.length) return Promise.resolve();

      return new Promise((resolve) => {
        this._busy = true;
        this._resolveShow = resolve;
        requestAnimationFrame(() => {
          words.forEach((w, i) => {
            w.style.transition = `opacity 520ms ${EASE_EMPHASIZED} ${i * wordDelay}ms, transform 520ms ${EASE_EMPHASIZED} ${i * wordDelay}ms, filter 520ms ${EASE_EMPHASIZED} ${i * wordDelay}ms`;
            w.style.opacity = "1";
            w.style.transform = "translateY(0)";
            w.style.filter = "blur(0)";
          });
          const totalTime = words.length * wordDelay + 600;
          setTimeout(() => {
            this._busy = false;
            const r = this._resolveShow;
            this._resolveShow = null;
            r && r();
          }, totalTime);
        });
      });
    }

    fadeOut(durationMs = 480) {
      if (!this.currentEl) return Promise.resolve();
      const el = this.currentEl;
      const words = Array.from(el.querySelectorAll(".w"));
      return new Promise((resolve) => {
        words.forEach((w, i) => {
          w.style.transition = `opacity ${durationMs}ms ${EASE_EMPHASIZED} ${i * 18}ms, transform ${durationMs}ms ${EASE_EMPHASIZED} ${i * 18}ms, filter ${durationMs}ms ${EASE_EMPHASIZED} ${i * 18}ms`;
          w.style.opacity = "0";
          w.style.transform = "translateY(-10px)";
          w.style.filter = "blur(6px)";
        });
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
          if (this.currentEl === el) this.currentEl = null;
          resolve();
        }, durationMs + words.length * 18 + 20);
      });
    }

    forceClear() {
      this.clear();
    }
  }

  global.Typography = Typography;
  global.EASE_EMPHASIZED = EASE_EMPHASIZED;
})(window);
