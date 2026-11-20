"use client";

export { ConnectGate } from "./ConnectGate";
import { useMemo, useState } from "react";
import { parseUnits, recoverTypedDataAddress, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useSignTypedData, useWriteContract } from "wagmi";
import { useTokenState } from "@/hooks/useTokenState";
import { erc20PermitAbi } from "@/lib/erc20";
import { CHAIN_ID, DEFAULT_DEADLINE_MINUTES, SPENDER_ADDRESS, UNLIMITED } from "@/lib/constants";
import { isHexAddress, formatAmount, humanError } from "@/lib/format";
import {
  PERMIT_TYPES,
  buildPermitDomain,
  deadlineFromMinutes,
  domainSeparator,
  formatDeadline,
  permitDigest,
  splitSignature,
  type PermitDomain,
  type PermitMessage,
} from "@/lib/permit";
import { DEFAULT_TOKEN, TOKENS } from "@/lib/tokens";
import { DomainPreview } from "./DomainPreview";
import { Badge, Callout, Card, CopyButton, Mono, Row, TxLink } from "./ui";

type AmountMode = "1" | "10" | "custom" | "max";

type Prepared = {
  key: string;
  message: PermitMessage;
  digest: Hex;
};

const DEADLINES: [number, string][] = [
  [30, "30 min"],
  [1440, "1 día"],
  [525600, "1 año"],
  [2628000, "5 años"],
];

export function PermitLab() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();

  const [tokenId, setTokenId] = useState(DEFAULT_TOKEN.id);
  const token = useMemo(
    () => TOKENS.find((item) => item.id === tokenId) ?? DEFAULT_TOKEN,
    [tokenId],
  );

  const [spenderMode, setSpenderMode] = useState<"self" | "custom">(
    SPENDER_ADDRESS ? "custom" : "self",
  );
  const [customSpender, setCustomSpender] = useState<string>(SPENDER_ADDRESS);

  const [amountMode, setAmountMode] = useState<AmountMode>("max");
  const [customAmount, setCustomAmount] = useState("1");
  const [deadlineMinutes, setDeadlineMinutes] = useState(DEFAULT_DEADLINE_MINUTES);

  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [signature, setSignature] = useState<Hex | null>(null);
  const [recovered, setRecovered] = useState<Address | null>(null);

  const [busy, setBusy] = useState<
    null | "prepare" | "sign" | "permit" | "transfer" | "revoke" | "relayer"
  >(null);
  const [error, setError] = useState<string | null>(null);

  const [permitTx, setPermitTx] = useState<Hex | null>(null);
  const [transferTx, setTransferTx] = useState<Hex | null>(null);
  const [revokeTx, setRevokeTx] = useState<Hex | null>(null);
  const [relayerTx, setRelayerTx] = useState<Hex | null>(null);

  const spender: Address | undefined =
    spenderMode === "self"
      ? address
      : isHexAddress(customSpender)
        ? (customSpender.trim() as Address)
        : undefined;

  const state = useTokenState(token, address, spender);
  const decimals = state.decimals;
  const domainVersion = state.version ?? token.domainVersionHint;

  const value = useMemo(() => {
    if (amountMode === "max") return UNLIMITED;
    const raw = (amountMode === "custom" ? customAmount : amountMode).replace(",", ".");
    try {
      return parseUnits(raw || "0", decimals);
    } catch {
      return 0n;
    }
  }, [amountMode, customAmount, decimals]);

  const domain = useMemo<PermitDomain | null>(() => {
    if (!state.name) return null;
    return buildPermitDomain({ address: token.address, name: state.name, version: domainVersion });
  }, [state.name, domainVersion, token.address]);

  const localSeparator = useMemo(() => (domain ? domainSeparator(domain) : null), [domain]);
  const separatorMatches = Boolean(
    localSeparator &&
      state.domainSeparator &&
      localSeparator.toLowerCase() === state.domainSeparator.toLowerCase(),
  );

  const paramsKey = `${token.id}|${spender ?? "none"}|${value.toString()}|${deadlineMinutes}`;
  const stale = prepared !== null && prepared.key !== paramsKey;
  const isSelf = Boolean(address && spender && address.toLowerCase() === spender.toLowerCase());
  const isUnlimited = value >= UNLIMITED;
  const recoveredMatches =
    Boolean(recovered && address) && recovered!.toLowerCase() === address!.toLowerCase();

  const transferable = state.balance < state.allowance ? state.balance : state.allowance;

  function resetSignature() {
    setPrepared(null);
    setSignature(null);
    setRecovered(null);
    setPermitTx(null);
    setTransferTx(null);
    setRevokeTx(null);
    setRelayerTx(null);
  }

  async function prepareRequest() {
    if (!address || !spender || !domain) {
      setError("Falta la cuenta, el spender o los datos del token.");
      return;
    }
    if (!publicClient) {
      setError("No hay cliente RPC disponible.");
      return;
    }
    if (value === 0n && amountMode !== "custom") {
      setError("El importe no es válido. Revisa los decimales del token.");
      return;
    }

    setError(null);
    setBusy("prepare");
    resetSignature();

    try {
      const nonce = await publicClient.readContract({
        address: token.address,
        abi: erc20PermitAbi,
        functionName: "nonces",
        args: [address],
      });
      const deadline = deadlineFromMinutes(deadlineMinutes);
      const message: PermitMessage = { owner: address, spender, value, nonce, deadline };
      const digest = permitDigest(domain, message);

      setPrepared({ key: paramsKey, message, digest });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(null);
    }
  }

  async function signRequest() {
    if (!prepared || !domain) return;

    setError(null);
    setBusy("sign");

    try {
      const typedData = {
        domain,
        types: PERMIT_TYPES,
        primaryType: "Permit" as const,
        message: prepared.message,
      };

      const sig = await signTypedDataAsync(typedData);
      const who = await recoverTypedDataAddress({ ...typedData, signature: sig });

      setSignature(sig);
      setRecovered(who);
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(null);
    }
  }

  async function submitPermit() {
    if (!prepared || !signature || !publicClient || !address) return;

    setError(null);
    setBusy("permit");

    try {
      const fresh = await publicClient.readContract({
        address: token.address,
        abi: erc20PermitAbi,
        functionName: "nonces",
        args: [address],
      });
      if (fresh !== prepared.message.nonce) {
        setError("El nonce ha cambiado. Vuelve a preparar la solicitud.");
        return;
      }

      const { v, r, s } = splitSignature(signature);
      const { message } = prepared;

      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20PermitAbi,
        functionName: "permit",
        args: [message.owner, message.spender, message.value, message.deadline, v, r, s],
      });

      setPermitTx(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("La transacción revirtió. Suele ser nonce repetido o dominio incorrecto.");
      }

      state.refresh();
      setPrepared(null);
      setSignature(null);
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(null);
    }
  }

  async function runTransferFrom() {
    if (!address || !spender || !publicClient) return;
    if (transferable === 0n) {
      setError("No hay allowance disponible para consumir.");
      return;
    }

    setError(null);
    setBusy("transfer");

    try {
      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20PermitAbi,
        functionName: "transferFrom",
        args: [address, spender, transferable],
      });

      setTransferTx(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("transferFrom revirtió.");

      state.refresh();
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(null);
    }
  }

  async function runRelayer() {
    if (!prepared || !signature) return;

    setError(null);
    setBusy("relayer");

    try {
      const res = await fetch("/api/sweep", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: prepared.message.owner,
          token: token.address,
          value: prepared.message.value.toString(),
          deadline: prepared.message.deadline.toString(),
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "El relayer falló");

      setRelayerTx(data.transferTx ?? data.permitTx);
      state.refresh();
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(null);
    }
  }

  async function revokeAllowance() {
    if (!spender) return;

    setError(null);
    setBusy("revoke");

    try {
      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20PermitAbi,
        functionName: "approve",
        args: [spender, 0n],
      });

      setRevokeTx(hash);
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (receipt && receipt.status !== "success") throw new Error("approve(0) revirtió.");

      state.refresh();
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {error ? (
          <Callout tone="danger" title="No se pudo completar la acción">
            {error}
          </Callout>
        ) : null}

        <Card
          step={1}
          title="Token y estado on-chain"
          subtitle="Primero se leen name, decimals, nonces y DOMAIN_SEPARATOR. Nada se firma en este paso."
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-500">
                Token
              </span>
              <select
                value={tokenId}
                onChange={(event) => {
                  setTokenId(event.target.value);
                  resetSignature();
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-500"
              >
                {TOKENS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.symbol} — {item.label}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-[11px] text-zinc-600">{token.note}</span>
            </label>
          </div>
        </Card>

        <Card
          step={2}
          title="Parámetros del permit"
          subtitle="Estos cinco valores son todo lo que autorizas."
        >
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
                Spender (quién podrá mover tus tokens)
              </legend>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
                  <input
                    type="radio"
                    name="spender"
                    checked={spenderMode === "custom"}
                    onChange={() => {
                      setSpenderMode("custom");
                      resetSignature();
                    }}
                    className="mt-0.5 accent-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] text-zinc-200">
                      Dirección del laboratorio
                    </span>
                    <span className="block text-[11px] text-zinc-500">
                      Un tercero podrá mover tus tokens. Es el caso hostil.
                    </span>
                    {spenderMode === "custom" ? (
                      <input
                        value={customSpender}
                        onChange={(event) => {
                          setCustomSpender(event.target.value);
                          resetSignature();
                        }}
                        placeholder="0x…"
                        spellCheck={false}
                        className="mt-2 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-200 outline-none focus:border-zinc-500"
                      />
                    ) : null}
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
                  <input
                    type="radio"
                    name="spender"
                    checked={spenderMode === "self"}
                    onChange={() => {
                      setSpenderMode("self");
                      resetSignature();
                    }}
                    className="mt-0.5 accent-white"
                  />
                  <span>
                    <span className="block text-[12.5px] text-zinc-200">Yo mismo</span>
                    <span className="block text-[11px] text-zinc-500">
                      La opción segura: no hay tercero.
                    </span>
                  </span>
                </label>
              </div>
              {spenderMode === "custom" && customSpender.length > 0 && !isHexAddress(customSpender) ? (
                <p className="mt-2 text-[11px] text-amber-400">
                  Esa dirección no tiene formato válido.
                </p>
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
                Importe autorizado
              </legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["1", "1"],
                    ["10", "10"],
                    ["max", "2^256 − 1"],
                    ["custom", "Otro"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setAmountMode(mode);
                      resetSignature();
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] transition ${
                      amountMode === mode
                        ? "border-zinc-400 bg-zinc-100 text-black"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {mode === "max" ? "Ilimitado" : label}
                  </button>
                ))}
              </div>

              {amountMode === "custom" ? (
                <input
                  value={customAmount}
                  onChange={(event) => {
                    setCustomAmount(event.target.value);
                    resetSignature();
                  }}
                  inputMode="decimal"
                  placeholder={`Cantidad en ${token.symbol}`}
                  className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-500"
                />
              ) : null}

              <p className="mt-2 text-[11px] text-zinc-500">
                Valor exacto: <Mono className="text-zinc-300">{value.toString()}</Mono> (
                {formatAmount(value, decimals)} {token.symbol})
              </p>

              {isUnlimited ? (
                <div className="mt-3">
                  <Callout tone="danger" title="Estás firmando una autorización infinita">
                    <code>2^256 − 1</code> permite mover tu saldo actual y todo lo que llegue en el
                    futuro, hasta que revoques.
                  </Callout>
                </div>
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
                Validez
              </legend>
              <div className="flex flex-wrap gap-2">
                {DEADLINES.map(([minutes, label]) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => {
                      setDeadlineMinutes(minutes);
                      resetSignature();
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] transition ${
                      deadlineMinutes === minutes
                        ? "border-zinc-400 bg-zinc-100 text-black"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="mt-2 block text-[11px] text-zinc-600">
                El deadline se fija al preparar la solicitud.
              </span>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={prepareRequest}
                disabled={!address || !spender || !domain || busy !== null}
                className="rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {busy === "prepare" ? "Leyendo nonce…" : "Preparar solicitud EIP-712"}
              </button>
              {prepared ? <Badge tone="ok">nonce {prepared.message.nonce.toString()}</Badge> : null}
            </div>
          </div>
        </Card>

        <Card
          step={3}
          title="Revisa el payload antes de firmar"
          subtitle="Esto es lo que tu wallet debería enseñarte."
        >
          {!prepared || !domain ? (
            <p className="text-[12px] text-zinc-600">
              Prepara la solicitud en el paso 2 para generar el payload y su digest.
            </p>
          ) : (
            <div className="space-y-4">
              {stale ? (
                <Callout tone="warn" title="Has cambiado los parámetros">
                  Esta solicitud ya no corresponde a la configuración actual. Vuelve a prepararla.
                </Callout>
              ) : null}

              <DomainPreview domain={domain} message={prepared.message} digest={prepared.digest} />

              <dl className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-1">
                <Row label="owner" value={prepared.message.owner} mono />
                <Row
                  label="spender"
                  value={prepared.message.spender}
                  mono
                  tone={isSelf ? "ok" : "warn"}
                  hint={isSelf ? "Eres tú: no hay tercero." : "Tercero: revísalo dos veces."}
                />
                <Row label="deadline" value={formatDeadline(prepared.message.deadline)} />
              </dl>
            </div>
          )}
        </Card>

        <Card
          step={4}
          title="Firma"
          subtitle="Firmar es gratis y no envía nada. La firma solo se convierte en allowance cuando alguien la envía al contrato."
        >
          {!prepared ? (
            <p className="text-[12px] text-zinc-600">Primero prepara la solicitud.</p>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={signRequest}
                disabled={stale || busy !== null}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {busy === "sign" ? "Esperando a la wallet…" : "Firmar con EIP-712"}
              </button>

              {signature ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">signature</p>
                      <CopyButton value={signature} />
                    </div>
                    <p className="mt-2 break-all font-mono text-[10.5px] text-zinc-300">
                      {signature}
                    </p>
                  </div>

                  <dl className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-1">
                    <Row label="r" value={`${signature.slice(0, 10)}…${signature.slice(-6)}`} mono />
                    <Row label="s" value="incluido en la firma (65 bytes)" mono />
                    <Row label="v" value={parseInt(signature.slice(130, 132), 16)} mono />
                    <Row
                      label="recovered"
                      value={recovered ?? "…"}
                      mono
                      tone={recoveredMatches ? "ok" : "warn"}
                      hint={recoveredMatches ? "Coincide con owner." : "No coincide: no la envíes."}
                    />
                  </dl>

                  <Callout tone={recoveredMatches ? "ok" : "danger"}>
                    {recoveredMatches
                      ? "La firma recupera tu dirección: el contrato la aceptará si el dominio y el nonce son correctos."
                      : "La firma no recupera la dirección del owner. Algo no cuadra: no la envíes."}
                  </Callout>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card
          step={5}
          title="Enviar, usar y revocar"
          subtitle="Convertir la firma en estado on-chain, gastar la allowance y dejarla a cero."
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                5a · Ejecutar desde el relayer
              </p>
              <button
                type="button"
                onClick={runRelayer}
                disabled={!signature || stale || busy !== null}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {busy === "relayer"
                  ? "Ejecutando…"
                  : "Enviar permit y transferFrom desde el relayer"}
              </button>
              <p className="text-[11px] leading-relaxed text-zinc-600">
                El gas lo paga el servidor. Tu cuenta no envía ninguna transacción.
              </p>
              {relayerTx ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2">
                  <span className="text-[11px] text-emerald-300">Relayer confirmado</span>
                  <TxLink hash={relayerTx} />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                5b · Enviar el permit desde tu cuenta
              </p>
              <button
                type="button"
                onClick={submitPermit}
                disabled={!signature || stale || busy !== null}
                className="w-full rounded-lg border border-zinc-600 px-4 py-2.5 text-[13px] font-semibold text-zinc-100 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                {busy === "permit" ? "Enviando…" : "Enviar permit on-chain"}
              </button>
              {permitTx ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2">
                  <span className="text-[11px] text-emerald-300">Permit confirmado</span>
                  <TxLink hash={permitTx} />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                5c · Consumir la allowance
              </p>
              <dl className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-1">
                <Row
                  label="allowance actual"
                  value={`${formatAmount(state.allowance, decimals)} ${token.symbol}`}
                  mono
                  tone={state.allowance > 0n ? "warn" : undefined}
                />
                <Row
                  label="transferible ahora"
                  value={`${formatAmount(transferable, decimals)} ${token.symbol}`}
                  mono
                />
              </dl>

              {!isSelf ? (
                <Callout tone="warn" title="Con spender externo, usa el relayer (5a)">
                  <code>transferFrom</code> lo tiene que enviar el spender, y tu cuenta es el owner.
                  Cambia a “Yo mismo” si quieres hacerlo a mano.
                </Callout>
              ) : null}

              <button
                type="button"
                onClick={runTransferFrom}
                disabled={transferable === 0n || busy !== null || !isSelf}
                className="w-full rounded-lg border border-zinc-600 px-4 py-2.5 text-[13px] font-semibold text-zinc-100 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                {busy === "transfer"
                  ? "Ejecutando transferFrom…"
                  : `Ejecutar transferFrom (${formatAmount(transferable, decimals)} ${token.symbol})`}
              </button>
              {transferTx ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2">
                  <span className="text-[11px] text-emerald-300">transferFrom confirmado</span>
                  <TxLink hash={transferTx} />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">5d · Revocar</p>
              <button
                type="button"
                onClick={revokeAllowance}
                disabled={!spender || state.allowance === 0n || busy !== null}
                className="w-full rounded-lg border border-rose-500/40 px-4 py-2.5 text-[13px] font-semibold text-rose-300 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                {busy === "revoke" ? "Revocando…" : "Revocar con approve(spender, 0)"}
              </button>
              {revokeTx ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2">
                  <span className="text-[11px] text-emerald-300">Allowance revocada</span>
                  <TxLink hash={revokeTx} />
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <Card title="Checklist antes de firmar">
          <ul className="space-y-2 text-[12px] leading-relaxed text-zinc-400">
            <li>1. ¿El <code>spender</code> es una dirección que reconozco?</li>
            <li>2. ¿El <code>value</code> es el importe que quiero, o es infinito?</li>
            <li>3. ¿El <code>deadline</code> es razonable?</li>
            <li>4. ¿El dominio (<code>name</code>, <code>version</code>) es el del token real?</li>
            <li>5. ¿La web me enseña el payload o solo un botón bonito?</li>
          </ul>
          <p className="mt-3 text-[11px] text-zinc-600">Si alguna respuesta es “no lo sé”, no firmes.</p>
        </Card>

        <Card title="Qué no hace esta app">
          <ul className="space-y-2 text-[12px] leading-relaxed text-zinc-400">
            <li>No guarda ni pide claves privadas en el cliente.</li>
            <li>No mueve fondos a ninguna dirección distinta del spender.</li>
            <li>No funciona fuera de Arbitrum One.</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}