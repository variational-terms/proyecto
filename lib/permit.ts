import {
  encodeAbiParameters,
  hashTypedData,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { CHAIN_ID } from "./constants";

/**
 * Tipos EIP-712 de `permit` tal y como los define EIP-2612.
 * El orden de los campos es parte del hash: cambiarlo invalida la firma.
 */
export const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export type PermitMessage = {
  owner: Address;
  spender: Address;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
};

export type PermitDomain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
};

export function buildPermitDomain(
  token: { address: Address; name: string; version: string },
  chainId: number = CHAIN_ID,
): PermitDomain {
  return {
    name: token.name,
    version: token.version,
    chainId,
    verifyingContract: token.address,
  };
}

/** Hash EIP-712 completo: esto es exactamente lo que firma la wallet. */
export function permitDigest(domain: PermitDomain, message: PermitMessage): Hex {
  return hashTypedData({
    domain,
    types: PERMIT_TYPES,
    primaryType: "Permit",
    message,
  });
}

/**
 * Domain separator calculado a mano. Si no coincide con `DOMAIN_SEPARATOR()`
 * del contrato, la firma fallará aunque la wallet diga que todo ha ido bien.
 * El 90% de los errores de permit vienen de aquí (name/version incorrectos).
 */
export function domainSeparator(domain: PermitDomain): Hex {
  const typeHash = keccak256(
    toHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
  );

  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        typeHash,
        keccak256(toHex(domain.name)),
        keccak256(toHex(domain.version)),
        BigInt(domain.chainId),
        domain.verifyingContract,
      ],
    ),
  );
}

export type SplitSignature = { v: number; r: Hex; s: Hex };

export function splitSignature(signature: Hex): SplitSignature {
  if (signature.length !== 132) {
    throw new Error("La firma no tiene 65 bytes (r + s + v).");
  }

  const v = parseInt(signature.slice(130, 132), 16);

  return {
    r: `0x${signature.slice(2, 66)}` as Hex,
    s: `0x${signature.slice(66, 130)}` as Hex,
    // Algunas wallets devuelven 0/1 en lugar de 27/28. OZ espera 27/28.
    v: v < 27 ? v + 27 : v,
  };
}

export function deadlineFromMinutes(minutes: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + Math.round(minutes * 60));
}

export function formatDeadline(deadline: bigint): string {
  return new Date(Number(deadline) * 1000).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
