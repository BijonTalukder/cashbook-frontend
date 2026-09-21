/* ============================================================
   Scene 05 — CUSTOMER DUE
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "05-customer-due";
  const label = "Customer due — owed amounts fly out of phone";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-05-due";

    const phone = G.makePhone({ width: 2.0, height: 4.0, depth: 0.16, screenKind: "customer" });
    phone.rotation.x = -0.12;
    phone.rotation.y = -0.15;
    phone.position.set(-1.0, 0, 0);
    root.add(phone);

    // Get a Taka note texture but dispose its other materials so we only use the tex.
    const note = G.makeTakaNote();
    const billTex = note.userData.disposeTex;
    // Dispose other materials but keep the texture for reuse.
    note.traverse((o) => {
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { if (m !== billTex) { /* keep tex */ } });
      }
    });

    const bills = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshStandardMaterial({
        map: billTex, color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide,
      });
      const bill = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), mat);
      bill.position.set(-0.4, 1.5 - i * 0.4, 0.2);
      bill.rotation.z = (Math.random() - 0.5) * 0.3;
      root.add(bill);
      bills.push({ mesh: bill, mat, startPos: bill.position.clone(), delay: i * 0.25 });
    }

    const stack = G.makeCoinStack(10);
    stack.position.set(2.6, -1.6, 0.5);
    root.add(stack);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("05", "customer due");

        camera.position.set(0, 0.3, 6.5);
        camera.lookAt(0.5, 0, 0);

        cameraRig.dollyTo({ pos: [0.4, 0.2, 5.4], look: [0.5, 0, 0], duration: 5000 });

        await cameraRig.wait(900);
        typography.show(`কে কত টাকা <span class="accent">দেবে</span>?`, {
          size: "big", pos: "top", wordDelay: 75,
        });
        cues.add("05-h1");
        await cameraRig.wait(2400);
        await typography.fadeOut();

        await cameraRig.wait(300);
        typography.show(`<span class="accent">এক নজরেই</span> জানুন`, {
          size: "hero", pos: "mid", wordDelay: 95,
        });
        cues.add("05-h2");
        await cameraRig.wait(400);

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 4) return;
          for (const b of bills) {
            const bt = (t - b.delay) / 1.2;
            if (bt < 0 || bt > 1) continue;
            const k = 1 - Math.pow(1 - bt, 2);
            const x = b.startPos.x + (2.6 - b.startPos.x) * k;
            const y = b.startPos.y + (-1.4 + b.delay * 0.05 - b.startPos.y) * k + Math.sin(bt * Math.PI) * 0.4;
            const z = b.startPos.z + (0.6 - b.startPos.z) * k;
            b.mesh.position.set(x, y, z);
            b.mesh.rotation.z = b.mesh.rotation.z * 0.95 + Math.sin(t * 4 + b.delay) * 0.05;
            const sx = 1 + Math.sin(bt * Math.PI) * 0.3;
            b.mesh.scale.set(sx, sx, 1);
          }
          requestAnimationFrame(animate);
        };
        animate();
        await cameraRig.wait(2400);

        const stackStart = performance.now();
        const stackAnim = () => {
          const t = (performance.now() - stackStart) / 1000;
          if (t > 1.5) return;
          stack.scale.y = 1 + t * 0.4;
          stack.rotation.y = t * 1.4;
          requestAnimationFrame(stackAnim);
        };
        stackAnim();

        await cameraRig.wait(1500);
        await typography.fadeOut();
      },
      dispose() {
        bills.forEach((b) => { b.mesh.geometry.dispose(); b.mat.dispose(); });
        root.traverse((o) => {
          if (o.geometry && !bills.find((b) => b.mesh === o)) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (m.map && m.map !== billTex) m.map.dispose();
              m.dispose();
            });
          }
        });
        if (billTex) billTex.dispose();
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
