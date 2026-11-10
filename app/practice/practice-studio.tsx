"use client";

import "abcjs/abcjs-audio.css";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_INSTRUMENT,
  INSTRUMENTS,
  isInstrument,
  type InstrumentId,
} from "@/lib/instruments";
import { transposeAnalysis, type Analysis } from "@/lib/music";
import { MAX_SUGGESTIONS, SUGGESTIONS, suggestionsFor, type Suggestion, type SuggestionId } from "@/lib/suggestions";

// `instrument` is the one the solo was written for, so changing the dropdown
// afterwards doesn't re-transpose an existing solo.
type Solo = { abc: string; explanation: string; practice_tips: string[]; instrument: InstrumentId };

const PRESETS = [
  { label: "ii–V–I in C", chords: "Dm7 | G7 | Cmaj7 | Cmaj7" },
  { label: "Minor ii–V–i in A", chords: "Bm7b5 | E7b9 | Am6 | Am6" },
  { label: "Jazz blues in F", chords: "F7 | Bb7 | F7 | Cm7 F7 | Bb7 | Bb7 | F7 | Am7 D7 | Gm7 | C7 | F7 D7 | Gm7 C7" },
  { label: "Turnaround in Bb", chords: "Bbmaj7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7" },
];

export function PracticeStudio() {
  const [progression, setProgression] = useState(PRESETS[0].chords);
  const [instrument, setInstrument] = useState<InstrumentId>(DEFAULT_INSTRUMENT);
  const [level, setLevel] = useState("beginner");
  const [tempo, setTempo] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<{ analysis: Analysis; instrument: InstrumentId } | null>(null);
  const [solo, setSolo] = useState<Solo | null>(null);
  // undefined = not loaded yet, null = unlimited (Pro)
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);
  const [picked, setPicked] = useState<SuggestionId[]>([]);

  // Only the suggestions that fit the chosen instrument (melody or drums) count.
  const available = suggestionsFor(instrument === "drums");
  const activeSuggestions = picked.filter((id) => available.includes(id));

  function toggleSuggestion(id: SuggestionId) {
    setPicked((current) => {
      const active = current.filter((p) => available.includes(p));
      if (active.includes(id)) return active.filter((p) => p !== id);
      // Picking one removes any that contradict it (e.g. "More space" vs "Busier lines").
      const suggestion: Suggestion = SUGGESTIONS[id];
      const conflicts = suggestion.conflicts ?? [];
      const kept = active.filter((p) => !conflicts.includes(p));
      return kept.length >= MAX_SUGGESTIONS ? kept : [...kept, id];
    });
  }

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
    const { program, transpose } = INSTRUMENTS[solo.instrument];

    (async () => {
      const abcjs = (await import("abcjs")).default;
      if (cancelled || !sheetRef.current || !playerRef.current) return;

      // visualTranspose shows the part in the instrument's key; playback still
      // sounds at concert pitch so it matches the chords.
      const [visualObj] = abcjs.renderAbc(sheetRef.current, solo.abc, {
        responsive: "resize",
        add_classes: true,
        paddingtop: 0,
        visualTranspose: transpose,
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
  }, [solo]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    generate();
  }

  async function generate() {
    setLoading(true);
    setError("");
    setSolo(null);

    try {
      const res = await fetch("/api/solo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progression, instrument, level, tempo, suggestions: activeSuggestions }),
      });
      const data = await res.json();
      if (data.analysis) setAnalysis({ analysis: data.analysis, instrument });
      if ("remaining" in data) setRemaining(data.remaining);
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (res.status === 429) setRemaining(0);
        return;
      }
      setSolo({ ...data.solo, instrument });
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="studio">
      <form className="card studio-form" onSubmit={handleSubmit}>
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
            <select value={instrument} onChange={(e) => isInstrument(e.target.value) && setInstrument(e.target.value)}>
              {(Object.keys(INSTRUMENTS) as InstrumentId[]).map((id) => (
                <option key={id} value={id}>{INSTRUMENTS[id].label}</option>
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

        <SuggestionChips available={available} active={activeSuggestions} onToggle={toggleSuggestion} />

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

      {analysis && analysis.instrument !== "drums" && (
        <section className="card">
          <h2 className="studio-heading">What to play</h2>
          {INSTRUMENTS[analysis.instrument].transpose % 12 !== 0 && (
            <p className="hint transpose-note">
              Shown in {INSTRUMENTS[analysis.instrument].key} for {INSTRUMENTS[analysis.instrument].label}, to match your
              part. Buddy&apos;s explanation below uses concert pitch.
            </p>
          )}
          <div className="analysis-table">
            <div className="analysis-row analysis-head">
              <span>Bar</span><span>Chord</span><span>Scale</span><span>Guide tones</span>
            </div>
            {transposeAnalysis(analysis.analysis, INSTRUMENTS[analysis.instrument].transpose).bars.flatMap((bar, i) =>
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

          <div className="adjust">
            <h3 className="tips-heading">Not quite right? Adjust it</h3>
            <SuggestionChips available={available} active={activeSuggestions} onToggle={toggleSuggestion} />
            <button type="button" className="btn btn-primary" onClick={generate} disabled={loading || remaining === 0}>
              {activeSuggestions.length ? "Write a new solo with these changes" : "Write a new solo"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/** The clickable suggestion buttons ("Use more space", "Less scales", ...). */
function SuggestionChips({ available, active, onToggle }: {
  available: SuggestionId[];
  active: SuggestionId[];
  onToggle: (id: SuggestionId) => void;
}) {
  return (
    <div className="suggestions">
      <p className="hint">
        Suggestions (optional): pick up to {MAX_SUGGESTIONS} to shape the next solo.
      </p>
      <div className="presets">
        {available.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip${active.includes(id) ? " chip-on" : ""}`}
            aria-pressed={active.includes(id)}
            onClick={() => onToggle(id)}
          >
            {active.includes(id) ? "✓ " : ""}
            {SUGGESTIONS[id].label}
          </button>
        ))}
      </div>
    </div>
  );
}
