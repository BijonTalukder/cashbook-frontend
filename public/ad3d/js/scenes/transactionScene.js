/* ============================================================
   Scene 06 — TRANSACTION
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "06-transaction";
  const label = "Transaction — numbers flow in";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-06-transaction";

    const phone = G.makePhone({ width: 2.4, height: 4.8, depth: 0.18, screenKind: "add" });
    phone.position.set(0.5, 0, 0);
    phone.rotation.y = -0.08;
    root.add(phone);

    const nums = [];
    const numTex = (txt, color = "#fff") => {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 256;
      const ctx = cv.getContext("2d");
      ctx.font = "bold 180px sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.fillText(txt, 128, 128);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const labels = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮"];
    const startX = -2.5;
    for (let i = 0; i < labels.length; i++) {
      const tex = numTex(labels[i], i % 2 ? "#34d399" : "#fff");
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), mat);
      mesh.position.set(startX - Math.random() * 0.4, (Math.random() - 0.5) * 3, Math.random() * 0.5);
      root.add(mesh);
      nums.push({
        mesh, tex, mat,
        target: new THREE.Vector3(0.5, (i - 4) * 0.5, 0.3),
        delay: i * 0.18,
      });
    }

    const successRing = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    successRing.position.set(0.5, -1.6, 0.4);
    root.add(successRing);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("06", "transaction");

        camera.position.set(0, 0.2, 7);
        camera.lookAt(0.4, 0, 0);

        cameraRig.dollyTo({ pos: [0.2, 0.1, 5.5], look: [0.4, 0, 0], duration: 5500 });

        await cameraRig.wait(900);
        typography.show(`লেনদেন <span class="accent">লিখুন</span>`, {
          size: "hero", pos: "top", wordDelay: 90,
        });
        cues.add("06-h1");
        await cameraRig.wait(2400);
        await typography.fadeOut();

        await cameraRig.wait(200);
        typography.show(`হিসাব <span class="accent">রাখুন</span>`, {
          size: "hero", pos: "mid", wordDelay: 95,
        });
        cues.add("06-h2");

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 4) return;
          for (const n of nums) {
            const nt = (t - n.delay) / 1.2;
            if (nt < 0) continue;
            if (nt > 1) { n.mesh.visible = false; continue; }
            const k = 1 - Math.pow(1 - nt, 2);
            n.mesh.position.lerpVectors(
              { x: -2.5, y: n.mesh.position.y, z: 0.5 },
              n.target, k
            );
            n.mesh.scale.setScalar(0.5 + k * 0.5);
            n.mat.opacity = 1 - Math.pow(Math.max(0, (nt - 0.8) / 0.2), 2);
          }
          const st = (t - 3) / 1.5;
          if (st > 0 && st < 1) {
            successRing.material.opacity = (1 - st) * 0.9;
            const s = 1 + st * 5;
            successRing.scale.set(s, s, 1);
          }
          requestAnimationFrame(animate);
        };
        animate();
        await cameraRig.wait(3500);
        await typography.fadeOut();
      },
      dispose() {
        nums.forEach((n) => { n.mesh.geometry.dispose(); n.tex.dispose(); });
        root.traverse((o) => {
          if (o.geometry && !nums.find((n) => n.mesh === o)) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (m.map && !nums.find((n) => n.tex === m.map)) m.map.dispose();
              m.dispose();
            });
          }
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
