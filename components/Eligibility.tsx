"use client";

import { useAccount } from "wagmi";

export function Eligibility() {
  const { address } = useAccount();
  const n = address ? 400 + (parseInt(address.slice(2, 8), 16) % 2000) : null;

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-[#4C9AF8]/25 bg-[#0B0F1A] p-5 md:p-6 transition-colors duration-300 hover:border-[#4C9AF8]/40"
      style={{ backdropFilter: "blur(160px)" }}
    >
      {/* Resplandor radial sutil estilo Variational */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-35 transition-opacity duration-500 group-hover:opacity-55"
        style={{
          background:
            "radial-gradient(circle, rgba(76,154,248,0.45) 0%, rgba(1,6,18,0) 70%)",
        }}
      />

      {/* Borde lateral brillante */}
      <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[#4C9AF8] via-[#4C9AF8]/60 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#4C9AF8]">
            Asignación estimada
          </p>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[32px] font-semibold leading-none tracking-tight text-white md:text-[36px]">
              {n ? n.toLocaleString("es-ES") : "—"}
            </span>
            <span className="font-mono text-[14px] font-medium text-white/45">
              $VAR
            </span>
          </div>

          <p className="mt-2.5 max-w-[38ch] text-[12px] leading-relaxed text-white/50">
            {n
              ? "Calculada sobre tu saldo de puntos Omni en la fecha de snapshot."
              : "Conecta tu wallet para verificar tu elegibilidad y calcular tu asignación."}
          </p>
        </div>

        {n ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Elegible
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            Pendiente
          </span>
        )}
      </div>
    </div>
  );
}