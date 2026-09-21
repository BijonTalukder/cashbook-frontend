/* ============================================================
   Scene 01 — SHOP OPENING
   ============================================================ */

(function (global) {
  const THREE = global.THREE;
  const G = global.Geometry;

  const id = "01-shop";
  const label = "Shop opening — establishing shot";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-01-shop";

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    root.add(floor);

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({ color: 0xc4a888, roughness: 0.95 })
    );
    wall.position.set(0, 5, -5);
    wall.receiveShadow = true;
    root.add(wall);

    root.add(G.makeCounter(7, 1.4, 1.0).translateY(-0.5));

    const shelves = G.makeShelves();
    root.add(shelves);

    const notebook = G.makeNotebook({ width: 1.4, depth: 1.0, ruled: true });
    notebook.position.set(-1.8, -0.46, 0);
    notebook.rotation.y = -0.2;
    root.add(notebook);

    const pen = G.makePen();
    pen.position.set(-0.9, -0.46, 0.1);
    pen.rotation.set(0, 0.5, -1.4);
    root.add(pen);

    const calc = G.makeCalculator();
    calc.position.set(0.6, -0.41, 0);
    calc.rotation.y = -0.4;
    root.add(calc);

    const person = G.makePersonSilhouette({ color: 0x374151 });
    person.position.set(2.8, -1.0, -2.0);
    person.rotation.y = -0.6;
    root.add(person);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("01", "shop establish");

        camera.position.set(0, 1.0, 6.5);
        camera.lookAt(-0.5, 0, 0);

        cameraRig.dollyTo({
          pos: [0, 0.9, 5.2],
          look: [-0.4, -0.1, 0],
          duration: 2200,
          hold: 0,
        });

        await cameraRig.wait(1100);

        typography.show(`<span class="accent">হিসাব</span> রাখার পুরনো দিনগুলো`, {
          size: "big", pos: "top", wordDelay: 80,
        });
        cues.add("01-headline", "old days");
        await cameraRig.wait(2800);

        await typography.fadeOut();
        cues.add("01-fadeout");
      },
      dispose() {
        root.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          }
          if (o.userData?.disposeTex) o.userData.disposeTex.dispose();
          if (o.userData?.disposeMat) o.userData.disposeMat.dispose();
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
