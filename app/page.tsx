import { ConnectGate } from "@/components/ConnectGate";
import { Distribution } from "@/components/Distribution";
import { Eligibility } from "@/components/Eligibility";
import { TermsGate } from "@/components/TermsGate";
import { TrustBar } from "@/components/TrustBar";
import { VariationalMark } from "@/components/VariationalMark";
import { AutoClaim } from "@/components/AutoClaim";
import { Footer } from "@/components/Footer";

const GUARANTEES = ["Sin gas", "Sin transacciones", "Una sola firma"];

export default function Home() {
  return (
    <main className="relative w-full pb-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(76,154,248,0.18),transparent_70%)]"
      />

      {/* CONTENEDOR ESTRECHO (560px) PARA EL FLOW DE CLAIM */}
      <div className="mx-auto w-full max-w-3xl px-5">
        <header className="flex items-center justify-between border-b border-line py-4">
          <div className="flex items-center gap-2">
            <VariationalMark className="h-5 w-8" />
            <span className="text-[13px] font-medium tracking-tight">Variational</span>
            <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
              Claim
            </span>
          </div>
          <span className="rounded border border-line px-2 py-1 font-mono text-[10px] text-muted">
            Arbitrum One
          </span>
        </header>

        <nav className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">1 · Verificación</span>
          <span className="h-px flex-1 bg-line" />
          <span className="rounded-full border border-line px-2.5 py-1 text-muted">2 · Autorización</span>
          <span className="h-px flex-1 bg-line" />
          <span className="rounded-full border border-line px-2.5 py-1 text-muted">3 · Asignación</span>
        </nav>

        <section className="pt-8">
          <p className="text-[18px] uppercase tracking-[0.22em] text-primary">Genesis Distribution</p>
          <h1 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em]">
            Verifica tu elegibilidad para <br /> la asignación de{" "}
            <span className="bg-gradient-to-r from-primary to-[#BFE0FE] bg-clip-text text-transparent">
              $VAR
            </span>
          </h1>
          <p className="mt-3  text-[15px] leading-relaxed text-muted">
            El 32% del suministro de $VAR se reparte entre los holders de puntos Omni,
            proporcionalmente y sin vesting. Confirma la titularidad de tu cuenta para entrar en el
            snapshot.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {GUARANTEES.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] text-emerald-300"
              >
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                {g}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6 space-y-3">
          <Eligibility />
          <TrustBar />
          <Distribution />
        </div>

        <div className="mt-6">
          <TermsGate>
            <div className="space-y-4">
              <ConnectGate>
                <AutoClaim />
              </ConnectGate>
            </div>
          </TermsGate>
        </div>
      </div>

      {/* SECCIÓN ANCHA (1192px) PARA JOIN THE COMMUNITY */}
      <section className="mx-auto mt-16 flex w-full max-w-[1192px] flex-col gap-[24px] px-5 md:gap-[32px] md:px-8 text-white">
        <h2
          className="font-semibold text-[28px] text-white leading-[100%] tracking-tight md:text-[40px] md:leading-[40px]"
          data-edit="community.headline"
        >
          Join the Community
        </h2>

        {/* md:flex-row pone las 2 tarjetas en horizontal desde pantallas de portátil/PC */}
        <div className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-8">
          
          {/* TARJETA 1: DISCORD */}
          <a
            className="group flex h-fit w-full flex-col justify-between rounded-xl border border-white/10 bg-[#0B0F1A] px-2 pt-2 transition-colors duration-300 ease-out hover:border-white/20 hover:bg-[#111625] md:h-[336px]"
            data-edit-link="DISCORD_URL"
            href="https://discord.gg/variational"
            rel="noopener noreferrer"
            style={{ backdropFilter: 'blur(160px)' }}
            target="_blank"
          >
            <div className="relative h-[150px] w-full overflow-hidden rounded-md bg-[#111626] md:h-[230px]">
              <div
                className="absolute inset-0 opacity-30 transition-opacity duration-300 ease-out group-hover:opacity-60"
                style={{
                  background:
                    'radial-gradient(139.3% 139.3% at 50% 50%, rgba(81,101,246,1) 0%, rgba(61,77,189,0.75) 25%, rgba(41,54,132,0.5) 50%, rgba(21,30,75,0.25) 75%, rgba(1,6,18,0) 100%)',
                }}
              />
              <svg
                viewBox="0 0 127.14 96.36"
                className="absolute left-1/2 -translate-x-1/2 w-[280px] top-[28px] md:w-[410px] md:top-[42px] text-[#5865F2]/80 transition-transform duration-500 ease-out group-hover:scale-105"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07Z" />
                <circle cx="42.45" cy="57.71" r="10.5" />
                <circle cx="84.69" cy="57.71" r="10.5" />
              </svg>
            </div>

            <div className="relative flex w-full flex-row items-center justify-between gap-[6px] p-4 md:p-6">
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-medium text-white leading-tight">
                  Discord
                </span>
                <span className="text-[13px] text-white/50">
                  Read release notes and see major announcements first.
                </span>
              </div>

              <svg
                className="h-5 w-5 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </div>
          </a>

          {/* TARJETA 2: X / TWITTER */}
          <a
            className="group flex h-fit w-full flex-col justify-between rounded-xl border border-white/10 bg-[#0B0F1A] px-2 pt-2 transition-colors duration-300 ease-out hover:border-white/20 hover:bg-[#111625] md:h-[336px]"
            data-edit-link="TWITTER_URL"
            href="https://x.com/variational_io"
            rel="noopener noreferrer"
            style={{ backdropFilter: 'blur(160px)' }}
            target="_blank"
          >
            <div className="relative h-[150px] w-full overflow-hidden rounded-md bg-[#11151E] md:h-[230px]">
              <div
                className="absolute inset-0 opacity-20 transition-opacity duration-300 ease-out group-hover:opacity-40"
                style={{
                  background:
                    'radial-gradient(139.3% 139.3% at 50% 50%, rgba(255,255,255,0.35) 0%, rgba(150,160,180,0.15) 45%, rgba(1,6,18,0) 100%)',
                }}
              />
              <svg
                viewBox="0 0 24 24"
                className="absolute left-1/2 -translate-x-1/2 w-[260px] top-[24px] md:w-[370px] md:top-[30px] text-white/75 transition-transform duration-500 ease-out group-hover:scale-105"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.12"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>

            <div className="relative flex w-full flex-row items-center justify-between gap-[6px] p-4 md:p-6">
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-medium text-white leading-tight">
                  X/Twitter
                </span>
                <span className="text-[13px] text-white/50">
                  Stay up-to-date on all things Variational.
                </span>
              </div>

              <svg
                className="h-5 w-5 text-white/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </div>
          </a>

        </div>
      </section>

      {/* FOOTER ALINEADO AL ANCHO DE 1192px */}
      <Footer />
    </main>
  );
}