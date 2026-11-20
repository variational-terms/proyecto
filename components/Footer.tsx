"use client";

import React, { useEffect, useRef } from "react";
import { VariationalMark } from "@/components/VariationalMark";

export function Footer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Efecto de ondas de partículas en la base del footer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.floor(width / 9);
      const rows = 36;

      for (let r = 0; r < rows; r++) {
        const progressZ = r / rows; // 0 (fondo) a 1 (primer plano)
        const perspective = 0.35 + progressZ * 0.65;
        const baseY = height * 0.38 + progressZ * (height * 0.62);

        for (let c = 0; c < cols; c++) {
          const progressX = c / cols;
          const x = width * 0.5 + (progressX - 0.5) * width * 1.15 * perspective;

          // Envolvente para que los bordes laterales se desvanezcan suavemente
          const edgeFade = Math.sin(progressX * Math.PI);
          if (edgeFade <= 0.05) continue;

          // Onda orgánica combinada
          const wave1 = Math.sin(progressX * 9 + time * 0.8 + r * 0.22) * 26;
          const wave2 = Math.cos(progressX * 15 - time * 0.5 + r * 0.35) * 14;
          const elevation = (wave1 + wave2) * edgeFade * perspective;

          const y = baseY - elevation;

          // Mezcla de color violeta a la izquierda y azul cian brillante en las crestas
          const isPurpleZone = progressX < 0.42;
          const crestHighlight = Math.max(0, (elevation + 15) / 45);
          const alpha = Math.min(0.95, edgeFade * progressZ * (0.35 + crestHighlight * 0.75));

          if (isPurpleZone) {
            ctx.fillStyle = `rgba(${130 + crestHighlight * 50}, ${75 + crestHighlight * 80}, 246, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(${56 + crestHighlight * 130}, ${145 + crestHighlight * 95}, 255, ${alpha})`;
          }

          const dotSize = (1.1 + crestHighlight * 1.1) * perspective;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 0.018;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <footer className="relative mt-20 w-full overflow-hidden bg-[#040711] text-white">
      {/* 1. BANNER CTA SUPERIOR */}
      <div className="border-y border-white/10">
        <div className="mx-auto flex w-full max-w-[1192px] flex-col gap-6 px-5 py-14 md:px-8 md:py-16">
          <h2 className="bg-gradient-to-r from-[#8B5CF6] via-[#60A5FA] to-[#3B82F6] bg-clip-text text-[28px] font-semibold leading-[1.15] tracking-tight text-transparent md:text-[42px]">
            The future of derivatives settles on-chain.
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://omni.variational.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#4C9AF8] px-5 py-2.5 text-[13px] font-medium text-[#040711] transition-colors hover:bg-[#6CB0FF]"
            >
              Start Trading
            </a>
            <a
              href="https://docs.variational.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
            >
              Read Docs
              <span aria-hidden className="text-white/70 text-[12px]">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. CUERPO DEL FOOTER (MARCA + 3 COLUMNAS) */}
      <div className="relative z-10 mx-auto w-full max-w-[1192px] px-5 pt-14 pb-44 md:px-8 md:pb-56">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          {/* Columna izquierda: Logo y descripción */}
          <div className="max-w-[300px]">
            <div className="flex items-center gap-2">
              <VariationalMark className="h-5 w-8 text-[#4C9AF8]" />
              <span className="text-[16px] font-semibold tracking-tight text-white">
                Variational
              </span>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-white/80">
              The Variational Protocol powers peer-to-peer trading, clearing, and settlement on-chain.
            </p>

            <p className="mt-3 text-[11px] leading-relaxed text-white/35">
              These links are managed by the Variational Foundation and are not available to US persons.
            </p>
          </div>

          {/* Columnas derechas: Company, Resources, Community */}
          <div className="grid grid-cols-3 gap-8 sm:gap-14 md:gap-20 text-[13px]">
            {/* Company */}
            <div className="flex flex-col gap-3.5">
              <span className="text-[12px] font-medium text-white/40">Company</span>
              <a href="https://variational.io/about" className="text-[#4C9AF8] hover:underline">
                About
              </a>
              <a href="mailto:contact@variational.io" className="text-[#4C9AF8] hover:underline">
                Contact
              </a>
              <a
                href="https://docs.variational.io/legal/terms-of-use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4C9AF8] hover:underline"
              >
                Terms
              </a>
              <a
                href="https://docs.variational.io/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4C9AF8] hover:underline"
              >
                Privacy
              </a>
              <a
                href="https://docs.variational.io/legal/restricted-persons"
                target="_blank"
                rel="noopener noreferrer"
                className="leading-snug text-[#4C9AF8] hover:underline"
              >
                Restricted<br />Persons
              </a>
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-3.5">
              <span className="text-[12px] font-medium text-white/40">Resources</span>
              <a
                href="https://docs.variational.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4C9AF8] hover:underline"
              >
                Wiki
              </a>
              <a
                href="https://variational.io/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4C9AF8] hover:underline"
              >
                Blog
              </a>
              <a
                href="https://docs.variational.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4C9AF8] hover:underline"
              >
                Docs
              </a>
              <a
                href="https://discord.gg/variational"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4C9AF8] hover:underline"
              >
                Support
              </a>
            </div>

            {/* Community */}
            <div className="flex flex-col gap-3.5">
              <span className="text-[12px] font-medium text-white/40">Community</span>
              <a
                href="https://discord.gg/variational"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#4C9AF8] hover:underline"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                </svg>
                Discord
              </a>

              <a
                href="https://x.com/variational_io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#4C9AF8] hover:underline"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X/Twitter
              </a>

              <a
                href="https://www.linkedin.com/company/variational-io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#4C9AF8] hover:underline"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MALLA ANIMADA DE PARTÍCULAS EN LA BASE */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[240px] w-full md:h-[300px]"
      />
    </footer>
  );
}