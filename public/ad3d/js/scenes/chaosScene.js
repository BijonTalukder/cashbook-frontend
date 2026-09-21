/* ============================================================
   Scene 02 — CHAOS
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "02-chaos";
  const label = "Chaos — pages scatter";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-02-chaos";

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    root.add(floor);

    const notebook = G.makeNotebook({ width: 1.6, depth: 1.1, ruled: true });
    notebook.position.set(0, -0.5, 0);
    notebook.rotation.set(0.4, 0.3, 0.2);
    root.add(notebook);

    const flyingPages = [];
    for (let i = 0; i < 14; i++) {
      const page = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.95),
        new THREE.MeshStandardMaterial({
          color: 0xf8f3e6, roughness: 0.95, side: THREE.DoubleSide,
        })
      );
      page.position.set(
        (Math.random() - 0.5) * 6,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 4
      );
      page.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      root.add(page);
      flyingPages.push({
        mesh: page,
        spinX: (Math.random() - 0.5) * 0.04,
        spinY: (Math.random() - 0.5) * 0.04,
        spinZ: (Math.random() - 0.5) * 0.05,
        drift: new THREE.Vector3((Math.random() - 0.5) * 0.01, -0.005, (Math.random() - 0.5) * 0.01),
      });
    }

    const calc = G.makeCalculator();
    calc.position.set(2, 0.5, 0);
    calc.rotation.set(0.3, 0.5, 0.4);
    root.add(calc);

    const digits = [];
    const redDigits = ["১২০/-", "?", "৳৳৳", "বাকি", "হিসাব?", "৮,০০০", "!!!"];
    for (let i = 0; i < redDigits.length; i++) {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 128;
      const ctx = cv.getContext("2d");
      ctx.font = "bold 56px serif";
      ctx.fillStyle = "#fca5a5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(252,165,165,.7)";
      ctx.shadowBlur = 18;
      ctx.fillText(redDigits[i], 128, 64);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), mat);
      plane.position.set(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 3 + 0.5,
        (Math.random() - 0.5) * 4
      );
      root.add(plane);
      digits.push({ mesh: plane, tex, drift: new THREE.Vector3((Math.random() - 0.5) * 0.005, (Math.random() - 0.5) * 0.005, 0) });
    }

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("02", "chaos");

        camera.position.set(0, 0.6, 7);
        camera.lookAt(0, 0, 0);

        cameraRig.shake(0.06, 1200);

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 5) return;
          for (const p of flyingPages) {
            p.mesh.rotation.x += p.spinX;
            p.mesh.rotation.y += p.spinY;
            p.mesh.rotation.z += p.spinZ;
            p.mesh.position.add(p.drift);
          }
          for (const d of digits) d.mesh.position.add(d.drift);
          calc.rotation.x += 0.012;
          calc.rotation.y += 0.018;
          calc.position.y = 0.5 + Math.sin(t * 1.4) * 0.15;
          requestAnimationFrame(animate);
        };
        animate();

        await cameraRig.wait(800);
        typography.show(`সব <span class="accent">গুলিয়ে</span> যাচ্ছে`, {
          size: "hero", pos: "mid", wordDelay: 90,
        });
        cues.add("02-headline", "messy");
        await cameraRig.wait(3000);

        await typography.fadeOut();
      },
      dispose() {
        flyingPages.forEach((p) => p.mesh.geometry.dispose());
        digits.forEach((d) => { d.mesh.geometry.dispose(); d.tex.dispose(); });
        root.traverse((o) => {
          if (o.geometry && !flyingPages.find((p) => p.mesh === o) && !digits.find((d) => d.mesh === o)) {
            o.geometry.dispose();
          }
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (m.map && !digits.find((d) => d.tex === m.map)) m.map.dispose();
              m.dispose();
            });
          }
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
