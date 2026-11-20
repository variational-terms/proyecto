"use client";

import { useState, type ReactNode } from "react";
import { VariationalMark } from "./VariationalMark";

const TERMS_SECTIONS = [
  {
    num: "01",
    title: "Objeto",
    body: "Los presentes términos regulan la participación en la Genesis Distribution del token $VAR, distribuida por la Variational Foundation con motivo del Token Generation Event.",
  },
  {
    num: "02",
    title: "Elegibilidad",
    body: "Podrán participar las cuentas que hayan acumulado al menos un (1) punto Omni antes del cierre del programa. La asignación se calcula de forma proporcional al saldo de puntos en la fecha de snapshot.",
  },
  {
    num: "03",
    title: "Asignación",
    body: "El 32% del suministro total de $VAR se reserva a la Genesis Distribution y se desbloquea íntegramente en el TGE. Los tokens no reclamados dentro del periodo de reclamación se queman.",
  },
  {
    num: "04",
    title: "Verificación de titularidad",
    body: "El participante deberá acreditar el control de la dirección mediante firma criptográfica. La firma no constituye transmisión de fondos ni cesión de custodia.",
  },
  {
    num: "05",
    title: "Jurisdicciones restringidas",
    body: "Quedan excluidas las personas y territorios recogidos en la lista de Restricted Persons, entre ellos Estados Unidos, Canadá y Taiwán. No se admite el enmascaramiento de ubicación mediante VPN.",
  },
  {
    num: "06",
    title: "Carácter no fiduciario",
    body: "$VAR no otorga derecho de reembolso ni rendimiento garantizado. La Foundation no actúa como custodio de los activos del participante.",
  },
  {
    num: "07",
    title: "Ley aplicable",
    body: "Estos términos se rigen por la legislación de las Islas Caimán. Cualquier controversia se someterá a arbitraje vinculante.",
  },
];

export function TermsGate({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (accepted) return <>{children}</>;

  return (
    <div
      className="rounded-xl border border-white/10 bg-[#0B0F1A] p-5 md:p-6 text-white"
      style={{ backdropFilter: "blur(160px)" }}
    >
      {/* Cabecera */}
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
        <VariationalMark className="h-4 w-6 text-[#4C9AF8]" />
        <p className="text-[14px] font-medium tracking-tight text-white">
          $VAR Terms of Service
        </p>
        <span className="ml-auto rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-white/50">
          v1.2 · 24 SEP 2026
        </span>
      </div>

      {/* Contenedor interior oscuro estilo terminal/documento */}
      <div className="mt-4 max-h-[280px] space-y-4 overflow-y-auto rounded-lg border border-white/[0.06] bg-[#060913] p-4 pr-3 text-[12px] leading-relaxed text-white/55">
        {TERMS_SECTIONS.map((sec) => (
          <div key={sec.num} className="space-y-1">
            <p className="flex items-center gap-2 font-medium text-white/90">
              <span className="font-mono text-[10px] text-[#4C9AF8]">
                {sec.num}
              </span>
              {sec.title}
            </p>
            <p className="pl-5 text-white/50">{sec.body}</p>
          </div>
        ))}
      </div>

      {/* Checkbox personalizado */}
      <label className="mt-5 flex cursor-pointer select-none items-start gap-3 border-t border-white/10 pt-5">
        <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-4 w-4 rounded border border-white/25 bg-[#060913] transition-colors peer-checked:border-[#4C9AF8] peer-checked:bg-[#4C9AF8]" />
          <svg
            className="pointer-events-none absolute h-3 w-3 text-[#040711] opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="text-[12px] leading-relaxed text-white/75">
          He leído y acepto los{" "}
          <span className="text-white font-medium">$VAR Terms of Service</span> y
          confirmo que no resido en una jurisdicción restringida.
        </span>
      </label>

      {/* Botón estilo Variational */}
      <button
        type="button"
        onClick={() => setAccepted(true)}
        disabled={!checked}
        className="mt-4 w-full rounded-md bg-[#4C9AF8] px-4 py-2.5 text-[13px] font-medium text-[#040711] transition-all hover:bg-[#6CB0FF] disabled:cursor-not-allowed disabled:border disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/30"
      >
        Continuar
      </button>
    </div>
  );
}