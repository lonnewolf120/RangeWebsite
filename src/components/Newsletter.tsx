"use client";

import { useState, type FormEvent } from "react";

/**
 * Newsletter signup. Currently a client-side stub — the submit handler
 * only flips local state and does not send the email anywhere yet.
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done">("idle");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: submit { email } somewhere real and handle errors
    setStatus("done");
  };

  if (status === "done") {
    return (
      <p className="text-sm text-emerald-400">
        ✓ Subscribed. Watch your inbox for upcoming batch announcements.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        className="w-full min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-500"
      >
        Subscribe
      </button>
    </form>
  );
}
