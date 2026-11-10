import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import abcjs from "abcjs";
import { z } from "zod";
import { DRUM_KIT, INSTRUMENTS, type InstrumentId } from "./instruments";
import type { Analysis } from "./music";

// Change this one line to switch models (e.g. "claude-sonnet-5-5" to halve the cost).
export const SOLO_MODEL = "claude-opus-5-5";

export const LEVELS = {
  beginner: "Mostly quarter and eighth notes, mostly chord tones, land on guide tones (3rds and 7ths) on beat 1, leave space with rests.",
  intermediate: "Mostly eighth notes, add chromatic approach notes and passing tones, connect guide tones smoothly between chords.",
  advanced: "Flowing bebop eighth-note lines with enclosures, chromatic passing tones, an occasional triplet, and phrases that cross bar lines.",
} as const;

const DRUM_LEVELS: Record<Level, string> = {
  beginner: "Keep a steady swing ride pattern with hi-hat (foot) on 2 and 4, and add simple snare and kick answers. Use quarter and eighth notes, with one short fill at the end.",
  intermediate: "Mix time-keeping with short fills on snare and toms, place kick and snare accents to mark where the chords change, and use an occasional triplet.",
  advanced: "A melodic solo that moves around the kit: phrases that cross bar lines, triplet fills across the toms, syncopated kick and snare figures, and a crash to mark the top of the form.",
};

export type Level = keyof typeof LEVELS;

const SoloSchema = z.object({
  abc_body: z
    .string()
    .describe("Only the ABC note lines (no X:, M:, L:, K: header lines). One bar per chord bar, separated by |, ending with |]."),
  explanation: z.string().describe("2–4 sentences on what the solo does over these changes."),
  practice_tips: z.array(z.string()).describe("2–3 short, specific practice tips for this solo."),
});

export type Solo = z.infer<typeof SoloSchema> & { abc: string };

const SYSTEM_PROMPT = `You are Bebop Buddy, a friendly jazz improvisation teacher. You write short original example solos for students and explain them in plain, encouraging language.

Write the solo in ABC notation with these fixed settings, which the app adds as the header: M:4/4, L:1/8 (so a plain note is an eighth note, "2" is a quarter, "4" is a half, "8" is a whole), K:C (no key signature: write every sharp or flat with ^ or _ and use = for naturals; accidentals last until the end of the bar).

Rules for the ABC:
- Exactly one bar of music per bar of chords, in order, and every bar must add up to exactly 4 beats (8 eighth-note units). Count carefully. A triplet (3abc takes the time of 2 eighth notes.
- Put each chord symbol in double quotes right before the first note of the beat where that chord starts, e.g. "Dm7"d2 f2 "G7"B2 d2.
- Use only notes, rests (z), ties (-), triplets, and bar lines. No slurs, ornaments, grace notes, or lyrics.
- Separate bars with | and end the final bar with |].
- Write the music as original material. Never quote a melody from an existing song.

In the explanation and tips, refer to the specific chords and notes in this progression.

Always write pitches at concert pitch (how they sound), in the octave the instrument plays. The app transposes the sheet music for B♭, E♭, and F instruments, so never transpose it yourself.

For drum set, write a drum solo instead of a melody: use only the drum notes you're given (several can sound together, like [F^f]2), keep the same bar and chord-symbol rules so the drummer can follow the form, and explain the solo in terms of the form and the drums, not scales.`;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

function buildPrompt(analysis: Analysis, instrument: InstrumentId, level: Level): string {
  if (instrument === "drums") {
    const form = analysis.bars
      .map((bar, i) => `Bar ${i + 1}: ${bar.map((c) => c.symbol).join(" then ")}`)
      .join("\n");
    const kit = DRUM_KIT.map((d) => `${d.note} = ${d.name}`).join(", ");
    return `Write a ${analysis.bars.length}-bar example drum set solo over this form at ${level} level, in a medium swing feel.

Drum notes to use (and no others): ${kit}.

Level guidance: ${DRUM_LEVELS[level]}

The form (put each chord symbol where it starts, like a lead sheet):
${form}`;
  }

  const bars = analysis.bars
    .map((bar, i) => {
      const chords = bar
        .map((c) => `${c.symbol} (scale: ${c.scale} = ${c.scaleNotes.join(" ")}; chord tones: ${c.chordTones.join(" ")}; guide tones: ${c.guideTones.join(" ")})`)
        .join(" then ");
      return `Bar ${i + 1}: ${chords}${bar.length > 1 ? " (each chord gets 2 beats)" : ""}`;
    })
    .join("\n");

  const inst = INSTRUMENTS[instrument];
  return `Write a ${analysis.bars.length}-bar example solo for ${inst.label} at ${level} level. Keep it within ${inst.range} (concert pitch, ABC octave: C = middle C, c = the C above, C, = the C below).

Level guidance: ${LEVELS[level]}

The progression, with the correct theory for each chord (use these notes):
${bars}`;
}

/** Adds up each bar's length; returns a problem description, or null if the ABC is valid. */
export function checkAbc(abc: string, expectedBars: number): string | null {
  const tune = abcjs.parseOnly(abc)[0];
  if (tune.warnings?.length) return `ABC syntax problem: ${tune.warnings[0].replace(/<[^>]+>/g, "")}`;

  const barLengths: number[] = [];
  let current = 0;
  let tripletLeft = 0;
  let tripletMultiplier = 1;

  for (const line of tune.lines) {
    for (const el of line.staff?.[0]?.voices?.[0] ?? []) {
      if (el.el_type === "bar") {
        if (current > 0) barLengths.push(current);
        current = 0;
      } else if (el.el_type === "note" && el.duration) {
        // abcjs sets these on the first note of a triplet, but its typings omit them.
        const triplet = el as { startTriplet?: number; tripletMultiplier?: number };
        if (triplet.startTriplet) {
          tripletLeft = triplet.startTriplet;
          tripletMultiplier = triplet.tripletMultiplier ?? 1;
        }
        current += el.duration * (tripletLeft > 0 ? tripletMultiplier : 1);
        if (tripletLeft > 0) tripletLeft--;
      }
    }
  }
  if (current > 0) barLengths.push(current);

  if (barLengths.length !== expectedBars) {
    return `Expected ${expectedBars} bars but found ${barLengths.length}.`;
  }
  const wrong = barLengths.findIndex((len) => Math.abs(len - 1) > 0.001);
  if (wrong >= 0) {
    return `Bar ${wrong + 1} adds up to ${barLengths[wrong] * 8} eighth notes instead of 8.`;
  }
  return null;
}

function toAbc(body: string, instrument: InstrumentId, tempo: number): string {
  const { clef, label } = INSTRUMENTS[instrument];
  // Drums: tell abcjs which drum sound (and x note head for cymbals) each staff position means.
  const drumMap =
    clef === "perc"
      ? DRUM_KIT.map((d) => `%%percmap ${d.note} ${d.sound}${d.head ? ` ${d.head}` : ""}\n`).join("")
      : "";
  const clefParam = clef === "treble" ? "" : ` clef=${clef}`;
  return `X:1\nT:Bebop Buddy solo\nC:${label}\nM:4/4\nL:1/8\nQ:1/4=${tempo}\n${drumMap}K:C${clefParam}\n${body.trim()}\n`;
}

/** Asks Claude for a solo, checks it, and retries once with the problem if it's invalid. */
export async function generateSolo(
  analysis: Analysis,
  instrument: InstrumentId,
  level: Level,
  tempo: number,
): Promise<Solo> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: buildPrompt(analysis, instrument, level) },
  ];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await getClient().beta.messages.parse({
      model: SOLO_MODEL,
      max_tokens: 16000,
      // If a safety check ever declines, retry on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(SoloSchema) },
      system: SYSTEM_PROMPT,
      messages,
    });

    if (response.stop_reason === "refusal") {
      throw new Error("The AI declined to write this solo. Try a different progression.");
    }
    const parsed = response.parsed_output;
    if (!parsed) throw new Error("The AI's answer couldn't be read. Please try again.");

    const abc = toAbc(parsed.abc_body, instrument, tempo);
    const problem = checkAbc(abc, analysis.bars.length);
    if (!problem) return { ...parsed, abc };

    // Show Claude what was wrong and let it fix the solo once.
    messages.push(
      { role: "assistant", content: response.content },
      { role: "user", content: `That solo has a problem: ${problem} Please fix it and send the full corrected solo.` },
    );
  }

  throw new Error("The AI wrote a solo with rhythm mistakes twice. Please try again.");
}
