/* ============================================================
   Scene 12 — HERO / BRAND OUTRO
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "12-hero";
  const label = "Hero / brand outro";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-12-hero";

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 0.4, 48),
      new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.4, metalness: 0.4 })
    );
    pedestal.position.y = -2;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    root.add(pedestal);

    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.04, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.4, roughness: 0.3,
      })
    );
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = -1.78;
    root.add(topRing);

    const logo = G.makeLogo3D();
    logo.position.set(-1.6, -1.6, 0);
    logo.rotation.y = 0.3;
    logo.scale.setScalar(1.2);
    root.add(logo);

    const phone = G.makePhone({ width: 1.4, height: 2.8, depth: 0.14, screenKind: "home" });
    phone.position.set(1.4, -0.6, 0);
    phone.rotation.y = -0.25;
    root.add(phone);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    floor.receiveShadow = true;
    root.add(floor);

    const particlesGeo = new THREE.BufferGeometry();
    const pp = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const r = 2 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      pp[i * 3 + 0] = Math.cos(a) * r;
      pp[i * 3 + 1] = y;
      pp[i * 3 + 2] = Math.sin(a) * r;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    const particles = new THREE.Points(
      particlesGeo,
      new THREE.PointsMaterial({ color: 0x34d399, size: 0.05, transparent: true, opacity: 0.7 })
    );
    root.add(particles);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("12", "hero");

        camera.position.set(0, 1.5, 7);
        camera.lookAt(0, -0.5, 0);

        const orbitAnim = new Promise((resolve) => {
          const dur = 7000;
          const t0 = performance.now();
          const step = () => {
            const t = (performance.now() - t0) / dur;
            if (t >= 1) return resolve();
            const a = -0.4 + t * 0.6;
            const r = 7 - t * 1.5;
            camera.position.set(Math.sin(a) * r, 1.5 - t * 0.5, Math.cos(a) * r);
            camera.lookAt(0, -0.3, 0);
            requestAnimationFrame(step);
          };
          step();
        });

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 7) return;
          particles.rotation.y = t * 0.2;
          topRing.rotation.z = t * 0.4;
          logo.rotation.y = 0.3 + Math.sin(t * 0.5) * 0.15;
          requestAnimationFrame(animate);
        };
        animate();

        await cameraRig.wait(1000);
        typography.show(`<span class="accent">হিসাব বই</span>`, {
          size: "hero", pos: "top", wordDelay: 110,
        });
        cues.add("12-h1");
        await cameraRig.wait(2400);
        await typography.fadeOut();

        await cameraRig.wait(400);
        typography.show(`আপনার ব্যবসার হিসাব, এখন আরও সহজ`, {
          size: "med", pos: "bottom", wordDelay: 55,
        });
        cues.add("12-h2");
        await cameraRig.wait(3000);
        await typography.fadeOut();

        await orbitAnim;
        await cameraRig.wait(800);
      },
      dispose() {
        particlesGeo.dispose();
        root.traverse((o) => {
          if (o.geometry && o.geometry !== particlesGeo) o.geometry.dispose();
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