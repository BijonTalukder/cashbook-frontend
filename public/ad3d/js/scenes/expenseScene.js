/* ============================================================
   Scene 07 — EXPENSE
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  const id = "07-expense";
  const label = "Expense — ledger + coins flow";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-07-expense";

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    root.add(floor);

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 1 })
    );
    wall.position.set(0, 5, -6);
    root.add(wall);

    const ledger = (() => {
      const cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 512;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#faf6ea";
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = "rgba(80,120,170,.4)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 14; i++) {
        const y = i * 38;
        ctx.beginPath();
        ctx.moveTo(40, y); ctx.lineTo(984, y); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(220,80,80,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 0); ctx.lineTo(140, 512); ctx.stroke();
      ctx.font = "20px serif";
      ctx.fillStyle = "rgba(20,30,60,.8)";
      const rows = ["চাল", "চা", "রহিম", "ভাড়া", "সবজি", "বিদ্যুৎ", "মশলা"];
      rows.forEach((r, i) => ctx.fillText(r, 170, 35 + i * 60));
      ctx.textAlign = "right";
      rows.forEach((_, i) => {
        const v = (Math.random() * 5000 + 100) | 0;
        ctx.fillStyle = Math.random() > 0.4 ? "#0a7a4a" : "#b91c1c";
        ctx.font = "bold 22px serif";
        ctx.fillText((Math.random() > 0.4 ? "+ " : "- ") + "৳ " + v, 960, 35 + i * 60);
      });
      ctx.textAlign = "start";
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    const ledgerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 3.75),
      new THREE.MeshStandardMaterial({ map: ledger, color: 0xffffff, roughness: 0.85 })
    );
    ledgerMesh.rotation.x = -0.25;
    ledgerMesh.position.set(0, 0.5, 0);
    root.add(ledgerMesh);

    const coins = [];
    for (let i = 0; i < 20; i++) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.85 })
      );
      coin.position.set(-5 + Math.random() * 0.3, -1 + Math.random() * 0.6, 1.5);
      coin.rotation.set(Math.PI / 2, 0, 0);
      root.add(coin);
      coins.push({ mesh: coin, delay: i * 0.12 });
    }

    const balance = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.1),
      new THREE.MeshStandardMaterial({
        color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.6, roughness: 0.4,
      })
    );
    balance.position.set(0, 4, 1);
    balance.visible = false;
    root.add(balance);

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("07", "expense");

        camera.position.set(0, 1.5, 5.5);
        camera.lookAt(0, 0, 0);

        cameraRig.dollyTo({ pos: [0, 1.0, 4.5], look: [0, 0, 0], duration: 4500 });

        await cameraRig.wait(800);
        typography.show(`বিক্রি যেমন দেখবেন,`, {
          size: "med", pos: "top", wordDelay: 65,
        });
        cues.add("07-h1");
        await cameraRig.wait(2000);
        await typography.fadeOut();

        await cameraRig.wait(300);
        typography.show(`<span class="accent">খরচও</span> থাকবে নজরে`, {
          size: "med", pos: "mid", wordDelay: 70,
        });
        cues.add("07-h2");

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 4) return;
          for (const c of coins) {
            const ct = (t - c.delay) / 1.5;
            if (ct < 0 || ct > 1) continue;
            c.mesh.position.x = -5 + ct * 10;
            c.mesh.position.y = -1 + Math.sin(ct * Math.PI) * 0.6;
            c.mesh.rotation.z = ct * Math.PI * 4;
            c.mesh.position.z = 1.5 - Math.abs(0.5 - ct) * 1.0;
          }
          if (t > 3) balance.visible = true;
          requestAnimationFrame(animate);
        };
        animate();
        await cameraRig.wait(3000);

        await typography.fadeOut();
      },
      dispose() {
        ledger.dispose();
        root.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => { if (m.map && m.map !== ledger) m.map.dispose(); m.dispose(); });
          }
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
