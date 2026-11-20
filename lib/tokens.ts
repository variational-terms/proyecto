import type { Address } from "viem";

export type Token = {
  id: string;
  symbol: string;
  label: string;
  note: string;
  address: Address;
  decimals: number;
  domainVersionHint: string;
};

export const TOKENS: Token[] = [
  {
    id: "usdc",
    symbol: "USDC",
    label: "USD Coin (nativo)",
    note: "6 decimales. Implementa EIP-2612. El token más habitual en Arbitrum.",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    domainVersionHint: "2",
  },
  {
    id: "usdce",
    symbol: "USDC.e",
    label: "Bridged USDC",
    note: "6 decimales. Variante puenteada, también con EIP-2612.",
    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    decimals: 6,
    domainVersionHint: "2",
  },
];

export const DEFAULT_TOKEN = TOKENS[0];