/* ============================================================
   Main entry — wires renderer, scene, camera, lighting, director.
   All scripts are loaded in order via <script> tags.
   THREE / Typography / Curtain / Cues / etc. are on window.
   ============================================================ */

(function () {
  // window.Scenes is initialized by the inline <script> in index.html
  // so each scene IIFE can call Scenes.register() at script parse-time.

  const canvas = document.getElementById("three-canvas");
  const stage = document.getElementById("stage");
  const textLayer = document.getElementById("textLayer");
  const curtainEl = document.getElementById("curtain");
  const cuesEl = document.getElementById("cues");
  const introEl = document.getElementById("intro");
  const playBtn = document.getElementById("playBtn");
  const brandMark = stage.querySelector(".brand-mark");

  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  function fitRenderer() {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    return { w: rect.width, h: rect.height };
  }
  let dims = fitRenderer();

  // Portrait phones (taller than wide) need the camera to be zoomed OUT
  // so 3D objects composed for a 16:9 frame still fit vertically.
  // We widen the FOV based on aspect ratio so the same world-coords scene
  // fits any screen shape without being cropped or squished.
  const isPortrait = dims.h > dims.w;
  const baseFOV = isPortrait ? 60 : 35;

  // ---------- Scene & Camera ----------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050810);

  const camera = new THREE.PerspectiveCamera(baseFOV, dims.w / dims.h, 0.1, 100);
  camera.position.set(0, 1, 7);
  camera.lookAt(0, 0, 0);

  // ---------- Engines ----------
  const lightingRig = new LightingRig(scene);
  const cameraRig = new CameraRig(camera);
  const typography = new Typography(textLayer);
  const curtain = new Curtain(curtainEl);
  const cues = new Cues(cuesEl);

  lightingRig.calmBright();

  // ---------- Resize ----------
  function resize() {
    dims = fitRenderer();
    const nowPortrait = dims.h > dims.w;
    const newFOV = nowPortrait ? 60 : 35;
    camera.aspect = dims.w / dims.h;
    if (Math.abs(camera.fov - newFOV) > 0.5) {
      camera.fov = newFOV;
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  // ---------- Lighting preset map ----------
  const LIGHTING_PRESETS = {
    shop: "warmShop",
    chaos: "darkDramatic",
    reveal: "heroReveal",
    "app-intro": "heroReveal",
    "customer-due": "screenShow",
    transaction: "screenShow",
    expense: "heroReveal",
    dashboard: "screenShow",
    montage: "heroReveal",
    morph: "digitalVoid",
    peace: "calmBright",
    hero: "heroReveal",
  };

  class SceneDirector extends Director {
    async _playOne(entry) {
      const presetName = LIGHTING_PRESETS[entry.id.replace(/^\d+-/, "")];
      if (presetName && lightingRig[presetName]) lightingRig[presetName]();
      // Keep the portrait-friendly FOV (60) on phones; otherwise reset to 35.
      if (!(dims.h > dims.w)) {
        camera.fov = 35;
      }
      camera.updateProjectionMatrix();
      return super._playOne(entry);
    }
  }

  const director = new SceneDirector({ scene, camera, typography, cues, cameraRig, curtain });

  // Register all scenes that have already self-registered.
  for (const s of Scenes._all) {
    director.register(s);
  }

  // ---------- Render loop ----------
  let _running = true;
  function loop() {
    renderer.render(scene, camera);
    if (_running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Play button ----------
  playBtn.addEventListener("click", async () => {
    introEl.classList.add("hidden");
    brandMark.classList.add("show");
    cues.reset();
    cues.add("play", "user clicked play");

    await new Promise((r) => setTimeout(r, 300));
    await director.run();

    cues.add("done");
    introEl.classList.remove("hidden");
    introEl.querySelector(".pill").textContent = "Ad complete";
    introEl.querySelector("h1").textContent = "ধন্যবাদ";
    introEl.querySelector(".sub").textContent = "2 MINUTES · WEBGL · 60FPS";
    introEl.querySelector(".desc").innerHTML = "Re-open this page to watch again, or upload your screen recording.";
    playBtn.textContent = "▶ আবার দেখুন";
  });

  // ---------- Pause-on-hidden ----------
  document.addEventListener("visibilitychange", () => {
    _running = !document.hidden;
    if (_running) loop();
  });
})();
