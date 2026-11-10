// Clickable suggestions in the Solo studio. The page sends only the ids; the server
// turns them into instructions for the AI, so users can't send arbitrary prompts.

export type Suggestion = {
  label: string;
  instruction: string;
  for: "melody" | "drums";
  conflicts?: string[]; // ids that can't be picked together with this one
};

export const SUGGESTIONS = {
  "more-space": {
    label: "Use more space",
    instruction: "Leave more space: rest for a beat or two in most bars, so the phrases can breathe.",
    for: "melody",
    conflicts: ["busier"],
  },
  "fewer-scales": {
    label: "Less scales",
    instruction: "Avoid running up and down scales. Use arpeggios, interval leaps, and short melodic ideas instead.",
    for: "melody",
  },
  "simpler-rhythm": {
    label: "Simpler rhythms",
    instruction: "Keep the rhythms simple: mostly quarter and eighth notes on the beat, no triplets.",
    for: "melody",
    conflicts: ["more-rhythm", "triplets"],
  },
  "more-rhythm": {
    label: "More rhythmic variety",
    instruction: "Vary the rhythm: syncopation, anticipations of the next chord, and phrases that start on off-beats.",
    for: "melody",
    conflicts: ["simpler-rhythm"],
  },
  motif: {
    label: "Repeat a motif",
    instruction: "Build the solo from one short motif that comes back several times, changed to fit each chord.",
    for: "melody",
  },
  chromatic: {
    label: "More chromatic notes",
    instruction: "Use more chromatic approach notes and enclosures leading into chord tones.",
    for: "melody",
  },
  bluesy: {
    label: "Make it bluesy",
    instruction: "Give it a bluesy sound: blue notes (flat 3 and flat 5), bends implied by grace-like approach notes, and call-and-response phrases.",
    for: "melody",
  },
  "smaller-leaps": {
    label: "Smaller jumps",
    instruction: "Move mostly by step and small skips; avoid leaps bigger than a 4th.",
    for: "melody",
  },
  triplets: {
    label: "Add triplets",
    instruction: "Include a few eighth-note triplets as bebop-style ornaments.",
    for: "melody",
    conflicts: ["simpler-rhythm"],
  },
  busier: {
    label: "Busier lines",
    instruction: "Make the lines busier, with longer runs of eighth notes.",
    for: "melody",
    conflicts: ["more-space"],
  },

  "drums-space": {
    label: "Use more space",
    instruction: "Leave more space: keep time on the ride and hi-hat and play fewer fills.",
    for: "drums",
    conflicts: ["drums-busier"],
  },
  "drums-simpler": {
    label: "Simpler",
    instruction: "Keep it simple: mostly ride, hi-hat foot, snare, and kick, with one short fill.",
    for: "drums",
    conflicts: ["drums-busier", "drums-toms"],
  },
  "drums-toms": {
    label: "More toms",
    instruction: "Use the toms more, with melodic phrases moving around the kit.",
    for: "drums",
    conflicts: ["drums-simpler"],
  },
  "drums-busier": {
    label: "Busier fills",
    instruction: "Play busier fills with triplets and syncopated snare-and-kick figures.",
    for: "drums",
    conflicts: ["drums-space", "drums-simpler"],
  },
  "drums-motif": {
    label: "Repeat a rhythm",
    instruction: "Build the solo from one short rhythm that comes back several times, moved around the kit.",
    for: "drums",
  },
} as const satisfies Record<string, Suggestion>;

export type SuggestionId = keyof typeof SUGGESTIONS;

export const MAX_SUGGESTIONS = 4;

export function suggestionsFor(isDrums: boolean): SuggestionId[] {
  return (Object.keys(SUGGESTIONS) as SuggestionId[]).filter(
    (id) => SUGGESTIONS[id].for === (isDrums ? "drums" : "melody"),
  );
}

/** Keeps only known ids that fit the instrument, up to the limit. */
export function cleanSuggestions(ids: unknown, isDrums: boolean): SuggestionId[] {
  if (!Array.isArray(ids)) return [];
  const allowed = new Set(suggestionsFor(isDrums));
  return [...new Set(ids)].filter((id): id is SuggestionId => allowed.has(id)).slice(0, MAX_SUGGESTIONS);
}
