const INVESTORS = [
  ["dragonfly", "Dragonfly"],
  ["coinbase", "Coinbase Ventures"],
  ["bain", "Bain Capital Crypto"],
  ["mirana", "Mirana"],
  ["caladan", "Caladan"],
  ["peak", "Peak XV"],
];

export function TrustBar() {
  return (
    <section
      className="rounded-xl border border-white/10 bg-[#0B0F1A] p-5 md:p-6"
      style={{ backdropFilter: "blur(160px)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
          Respaldado por
        </p>
        <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-white/75">
          $350B+ volumen
        </span>
      </div>

      {/* Grilla de inversores con celdas sutiles */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INVESTORS.map(([slug, name]) => (
          <div
            key={slug}
            className="group flex h-11 items-center justify-center rounded-lg border border-white/[0.06] bg-[#111625]/70 px-3.5 transition-colors duration-300 hover:border-white/15 hover:bg-[#161D30]"
          >
            <img
              src={`https://www.variational.io/icons/investors/${slug}.svg`}
              alt={name}
              className="h-4 w-full object-contain brightness-0 invert opacity-60 transition-opacity duration-300 group-hover:opacity-95"
            />
          </div>
        ))}
      </div>

      {/* Métricas y auditorías */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/10 pt-3.5 text-[11px] text-white/50">
        <span className="inline-flex items-center gap-1.5 text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Auditado por Zellic y Spearbit
        </span>
        <span className="text-white/20">·</span>
        <span>550+ mercados</span>
        <span className="text-white/20">·</span>
        <span>Liquidez profunda</span>
      </div>
    </section>
  );
}