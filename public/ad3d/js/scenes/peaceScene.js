/* ============================================================
   Scene 11 — PEACE
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "11-peace";
  const label = "Peace — calm shop owner, organized world";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-11-peace";

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xa17a52, roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    root.add(floor);

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.95 })
    );
    wall.position.set(0, 5, -5);
    wall.receiveShadow = true;
    root.add(wall);

    const counter = G.makeCounter(7, 1.4, 1.0);
    counter.position.y = -0.5;
    root.add(counter);

    const person = G.makePersonSilhouette({ color: 0x1f2937, scale: 1.0 });
    person.position.set(1.0, -1.0, -1.8);
    person.rotation.y = -0.2;
    root.add(person);

    const phone = G.makePhone({ width: 1.6, height: 3.2, depth: 0.14, screenKind: "dashboard" });
    phone.position.set(2.6, 0.3, 0.5);
    phone.rotation.y = -0.3;
    root.add(phone);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.18, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
    );
    pot.position.set(-2.4, -0.3, 0);
    pot.castShadow = true;
    root.add(pot);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.9 })
    );
    leaves.position.set(-2.4, 0.0, 0);
    leaves.castShadow = true;
    root.add(leaves);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("11", "peace");

        camera.position.set(0, 0.5, 7);
        camera.lookAt(0.5, 0, 0);

        cameraRig.dollyTo({ pos: [0.5, 0.4, 5.5], look: [0.5, 0, 0], duration: 5500 });

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 6) return;
          phone.position.y = 0.3 + Math.sin(t * 1.1) * 0.12;
          phone.rotation.z = Math.sin(t * 0.7) * 0.05;
          requestAnimationFrame(animate);
        };
        animate();

        await cameraRig.wait(1000);
        typography.show(`হিসাব নিয়ে <span class="accent">চিন্তা নয়</span>`, {
          size: "med", pos: "top", wordDelay: 70,
        });
        cues.add("11-h1");
        await cameraRig.wait(2400);
        await typography.fadeOut();

        await cameraRig.wait(300);
        typography.show(`ব্যবসায় <span class="accent">মন দিন</span>`, {
          size: "hero", pos: "mid", wordDelay: 95,
        });
        cues.add("11-h2");
        await cameraRig.wait(2500);
        await typography.fadeOut();
      },
      dispose() {
        root.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
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