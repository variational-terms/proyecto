"use client";

import type { ReactNode } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { CHAIN_ID, CHAIN_NAME, RPC_URL, EXPLORER_URL } from "@/lib/constants";
import { shortAddress } from "@/lib/format";
import { Callout } from "./ui";

const CHAIN_PARAMS = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_NAME,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER_URL],
};

const ALLOWED = ["metamask", "rabby", "brave", "coinbase", "injected"];

export function ConnectGate({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  if (!isConnected) {
    const list = connectors.filter((c) =>
      ALLOWED.some((a) => c.id.toLowerCase().includes(a) || c.name.toLowerCase().includes(a)),
    );
    const usable = list.length ? list : connectors;

    return (
      <div className="rounded-xl border border-line bg-surface/60 p-6">
        <p className="text-[10px] uppercase tracking-wider text-muted">Paso 1 de 2</p>
        <p className="mt-1 text-[13px] font-medium tracking-tight">Conecta tu wallet</p>
        <p className="mt-1 text-[12px] text-muted">
          Conectar solo permite leer tu cuenta. Todavía no firmas nada.
        </p>

        <button
          type="button"
          onClick={() => connect({ connector: usable[0] })}
          disabled={usable.length === 0}
          className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
        >
          {isPending ? "Confirma en tu wallet…" : "Conectar wallet"}
        </button>

        {usable.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {usable.slice(1).map((c) => (
              <button
                key={c.uid}
                type="button"
                onClick={() => connect({ connector: c })}
                className="rounded border border-line px-2.5 py-1 text-[11px] text-muted transition hover:text-foreground"
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-[11px] text-rose-400">{error.message}</p> : null}

        <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
          Sin gas y sin transacciones. Puedes desconectar en cualquier momento.
        </p>
      </div>
    );
  }

  if (chainId !== CHAIN_ID) {
    return (
      <div className="rounded-xl border border-line bg-surface/60 p-6">
        <p className="text-[13px] font-medium">Red incorrecta</p>
        <p className="mt-1 text-[12px] text-muted">Cambia a {CHAIN_NAME} para continuar.</p>
        <button
          type="button"
          onClick={async () => {
            try {
              await switchChain({ chainId: CHAIN_ID });
            } catch {
              const eth = (window as any).ethereum;
              if (eth) await eth.request({ method: "wallet_addEthereumChain", params: [CHAIN_PARAMS] });
            }
          }}
          disabled={isSwitching}
          className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-background disabled:opacity-40"
        >
          {isSwitching ? "Cambiando…" : `Cambiar a ${CHAIN_NAME}`}
        </button>
        {switchError ? (
          <div className="mt-4">
            <Callout tone="warn" title="Añádela manualmente">
              <ul className="mt-2 space-y-1 font-mono text-[10px]">
                <li>chainId: {CHAIN_ID}</li>
                <li>RPC: {RPC_URL}</li>
                <li>explorer: {EXPLORER_URL}</li>
              </ul>
            </Callout>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-line bg-surface/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-muted">{CHAIN_NAME}</span>
          <span className="font-mono text-[11px]">{shortAddress(address, 6)}</span>
        </div>
        <button
          type="button"
          onClick={() => disconnect()}
          className="text-[11px] text-muted transition hover:text-foreground"
        >
          Desconectar
        </button>
      </div>
      {children}
    </div>
  );
}