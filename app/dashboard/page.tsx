import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default function DashboardPage() {
  return (
    <>
      <header className="nav">
        <div className="container">
          <Link href="/" className="logo">
            Bebop <span>Buddy</span>
          </Link>
          <nav className="nav-links">
            <SignOutButton />
          </nav>
        </div>
      </header>

      {/* Reading the login session happens per request, so it streams in here. */}
      <Suspense fallback={<main className="dashboard container">Loading…</main>}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const firstName = session.user.name.split(" ")[0] || "there";

  return (
    <main className="dashboard container">
      <span className="plan-pill">Free plan</span>
      <h1>Welcome, {firstName} 🎷</h1>
      <p className="lead">You&apos;re logged in as {session.user.email}.</p>

      <div className="grid grid-3">
        <Link href="/practice" className="card">
          <div className="icon">🎼</div>
          <h3>Solo studio</h3>
          <p>Enter chord changes and get scales, guide tones, and AI-written solos.</p>
          <p className="card-link">Open the studio →</p>
        </Link>
        <div className="card">
          <div className="icon">🥁</div>
          <h3>Jam mode</h3>
          <p>Practice over a looping backing track at any tempo.</p>
          <p className="coming-soon">Coming soon</p>
        </div>
        <div className="card">
          <div className="icon">📚</div>
          <h3>The Shed</h3>
          <p>Step-by-step improv lessons from chord tones to bebop lines.</p>
          <p className="coming-soon">Coming soon</p>
        </div>
      </div>
    </main>
  );
}
