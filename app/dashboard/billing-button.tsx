"use client";

import { useState } from "react";

/** Sends the user to Stripe Checkout (upgrade) or the Stripe customer portal (manage). */
export function BillingButton({ action, children, className }: {
  action: "checkout" | "portal";
  children: React.ReactNode;
  className: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(action === "checkout" ? "/api/checkout" : "/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? "Opening Stripe…" : children}
      </button>
      {error && <div className="form-error billing-error">{error}</div>}
    </>
  );
}
