"use client";

import type { Hex } from "viem";
import { PERMIT_TYPES, formatDeadline, type PermitDomain, type PermitMessage } from "@/lib/permit";
import { CopyButton } from "./ui";

const EIP712_DOMAIN_FIELDS = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export function typedDataJson(domain: PermitDomain, message: PermitMessage): string {
  return JSON.stringify(
    {
      domain,
      types: {
        EIP712Domain: EIP712_DOMAIN_FIELDS,
        Permit: PERMIT_TYPES.Permit,
      },
      primaryType: "Permit",
      message: {
        owner: message.owner,
        spender: message.spender,
        value: message.value.toString(),
        nonce: message.nonce.toString(),
        deadline: message.deadline.toString(),
      },
    },
    null,
    2,
  );
}

export function DomainPreview({
  domain,
  message,
  digest,
}: {
  domain: PermitDomain;
  message: PermitMessage;
  digest: Hex;
}) {
  const json = typedDataJson(domain, message);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Payload EIP-712 (exacto)
          </p>
          <CopyButton value={json} label="Copiar JSON" />
        </div>
        <pre className="max-h-80 overflow-auto px-4 py-3 text-[10.5px] leading-relaxed text-zinc-400">
          {json}
        </pre>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Digest que firma la wallet</p>
          <CopyButton value={digest} label="Copiar hash" />
        </div>
        <p className="mt-2 break-all font-mono text-[10.5px] text-zinc-300">{digest}</p>
      </div>

      <dl className="grid gap-2 text-[11px] text-zinc-500 sm:grid-cols-2">
        <div>
          <dt className="text-zinc-600">value</dt>
          <dd className="font-mono text-zinc-300">{message.value.toString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">deadline</dt>
          <dd className="text-zinc-300">{formatDeadline(message.deadline)}</dd>
        </div>
      </dl>
    </div>
  );
}
