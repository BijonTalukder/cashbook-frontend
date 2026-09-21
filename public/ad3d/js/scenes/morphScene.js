/* ============================================================
   Scene 10 — PAPER → DIGITAL MORPH
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "10-morph";
  const label = "Paper → digital morph";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-10-morph";

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    root.add(floor);

    const notebook = G.makeNotebook({ width: 2.4, depth: 1.7, ruled: true });
    notebook.position.set(0, -1.4, 0);
    notebook.rotation.y = 0.2;
    root.add(notebook);

    const PARTICLES = 800;
    const positions = new Float32Array(PARTICLES * 3);
    const velocities = new Float32Array(PARTICLES * 3);
    const particleGeo = new THREE.BufferGeometry();
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399, size: 0.06, sizeAttenuation: true,
      transparent: true, opacity: 0.95,
    });
    for (let i = 0; i < PARTICLES; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 1] = -1.4 + (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 6;
      velocities[i * 3 + 1] = Math.random() * 5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.visible = false;
    root.add(particles);

    const phone = G.makePhone({ width: 1.6, height: 3.2, depth: 0.14, screenKind: "home" });
    phone.position.set(0, -0.5, 0);
    phone.visible = false;
    root.add(phone);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("10", "morph");

        camera.position.set(0, 0.3, 6);
        camera.lookAt(0, 0, 0);

        cameraRig.dollyTo({ pos: [0, 0.2, 5], look: [0, 0, 0], duration: 5500 });

        await cameraRig.wait(800);
        typography.show(`খাতার হিসাব থেকে`, {
          size: "med", pos: "top", wordDelay: 60,
        });
        cues.add("10-h1");
        await cameraRig.wait(1900);
        await typography.fadeOut();

        await cameraRig.wait(300);
        const explodeStart = performance.now();
        notebook.userData.exploded = false;

        particles.visible = true;
        const animate = () => {
          const t = (performance.now() - explodeStart) / 1000;
          if (t > 4.5) return;

          const nbK = Math.max(0, 1 - t / 0.3);
          notebook.scale.setScalar(nbK);
          notebook.children.forEach((c) => {
            if (c.material && "opacity" in c.material) {
              c.material.transparent = true;
              c.material.opacity = nbK;
            }
          });
          if (nbK <= 0.01) notebook.visible = false;

          const arr = particleGeo.attributes.position.array;
          for (let i = 0; i < PARTICLES; i++) {
            if (t < 1.2) {
              arr[i * 3 + 0] += velocities[i * 3 + 0] * 0.016;
              arr[i * 3 + 1] += velocities[i * 3 + 1] * 0.016 - 0.012;
              arr[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
              velocities[i * 3 + 0] *= 0.985;
              velocities[i * 3 + 1] *= 0.985;
              velocities[i * 3 + 2] *= 0.985;
            } else if (t > 1.8 && t < 3.4) {
              const k = (t - 1.8) / 1.6;
              arr[i * 3 + 0] *= (1 - k * 0.08);
              arr[i * 3 + 1] += (-0.5 - arr[i * 3 + 1]) * 0.06;
              arr[i * 3 + 2] *= (1 - k * 0.08);
            } else {
              arr[i * 3 + 1] += (-0.5 - arr[i * 3 + 1]) * 0.05;
            }
          }
          particleGeo.attributes.position.needsUpdate = true;
          particleMat.opacity = t > 3.0 ? Math.max(0, 1 - (t - 3) / 1.0) : 0.95;

          if (t > 2.5 && !phone.visible) {
            phone.visible = true;
            phone.scale.setScalar(0.5);
          }
          if (phone.visible) {
            const ps = Math.min(1, (t - 2.5) / 0.8);
            phone.scale.setScalar(0.5 + ps * 0.5);
            phone.rotation.y = (1 - ps) * 0.5;
          }
          requestAnimationFrame(animate);
        };
        animate();

        typography.show(`<span class="accent">ডিজিটাল</span> হিসাবের পথে`, {
          size: "med", pos: "mid", wordDelay: 65,
        });
        cues.add("10-h2");
        await cameraRig.wait(4000);
        await typography.fadeOut();
      },
      dispose() {
        particleGeo.dispose();
        root.traverse((o) => {
          if (o.geometry && o.geometry !== particleGeo) o.geometry.dispose();
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
