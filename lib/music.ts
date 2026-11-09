import { Chord, Note, Scale } from "tonal";

export type ChordInfo = {
  symbol: string;
  scale: string; // e.g. "D dorian"
  scaleNotes: string[];
  chordTones: string[];
  guideTones: string[]; // the 3rd and 7th (or 6th)
};

export type Analysis = {
  bars: ChordInfo[][]; // one entry per bar, 1–2 chords each
};

// The scale jazz players usually reach for first, by chord type.
const PREFERRED_SCALE: Record<string, string> = {
  maj7: "major",
  maj9: "major",
  "6": "major",
  "69": "major",
  M: "major",
  m7: "dorian",
  m9: "dorian",
  m11: "dorian",
  m: "dorian",
  "7": "mixolydian",
  "9": "mixolydian",
  "13": "mixolydian",
  "7sus4": "mixolydian",
  "7#11": "lydian dominant",
  "7b9": "half-whole diminished",
  "7#9": "altered",
  "7alt": "altered",
  "7b13": "altered",
  m7b5: "locrian",
  dim7: "diminished",
  dim: "diminished",
  m6: "melodic minor",
  mMaj7: "melodic minor",
};

const simplify = (notes: string[]) => notes.map((n) => Note.simplify(n));

function analyzeChord(symbol: string): ChordInfo | null {
  const chord = Chord.get(symbol);
  if (chord.empty || !chord.tonic) return null;

  const alias = chord.aliases[0] ?? "";
  const scaleName = PREFERRED_SCALE[alias] ?? Chord.chordScales(symbol)[0] ?? "chromatic";
  const scale = Scale.get(`${chord.tonic} ${scaleName}`);

  const toneFor = (degree: string) => {
    const i = chord.intervals.findIndex((iv) => iv.startsWith(degree));
    return i >= 0 ? chord.notes[i] : null;
  };
  const third = toneFor("3");
  const seventh = toneFor("7") ?? toneFor("6");

  return {
    symbol,
    scale: `${chord.tonic} ${scaleName}`,
    scaleNotes: simplify(scale.notes),
    chordTones: simplify(chord.notes),
    guideTones: simplify([third, seventh].filter((n): n is string => n !== null)),
  };
}

/**
 * Parses a progression like "Dm7 | G7 | Cmaj7 | Cmaj7" or "Dm7 G7 | Cmaj7".
 * Returns the analysis, or the chord symbols that couldn't be understood.
 */
export function analyzeProgression(input: string): { analysis: Analysis } | { unknown: string[] } {
  const barTexts = input
    .split("|")
    .map((bar) => bar.trim())
    .filter(Boolean);

  const unknown: string[] = [];
  const bars = barTexts.map((bar) =>
    bar.split(/\s+/).flatMap((symbol) => {
      const info = analyzeChord(symbol);
      if (!info) unknown.push(symbol);
      return info ? [info] : [];
    }),
  );

  if (unknown.length > 0) return { unknown };
  return { analysis: { bars } };
}

/** Rebuilds the progression as text, e.g. "Dm7 | G7 | Cmaj7". */
export function progressionText(analysis: Analysis): string {
  return analysis.bars.map((bar) => bar.map((c) => c.symbol).join(" ")).join(" | ");
}
