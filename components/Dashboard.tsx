"use client";

import { useEffect, useState } from "react";
import { useSensorStream } from "@/lib/sensorSimulator";
import { recommend } from "@/lib/recommendationEngine";
import {
  SessionSnapshot,
  loadSessionHistory,
  saveSessionSnapshot,
  clearSessionHistory,
  summarizeReadings,
  seedDemoHistoryIfEmpty,
} from "@/lib/sessionHistory";
import Hand3D from "./Hand3D";
import SensorPanel from "./SensorPanel";
import RecommendationPanel from "./RecommendationPanel";
import ExerciseDemo from "./ExerciseDemo";
import MirrorTherapyPanel from "./MirrorTherapyPanel";
import HistoryPanel from "./HistoryPanel";
import PatientSummary from "./PatientSummary";

type Mode = "mirror" | "exercise";
type Audience = "clinician" | "patient";

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
  const [audience, setAudience] = useState<Audience>("clinician");
  const [sessionHistory, setSessionHistory] = useState<SessionSnapshot[]>([]);

  // seed a plausible past-sessions trend on first load so charts aren't
  // empty for a demo/presentation, then load whatever is in this browser
  useEffect(() => {
    seedDemoHistoryIfEmpty();
    setSessionHistory(loadSessionHistory());
  }, []);

  function handleLogSession() {
    const snapshot = summarizeReadings(history, rec.exercise.id);
    const next = saveSessionSnapshot(snapshot);
    if (next) setSessionHistory(next);
  }

  function handleClearHistory() {
    clearSessionHistory();
    setSessionHistory([]);
  }

  return (
    <div className="min-h-screen bg-scanlines">
      {/* top bar */}
      <header className="border-b border-panelBorder bg-panel/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm border border-signal/40 flex items-center justify-center">
            <div className="h-2 w-2 bg-signal rounded-full shadow-glow animate-flicker" />
          </div>
          <div>
            <div className="font-display text-base tracking-[0.2em] text-bone">NEUROFLEX</div>
            <div className="text-[17px] font-mono text-mist tracking-normal">REHAB TELEMETRY CONSOLE — DEMO BUILD</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* audience toggle — same data, different level of detail/language */}
          <div className="flex border border-panelBorder rounded-sm overflow-hidden">
            {(["clinician", "patient"] as Audience[]).map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`px-3 py-1.5 text-[17px] font-mono tracking-normal transition-colors ${
                  audience === a ? "bg-signal/10 text-signal" : "text-mist hover:text-bone"
                }`}
              >
                {a === "clinician" ? "CLINICIAN VIEW" : "PATIENT VIEW"}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[14px] font-mono text-mist tracking-normal">
            <span>SESSION 0X4F2A</span>
            <span>PATIENT UNIT R-07</span>
            <span className="text-signal">{clock} UTC</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* hero */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[14px] font-mono text-signalDim tracking-[0.1em] mb-2">
              {audience === "clinician"
                ? "// LIVE GLOVE CHANNEL — SIMULATED FEED, PNEUNET ACTUATOR MODEL"
                : "Your hand movement, tracked live"}
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-bone tracking-wide">
              {audience === "clinician"
                ? "Hand mobility, mapped and mirrored in real time."
                : "See how your hand is moving, session by session."}
            </h1>
          </div>

          {/* mode tabs */}
          <div className="flex border border-panelBorder rounded-sm overflow-hidden self-start">
            {(["mirror", "exercise"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-[14px] font-mono tracking-normal transition-colors ${
                  mode === m ? "bg-signal/15 text-signal" : "text-mist hover:text-bone"
                }`}
              >
                {m === "mirror" ? "MIRROR THERAPY MODE" : "EXERCISE MODE"}
              </button>
            ))}
          </div>
        </div>

        {audience === "patient" ? (
          // patient view: plain language, big encouraging numbers, one chart.
          // still backed by the same live + logged session data as the clinician view.
          <div className="mb-5">
            <PatientSummary latest={latest} history={sessionHistory} rec={rec} />
          </div>
        ) : mode === "mirror" ? (
          <>
            <MirrorTherapyPanel latest={latest} />
            <div className="mt-5">
              <SensorPanel history={history} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="panel clip-corner p-6 flex flex-col items-center justify-center lg:col-span-1">
              <div className="text-[17px] font-mono text-mist tracking-normal self-start mb-2">
                AFFECTED HAND — LIVE ARTICULATION
              </div>
              <Hand3D values={latest} height={260} accent="#1F4E6B" />
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 self-start text-[17px] font-mono text-mist">
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

        {/* historic trend data — visible to both audiences, but framed for
            clinicians (per-finger breakdown, deltas, log/clear controls);
            patients get the simplified version inside PatientSummary above */}
        {audience === "clinician" && (
          <div className="mt-5">
            <HistoryPanel history={sessionHistory} onLogSession={handleLogSession} onClear={handleClearHistory} />
          </div>
        )}

        <footer className="mt-10 pb-6 text-center text-[17px] font-mono text-mist/60 tracking-normal">
          SENSOR DATA IS SIMULATED FOR DEMONSTRATION · NOT A DIAGNOSTIC OR MEDICAL DEVICE
        </footer>
      </main>
    </div>
  );
}