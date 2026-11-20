import { formatUnits } from "viem";
import type { Address } from "viem";

export function formatAmount(value: bigint, decimals: number, maxFractionDigits = 4): string {
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const trimmed = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return trimmed ? `${grouped},${trimmed}` : grouped;
}

export function shortAddress(address?: Address | string, size = 4): string {
  if (!address) return "—";
  if (address.length <= 2 + size * 2) return address;
  return `${address.slice(0, 2 + size)}…${address.slice(-size)}`;
}

export function isHexAddress(value: string): value is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

/** Mensajes de error de wallet/viem traducidos a algo legible. */
export function humanError(error: unknown): string {
  if (!error) return "Error inesperado.";

  const anyError = error as { name?: string; shortMessage?: string; message?: string };

  if (
    anyError.name === "UserRejectedRequestError" ||
    /user rejected|rejected the request|denied/i.test(anyError.message ?? "")
  ) {
    return "Rechazaste la solicitud en la wallet. No se ha enviado nada.";
  }

  if (anyError.name === "InsufficientFundsError") {
    return "La cuenta no tiene ETH de testnet para pagar el gas.";
  }

  if (anyError.name === "ChainMismatchError") {
    return "La wallet está en otra red. Cambia a Arbitrum Sepolia.";
  }

  const text = anyError.shortMessage ?? anyError.message ?? "Error inesperado.";
  return text.split("\n")[0].slice(0, 220);
}
