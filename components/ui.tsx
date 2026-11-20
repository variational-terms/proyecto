"use client";

import { useState, type ReactNode } from "react";
import { EXPLORER_URL } from "@/lib/constants";

export function Card({
  title,
  subtitle,
  step,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  step?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6 ${className}`}
    >
      <header className="mb-5 flex items-start gap-3">
        {typeof step === "number" ? (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 font-mono text-[11px] text-zinc-400">
            {step}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-100">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Row({
  label,
  value,
  mono = false,
  tone,
  hint,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  tone?: "warn" | "ok";
  hint?: string;
}) {
  const toneClass =
    tone === "warn" ? "text-amber-300" : tone === "ok" ? "text-emerald-300" : "text-zinc-200";

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-800/80 py-2 last:border-0">
      <dt className="shrink-0 text-[12px] text-zinc-500">{label}</dt>
      <dd className={`min-w-0 text-right text-[12px] ${mono ? "font-mono" : ""} ${toneClass}`}>
        {value}
        {hint ? <span className="mt-0.5 block text-[10px] text-zinc-600">{hint}</span> : null}
      </dd>
    </div>
  );
}

export function Callout({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warn" | "danger" | "ok";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    neutral: "border-zinc-800 bg-zinc-900/50 text-zinc-400",
    warn: "border-amber-500/30 bg-amber-500/[0.06] text-amber-200/90",
    danger: "border-rose-500/30 bg-rose-500/[0.06] text-rose-200/90",
    ok: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200/90",
  } as const;

  return (
    <div className={`rounded-lg border px-4 py-3 text-[12px] leading-relaxed ${styles[tone]}`}>
      {title ? <p className="mb-1 font-medium text-zinc-100">{title}</p> : null}
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" }) {
  const styles = {
    neutral: "border-zinc-700 text-zinc-400",
    ok: "border-emerald-500/40 text-emerald-300",
    warn: "border-amber-500/40 text-amber-300",
    danger: "border-rose-500/40 text-rose-300",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
    >
      {copied ? "Copiado" : label}
    </button>
  );
}

export function TxLink({ hash, label = "Ver transacción" }: { hash: string; label?: string }) {
  return (
    <a
      href={`${EXPLORER_URL}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 underline underline-offset-4 transition hover:text-zinc-100"
    >
      {label} ↗
    </a>
  );
}

export function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a
      href={`${EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noreferrer"
      className="font-mono underline decoration-zinc-700 underline-offset-4 transition hover:text-zinc-100"
    >
      {label ?? address}
    </a>
  );
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[11px] ${className}`}>{children}</span>;
}
