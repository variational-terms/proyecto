import type { ReactNode } from "react";
import { Callout } from "./ui";

function Item({ children }: { children: ReactNode }) {
  return <li className="pl-4 text-[12px] leading-relaxed text-zinc-400 [&::marker]:text-zinc-600">{children}</li>;
}

export function DrainerAnatomy() {
  return (
    <div className="space-y-4">
      <Callout tone="danger" title="Anatomía de un drainer (para reconocerlo)">
        El patrón es idéntico a una demo de permit, con tres cambios: el <code>spender</code> es
        una dirección del atacante, el <code>value</code> es <code>2^256-1</code> y el
        <code>deadline</code> es de años. La wallet muestra “Permit” y firmar no cuesta gas, por
        eso funciona.
      </Callout>

      <ul className="list-disc space-y-2">
        <Item>
          <span className="text-zinc-200">Unlimited allowance.</span> Firmar por{" "}
          <code className="text-zinc-300">2^256-1</code> autoriza a mover todo el saldo, ahora y en
          el futuro. En esta demo el valor máximo hay que elegirlo a mano y está marcado.
        </Item>
        <Item>
          <span className="text-zinc-200">Spender oculto.</span> Si la UI no dice a quién autorizas,
          no firmes. Aquí es un campo visible y por defecto eres tú.
        </Item>
        <Item>
          <span className="text-zinc-200">Relayer que cobra.</span> Un backend con una clave privada
          ejecutando <code>transferFrom</code> hacia una dirección fija. Este proyecto no tiene ni
          backend ni clave privada.
        </Item>
        <Item>
          <span className="text-zinc-200">Contexto inventado.</span> Términos de servicio falsos,
          contadores de TGE, “verificación de cuenta”. Nada de eso requiere mover tokens.
        </Item>
        <Item>
          <span className="text-zinc-200">Y el detalle legal:</span> una firma EIP-712 válida es
          autorización suficiente. No hay chargeback. Por eso el paso de leer el payload es el
          único control real que tienes.
        </Item>
      </ul>

      <Callout tone="ok" title="Qué sí es legítimo">
        Un permit es legítimo cuando dice explícitamente a quién autorizas, por cuánto y hasta
        cuándo, y cuando tú eres quien decide ejecutar la transferencia después.
      </Callout>
    </div>
  );
}
