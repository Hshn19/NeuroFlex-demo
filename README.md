# NEUROFLEX — Rehab Telemetry Console (Demo)

A demoable web app for the mirror-therapy rehab glove concept, now grounded in the
technical specifics of the reference FYP thesis: **"Smart Glove Robotic
Rehabilitation System"** (Amirul Jeffry Lau, Universiti Sains Malaysia, School of
Electrical & Electronic Engineering, Bachelor of Mechatronic Engineering, July 2025).

It shows:

- **Live "sensor" telemetry** (simulated client-side — no hardware or paid API
  required) for thumb/index/middle/ring/pinky flex, wrist angle, and grip force.
- A real **3D hand model** (React Three Fiber / Three.js — orbit it with your mouse)
  built from ribbed, glowing segments modeled on the thesis's **PneuNet soft
  pneumatic actuators**, not a flat 2D diagram.
- **Mirror Therapy Mode**: two hands side by side — the **healthy hand** (flex
  sensor source) and the **affected hand** (PneuNet actuator output) — mirroring
  the real architecture in the thesis, plus a live data table styled after the
  thesis's own Table 4-2 (8-bit sensor values + voltage), with a mirroring-lock
  indicator based on the same "difference below threshold" logic described in
  Section 4.3.2(b).
- **Exercise Mode**: a rule-based recommendation engine plus a looping 3D
  animation of the correct movement — the personalization layer the thesis
  explicitly flags as future work (Section 5.2).
- A **sci-fi biosignal-console theme** (dark HUD, glow, scanlines, monospace
  telemetry readouts).

Everything runs entirely in the browser. **No paid API keys, no backend, no
database are required to run this demo.**

---

## 1. How this maps to the reference thesis

| Thesis component (real, built & tested in the FYP) | This demo |
|---|---|
| Arduino Mega 2560 controller | Simulated — see `lib/sensorSimulator.ts` |
| Flex sensors on the healthy hand | Simulated live stream, mapped to the same 0–255 (8-bit) / voltage scale used in thesis Table 4-2 |
| 5× DR385 DC 12V pneumatic diaphragm pumps + 5× 6V solenoid air valves | Represented visually as the PneuNet actuator segments on the 3D "affected hand" model |
| PneuNet soft actuator glove (custom-fabricated) | Modeled as ribbed, glowing 3D bellows segments per finger in `components/Hand3D.tsx` |
| Mirror-therapy "successful mirroring" threshold logic | Reproduced in `components/MirrorTherapyPanel.tsx` (average Δ between hands < threshold → "MIRRORING: LOCKED") |
| Thesis Section 5.2 future work: *"intelligent and personalised user interface… guided feedback tailored to their unique rehabilitation requirements"* | This is exactly the **Exercise Mode** recommendation layer — the demo's AI/UX contribution builds directly on a gap the thesis itself identifies |

**Framing for your submission:** this demo is best presented as *"a working front-end
realization of the personalized-interface future work identified in [thesis
citation], built on top of the validated hardware architecture from that FYP."*
That's a stronger and more honest claim than presenting it as new hardware — the
thesis already proved the actuator/sensor hardware works; this project's
contribution is the intelligent personalization layer on top of it.

---

## 2. Tech stack (all free/open-source)

| Piece | Library | Cost |
|---|---|---|
| Framework | Next.js 14 (App Router) | Free, open-source |
| Styling | Tailwind CSS | Free, open-source |
| 3D rendering | Three.js + React Three Fiber + drei | Free, open-source |
| Charts | Recharts | Free, open-source |
| Fonts | Google Fonts (Orbitron, Space Grotesk, JetBrains Mono) via `next/font/google` | Free, no API key needed |
| Hosting | Vercel free (Hobby) tier | Free |

No external/paid API integration is used — "sensor data" is simulated in
`lib/sensorSimulator.ts` so you can present a working, live-updating, 3D demo
today, before real glove hardware is wired up.

### If/when you connect a real glove
- **Web Bluetooth API** (built into Chrome/Edge, free) — if the Arduino/microcontroller
  broadcasts over BLE.
- **Web Serial API** (built into Chrome, free) — if the glove is USB-tethered to the
  laptop running the demo, matching the thesis's current wired setup.

Swapping simulated data for real data means replacing the contents of
`lib/sensorSimulator.ts` with a hook that reads from one of these APIs instead of
`setInterval`. The 3D model, mirroring logic, and recommendation engine don't need
to change — they just consume whatever `SensorReading` values you feed them.

---

## 3. Run it locally in VS Code

**Prerequisites:** Node.js 18.18+ (Node 20 LTS recommended). Check with:
```bash
node -v
npm -v
```
Get it from https://nodejs.org (LTS version) if missing.

**Steps:**

1. Open the project folder in VS Code: `File → Open Folder…` → select `neuroflex`.
2. Open the terminal: `Terminal → New Terminal`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open **http://localhost:3000**. Try both mode tabs, and drag on either 3D hand
   to orbit the camera.

**Recommended VS Code extensions** (free): *ES7+ React/Redux/React-Native
snippets*, *Tailwind CSS IntelliSense*, *Prettier — Code formatter*.

**Where to make changes:**
- `lib/exercises.ts` — edit/add exercises and instruction text.
- `lib/recommendationEngine.ts` — edit the recommendation rules.
- `lib/sensorSimulator.ts` — edit simulated data, or swap in real sensor input.
- `components/Hand3D.tsx` — the 3D PneuNet actuator hand model itself (finger
  geometry, chamber count, colors, lighting).
- `components/MirrorTherapyPanel.tsx` — the dual-hand mirror therapy view + data table.
- `components/Dashboard.tsx` — overall page layout and mode tabs.
- `tailwind.config.ts` — theme colors and glow tokens.

---

## 4. Deploy to Vercel (free)

### Option A — via GitHub (recommended)

```bash
cd neuroflex
git init
git add .
git commit -m "NeuroFlex demo with 3D PneuNet hand model"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
Then at https://vercel.com: **Add New… → Project → Import** your repo → **Deploy**.
Every future `git push` to `main` auto-redeploys.

### Option B — via Vercel CLI

```bash
npm install -g vercel
cd neuroflex
vercel login
vercel
vercel --prod
```

No environment variables or paid add-ons are required.

---

## 5. Project structure

```
neuroflex/
├── app/
│   ├── layout.tsx            # fonts + global page shell
│   ├── page.tsx               # entry point → renders Dashboard
│   └── globals.css            # sci-fi theme tokens
├── components/
│   ├── Dashboard.tsx           # top-level layout, mode tabs, wires data → UI
│   ├── Hand3D.tsx               # 3D PneuNet actuator hand model (Three.js/R3F)
│   ├── MirrorTherapyPanel.tsx   # dual-hand live mirroring view + data table
│   ├── SensorPanel.tsx          # live numeric readouts + grip force chart
│   ├── RecommendationPanel.tsx  # suggested exercise + rationale
│   └── ExerciseDemo.tsx         # loops the 3D hand through the correct movement
├── lib/
│   ├── sensorSimulator.ts       # simulated live data incl. healthy/mirrored channels
│   ├── recommendationEngine.ts  # rule-based logic (stand-in for the trained model)
│   └── exercises.ts             # exercise library + instructions + animation keyframes
├── tailwind.config.ts
└── package.json
```

---

## 6. Honest scope note for your pitch

- Sensor data is **simulated**, not read from real hardware yet — but the value
  ranges, 8-bit mapping, and mirroring-threshold logic are drawn directly from the
  reference thesis's own measured results (Table 4-2), not invented.
- The 3D actuator model is an **original, procedurally-built visualization**
  inspired by the thesis's description of custom-fabricated PneuNet actuators —
  not a scan or photo of the real device.
- The recommendation logic is **transparent, rule-based thresholds**, standing in
  for the trained personalization model that would be built from hospital
  treatment-plan data (a separate, later roadmap item).

Presenting it this way — "front-end + interaction model demo, built on a cited,
validated hardware thesis, with the AI layer clearly marked as the next phase" —
is more credible to judges than implying the full system already exists.
