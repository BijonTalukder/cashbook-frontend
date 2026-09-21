/* ============================================================
   Scene 09 — SPEED MONTAGE
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  const id = "09-montage";
  const label = "Speed montage — 4 quick shots";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-09-montage";

    const bigCoin = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.15, 48),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24, roughness: 0.25, metalness: 0.9,
        emissive: 0xfbbf24, emissiveIntensity: 0.15,
      })
    );
    bigCoin.rotation.x = Math.PI / 2;
    bigCoin.position.set(0, 0, 0);
    bigCoin.visible = false;
    root.add(bigCoin);

    const phoneShot = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 3.2, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.4, metalness: 0.5 })
    );
    body.castShadow = true;
    phoneShot.add(body);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.46, 3.04),
      new THREE.MeshStandardMaterial({
        color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.7, roughness: 0.3,
      })
    );
    screen.position.z = 0.082;
    phoneShot.add(screen);
    phoneShot.visible = false;
    root.add(phoneShot);

    const chartGroup = new THREE.Group();
    chartGroup.visible = false;
    for (let i = 0; i < 5; i++) {
      const h = 0.5 + Math.random() * 2;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, h, 0.5),
        new THREE.MeshStandardMaterial({
          color: i === 4 ? 0xfbbf24 : 0x10b981,
          emissive: i === 4 ? 0xfbbf24 : 0x10b981,
          emissiveIntensity: i === 4 ? 0.6 : 0.2,
          roughness: 0.4,
        })
      );
      bar.position.set((i - 2) * 0.8, h / 2 - 1.5, 0);
      bar.userData.targetY = bar.position.y;
      bar.position.y = -3;
      chartGroup.add(bar);
    }
    root.add(chartGroup);

    const ledger = new THREE.Group();
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.3, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.6, metalness: 0.2 })
    );
    ledger.add(cover);
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.12, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf8f3e6, roughness: 0.9 })
    );
    pages.position.y = 0.18;
    ledger.add(pages);
    ledger.visible = false;
    root.add(ledger);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("09", "montage");

        camera.position.set(0, 0.2, 6);
        camera.lookAt(0, 0, 0);

        bigCoin.visible = true;
        await cameraRig.wait(200);
        typography.show(`সহজ`, { size: "hero", pos: "mid", wordDelay: 110 });
        cues.add("09-shot1");
        await cameraRig.wait(1200);
        await typography.fadeOut();
        bigCoin.visible = false;

        phoneShot.visible = true;
        await cameraRig.wait(150);
        phoneShot.rotation.y = 0.6;
        await cameraRig.wait(200);
        typography.show(`দ্রুত`, { size: "hero", pos: "mid", wordDelay: 110 });
        cues.add("09-shot2");
        await cameraRig.wait(1100);
        await typography.fadeOut();
        phoneShot.visible = false;

        chartGroup.visible = true;
        await cameraRig.wait(150);
        typography.show(`গোছানো`, { size: "hero", pos: "mid", wordDelay: 110 });
        cues.add("09-shot3");
        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 1.2) return;
          for (const bar of chartGroup.children) {
            bar.position.y = -3 + (bar.userData.targetY + 3) * Math.min(1, t / 0.6);
          }
          requestAnimationFrame(animate);
        };
        animate();
        await cameraRig.wait(1200);
        await typography.fadeOut();
        chartGroup.visible = false;

        ledger.visible = true;
        await cameraRig.wait(150);
        typography.show(`স্মার্ট`, { size: "hero", pos: "mid", wordDelay: 110 });
        cues.add("09-shot4");
        const lstart = performance.now();
        const lanimate = () => {
          const t = (performance.now() - lstart) / 1000;
          if (t > 1.2) return;
          ledger.rotation.y = (1 - Math.min(1, t / 0.6)) * Math.PI;
          requestAnimationFrame(lanimate);
        };
        lanimate();
        await cameraRig.wait(1300);
        await typography.fadeOut();
        ledger.visible = false;

        cameraRig.wait(200);
      },
      dispose() {
        root.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => m.dispose());
          }
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
