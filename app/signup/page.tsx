"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not create your account.");
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
        <h1>Create your account</h1>
        <p>Start practicing jazz improv for free.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
