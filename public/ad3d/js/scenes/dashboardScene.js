/* ============================================================
   Scene 08 — DASHBOARD
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const id = "08-dashboard";
  const label = "Business dashboard — 3D bar chart grows";

  function factory() {
    const root = new THREE.Group();
    root.name = "Scene-08-dashboard";

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    root.add(floor);

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 1 })
    );
    wall.position.set(0, 5, -6);
    root.add(wall);

    const dashTex = (() => {
      const cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 1024;
      const ctx = cv.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, "#0a0f1e");
      grad.addColorStop(1, "#050810");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = "#10b981";
      _roundRect(ctx, 60, 60, 904, 320, 28); ctx.fill();
      ctx.fillStyle = "#022c22";
      ctx.font = "32px sans-serif";
      ctx.fillText("এই মাসের নিট লাভ", 100, 110);
      ctx.font = "bold 130px serif";
      ctx.fillText("৳ ৪৮,৭৫০", 100, 240);

      const baseY = 820;
      const bars = [
        { m: "জুন", v: 120, c: "rgba(16,185,129,.55)" },
        { m: "জুলা", v: 180, c: "rgba(16,185,129,.55)" },
        { m: "আগ",  v: 140, c: "rgba(16,185,129,.55)" },
        { m: "সেপ", v: 200, c: "#fbbf24" },
      ];
      const barW = 130;
      const gap = 60;
      bars.forEach((b, i) => {
        const x = 110 + i * (barW + gap);
        const h = b.v * 2.6;
        ctx.fillStyle = b.c;
        _roundRect(ctx, x, baseY - h, barW, h, 12); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.m, x + barW / 2, baseY + 40);
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.font = "22px sans-serif";
        ctx.fillText("৳" + (b.v * 1000), x + barW / 2, baseY - h - 18);
        ctx.textAlign = "start";
      });
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshStandardMaterial({ map: dashTex, color: 0xffffff, roughness: 0.6, emissive: 0x0a0f1e, emissiveIntensity: 0.3 })
    );
    board.position.set(0, 0, 0);
    root.add(board);

    const tiles = [];
    const labels = [
      { label: "বিক্রি", value: "+৳ ৬২,৪০০", color: "#10b981" },
      { label: "খরচ", value: "-৳ ১৩,৬৫০", color: "#f87171" },
      { label: "লাভ", value: "+৳ ৪৮,৭৫০", color: "#fbbf24" },
    ];
    for (let i = 0; i < labels.length; i++) {
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 256;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "rgba(255,255,255,.08)";
      _roundRect(ctx, 0, 0, 512, 256, 18);
      ctx.fill();
      ctx.strokeStyle = labels[i].color;
      ctx.lineWidth = 4;
      _roundRect(ctx, 0, 0, 512, 256, 18);
      ctx.stroke();
      ctx.fillStyle = labels[i].color;
      ctx.font = "32px sans-serif";
      ctx.fillText(labels[i].label, 28, 56);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 64px serif";
      ctx.fillText(labels[i].value, 28, 150);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.4 });
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), mat);
      tile.position.set(-3 + i * 3, -3.5, 1);
      tile.userData.targetY = -3.5;
      tiles.push(tile);
      root.add(tile);
    }

    return {
      root,
      async run({ camera, typography, cues, cameraRig }) {
        cues.add("08", "dashboard");

        camera.position.set(0, 0.5, 7);
        camera.lookAt(0, 0, 0);

        cameraRig.dollyTo({ pos: [0, 0.4, 5.5], look: [0, 0, 0], duration: 5500 });

        const start = performance.now();
        const animate = () => {
          const t = (performance.now() - start) / 1000;
          if (t > 4) return;
          for (let i = 0; i < tiles.length; i++) {
            const tt = (t - i * 0.2) / 0.8;
            if (tt < 0) continue;
            if (tt > 1) { tiles[i].position.y = tiles[i].userData.targetY; continue; }
            const k = 1 - Math.pow(1 - tt, 2);
            tiles[i].position.y = -6 + (tiles[i].userData.targetY + 6) * k;
            tiles[i].rotation.z = (1 - k) * 0.3;
          }
          requestAnimationFrame(animate);
        };
        animate();

        await cameraRig.wait(800);
        typography.show(`ব্যবসার অবস্থা বুঝুন <span class="accent">এক নজরে</span>`, {
          size: "med", pos: "top", wordDelay: 60,
        });
        cues.add("08-h");
        await cameraRig.wait(3500);
        await typography.fadeOut();
      },
      dispose() {
        dashTex.dispose();
        root.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => { if (m.map && m.map !== dashTex) m.map.dispose(); m.dispose(); });
          }
        });
      },
    };
  }

  global.Scenes.register(id, label, factory);
})(window);
