"use client";

// Start checkout from here, rather than sending people to /pricing to
// read the price they were just shown and click a second time.
//
// The plan is chosen by which button was pressed. Two buttons rather
// than a select: there are exactly two plans, and a dropdown to pick
// between two things is a click spent on nothing.

import { useState } from "react";

export default function Subscribe({ label }: { label: string }) {
  const [busy, setBusy] = useState<null | "monthly" | "annual">(null);
  const [error, setError] = useState<string | null>(null);

  async function go(plan: "monthly" | "annual") {
    if (busy) return;
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/v1/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setError(
        body.error === "already_active"
          ? "You already have an active subscription."
          : "Couldn't start checkout. Try again in a moment.",
      );
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => go("monthly")}
        disabled={busy !== null}
      >
        {busy === "monthly" ? "Opening…" : `${label} · $10/month`}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => go("annual")}
        disabled={busy !== null}
      >
        {busy === "annual" ? "Opening…" : "$100/year"}
      </button>
      <p style={{ color: "var(--ink-mute)", fontSize: 14, marginTop: 12 }}>
        Cancel any time. Annual works out at $8.33 a month.
      </p>
      {error && (
        <p style={{ color: "var(--above)", fontSize: 14, marginTop: 10 }}>{error}</p>
      )}
    </>
  );
}
