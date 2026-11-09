import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "../dashboard/sign-out-button";
import { PracticeStudio } from "./practice-studio";

export default function PracticePage() {
  return (
    <>
      <header className="nav">
        <div className="container">
          <Link href="/" className="logo">
            Bebop <span>Buddy</span>
          </Link>
          <nav className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="dashboard container">
        <h1>Solo studio</h1>
        <p className="lead">Enter chord changes, and Buddy shows you what to play and writes an example solo you can see and hear.</p>
        <Suspense fallback={<p>Loading…</p>}>
          <RequireLogin>
            <PracticeStudio />
          </RequireLogin>
        </Suspense>
      </main>
    </>
  );
}

// Only logged-in users can use the studio.
async function RequireLogin({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return children;
}
