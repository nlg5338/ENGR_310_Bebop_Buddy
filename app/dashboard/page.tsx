import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStripe, syncCustomer } from "@/lib/billing";
import { FREE_DAILY_SOLOS, getPlan } from "@/lib/db";
import { BillingButton } from "./billing-button";
import { SignOutButton } from "./sign-out-button";

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
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
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // Coming back from Stripe Checkout: confirm the payment right away instead of
  // waiting for the webhook.
  const { checkout, session_id } = await searchParams;
  if (checkout === "success" && typeof session_id === "string") {
    const completed = await getStripe().checkout.sessions.retrieve(session_id);
    if (completed.client_reference_id === session.user.id && typeof completed.customer === "string") {
      await syncCustomer(completed.customer);
    }
  }

  const plan = await getPlan(session.user.id);
  const firstName = session.user.name.split(" ")[0] || "there";
  const endDate = plan.renewsOrEnds?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="dashboard container">
      <span className="plan-pill">{plan.pro ? "Pro plan ⭐" : "Free plan"}</span>
      <h1>Welcome, {firstName} 🎷</h1>
      <p className="lead">You&apos;re logged in as {session.user.email}.</p>

      {checkout === "success" && plan.pro && (
        <div className="notice notice-success">You&apos;re on Pro! Unlimited solos are unlocked. Thanks for supporting Bebop Buddy.</div>
      )}
      {checkout === "canceled" && (
        <div className="notice">Checkout canceled. You haven&apos;t been charged.</div>
      )}

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

      <section className="card billing-card">
        {plan.pro ? (
          <>
            <h3>Bebop Buddy Pro</h3>
            <p>
              Unlimited solos are on.{" "}
              {endDate && (plan.canceling ? `Your Pro access ends on ${endDate}.` : `Renews on ${endDate} for $6.`)}
            </p>
            <BillingButton action="portal" className="btn btn-ghost">Manage subscription</BillingButton>
          </>
        ) : (
          <>
            <h3>Go Pro for $6/month</h3>
            <p>
              Free accounts get {FREE_DAILY_SOLOS} solos a day. Pro gives you unlimited solos and the full lesson path.
              Cancel anytime.
            </p>
            <BillingButton action="checkout" className="btn btn-primary">Upgrade to Pro</BillingButton>
          </>
        )}
      </section>
    </main>
  );
}
