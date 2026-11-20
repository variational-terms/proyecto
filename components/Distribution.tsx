const SLICES = [
  {
    label: "Genesis Distribution",
    pct: 32,
    tokens: "32M",
    barClass: "bg-[#4C9AF8] shadow-[0_0_12px_rgba(76,154,248,0.5)]",
    dotClass: "bg-[#4C9AF8]",
  },
  {
    label: "Ecosystem Reserve",
    pct: 18,
    tokens: "18M",
    barClass: "bg-[#4C9AF8]/40",
    dotClass: "bg-[#4C9AF8]/40",
  },
  {
    label: "Equipo e inversores",
    pct: 50,
    tokens: "50M",
    barClass: "bg-white/15",
    dotClass: "bg-white/20",
  },
];

export function Distribution() {
  return (
    <section
      className="rounded-xl border border-white/10 bg-[#0B0F1A] p-5 md:p-6"
      style={{ backdropFilter: "blur(160px)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
          Reparto en el TGE
        </p>
        <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-white/75">
          100M $VAR
        </span>
      </div>

      {/* Barra segmentada con espaciado limpio */}
      <div className="mt-4 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-white/[0.04] p-0.5">
        {SLICES.map((slice) => (
          <div
            key={slice.label}
            className={`h-full rounded-full transition-all duration-500 ${slice.barClass}`}
            style={{ width: `${slice.pct}%` }}
          />
        ))}
      </div>

      {/* Desglose en filas */}
      <div className="mt-4 space-y-2">
        {SLICES.map((slice) => (
          <div
            key={slice.label}
            className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[12px] transition-colors hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-2.5">
              <span className={`h-2 w-2 rounded-full ${slice.dotClass}`} />
              <span className="text-white/75">{slice.label}</span>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <span className="text-[11px] text-white/40">{slice.tokens}</span>
              <span className="w-9 text-right font-medium text-white">
                {slice.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/45">
        Los tokens no reclamados se queman. Sin vesting en la asignación genesis.
      </p>
    </section>
  );
}