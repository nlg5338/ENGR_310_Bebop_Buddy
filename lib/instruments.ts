// Instruments in the Solo studio, in display order. Shared by the page and the server.
//
// Solos are written and played at concert pitch. `transpose` is how many half steps
// the sheet music is shifted so each player reads it in their instrument's key
// (e.g. a B♭ trumpet reads a whole step higher than it sounds). Guitar and bass
// guitar sound an octave below where they're written, so they shift up 12.

export type Instrument = {
  label: string;
  key: "C" | "B♭" | "E♭" | "F";
  clef: "treble" | "bass" | "perc";
  transpose: number; // half steps from concert pitch to written pitch
  range: string; // comfortable solo range, in concert (sounding) pitch
  program: number; // General MIDI sound for playback
};

export const INSTRUMENTS = {
  flute: { label: "Flute", key: "C", clef: "treble", transpose: 0, range: "D4 to G6", program: 73 },
  clarinet: { label: "Clarinet", key: "B♭", clef: "treble", transpose: 2, range: "F3 to B♭5", program: 71 },
  "soprano-sax": { label: "Soprano Saxophone", key: "B♭", clef: "treble", transpose: 2, range: "A♭3 to C6", program: 64 },
  "alto-sax": { label: "Alto Saxophone", key: "E♭", clef: "treble", transpose: 9, range: "E♭3 to G5", program: 65 },
  "tenor-sax": { label: "Tenor Saxophone", key: "B♭", clef: "treble", transpose: 14, range: "B♭2 to D5", program: 66 },
  "bari-sax": { label: "Baritone Saxophone", key: "E♭", clef: "treble", transpose: 21, range: "E♭2 to G4", program: 67 },
  "f-horn": { label: "F Horn", key: "F", clef: "treble", transpose: 7, range: "F3 to C5", program: 60 },
  trumpet: { label: "Trumpet", key: "B♭", clef: "treble", transpose: 2, range: "B♭3 to G5", program: 56 },
  trombone: { label: "Trombone", key: "C", clef: "bass", transpose: 0, range: "F2 to B♭4", program: 57 },
  baritone: { label: "Baritone", key: "C", clef: "bass", transpose: 0, range: "F2 to B♭4", program: 57 },
  tuba: { label: "Tuba", key: "C", clef: "bass", transpose: 0, range: "B♭1 to B♭3", program: 58 },
  "bass-guitar": { label: "Bass Guitar", key: "C", clef: "bass", transpose: 12, range: "E1 to G3", program: 33 },
  guitar: { label: "Guitar", key: "C", clef: "treble", transpose: 12, range: "A2 to E5", program: 26 },
  piano: { label: "Piano", key: "C", clef: "treble", transpose: 0, range: "C4 to C6", program: 0 },
  drums: { label: "Drum Set", key: "C", clef: "perc", transpose: 0, range: "", program: 0 },
} as const satisfies Record<string, Instrument>;

export type InstrumentId = keyof typeof INSTRUMENTS;

export const DEFAULT_INSTRUMENT: InstrumentId = "alto-sax";

export function isInstrument(id: unknown): id is InstrumentId {
  return typeof id === "string" && id in INSTRUMENTS;
}

// Drum set notation: where each drum sits on the staff (ABC note), its sound, and note head.
export const DRUM_KIT = [
  { note: "F", name: "kick drum", sound: "acoustic-bass-drum", head: "" },
  { note: "c", name: "snare", sound: "acoustic-snare", head: "" },
  { note: "e", name: "high tom", sound: "high-tom", head: "" },
  { note: "d", name: "mid tom", sound: "low-mid-tom", head: "" },
  { note: "A", name: "floor tom", sound: "high-floor-tom", head: "" },
  { note: "^g", name: "closed hi-hat", sound: "closed-hi-hat", head: "x" },
  { note: "D", name: "hi-hat with foot (pedal)", sound: "pedal-hi-hat", head: "x" },
  { note: "^f", name: "ride cymbal", sound: "ride-cymbal-1", head: "x" },
  { note: "^a", name: "crash cymbal", sound: "crash-cymbal-1", head: "x" },
] as const;
