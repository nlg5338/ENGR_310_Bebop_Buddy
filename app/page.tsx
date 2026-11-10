import Link from "next/link";
import { SessionLink } from "./session-link";

const DASHBOARD = { href: "/dashboard", label: "Dashboard" };
const STUDIO = { href: "/practice", label: "Open the solo studio" };

export default function Home() {
  return (
    <>
      {/* Nav */}
      <header className="nav">
        <div className="container">
          <Link href="/" className="logo">
            Bebop <span>Buddy</span>
          </Link>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#who">Who it&apos;s for</a>
            <a href="#pricing">Pricing</a>
            <SessionLink
              loggedIn={DASHBOARD}
              loggedOut={{ href: "/login", label: "Log in" }}
              className="btn btn-ghost"
            />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div>
            <span className="eyebrow">Learn jazz improvisation</span>
            <h1>Bebop Buddy</h1>
            <p className="tagline">Your AI jazz partner</p>
            <p className="hero-text">
              Type in any chord progression and Bebop Buddy shows you which notes to play,
              writes example solos you can see and hear, plays a backing track to jam over,
              and walks you through lessons from your first chord tones to real bebop lines.
            </p>
            <div className="hero-actions">
              <SessionLink
                loggedIn={STUDIO}
                loggedOut={{ href: "/signup", label: "Start practicing free" }}
                className="btn btn-primary"
              />
              <a href="#how" className="btn btn-ghost">
                See how it works
              </a>
            </div>
            <p className="hero-note">No credit card needed for the free plan.</p>
          </div>

          <div className="demo" aria-label="Example of Bebop Buddy analyzing a ii-V-I progression">
            <div className="demo-label">Your progression</div>
            <div className="chords">
              <div className="chord"><strong>Dm7</strong><small>ii</small></div>
              <div className="chord"><strong>G7</strong><small>V</small></div>
              <div className="chord"><strong>Cmaj7</strong><small>I</small></div>
            </div>
            <div className="demo-label">Guide tones to target</div>
            <div className="guide-tones">
              <span className="tone">Dm7: F · C</span>
              <span className="tone">G7: B · F</span>
              <span className="tone">Cmaj7: E · B</span>
            </div>
            <div className="buddy-says">
              <b>🎷 Buddy says:</b>
              This is a ii–V–I, the most common move in jazz. Try landing on the
              3rd of each chord (F, B, then E) on beat one. Hear how the line resolves?
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="problem">
        <div className="container">
          <div className="section-head">
            <h2>Improvising is the hardest part of learning jazz</h2>
            <p>You can read the chords. Then the solo section comes and you freeze. Sound familiar?</p>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <div className="icon">🤔</div>
              <h3>&quot;What notes do I even play?&quot;</h3>
              <p>Theory books explain scales, but not how to use them over the song you&apos;re actually learning.</p>
            </div>
            <div className="card">
              <div className="icon">🎧</div>
              <h3>No one to practice with</h3>
              <p>Improvising alone in silence doesn&apos;t feel like music. You need a band behind you.</p>
            </div>
            <div className="card">
              <div className="icon">💸</div>
              <h3>Lessons are expensive</h3>
              <p>A private jazz teacher can cost $50 or more an hour, and you can&apos;t take them home to practice with.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works / features */}
      <section id="how">
        <div className="container">
          <div className="section-head">
            <h2>How Bebop Buddy works</h2>
            <p>Bring any progression: a standard, a blues, or the tune your combo is rehearsing this week.</p>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <div className="step-num">1</div>
              <h3>Enter your chords</h3>
              <p>Type the changes, like <em>Dm7 | G7 | Cmaj7</em>, or pick a built-in progression such as a 12-bar blues.</p>
            </div>
            <div className="card">
              <div className="step-num">2</div>
              <h3>See what to play</h3>
              <p>Get the scale for every chord and the guide tones that make your lines sound like jazz, with a plain-English explanation of why.</p>
            </div>
            <div className="card">
              <div className="step-num">3</div>
              <h3>Hear example solos</h3>
              <p>Bebop Buddy writes original solo lines over your changes, shown as sheet music you can play back and study.</p>
            </div>
            <div className="card">
              <div className="step-num">4</div>
              <h3>Jam with a backing track</h3>
              <p>Loop piano, walking bass, and swing drums at any tempo, so you can practice like you&apos;re on the bandstand.</p>
            </div>
            <div className="card">
              <div className="step-num">5</div>
              <h3>Level up with lessons</h3>
              <p>Follow a step-by-step path: chord tones, guide-tone lines, approach notes, enclosures, and bebop phrasing.</p>
            </div>
            <div className="card">
              <div className="step-num">6</div>
              <h3>Save your songs</h3>
              <p>Keep your progressions, favorite solos, and lesson progress in your account and pick up where you left off.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section id="who" className="audience">
        <div className="container">
          <div className="section-head">
            <h2>Who it&apos;s for</h2>
            <p>Any instrument. Any level. If you can play a scale, you&apos;re ready.</p>
          </div>
          <div className="grid grid-4">
            <div className="card">
              <div className="icon">🎒</div>
              <h3>Jazz band students</h3>
              <p>Prepare for your next solo in high school or college jazz band.</p>
            </div>
            <div className="card">
              <div className="icon">🎹</div>
              <h3>Self-taught players</h3>
              <p>Adults learning jazz on their own who want structure and feedback.</p>
            </div>
            <div className="card">
              <div className="icon">🎸</div>
              <h3>Musicians crossing over</h3>
              <p>Rock, pop, and classical players who want to finally &quot;get&quot; jazz harmony.</p>
            </div>
            <div className="card">
              <div className="icon">👩‍🏫</div>
              <h3>Music teachers</h3>
              <p>Generate exercises and backing tracks for your students in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="container">
          <div className="section-head">
            <h2>Simple pricing</h2>
            <p>Start free. Upgrade when you&apos;re ready to practice every day.</p>
          </div>
          <div className="pricing-grid">
            <div className="card plan">
              <h3>Free</h3>
              <div className="price">$0 <small>/ month</small></div>
              <p>Try it out and learn the basics.</p>
              <ul>
                <li>1 saved progression</li>
                <li>3 AI-generated solos per day</li>
                <li>Scale and guide-tone analysis</li>
                <li>Backing track player</li>
                <li>First 2 lessons</li>
              </ul>
              <SessionLink
                loggedIn={STUDIO}
                loggedOut={{ href: "/signup", label: "Get started" }}
                className="btn btn-ghost"
              />
            </div>
            <div className="card plan featured">
              <span className="badge">Most popular</span>
              <h3>Pro</h3>
              <div className="price">$6 <small>/ month</small></div>
              <p>For players serious about improving.</p>
              <ul>
                <li>Unlimited saved progressions</li>
                <li>Unlimited AI-generated solos</li>
                <li>The full lesson path, beginner to bebop</li>
                <li>Personalized feedback from Buddy</li>
                <li>Cancel anytime</li>
              </ul>
              <Link href="/dashboard" className="btn btn-primary">Go Pro</Link>
            </div>
          </div>
          <p className="value-note">
            A full year of Pro costs about the same as a single private jazz lesson,
            and Bebop Buddy is there every time you sit down to practice.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <h2>Questions</h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>Do I need to know music theory?</summary>
              <p>No. Buddy explains every concept in plain language as you go. Knowing how to read basic chord symbols helps, and the first lesson covers it.</p>
            </details>
            <details>
              <summary>What instruments does it work for?</summary>
              <p>Any of them: sax, trumpet, trombone, piano, guitar, bass, voice, and more. Solos are shown in standard notation you can read on your instrument.</p>
            </details>
            <details>
              <summary>Can I use the songs I&apos;m learning?</summary>
              <p>Yes. Type in the chord changes of any tune and Bebop Buddy builds analysis, solos, and a backing track around them.</p>
            </details>
            <details>
              <summary>Are the example solos copied from real recordings?</summary>
              <p>No. Every solo is newly written by AI for your progression, so you get fresh material to study every time.</p>
            </details>
            <details>
              <summary>Can I cancel Pro?</summary>
              <p>Anytime, in one click from your account page. You keep Pro until the end of your billing month.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to take your first solo?</h2>
          <p>Your AI jazz partner is warmed up and waiting.</p>
          <SessionLink
            loggedIn={STUDIO}
            loggedOut={{ href: "/signup", label: "Start practicing free" }}
            className="btn btn-primary"
          />
        </div>
      </section>

      <footer>
        <div className="container">
          <span>© 2026 Bebop Buddy</span>
          <span>Created by Nick Gombocz</span>
        </div>
      </footer>
    </>
  );
}
