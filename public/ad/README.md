# হিসাব বই — Cinematic Ad (Facebook Reels 9:16)

A 2-minute, director-grade product advertisement for **হিসাব বই (Hisab Boi)** built natively for Facebook Reels (1080×1920). Director-first architecture: **one scene at a time, one headline at a time, no overlap ever.**

## Files

```
public/ad/
├── index.html     Reels stage 1080×1920, single-scene architecture
├── styles.css     9:16 vertical layout, safe zones for Reels chrome
├── script.js      Director-grade timeline — strict enter/hold/exit
└── launch.html    Recording launcher with player
```

## Architectural principles (the rules that govern every frame)

1. **One scene owns the entire stage.** The previous scene is fully removed before the next starts.
2. **One headline. Strict enter/hold/exit.** The `Typography` engine shows exactly one headline at a time, animates word-by-word, holds, then fades completely before the next appears. Two large texts never share the screen.
3. **Visual hierarchy:** At any moment, only ONE of these is the primary focus:
   - 3D environment
   - smartphone
   - app UI
   - headline text
   - product object
4. **Cinematic cuts between scenes.** Every scene boundary uses a `Curtain.cut()` (fade-to-black) — never an in-place swap.
5. **No constant motion.** Every scene has at least one stillness beat (~700ms+ pause) so the viewer can absorb the moment.

## Timeline (12 scenes, 2 minutes)

| t         | Scene                              | Headline                                                | Sound cue           |
| --------- | ---------------------------------- | ------------------------------------------------------- | ------------------- |
| 0:00–0:08 | 01 Cinematic hook                  | "হিসাব রাখতে এখনও খাতা-কলম?"                            | pen writing         |
| 0:08–0:17 | 02 Chaos                           | "হিসাব গুলিয়ে যাচ্ছে?"                                  | paper shake, freeze |
| 0:17–0:27 | 03 Silence → product reveal        | "হিসাব হোক স্মার্ট।"                                    | whoosh, logo hit    |
| 0:27–0:37 | 04 App intro                       | "আপনার ব্যবসার হিসাব" → "এক জায়গায়।"                  | music bed           |
| 0:37–0:49 | 05 Customer due                    | "কে কত টাকা দেবে?" → "এক নজরেই জানুন।"               | counter ticks       |
| 0:49–0:59 | 06 Transaction                     | "লেনদেন লিখুন।" → "হিসাব রাখুন।"                       | tap, success        |
| 0:59–1:09 | 07 Expense                         | "বিক্রি যেমন দেখবেন," → "খরচও থাকবে নজরে।"            | page turn           |
| 1:09–1:21 | 08 Business overview               | "ব্যবসার অবস্থা বুঝুন এক নজরে।"                         | chart draw          |
| 1:21–1:33 | 09 Fast montage (4 shots)          | "সহজ।" "দ্রুত।" "গোছানো।" "স্মার্ট।"                   | drum hits           |
| 1:33–1:45 | 10 Paper → digital morph           | "খাতার হিসাব থেকে" → "ডিজিটাল হিসাবের পথে।"            | morph whoosh        |
| 1:45–1:53 | 11 Emotional payoff                | "হিসাব নিয়ে চিন্তা নয়।" → "ব্যবসায় মন দিন।"            | soft tone           |
| 1:53–2:00+| 12 Hero product / brand            | "হিসাব বই" → "আপনার ব্যবসার হিসাব, এখন আরও সহজ।"      | logo sting          |

## Reels safe zones

- Top 14%: username / avatar / follow button
- Bottom 22%: caption / like button / share
- Headlines and key visuals stay in the central 64% vertical band.

## How to record

1. Open `public/ad/launch.html` (or `public/ad/index.html` directly).
2. Set browser window to **1080×1920** (use Chrome DevTools device emulation or set the window to that exact size).
3. Hit Play — the 2-minute piece auto-plays.
4. Start screen capture (OBS, native recorder, etc.).
5. The piece plays from 0:00 to ~2:00 with a final fade-out. Trim/convert as needed for upload.

## Implementation notes

- **No external libs.** Pure HTML + CSS + vanilla JS. 60fps target.
- **Real app UI.** All in-phone screens match the actual Hisab Boi patterns (DM Serif Display headings, `#10b981` brand, surface tokens, customer list, sales list, expense list, add-transaction sheet).
- **Cue markers.** Sound design timing is logged to a hidden `#cues` element in the corner; each scene logs `enter`, `freeze`, `headline`, etc. for post-production.
