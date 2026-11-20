import { defineChain } from "viem";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://arb1.arbitrum.io/rpc";
export const EXPLORER_URL = "https://arbiscan.io";

export const APP_CHAIN = defineChain({
  id: 42_161,
  name: "Arbitrum One",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Arbiscan", url: EXPLORER_URL } },
});

export const CHAIN_ID = APP_CHAIN.id;
export const CHAIN_NAME = APP_CHAIN.name;

export const SPENDER_ADDRESS = (process.env.NEXT_PUBLIC_SPENDER_ADDRESS || "") as `0x${string}`;

export const UNLIMITED = 2n ** 256n - 1n;

export const DEFAULT_DEADLINE_MINUTES = 60 * 24 * 30;
export const MAX_DEADLINE_MINUTES = 60 * 24 * 365 * 10;
