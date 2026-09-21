/* ============================================================
   PBR materials library — shared across scenes.
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  const COLORS = {
    brand: 0x10b981,
    brandLight: 0x34d399,
    brandDark: 0x022c22,
    ink: 0x0a0f1e,
    paper: 0xf8f5ee,
    paperWarm: 0xf2e8d5,
    woodLight: 0xb88c5a,
    woodDark: 0x5a3a22,
    gold: 0xfbbf24,
    screenBg: 0x0a0f1e,
  };

  function makeWood(opts = {}) {
    const {
      color = COLORS.woodLight,
      roughness = 0.78,
      metalness = 0.02,
      map = null,
    } = opts;
    return new THREE.MeshStandardMaterial({
      color, roughness, metalness, map, envMapIntensity: 0.6,
    });
  }

  function makePaper(opts = {}) {
    const { color = COLORS.paper, roughness = 0.95, metalness = 0.0 } = opts;
    return new THREE.MeshStandardMaterial({
      color, roughness, metalness, envMapIntensity: 0.3,
    });
  }

  function makePlastic(opts = {}) {
    const { color = 0x111827, roughness = 0.45, metalness = 0.05 } = opts;
    return new THREE.MeshStandardMaterial({
      color, roughness, metalness, envMapIntensity: 0.9,
    });
  }

  function makeMetal(opts = {}) {
    const { color = 0xc0c8d0, roughness = 0.3, metalness = 0.85 } = opts;
    return new THREE.MeshStandardMaterial({
      color, roughness, metalness, envMapIntensity: 1.0,
    });
  }

  function makeGlass(opts = {}) {
    const { color = 0xffffff, roughness = 0.05, metalness = 0.0, opacity = 0.18 } = opts;
    return new THREE.MeshPhysicalMaterial({
      color, roughness, metalness,
      transparent: true, opacity,
      transmission: 0.9, thickness: 0.4, ior: 1.45,
      envMapIntensity: 1.2,
    });
  }

  function makeScreen(opts = {}) {
    const { color = COLORS.screenBg, emissive = COLORS.brand, emissiveIntensity = 0.05 } = opts;
    return new THREE.MeshStandardMaterial({
      color, roughness: 0.2, metalness: 0.1,
      emissive, emissiveIntensity, envMapIntensity: 1.1,
    });
  }

  function makeFabric(opts = {}) {
    const { color = 0x2a2f3e, roughness = 0.95 } = opts;
    return new THREE.MeshStandardMaterial({
      color, roughness, metalness: 0.0, envMapIntensity: 0.5,
    });
  }

  function makeBrand(opts = {}) {
    const { color = COLORS.brandLight, intensity = 1.6 } = opts;
    return new THREE.MeshStandardMaterial({
      color,
      emissive: COLORS.brand,
      emissiveIntensity: intensity,
      roughness: 0.35, metalness: 0.1,
    });
  }

  function makeInk(opts = {}) {
    const { color = 0x1f2937, roughness = 1.0 } = opts;
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.0 });
  }

  function makeBanknote() {
    return new THREE.MeshStandardMaterial({
      color: 0x7ec8a0, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.4,
    });
  }

  function makeVoid() {
    return new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 1.0, metalness: 0.0 });
  }

  function makeGlow(color = COLORS.brandLight) {
    return new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.85,
    });
  }

  global.Materials = {
    COLORS, makeWood, makePaper, makePlastic, makeMetal,
    makeGlass, makeScreen, makeFabric, makeBrand, makeInk,
    makeBanknote, makeVoid, makeGlow,
  };
})(window);
