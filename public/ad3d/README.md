# হিসাব বই — Cinematic 3D Ad (Three.js)

A 2-minute, **director-grade WebGL advertisement** for **হিসাব বই (Hisab Boi)** rendered entirely with **Three.js** at 1920×1080 (16:9).

Creative direction: **FROM CHAOS TO CONTROL.**

```
public/ad3d/
├── index.html              Entry point + import map (CDN)
├── styles.css              1920×1080 stage, letterboxed
├── launch.html             Recording launcher
├── README.md               This file
└── js/
    ├── main.js             Renderer, scene, camera, lighting, director, loop
    ├── lib/
    │   ├── typography.js   Word-by-word headline engine (one at a time)
    │   ├── curtain.js      Fade-to-black cinematic cuts
    │   ├── cues.js         Sound-design timing log
    │   ├── materials.js    PBR materials (wood, paper, plastic, metal, glass)
    │   ├── geometry.js     Procedural geometry + canvas textures
    │   ├── lighting.js     Ambient/hemi/key/fill/rim presets
    │   ├── camera.js       Dolly, orbit, shake tween rig
    │   └── director.js     Scene orchestrator with strict enter/hold/exit
    └── scenes/             12 self-contained scenes
        ├── shopScene.js          01 — warm shop establish
        ├── chaosScene.js         02 — pages scatter, red digits fly
        ├── revealScene.js        03 — green voxels form into a phone
        ├── appIntroScene.js      04 — floating phone, slow orbit
        ├── customerDueScene.js   05 — owed amounts fly out, stack grows
        ├── transactionScene.js   06 — Bengali numerals stream into form
        ├── expenseScene.js       07 — ledger + flowing coins
        ├── dashboardScene.js     08 — 3D dashboard, tiles fly up
        ├── montageScene.js       09 — 4 quick shots: সহজ/দ্রুত/গোছানো/স্মার্ট
        ├── morphScene.js         10 — paper explodes → digital phone
        ├── peaceScene.js         11 — calm shop owner + floating phone
        └── heroScene.js          12 — pedestal, logo, brand outro
```

## Architectural rules (enforced everywhere)

1. **One scene owns the entire stage.** The previous scene is fully disposed before the next one mounts.
2. **One headline at a time.** The `Typography` engine never lets two large texts share the screen; word-by-word enter, hold, then full fade.
3. **Cinematic cuts.** Every scene boundary uses a `Curtain.cut()` — never an in-place swap.
4. **No external assets.** Every material, texture, geometry is procedural (canvas + Three.js primitives). The only network dependency is the Three.js library itself, loaded from CDN via import map.
5. **60 FPS target.** Shadows are PCF-soft, pixel ratio capped at 2, particle counts kept modest.

## Timeline (12 scenes, ~2 minutes)

| t         | Scene                          | Headline                                              | Mood             |
| --------- | ------------------------------ | ----------------------------------------------------- | ---------------- |
| 0:00–0:10 | 01 Shop establish              | হিসাব রাখার পুরনো দিনগুলো                              | warm, cozy       |
| 0:10–0:20 | 02 Chaos                       | সব গুলিয়ে যাচ্ছে                                       | dark, shaky      |
| 0:20–0:33 | 03 Reveal                      | হিসাব হোক স্মার্ট                                      | glowing green    |
| 0:33–0:47 | 04 App intro                   | আপনার ব্যবসার হিসাব / এক জায়গায়                       | brand, polished  |
| 0:47–1:00 | 05 Customer due                | কে কত টাকা দেবে? / এক নজরেই জানুন                     | gold + green     |
| 1:00–1:12 | 06 Transaction                 | লেনদেন লিখুন / হিসাব রাখুন                            | screen-glow      |
| 1:12–1:22 | 07 Expense                     | বিক্রি যেমন দেখবেন / খরচও থাকবে নজরে                  | studio           |
| 1:22–1:32 | 08 Dashboard                   | ব্যবসার অবস্থা বুঝুন এক নজরে                            | data, bars       |
| 1:32–1:42 | 09 Speed montage               | সহজ / দ্রুত / গোছানো / স্মার্ট                          | drum-hits energy |
| 1:42–1:52 | 10 Paper → digital             | খাতার হিসাব থেকে / ডিজিটাল হিসাবের পথে                | particles        |
| 1:52–1:58 | 11 Peace                       | হিসাব নিয়ে চিন্তা নয় / ব্যবসায় মন দিন                | warm, soft       |
| 1:58–2:00+| 12 Hero / brand                | হিসাব বই / আপনার ব্যবসার হিসাব, এখন আরও সহজ          | logo sting       |

## How to record

1. Open `public/ad3d/index.html` in **Chrome / Edge**.
2. Set browser window to **exactly 1920×1080** via DevTools device emulation.
3. Click **▶ প্লে অ্যাড**.
4. Start screen capture (OBS, native recorder, etc.).
5. The ad runs ~2 minutes then fades to black.
6. Trim/convert as needed for upload.

## Implementation notes

- **Pure Three.js** loaded via importmap (`unpkg.com/three@0.160.0`). No bundler, no build step.
- **Procedural textures** rendered into `<canvas>` and wrapped as `CanvasTexture`. No images shipped.
- **PBR materials** with varied roughness/metalness; shadow casting on key objects; soft PCF shadows.
- **Six lighting presets** (`warmShop`, `darkDramatic`, `heroReveal`, `screenShow`, `calmBright`, `digitalVoid`) swapped per scene by the director.
- **Camera rig** supports dolly-to, orbit-to, and shake.
- **Sound-design cues** are logged to a hidden `#cues` div and the console (with mm:ss timestamps) for post-production audio sync.

## SHOW, DON'T EXPLAIN

The visuals show: warm shop → pages scatter → green voxels form into a phone → app screens animate → coins/bills fly into ledgers → paper notebook explodes into particles that coalesce into the digital phone → calm shop owner behind a clean counter → hero shot of the brand.
