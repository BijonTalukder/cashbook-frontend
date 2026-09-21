/* ============================================================
   Procedural geometry helpers.
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  /* ---------- Textures ---------- */

  function makeCanvasTexture(draw, w = 512, h = 512, { repeat = null } = {}) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    if (repeat) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat[0], repeat[1]);
    }
    return tex;
  }

  function woodTexture() {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#a87446");
      grad.addColorStop(0.5, "#bf8a5c");
      grad.addColorStop(1, "#8d5d36");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(80,45,20,.45)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        const y = (i * h) / 40 + Math.sin(i) * 6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 16) {
          ctx.lineTo(x, y + Math.sin((x / w) * 6 + i * 0.6) * 8);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(60,32,16,.5)";
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.35, 18, 12, 0.4, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = `rgba(${50 + Math.random() * 40},${30 + Math.random() * 30},${10 + Math.random() * 20},${Math.random() * 0.18})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
    }, 1024, 1024, { repeat: [2, 2] });
  }

  function paperTexture() {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = "#f8f3e6";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = `rgba(120,90,50,${Math.random() * 0.07})`;
        ctx.fillRect(x, y, 1, Math.random() * 2);
      }
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 30 + Math.random() * 80;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(210,180,120,${0.05 + Math.random() * 0.08})`);
        grad.addColorStop(1, "rgba(210,180,120,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }, 1024, 1024);
  }

  function ruledPaperTexture() {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = "#faf6ea";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(80,120,170,.4)";
      ctx.lineWidth = 1;
      const gap = h / 26;
      for (let i = 1; i < 26; i++) {
        const y = i * gap;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(220,80,80,.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.13, 0);
      ctx.lineTo(w * 0.13, h);
      ctx.stroke();
      ctx.strokeStyle = "rgba(20,30,60,.7)";
      ctx.lineWidth = 1.6;
      const scribbles = [
        ["20/-", 5], ["rice", 11], ["120/-", 17],
        ["tea", 6], ["30/-", 13], ["salt", 19], ["40/-", 22],
      ];
      scribbles.forEach(([_, idx]) => {
        const y = idx * gap - gap * 0.4;
        ctx.font = "16px serif";
        ctx.fillStyle = "rgba(20,30,60,.75)";
        ctx.fillText("✕ " + _, 200 + Math.random() * 200, y);
      });
      const grad = ctx.createRadialGradient(w * 0.8, h * 0.2, 5, w * 0.8, h * 0.2, 80);
      grad.addColorStop(0, "rgba(120,80,40,.25)");
      grad.addColorStop(1, "rgba(120,80,40,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }, 1024, 1024);
  }

  function takaNoteTexture() {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#3f8a64");
      grad.addColorStop(1, "#2d6f4e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,230,160,.5)";
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.font = "bold 26px serif";
      ctx.fillStyle = "rgba(255,230,160,.85)";
      ctx.fillText("১০০", 40, 90);
      ctx.fillText("১০০", w - 100, h - 40);
      ctx.font = "bold 180px serif";
      ctx.fillStyle = "rgba(255,230,160,.85)";
      ctx.fillText("১০০", w - 280, h / 2 + 60);
      ctx.fillStyle = "rgba(255,230,160,.7)";
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.5, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(45,111,78,1)";
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.5, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,230,160,.5)";
      ctx.font = "bold 60px serif";
      ctx.textAlign = "center";
      ctx.fillText("বাংলাদেশ", w * 0.35, h * 0.52);
      ctx.font = "bold 22px serif";
      ctx.fillText("১০০ টাকা", w * 0.35, h * 0.62);
      ctx.textAlign = "start";
      ctx.strokeStyle = "rgba(255,230,160,.4)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 14; i++) {
        const y = 120 + i * 24;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(540, y);
        ctx.stroke();
      }
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
    }, 1024, 512);
  }

  function phoneScreenTexture(kind = "home") {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0a0f1e");
      grad.addColorStop(1, "#050810");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (kind === "home") {
        ctx.fillStyle = "#fff";
        ctx.font = "24px sans-serif";
        ctx.fillText("9:41", 40, 22);
        ctx.fillText("●●● ▮", w - 100, 22);
        ctx.fillStyle = "rgba(255,255,255,.6)";
        ctx.font = "26px sans-serif";
        ctx.fillText("স্বাগতম,", 50, 110);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px serif";
        ctx.fillText("হিসাব বই", 50, 170);
        ctx.fillStyle = "#10b981";
        roundRect(ctx, 50, 220, w - 100, 200, 24);
        ctx.fill();
        ctx.fillStyle = "#022c22";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("আজকের বিক্রি", 80, 270);
        ctx.font = "bold 64px serif";
        ctx.fillText("৳ ১২,৪৫০", 80, 340);
        ctx.fillStyle = "rgba(2,44,34,.7)";
        ctx.font = "22px sans-serif";
        ctx.fillText("+ ৳ ৩,২০০ গতকালের চেয়ে", 80, 380);
        const tiles = ["বাকি পাবেন", "খরচ", "লেনদেন", "গ্রাহক"];
        tiles.forEach((t, i) => {
          const x = 50 + (i % 2) * ((w - 130) / 2 + 20);
          const y = 460 + Math.floor(i / 2) * 170;
          ctx.fillStyle = "rgba(255,255,255,.06)";
          roundRect(ctx, x, y, (w - 130) / 2, 140, 18);
          ctx.fill();
          ctx.fillStyle = "#34d399";
          ctx.font = "22px sans-serif";
          ctx.fillText(t, x + 24, y + 50);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 32px serif";
          ctx.fillText("৳ " + (i + 1) * 1200, x + 24, y + 100);
        });
        ctx.fillStyle = "rgba(255,255,255,.04)";
        roundRect(ctx, 50, h - 130, w - 100, 80, 18);
        ctx.fill();
        const nav = ["হোম", "বিক্রি", "খরচ", "গ্রাহক", "আরও"];
        nav.forEach((n, i) => {
          ctx.fillStyle = i === 0 ? "#10b981" : "rgba(255,255,255,.5)";
          ctx.font = "20px sans-serif";
          ctx.fillText(n, 90 + i * 170, h - 78);
        });
      } else if (kind === "ledger") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px serif";
        ctx.fillText("খতিয়ান", 50, 70);
        ctx.strokeStyle = "rgba(16,185,129,.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 100);
        ctx.lineTo(w - 50, 100);
        ctx.stroke();
        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("তারিখ       বিবরণ          টাকা", 50, 130);
        ctx.fillStyle = "#fff";
        const rows = [
          ["১২ সেপ্ট", "চাল বিক্রি", "+ ৳ ৪,৫০০"],
          ["১২ সেপ্ট", "চা খরচ",     "- ৳ ২৫০"],
          ["১১ সেপ্ট", "রহিম (বাকি)", "+ ৳ ৮,০০০"],
          ["১১ সেপ্ট", "ভাড়া",       "- ৳ ৩,০০০"],
          ["১০ সেপ্ট", "সবজি বিক্রি", "+ ৳ ২,২০০"],
          ["১০ সেপ্ট", "বিদ্যুৎ বিল",  "- ৳ ৯৫০"],
        ];
        rows.forEach((r, i) => {
          const y = 180 + i * 70;
          ctx.fillStyle = "rgba(255,255,255,.85)";
          ctx.font = "22px sans-serif";
          ctx.fillText(r[0], 50, y);
          ctx.fillText(r[1], 230, y);
          ctx.fillStyle = r[2].startsWith("+") ? "#34d399" : "#f87171";
          ctx.textAlign = "right";
          ctx.fillText(r[2], w - 50, y);
          ctx.textAlign = "start";
        });
      } else if (kind === "customer") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px serif";
        ctx.fillText("গ্রাহক", 50, 70);
        ctx.fillStyle = "rgba(255,255,255,.08)";
        roundRect(ctx, 50, 100, w - 100, 70, 18);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.5)";
        ctx.font = "22px sans-serif";
        ctx.fillText("🔍  গ্রাহক খুঁজুন...", 80, 145);
        const customers = [
          ["রহিম মিয়া", "+ ৳ ৮,০০০", "owed"],
          ["করিম উদ্দিন", "+ ৳ ৩,২০০", "owed"],
          ["সালাম সাহেব", "৳ ০", "settled"],
          ["জামাল", "+ ৳ ১,৫০০", "owed"],
          ["আনিসা বেগম", "+ ৳ ৪,৮০০", "owed"],
          ["সাইফুল", "৳ ০", "settled"],
        ];
        customers.forEach((c, i) => {
          const y = 200 + i * 90;
          ctx.fillStyle = "rgba(255,255,255,.04)";
          roundRect(ctx, 50, y, w - 100, 76, 14);
          ctx.fill();
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(95, y + 38, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#022c22";
          ctx.font = "bold 20px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(c[0][0], 95, y + 44);
          ctx.textAlign = "start";
          ctx.fillStyle = "#fff";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText(c[0], 130, y + 36);
          ctx.fillStyle = "rgba(255,255,255,.5)";
          ctx.font = "16px sans-serif";
          ctx.fillText(c[2] === "owed" ? "বাকি পাবেন" : "পরিশোধিত", 130, y + 58);
          ctx.fillStyle = c[2] === "owed" ? "#fbbf24" : "#10b981";
          ctx.font = "bold 22px serif";
          ctx.textAlign = "right";
          ctx.fillText(c[1], w - 60, y + 48);
          ctx.textAlign = "start";
        });
      } else if (kind === "dashboard") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px serif";
        ctx.fillText("ব্যবসার অবস্থা", 50, 70);
        ctx.fillStyle = "#10b981";
        roundRect(ctx, 50, 110, w - 100, 220, 24);
        ctx.fill();
        ctx.fillStyle = "#022c22";
        ctx.font = "22px sans-serif";
        ctx.fillText("এই মাসের নিট লাভ", 80, 155);
        ctx.font = "bold 80px serif";
        ctx.fillText("৳ ৪৮,৭৫০", 80, 240);
        const months = ["জুন", "জুলা", "আগ", "সেপ"];
        const vals = [120, 180, 140, 200];
        const baseY = 600;
        const barW = 100;
        const gap = 40;
        months.forEach((m, i) => {
          const x = 80 + i * (barW + gap);
          const h = vals[i] * 1.6;
          ctx.fillStyle = i === 3 ? "#fbbf24" : "rgba(16,185,129,.6)";
          roundRect(ctx, x, baseY - h, barW, h, 8);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "20px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(m, x + barW / 2, baseY + 28);
          ctx.fillStyle = "rgba(255,255,255,.8)";
          ctx.font = "16px sans-serif";
          ctx.fillText(String(vals[i] * 1000), x + barW / 2, baseY - h - 12);
          ctx.textAlign = "start";
        });
      } else if (kind === "add") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px serif";
        ctx.fillText("নতুন লেনদেন", 50, 70);
        ctx.fillStyle = "rgba(255,255,255,.05)";
        roundRect(ctx, 50, 110, w - 100, 80, 14);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.4)";
        ctx.font = "22px sans-serif";
        ctx.fillText("বিবরণ", 80, 150);
        ctx.fillStyle = "rgba(255,255,255,.05)";
        roundRect(ctx, 50, 210, w - 100, 80, 14);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.4)";
        ctx.font = "22px sans-serif";
        ctx.fillText("টাকা", 80, 250);
        ctx.fillStyle = "rgba(255,255,255,.05)";
        roundRect(ctx, 50, 310, w - 100, 80, 14);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.4)";
        ctx.font = "22px sans-serif";
        ctx.fillText("গ্রাহক (ঐচ্ছিক)", 80, 350);
        ctx.fillStyle = "rgba(16,185,129,.2)";
        roundRect(ctx, 50, 410, w - 100, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#10b981";
        roundRect(ctx, 60, 420, (w - 120) / 2, 50, 10);
        ctx.fill();
        ctx.fillStyle = "#022c22";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("পাবেন", (w) / 2 - 30, 452);
        ctx.fillStyle = "rgba(255,255,255,.5)";
        ctx.fillText("দেবেন", (w) / 2 + 110, 452);
        ctx.textAlign = "start";
        ctx.fillStyle = "#10b981";
        roundRect(ctx, 50, h - 130, w - 100, 80, 14);
        ctx.fill();
        ctx.fillStyle = "#022c22";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("সংরক্ষণ করুন", w / 2, h - 80);
        ctx.textAlign = "start";
      }

      for (let i = 0; i < 800; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
    }, 540, 1140);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- Reusable meshes ---------- */

  function makeCounter(width = 4, depth = 1.4, height = 1.0) {
    const woodMap = woodTexture();
    const wood = new THREE.MeshStandardMaterial({
      map: woodMap, color: 0xb88c5a, roughness: 0.78, metalness: 0.02,
    });
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, wood);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.disposeMat = woodMap;
    return mesh;
  }

  function makeNotebook(opts = {}) {
    const { width = 1.2, depth = 0.85, height = 0.08, ruled = false } = opts;
    const grp = new THREE.Group();

    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 })
    );
    cover.castShadow = true;
    cover.receiveShadow = true;
    grp.add(cover);

    const pageTex = ruled ? ruledPaperTexture() : paperTexture();
    const page = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.95, depth * 0.95),
      new THREE.MeshStandardMaterial({
        map: pageTex, color: 0xffffff, roughness: 0.95, metalness: 0.0,
      })
    );
    page.rotation.x = -Math.PI / 2;
    page.position.y = height / 2 + 0.001;
    page.receiveShadow = true;
    grp.add(page);

    for (let i = 0; i < 3; i++) {
      const sheet = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.9, depth * 0.9),
        new THREE.MeshStandardMaterial({
          map: paperTexture(), color: 0xffffff, roughness: 0.95,
        })
      );
      sheet.rotation.x = -Math.PI / 2;
      sheet.rotation.z = (i - 1) * 0.03;
      sheet.position.y = height / 2 + 0.003 + i * 0.002;
      sheet.receiveShadow = true;
      grp.add(sheet);
    }

    return grp;
  }

  function makePen(color = 0x0a0f1e) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.0, 18),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1 })
    );
    body.castShadow = true;
    grp.add(body);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.031, 0.3, 18),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.35, metalness: 0.4 })
    );
    cap.position.y = 0.35;
    cap.castShadow = true;
    grp.add(cap);
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xc0c8d0, roughness: 0.3, metalness: 0.9 })
    );
    tip.position.y = -0.54;
    tip.rotation.x = Math.PI;
    tip.castShadow = true;
    grp.add(tip);
    return grp;
  }

  function makeCalculator(width = 0.9, height = 1.4) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.18, height),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.05 })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);

    const lcd = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.85, height * 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x3f8a64, emissive: 0x3f8a64, emissiveIntensity: 0.35, roughness: 0.4,
      })
    );
    lcd.rotation.x = -Math.PI / 2;
    lcd.position.set(0, 0.091, -height * 0.36);
    grp.add(lcd);

    const cols = 4, rows = 5;
    const w = (width * 0.85) / cols;
    const h = (height * 0.55) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isOrange = r === rows - 1 && c === cols - 1;
        const isDark = c === cols - 1;
        const btnMat = new THREE.MeshStandardMaterial({
          color: isOrange ? 0xfbbf24 : (isDark ? 0x374151 : 0xe5e7eb),
          roughness: 0.35, metalness: isDark ? 0.4 : 0.05,
        });
        const btn = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.78, 0.03, h * 0.78), btnMat
        );
        btn.position.set(-width * 0.425 + w * 0.5 + c * w, 0.092, -height * 0.05 + h * 0.5 + r * h);
        btn.castShadow = true;
        grp.add(btn);
      }
    }
    return grp;
  }

  function makePhone(opts = {}) {
    const { width = 1.2, height = 2.4, depth = 0.12, screenKind = "home" } = opts;
    const grp = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.4, metalness: 0.5 })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);

    const screenTex = phoneScreenTexture(screenKind);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.92, height * 0.95),
      new THREE.MeshStandardMaterial({
        map: screenTex, color: 0xffffff, roughness: 0.25, metalness: 0.05,
        emissive: 0x0a0f1e, emissiveIntensity: 0.4,
      })
    );
    screen.position.z = depth / 2 + 0.001;
    screen.position.y = -height * 0.005;
    grp.add(screen);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.92, height * 0.95),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.05, metalness: 0,
        transparent: true, opacity: 0.08, transmission: 0.95, ior: 1.45, thickness: 0.3,
      })
    );
    glass.position.z = depth / 2 + 0.005;
    grp.add(glass);

    const cam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.02, 24),
      new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 0.2, metalness: 0.9 })
    );
    cam.rotation.x = Math.PI / 2;
    cam.position.set(width * 0.32, height * 0.42, depth / 2 + 0.005);
    grp.add(cam);

    const pwr = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.18, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.6 })
    );
    pwr.position.set(width / 2 + 0.005, height * 0.2, 0);
    grp.add(pwr);

    grp.userData.disposeTex = screenTex;
    return grp;
  }

  function makeTakaNote() {
    const tex = takaNoteTexture();
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      map: tex, color: 0xffffff, roughness: 0.85, metalness: 0.05,
    });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), mat);
    grp.add(note);
    const stackMat = new THREE.MeshStandardMaterial({ color: 0x2d6f4e, roughness: 0.9 });
    for (let i = 1; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), stackMat);
      s.position.z = -i * 0.005;
      grp.add(s);
    }
    grp.userData.disposeTex = tex;
    return grp;
  }

  function makeCoinStack(count = 8) {
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.85 });
    for (let i = 0; i < count; i++) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 32), mat);
      coin.position.y = i * 0.04;
      coin.rotation.x = Math.PI / 2;
      coin.castShadow = true;
      grp.add(coin);
    }
    return grp;
  }

  function makeShelves() {
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 });
    for (let i = 0; i < 3; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 0.7), mat);
      plank.position.y = 1.5 + i * 1.4;
      plank.castShadow = true;
      plank.receiveShadow = true;
      grp.add(plank);
      for (let j = 0; j < 6; j++) {
        const jar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.4, 18),
          new THREE.MeshStandardMaterial({
            color: 0xc2410c + j * 0x010101, roughness: 0.5, metalness: 0.1,
          })
        );
        jar.position.set(-3.5 + j * 1.4, 1.5 + i * 1.4 + 0.23, 0);
        jar.castShadow = true;
        grp.add(jar);
      }
    }
    return grp;
  }

  function makePersonSilhouette(opts = {}) {
    const { color = 0x1f2937, scale = 1 } = opts;
    const grp = new THREE.Group();
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.7, 1.6, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    torso.position.y = 0;
    torso.castShadow = true;
    torso.scale.setScalar(scale);
    grp.add(torso);

    const shoulders = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 24, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    shoulders.position.y = 0.6;
    shoulders.scale.setScalar(scale);
    shoulders.castShadow = true;
    grp.add(shoulders);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 })
    );
    neck.position.y = 1.05;
    neck.scale.setScalar(scale);
    grp.add(neck);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.85 })
    );
    head.position.y = 1.6;
    head.scale.setScalar(scale);
    head.castShadow = true;
    grp.add(head);

    return grp;
  }

  function makeLogo3D() {
    const grp = new THREE.Group();
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.18, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.5, metalness: 0.2 })
    );
    book.castShadow = true;
    grp.add(book);

    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.06, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xf8f3e6, roughness: 0.95 })
    );
    pages.position.y = 0.1;
    pages.castShadow = true;
    grp.add(pages);

    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 12, 32, Math.PI),
      new THREE.MeshStandardMaterial({
        color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2, roughness: 0.3,
      })
    );
    arc.position.y = 0.35;
    arc.rotation.x = Math.PI / 2;
    grp.add(arc);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 24, 16),
      new THREE.MeshStandardMaterial({
        color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.4, roughness: 0.3,
      })
    );
    dot.position.y = 0.35;
    grp.add(dot);

    return grp;
  }

  function makeProductBox() {
    const grp = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.4, metalness: 0.3 })
    );
    box.castShadow = true;
    grp.add(box);
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.25),
      new THREE.MeshStandardMaterial({
        color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.5, roughness: 0.4,
      })
    );
    stripe.position.z = 0.252;
    stripe.position.y = 0.7;
    grp.add(stripe);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xf8f3e6, roughness: 0.7 })
    );
    label.position.z = 0.252;
    label.position.y = 0;
    grp.add(label);
    return grp;
  }

  function makeParticleCloud(count = 200, color = 0x10b981) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color, size: 0.04, sizeAttenuation: true, transparent: true, opacity: 0.9,
    });
    return new THREE.Points(geo, mat);
  }

  global.Geometry = {
    woodTexture, paperTexture, ruledPaperTexture, takaNoteTexture,
    phoneScreenTexture, roundRect,
    makeCounter, makeNotebook, makePen, makeCalculator, makePhone,
    makeTakaNote, makeCoinStack, makeShelves, makePersonSilhouette,
    makeLogo3D, makeProductBox, makeParticleCloud,
  };
})(window);
