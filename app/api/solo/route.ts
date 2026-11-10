import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { recordSolo, solosRemaining } from "@/lib/db";
import { analyzeProgression, progressionText } from "@/lib/music";
import { DEFAULT_INSTRUMENT, isInstrument } from "@/lib/instruments";
import { generateSolo, LEVELS, type Level } from "@/lib/solo";

// Writing and checking a solo can take a while (up to two AI calls).
export const maxDuration = 120;

const MAX_BARS = 16;

/** How many free solos the logged-in user has left today. */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please log in." }, { status: 401 });
  return Response.json({ remaining: await solosRemaining(session.user.id) });
}

/** Analyzes a progression and asks Claude for an example solo over it. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const instrument = isInstrument(body.instrument) ? body.instrument : DEFAULT_INSTRUMENT;
  const level = (body.level in LEVELS ? body.level : "beginner") as Level;
  const tempo = Math.min(240, Math.max(60, Number(body.tempo) || 120));

  const result = analyzeProgression(String(body.progression ?? ""));
  if ("unknown" in result) {
    return Response.json(
      { error: `I don't recognize these chords: ${result.unknown.join(", ")}. Try symbols like Dm7, G7, Cmaj7, F#m7b5.` },
      { status: 400 },
    );
  }
  const { analysis } = result;
  if (analysis.bars.length === 0) {
    return Response.json({ error: "Enter at least one bar of chords." }, { status: 400 });
  }
  if (analysis.bars.length > MAX_BARS || analysis.bars.some((bar) => bar.length > 2)) {
    return Response.json(
      { error: `Use up to ${MAX_BARS} bars, with at most 2 chords per bar.` },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "The AI isn't set up yet (missing ANTHROPIC_API_KEY). Here's the theory for your chords in the meantime.", analysis },
      { status: 503 },
    );
  }

  const remaining = await solosRemaining(session.user.id); // null = unlimited (Pro)
  if (remaining !== null && remaining <= 0) {
    return Response.json(
      { error: "You've used today's free solos. Come back tomorrow, or go Pro for unlimited solos.", analysis },
      { status: 429 },
    );
  }

  try {
    const solo = await generateSolo(analysis, instrument, level, tempo);
    await recordSolo(session.user.id, progressionText(analysis));
    return Response.json({ analysis, solo, remaining: remaining === null ? null : remaining - 1 });
  } catch (error) {
    console.error("Solo generation failed:", error);
    const message =
      error instanceof Anthropic.APIError
        ? "The AI service is busy or unavailable right now. Please try again in a minute."
        : error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    return Response.json({ error: message, analysis }, { status: 502 });
  }
}
