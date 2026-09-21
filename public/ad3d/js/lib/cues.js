/* ============================================================
   Cue logger — prints sound-design timing to hidden #cues.
   ============================================================ */

(function (global) {
  function fmtTime(t) {
    const m = Math.floor(t / 60);
    const s = (t - m * 60).toFixed(2);
    return `${String(m).padStart(2, "0")}:${s.padStart(5, "0")}`;
  }

  class Cues {
    constructor(el) {
      this.el = el;
      this.startTime = performance.now();
    }

    reset() {
      this.startTime = performance.now();
      if (this.el) this.el.innerHTML = "";
    }

    add(label, detail = "") {
      const t = (performance.now() - this.startTime) / 1000;
      const line = document.createElement("div");
      line.textContent = `${fmtTime(t)}  ${label}${detail ? "  " + detail : ""}`;
      if (this.el) this.el.appendChild(line);
      if (typeof window !== "undefined") {
        try { console.log(`[cue ${fmtTime(t)}]`, label, detail); } catch (_) {}
      }
    }
  }

  global.Cues = Cues;
})(window);
