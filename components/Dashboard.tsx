"use client";

import { useEffect, useState } from "react";
import { useSensorStream } from "@/lib/sensorSimulator";
import { recommend } from "@/lib/recommendationEngine";
import Hand3D from "./Hand3D";
import SensorPanel from "./SensorPanel";
import RecommendationPanel from "./RecommendationPanel";
import ExerciseDemo from "./ExerciseDemo";
import MirrorTherapyPanel from "./MirrorTherapyPanel";

type Mode = "mirror" | "exercise";

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toUTCString().slice(17, 25));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Dashboard() {
  const history = useSensorStream(900);
  const latest = history[history.length - 1];
  const rec = recommend(history);
  const clock = useClock();
  const [mode, setMode] = useState<Mode>("mirror");

  return (
    <div className="min-h-screen bg-scanlines">
      {/* top bar */}
      <header className="border-b border-panelBorder bg-panel/60 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm border border-signal/40 flex items-center justify-center">
            <div className="h-2 w-2 bg-signal rounded-full shadow-glow animate-flicker" />
          </div>
          <div>
            <div className="font-display text-sm tracking-[0.3em] text-bone">NEUROFLEX</div>
            <div className="text-[10px] font-mono text-mist tracking-widest">REHAB TELEMETRY CONSOLE — DEMO BUILD</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-[11px] font-mono text-mist tracking-widest">
          <span>SESSION 0X4F2A</span>
          <span>PATIENT UNIT R-07</span>
          <span className="text-signal">{clock} UTC</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* hero */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-signalDim tracking-[0.3em] mb-2">
              // LIVE GLOVE CHANNEL — SIMULATED FEED, PNEUNET ACTUATOR MODEL
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-bone tracking-wide">
              Hand mobility, mapped and mirrored in real time.
            </h1>
          </div>

          {/* mode tabs */}
          <div className="flex border border-panelBorder rounded-sm overflow-hidden self-start">
            {(["mirror", "exercise"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-[11px] font-mono tracking-widest transition-colors ${
                  mode === m ? "bg-signal/15 text-signal" : "text-mist hover:text-bone"
                }`}
              >
                {m === "mirror" ? "MIRROR THERAPY MODE" : "EXERCISE MODE"}
              </button>
            ))}
          </div>
        </div>

        {mode === "mirror" ? (
          <>
            <MirrorTherapyPanel latest={latest} />
            <div className="mt-5">
              <SensorPanel history={history} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="panel clip-corner p-6 flex flex-col items-center justify-center lg:col-span-1">
              <div className="text-[10px] font-mono text-mist tracking-widest self-start mb-2">
                AFFECTED HAND — LIVE ARTICULATION
              </div>
              <Hand3D values={latest} height={260} accent="#00E5FF" />
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 self-start text-[10px] font-mono text-mist">
                <span>◆ &gt;70% RANGE</span>
                <span className="text-vital">NORMAL</span>
                <span>◆ 35–70% RANGE</span>
                <span className="text-signal">MONITOR</span>
                <span>◆ &lt;35% RANGE</span>
                <span className="text-warn">RESTRICTED</span>
              </div>
            </div>

            <div className="lg:col-span-1">
              <SensorPanel history={history} />
            </div>

            <div className="lg:col-span-1">
              <RecommendationPanel rec={rec} />
            </div>

            <div className="lg:col-span-3">
              <ExerciseDemo exercise={rec.exercise} />
            </div>
          </div>
        )}

        <footer className="mt-10 pb-6 text-center text-[10px] font-mono text-mist/60 tracking-widest">
          SENSOR DATA IS SIMULATED FOR DEMONSTRATION · NOT A DIAGNOSTIC OR MEDICAL DEVICE
        </footer>
      </main>
    </div>
  );
}
