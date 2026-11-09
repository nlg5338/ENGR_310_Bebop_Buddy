"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setLoading(false);
    if (error) {
      setError(error.message ?? "Incorrect email or password.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="auth-page">
      <Link href="/" className="logo">
        Bebop <span>Buddy</span>
      </Link>
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Log in to keep practicing.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New to Bebop Buddy? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
