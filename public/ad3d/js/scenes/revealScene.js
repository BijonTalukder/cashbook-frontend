/* ============================================================
   Scene 03 — REVEAL
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "03-reveal";
  const label = "Product reveal — phone forms from digital grid";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-03-reveal";

    const GRID_W = 14;
    const GRID_H = 24;
    const CELL = 0.12;
    const voxels = [];
    const geo = new THREE.BoxGeometry(CELL, CELL, CELL);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.4,
      roughness: 0.4, transparent: true, opacity: 0.95,
    });

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const u = (x + 0.5) / GRID_W;
        const v = (y + 0.5) / GRID_H;
        const margin = 0.06;
        const inX = (u >= margin && u <= 1 - margin);
        const inY = (v >= 0.03 && v <= 0.97);
        if (!inX || !inY) continue;
        const cornerR = 0.06;
        const cx = u < 0.5 ? margin + cornerR : 1 - margin - cornerR;
        const cy = v < 0.5 ? 0.03 + cornerR : 0.97 - cornerR;
        const dx = Math.abs(u - cx);
        const dy = Math.abs(v - cy);
        if (u < margin + cornerR && v < 0.03 + cornerR && (dx * dx + dy * dy) > cornerR * cornerR) continue;
        if (u > 1 - margin - cornerR && v < 0.03 + cornerR && (dx * dx + dy * dy) > cornerR * cornerR) continue;
        if (u < margin + cornerR && v > 0.97 - cornerR && (dx * dx + dy * dy) > cornerR * cornerR) continue;
        if (u > 1 - margin - cornerR && v > 0.97 - cornerR && (dx * dx + dy * dy) > cornerR * cornerR) continue;

        const cell = new THREE.Mesh(geo, baseMat.clone());
        cell.position.set((x - GRID_W / 2 + 0.5) * CELL, (y - GRID_H / 2 + 0.5) * CELL, 0);
        cell.scale.setScalar(0.01);
        cell.userData.targetScale = 1;
        cell.userData.delay = Math.random() * 0.6;
        voxels.push(cell);
        root.add(cell);
      }
    }

    const phone = G.makePhone({ width: 1.68, height: GRID_H * CELL, depth: 0.12, screenKind: "home" });
    phone.visible = false;
    root.add(phone);

    const particlesGeo = new THREE.BufferGeometry();
    const pp = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      pp[i * 3 + 0] = (Math.random() - 0.5) * 14;
      pp[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pp[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    const particles = new THREE.Points(
      particlesGeo,
      new THREE.PointsMaterial({ color: 0x34d399, size: 0.04, transparent: true, opacity: 0.7 })
    );
    root.add(particles);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("03", "reveal");

        camera.position.set(0, 0.5, 6);
        camera.lookAt(0, 0, 0);

        cameraRig.dollyTo({ pos: [0, 0.2, 4.5], look: [0, 0, 0], duration: 6000 });

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 6) return;
          for (const v of voxels) {
            const k = Math.max(0, Math.min(1, (t - v.userData.delay) / 0.4));
            const e = 1 - Math.pow(1 - k, 3);
            v.scale.setScalar(0.01 + e * v.userData.targetScale);
            v.material.opacity = e;
          }
          particles.rotation.y = t * 0.05;
          particles.rotation.x = t * 0.02;
          requestAnimationFrame(animate);
        };
        animate();

        await cameraRig.wait(1400);
        typography.show(`<span class="accent">হিসাব</span> হোক স্মার্ট`, {
          size: "hero", pos: "mid", wordDelay: 100,
        });
        cues.add("03-headline", "smart");

        await cameraRig.wait(3500);

        const swapStart = performance.now();
        const swapAnim = () => {
          const t = (performance.now() - swapStart) / 800;
          if (t >= 1) return;
          const e = t;
          for (const v of voxels) {
            v.scale.setScalar(1 - e);
            v.material.opacity = 1 - e;
          }
          phone.visible = t > 0.4;
          if (phone.visible) {
            phone.traverse((o) => {
              if (o.material && "opacity" in o.material) {
                o.material.transparent = true;
                o.material.opacity = Math.max(0, (t - 0.4) / 0.6);
              }
            });
          }
          requestAnimationFrame(swapAnim);
        };
        swapAnim();
        await cameraRig.wait(1000);

        await typography.fadeOut();
      },
      dispose() {
        voxels.forEach((v) => v.material.dispose());
        geo.dispose();
        particlesGeo.dispose();
        root.traverse((o) => {
          if (o.geometry && o.geometry !== geo && o.geometry !== particlesGeo) {
            o.geometry.dispose();
          }
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
