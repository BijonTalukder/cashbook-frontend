/* ============================================================
   Scene 04 — APP INTRO
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "04-app-intro";
  const label = "App intro — phone orbits in space";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-04-app-intro";

    const phone = G.makePhone({ width: 2.2, height: 4.4, depth: 0.18, screenKind: "home" });
    root.add(phone);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.04, 16, 96),
      new THREE.MeshStandardMaterial({
        color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.9, roughness: 0.4,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.4;
    root.add(ring);

    const dustGeo = new THREE.BufferGeometry();
    const dp = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const r = 3 + Math.random() * 2;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6;
      dp[i * 3 + 0] = Math.cos(a) * r;
      dp[i * 3 + 1] = y;
      dp[i * 3 + 2] = Math.sin(a) * r;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0x34d399, size: 0.04, transparent: true, opacity: 0.6 })
    );
    root.add(dust);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("04", "app intro");

        camera.position.set(0, 0.5, 8);
        camera.lookAt(0, 0, 0);

        const orbitAnim = new Promise((resolve) => {
          const dur = 6500;
          const r0 = 8, r1 = 5.5;
          const a0 = 0.4, a1 = -0.2;
          const h0 = 0.5, h1 = 0.2;
          const t0 = performance.now();
          const step = () => {
            const t = (performance.now() - t0) / dur;
            if (t >= 1) return resolve();
            const k = 1 - Math.pow(1 - t, 3);
            const r = r0 + (r1 - r0) * k;
            const a = a0 + (a1 - a0) * k;
            const h = h0 + (h1 - h0) * k;
            camera.position.set(Math.sin(a) * r, h, Math.cos(a) * r);
            camera.lookAt(0, 0, 0);
            requestAnimationFrame(step);
          };
          step();
        });

        const spin = new Promise((resolve) => {
          const start = performance.now();
          const dur = 7000;
          const step = () => {
            const t = (performance.now() - start) / dur;
            if (t >= 1) { phone.rotation.y = 0.4; return resolve(); }
            phone.rotation.y = -0.3 + t * 0.7;
            phone.position.y = Math.sin(t * Math.PI * 2) * 0.15;
            dust.rotation.y = t * 0.4;
            requestAnimationFrame(step);
          };
          step();
        });

        await cameraRig.wait(1200);
        typography.show(`আপনার ব্যবসার হিসাব`, {
          size: "big", pos: "top", wordDelay: 75,
        });
        cues.add("04-h1");
        await cameraRig.wait(2200);
        await typography.fadeOut();

        await cameraRig.wait(300);
        typography.show(`<span class="accent">এক জায়গায়</span>`, {
          size: "hero", pos: "mid", wordDelay: 110,
        });
        cues.add("04-h2");
        await cameraRig.wait(2400);
        await typography.fadeOut();

        await Promise.all([orbitAnim, spin]);
      },
      dispose() {
        dustGeo.dispose();
        root.traverse((o) => {
          if (o.geometry && o.geometry !== dustGeo) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
          }
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
