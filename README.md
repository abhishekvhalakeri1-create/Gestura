# Gestura

An on-device hand sign interpreter. Hold an ASL fingerspelling letter in front of your webcam and it lands on the page — no upload, no account, no server. Then take it into practice mode and let it tell you which finger is out of place.

Everything runs in the browser tab: MediaPipe's hand landmark model (WASM), a geometric handshape classifier, and a custom canvas overlay drawn on top of the video.

```
npm install
npm run dev        # http://localhost:5173
```

Node 20+ is required. The first `dev`/`build` run copies the MediaPipe WASM runtime out of `node_modules` into `public/mediapipe` (git-ignored, ~7 MB); the hand landmark model itself ships in `public/models`. No network access is needed at runtime.

---

## The three views

**Live Interpreter** — a 60/40 split. The camera viewport carries floating controls (camera switch, mirror, skeleton, dwell speed) and a "On-Device Processing · No Video Stored" pill. The right-hand column is a paper tape of committed signs with a dwell ring that fills while a handshape is held; **Speak Aloud**, **Backspace**, **Space** and **Clear** sit underneath.

**Dictionary & Practice** — thirty-two signs as a filterable card grid. Each card draws the canonical handshape from the same geometry the classifier uses, with plain-language finger placement under it. *Practice this sign* opens a side-by-side comparison: your hand on the left, the target on the right, a match score in the middle, and a short list of corrections ("bring the thumb across the palm", "straighten the pinky").

**Onboarding** — a calm three-step strip with a single action: *Enable Camera to Begin*. Permission denial is a first-class state, not an error dialog.

### Keyboard

| Key | Action |
| --- | --- |
| `Space` | insert a space in the transcript |
| `Backspace` | remove the last token |
| `Enter` | speak the transcript aloud |
| `Esc` | close practice mode |

---

## How a hand becomes a letter

```
webcam ──▶ HandLandmarker (VIDEO, 30 Hz) ──▶ 21 landmarks
                                              │
                        palm-local normalise ──┤ (origin, scale, rotation)
                                              ▼
                                    13 anatomical features
                                              │
                     weighted distance to 21 templates ──▶ confidence
                                              │
                        motion gate + 6-frame stability ──▶ dwell (1.2 s) ──▶ transcript
```

**Normalisation.** Each frame is re-expressed in a frame built from the wrist, middle MCP and pinky MCP: translation, rotation and hand size disappear, so distance from the camera and a tilted wrist do not matter.

**The feature vector** — every number is a joint angle or a fingertip gap, which is what makes the coaching messages possible:

| # | Feature | Meaning |
| --- | --- | --- |
| 0–3 | `extI extM extR extP` | how extended each finger is (tip reach ÷ finger length) |
| 4 | `thumbReach` | how far the thumb reaches out from the palm |
| 5 | `thumbX` | thumb tip relative to the index MCP — across the palm, or out to the side |
| 6 | `tipDrop` | average fingertip height above the knuckle row |
| 7–11 | `gTI gTM gIM gMR gRP` | tip gaps: thumb↔index, thumb↔middle, index↔middle, middle↔ring, ring↔pinky |
| 12 | `ang` | angle between the index and the thumb |

**Classification.** Templates are generated from the same parametric hand rig (`src/lib/handPose.ts`) that draws the illustrations, projected through the identical feature extraction. The nearest template wins by weighted Euclidean distance, and the distance maps to confidence through a Gaussian (`σ = 0.45`). Templates are written for a right hand; each frame picks the chirality whose best match is closer and uses it for the whole ranking, so a left hand does not degrade into a different letter.

**Making it usable, not just accurate.** Three guards sit between the classifier and the tape:

- *Ambiguity* — when the top two readings are within 0.06 of each other (M/N, U/V, R/U), the commit threshold rises to 0.84 instead of 0.72.
- *Temporal stability* — a sign must hold for several consecutive detections before the dwell ring starts filling.
- *Release* — a committed letter will not repeat until the hand has changed, unless the dwell lock is deliberately reset.

Movement signs (Hello, Thank you, Yes, No, Please) are read from the last ~950 ms of palm motion — reversal counts for waves and nods, circularity for *please* — because those words live in motion, not in a frozen shape.

---

## Accuracy

The classifier is a heuristic geometry model, not a trained network. It is honest about what that means:

```
npm run validate        # canonical poses + noise robustness
npm run validate:real   # feature vectors captured from real ASL photographs
```

- **21/21** canonical poses recognised first, at 100% self-confidence.
- **99.0%** accuracy under ±0.06 noise on every feature (40 trials per sign).
- **6/6** real photographs (A, B, L, V, W, Y) classified first, at 79–94% confidence, from hands of both chiralities and very different framing.

The weakest distinctions are the ones humans also find hard: M/N (thumb under two vs three fingers), U/V (spread of the middle fingers) and R/U. Confidence on those sits in the 60–75% band by design, which keeps them off the tape until the pose is clean.

---

## Project structure

```
src/
  lib/
    handPose.ts        parametric hand rig → 21 landmarks (one source of truth)
    handFeatures.ts    landmark → 13 anatomical features + weights
    classifier.ts      template matching, chirality, confidence, coaching input
    coaching.ts        feature deltas → plain-language corrections
    handSvg.ts         rig → SVG paths for the dictionary illustrations
    skeletonRenderer.ts  custom canvas overlay (nodes, bones, palm wash)
    motion.ts          movement gestures from a short palm trail
    transcript.ts      token accumulation, spacing, spoken text
    speech.ts          window.speechSynthesis wrapper
    config.ts          dwell, thresholds, asset paths
  hooks/
    useCamera.ts       getUserMedia, device switching, mirroring
    useHandRecognition.ts  the rAF loop; detection decoupled from React renders
    useSignCommit.ts   dwell timing, stability, release
    useFrameSnapshot.ts throttled frame for the HUD
  components/          CameraStage, CameraSurface, TranscriptTape, SignCard,
                       PracticePanel, TopNav, Onboarding, HUD pieces
scripts/
  validate-classifier.ts  pose + noise regression suite
  real-sample-check.ts    real-photo feature vectors
  render-hand-sheet.ts    renders every illustration to one SVG for review
```

**Render discipline.** Detection runs on its own `requestAnimationFrame` loop and pushes results into refs. React only re-renders when the recognised sign changes, a sign commits, or the HUD needs a tick — the overlay itself is painted straight to canvas at display refresh, so a 30 Hz model never drags the UI down to 30 Hz.

---

## Design

Tactile editorial, warm minimalism: `#F7F5F0` paper, white cards, `#18181B` ink, hairline `#E4E2DD` borders, and one accent — terracotta `#D94E34` — reserved for recording and focal states. Instrument Serif for display type, Inter for UI, JetBrains Mono for anything that should read as measurement (confidence, fps, latency). Shadows are barely there. Motion uses a spring curve for state changes and an editorial ease for entrances.

The hand illustrations are generated, not drawn: the same rig that defines each canonical pose is projected to SVG with a single continuous silhouette, a palm tone, and folded fingers drawn last with their own hairline so a closed fist reads as knuckles rather than a lump.

---

## Privacy

The camera stream never leaves the tab. There is no analytics, no upload path, and no network request after the assets load — the model and the WASM runtime are served from your own origin.

---

## Limits worth knowing

- **Static handshapes only.** J and Z move in real ASL; the dictionary explains them, but a still hand will not commit them.
- **One hand at a time** for classification (two are tracked for the overlay).
- **Palm towards the camera.** Rotated signs (G, H, P, Q) are diagrammed sideways; making them with the hand rotated towards the lens reads less reliably.
- **Lighting matters.** Backlit or very low-contrast hands lose the landmarker before they lose the classifier.
- The model is a landmark detector, not a sign-language model: it knows where the joints are, not what a sign means. Everything semantic here is the geometry layer.

If you want to tune it: dwell and thresholds live in `src/lib/config.ts`, feature weights in `src/lib/handFeatures.ts`, and the shapes themselves in `src/data/signs.ts`. After changing a shape, run `npm run validate` and `npm run hands` (the latter writes a single sheet of all 32 illustrations to `node_modules/.cache/hands.svg`).
