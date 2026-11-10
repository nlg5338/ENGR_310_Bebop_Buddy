import abcjs from "abcjs";

// In ABC, notes written without a space between them are beamed together.
// Claude separates every note with spaces, which draws each eighth note with its
// own flag. This re-spaces the music so eighth notes are beamed in two-beat groups
// (beats 1–2 and 3–4), the usual way 4/4 jazz is written, with 4 bars per line.

const GROUP = 0.5; // a beam group is half a 4/4 bar (two beats), in whole notes
const BARS_PER_LINE = 4;

type Element = {
  el_type: string;
  startChar: number;
  endChar: number;
  duration?: number;
  startTriplet?: number;
  tripletMultiplier?: number;
};

export function beamEighthNotes(abc: string): string {
  const tune = abcjs.parseOnly(abc)[0];
  const elements = tune.lines.flatMap(
    (line) => (line.staff?.[0]?.voices?.[0] ?? []) as unknown as Element[],
  );
  if (elements.length === 0) return abc;

  let out = "";
  let time = 0; // position in the current bar, in whole notes
  let bars = 0;
  let tripletLeft = 0;
  let tripletMultiplier = 1;

  for (const el of elements) {
    const text = abc.slice(el.startChar, el.endChar).trim();

    if (el.el_type === "bar") {
      bars++;
      time = 0;
      out += ` ${text}`;
      if (bars % BARS_PER_LINE === 0 && !text.endsWith("]")) out += "\n";
      continue;
    }

    if (el.el_type === "note") {
      // Start a new beam group at the start of the bar and on beat 3.
      const startsGroup = time < 1e-6 || Math.abs(time - GROUP) < 1e-6;
      if (startsGroup && out && !out.endsWith("\n")) out += " ";
      out += text;

      if (el.startTriplet) {
        tripletLeft = el.startTriplet;
        tripletMultiplier = el.tripletMultiplier ?? 1;
      }
      time += (el.duration ?? 0) * (tripletLeft > 0 ? tripletMultiplier : 1);
      if (tripletLeft > 0) tripletLeft--;
      continue;
    }

    out += ` ${text} `;
  }

  const first = elements[0].startChar;
  const last = elements[elements.length - 1].endChar;
  return abc.slice(0, first) + out.trim().replace(/\n /g, "\n") + abc.slice(last);
}
