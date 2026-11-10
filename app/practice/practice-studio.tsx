"use client";

import "abcjs/abcjs-audio.css";
import { useEffect, useRef, useState } from "react";
import type { Analysis } from "@/lib/music";

type Solo = { abc: string; explanation: string; practice_tips: string[] };

const PRESETS = [
  { label: "ii–V–I in C", chords: "Dm7 | G7 | Cmaj7 | Cmaj7" },
  { label: "Minor ii–V–i in A", chords: "Bm7b5 | E7b9 | Am6 | Am6" },
  { label: "Jazz blues in F", chords: "F7 | Bb7 | F7 | Cm7 F7 | Bb7 | Bb7 | F7 | Am7 D7 | Gm7 | C7 | F7 D7 | Gm7 C7" },
  { label: "Turnaround in Bb", chords: "Bbmaj7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7" },
];

const INSTRUMENT_OPTIONS = [
  { value: "sax", label: "Saxophone", program: 65 },
  { value: "trumpet", label: "Trumpet", program: 56 },
  { value: "piano", label: "Piano", program: 0 },
  { value: "guitar", label: "Guitar", program: 26 },
  { value: "flute", label: "Flute", program: 73 },
  { value: "trombone", label: "Trombone", program: 57 },
  { value: "bass", label: "Bass", program: 32 },
];

export function PracticeStudio() {
  const [progression, setProgression] = useState(PRESETS[0].chords);
  const [instrument, setInstrument] = useState("sax");
  const [level, setLevel] = useState("beginner");
  const [tempo, setTempo] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [solo, setSolo] = useState<Solo | null>(null);
  // undefined = not loaded yet, null = unlimited (Pro)
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);

  const sheetRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Show how many free solos are left today.
  useEffect(() => {
    fetch("/api/solo")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setRemaining(data.remaining ?? null))
      .catch(() => {});
  }, []);

  // Draw the sheet music and set up playback whenever a new solo arrives.
  useEffect(() => {
    if (!solo || !sheetRef.current || !playerRef.current) return;
    let cancelled = false;
    const program = INSTRUMENT_OPTIONS.find((i) => i.value === instrument)?.program ?? 0;

    (async () => {
      const abcjs = (await import("abcjs")).default;
      if (cancelled || !sheetRef.current || !playerRef.current) return;

      const [visualObj] = abcjs.renderAbc(sheetRef.current, solo.abc, {
        responsive: "resize",
        add_classes: true,
        paddingtop: 0,
      });

      if (!abcjs.synth.supportsAudio()) {
        playerRef.current.textContent = "Audio playback isn't supported in this browser.";
        return;
      }

      // Highlight each note as it plays.
      const sheet = sheetRef.current;
      const cursor = {
        onEvent(event: { elements?: HTMLElement[][] }) {
          sheet.querySelectorAll(".playing").forEach((el) => el.classList.remove("playing"));
          event.elements?.flat().forEach((el) => el.classList.add("playing"));
        },
        onFinished() {
          sheet.querySelectorAll(".playing").forEach((el) => el.classList.remove("playing"));
        },
      };

      const controller = new abcjs.synth.SynthController();
      controller.load(playerRef.current, cursor, {
        displayPlay: true,
        displayProgress: true,
        displayLoop: true,
        displayWarp: true,
      });
      // The chord symbols in the solo also play as a piano-and-bass accompaniment.
      await controller.setTune(visualObj, false, { program, chordprog: 0, bassprog: 32 });
    })();

    return () => {
      cancelled = true;
    };
  }, [solo, instrument]);

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSolo(null);

    try {
      const res = await fetch("/api/solo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progression, instrument, level, tempo }),
      });
      const data = await res.json();
      if (data.analysis) setAnalysis(data.analysis);
      if ("remaining" in data) setRemaining(data.remaining);
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (res.status === 429) setRemaining(0);
        return;
      }
      setSolo(data.solo);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="studio">
      <form className="card studio-form" onSubmit={handleGenerate}>
        <label className="field">
          <span>Chord progression</span>
          <input
            value={progression}
            onChange={(e) => setProgression(e.target.value)}
            placeholder="Dm7 | G7 | Cmaj7 | Cmaj7"
            required
          />
        </label>
        <p className="hint">Separate bars with |. Up to 2 chords per bar and 16 bars.</p>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip" onClick={() => setProgression(p.chords)}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="studio-options">
          <label className="field">
            <span>Instrument</span>
            <select value={instrument} onChange={(e) => setInstrument(e.target.value)}>
              {INSTRUMENT_OPTIONS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="field">
            <span>Tempo: {tempo} BPM</span>
            <input type="range" min={60} max={240} step={5} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || remaining === 0}>
          {loading ? "Buddy is writing your solo…" : "Generate solo"}
        </button>
        {remaining === null && <p className="hint">⭐ Pro: unlimited solos.</p>}
        {typeof remaining === "number" && (
          <p className="hint">
            {remaining > 0 ? `${remaining} free solo${remaining === 1 ? "" : "s"} left today. ` : "No free solos left today. "}
            <a href="/dashboard">Go Pro</a> for unlimited solos.
          </p>
        )}
        {error && <div className="form-error">{error}</div>}
      </form>

      {analysis && (
        <section className="card">
          <h2 className="studio-heading">What to play</h2>
          <div className="analysis-table">
            <div className="analysis-row analysis-head">
              <span>Bar</span><span>Chord</span><span>Scale</span><span>Guide tones</span>
            </div>
            {analysis.bars.flatMap((bar, i) =>
              bar.map((c, j) => (
                <div className="analysis-row" key={`${i}-${j}`}>
                  <span>{j === 0 ? i + 1 : ""}</span>
                  <strong>{c.symbol}</strong>
                  <span>{c.scale}<small>{c.scaleNotes.join(" ")}</small></span>
                  <span className="tone">{c.guideTones.join(" · ")}</span>
                </div>
              )),
            )}
          </div>
        </section>
      )}

      {loading && <div className="card loading-card">🎷 Writing an original solo and checking every bar…</div>}

      {solo && (
        <section className="card">
          <h2 className="studio-heading">Your solo</h2>
          <div ref={sheetRef} className="sheet" />
          <div ref={playerRef} className="player" />
          <p className="solo-explanation">{solo.explanation}</p>
          <h3 className="tips-heading">Practice tips</h3>
          <ul className="tips">
            {solo.practice_tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
