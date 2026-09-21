/* ============================================================
   Curtain — fade-to-black for cinematic scene cuts.
   ============================================================ */

(function (global) {
  const EASE_EMPHASIZED = "cubic-bezier(0.2, 0, 0, 1)";

  class Curtain {
    constructor(el) {
      this.el = el;
      this.duration = 380;
    }

    cut(midCallback) {
      return new Promise((resolve) => {
        this.el.style.transition = `opacity ${this.duration}ms ${EASE_EMPHASIZED}`;
        this.el.style.opacity = "1";
        setTimeout(() => {
          let r;
          try {
            r = midCallback && midCallback();
          } catch (e) {
            console.error("[Curtain] midCallback error:", e);
          }
          const after = () => {
            this.el.style.opacity = "0";
            setTimeout(() => {
              this.el.style.transition = "";
              resolve();
            }, this.duration + 20);
          };
          if (r && typeof r.then === "function") {
            r.then(after, after);
          } else {
            after();
          }
        }, this.duration + 20);
      });
    }

    down() {
      return new Promise((resolve) => {
        this.el.style.transition = `opacity ${this.duration}ms ${EASE_EMPHASIZED}`;
        this.el.style.opacity = "1";
        setTimeout(() => resolve(), this.duration);
      });
    }

    up() {
      return new Promise((resolve) => {
        this.el.style.transition = `opacity ${this.duration}ms ${EASE_EMPHASIZED}`;
        this.el.style.opacity = "0";
        setTimeout(() => {
          this.el.style.transition = "";
          resolve();
        }, this.duration);
      });
    }
  }

  global.Curtain = Curtain;
})(window);
