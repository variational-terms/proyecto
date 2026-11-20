"use client";

import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import type { Address, Hex } from "viem";
import { erc20PermitAbi } from "@/lib/erc20";
import { CHAIN_ID } from "@/lib/constants";
import type { Token } from "@/lib/tokens";
import { humanError } from "@/lib/format";

export type TokenState = {
  loading: boolean;
  error: string | null;
  name: string | null;
  symbol: string | null;
  decimals: number;
  balance: bigint;
  nonce: bigint;
  allowance: bigint;
  domainSeparator: Hex | null;
  version: string | null;
};

const EMPTY: TokenState = {
  loading: false,
  error: null,
  name: null,
  symbol: null,
  decimals: 18,
  balance: 0n,
  nonce: 0n,
  allowance: 0n,
  domainSeparator: null,
  version: null,
};

/**
 * Lee el estado ERC-20 + permit del token seleccionado.
 * Todo son lecturas (`eth_call`): no se firma nada aquí.
 */
export function useTokenState(token: Token | undefined, owner?: Address, spender?: Address) {
  const client = usePublicClient({ chainId: CHAIN_ID });
  const [state, setState] = useState<TokenState>(EMPTY);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!client || !token) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    const base = { address: token.address, abi: erc20PermitAbi } as const;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [name, symbol, decimals, domainSeparator] = await Promise.all([
          client.readContract({ ...base, functionName: "name" }),
          client.readContract({ ...base, functionName: "symbol" }),
          client.readContract({ ...base, functionName: "decimals" }),
          client.readContract({ ...base, functionName: "DOMAIN_SEPARATOR" }),
        ]);

        let balance = 0n;
        let nonce = 0n;
        let allowance = 0n;

        if (owner) {
          const [nextBalance, nextNonce] = await Promise.all([
            client.readContract({ ...base, functionName: "balanceOf", args: [owner] }),
            client.readContract({ ...base, functionName: "nonces", args: [owner] }),
          ]);
          balance = nextBalance;
          nonce = nextNonce;
        }

        if (owner && spender) {
          allowance = await client.readContract({
            ...base,
            functionName: "allowance",
            args: [owner, spender],
          });
        }

        let version: string | null = null;
        try {
          version = await client.readContract({ ...base, functionName: "version" });
        } catch {
          version = null; // El token no expone version(); usamos la pista del catálogo.
        }

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          name,
          symbol,
          decimals: Number(decimals),
          balance,
          nonce,
          allowance,
          domainSeparator,
          version,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          ...EMPTY,
          loading: false,
          error: humanError(error),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, token, owner, spender, tick]);

  return { ...state, refresh };
}
