# Permit Lab — EIP-2612 en Arbitrum One

Laboratorio para ver, paso a paso, qué autoriza realmente una firma EIP-2612 (`permit`)
sobre un token ERC-20 — y para ejecutarla después desde un relayer, sin que la víctima
envíe ninguna transacción.

El repo implementa **los dos modos**: el seguro (`spender` = tú mismo, importe 1, plazo
corto) y el hostil (`spender` = tercero, `2^256 − 1`, plazo de años, ejecución por API).
La diferencia entre ambos no es tecnológica: son cuatro parámetros y quién pulsa el botón.

Todo ocurre en **Arbitrum One (42161)** con USDC real.

---

## Qué demuestra

1. **Lectura on-chain** de `name`, `decimals`, `nonces`, `allowance` y `DOMAIN_SEPARATOR()`.
2. **Construcción del dominio EIP-712** y comparación con el `DOMAIN_SEPARATOR` del contrato.
   Si `name` o `version` no coinciden, la firma falla: es el error nº 1 en integraciones reales.
3. **Payload exacto** que se firma, con su digest (`hashTypedData`).
4. **Firma** con `signTypedData` y recuperación de la dirección (`recoverTypedDataAddress`)
   *sin enviar nada*.
5. **Ejecución desde el relayer**: `permit` + `transferFrom` en una sola llamada, con el gas
   pagado por el servidor.
6. **Envío manual del permit** y **revocación** con `approve(spender, 0)`, como vía alternativa
   y para inspeccionar el estado on-chain.

---

## Requisitos

- Node.js 20+
- Una wallet de navegador (MetaMask, Rabby…)
- **ETH real en Arbitrum One** para la wallet del relayer (≈0,001 ETH da para decenas de operaciones)

## Variables de entorno

```bash
cp .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>.

### Token para las pruebas

**Opción A — contrato propio (recomendado).**
`contracts/MockPermitToken.sol` es un ERC-20 con `ERC20Permit` de OpenZeppelin y `mint` abierto.

Con Foundry:

```bash
# en la raíz del repo
forge create contracts/MockPermitToken.sol:MockPermitToken \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Copia la dirección desplegada en `.env.local`:

```
NEXT_PUBLIC_DEMO_TOKEN_ADDRESS=0x...
```

Con Remix: pega el contrato, compila con `^0.8.24` y, si el import de OpenZeppelin no se
resuelve, fija la versión: `@openzeppelin/contracts@5.0.2/token/ERC20/extensions/ERC20Permit.sol`.
Despliega en Arbitrum Sepolia con *Injected Provider*.

Después, desde la propia app o con `cast`, acuña saldo de prueba:

```bash
cast send 0xTU_TOKEN "mint(address,uint256)" 0xTU_WALLET 100000000 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY
```

(100000000 = 100 dUSDC con 6 decimales.)

**Opción B — USDC de Circle en testnet.**
Si no defines `NEXT_PUBLIC_DEMO_TOKEN_ADDRESS`, la app usa el USDC de Arbitrum Sepolia
(`0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`, dominio `"USD Coin"` / `"2"`). Consíguelo en
<https://faucet.circle.com>. Verifica la dirección en la documentación de Circle antes de usarla.

---

## Recorrido sugerido

1. Conecta una **wallet nueva** de testnet y cambia a Arbitrum Sepolia.
2. Paso 1: observa `nonces(owner)` y `DOMAIN_SEPARATOR()`.
3. Paso 2: deja el spender en **“Yo mismo”** y el importe en **1**.
4. Pulsa **Preparar solicitud**. El nonce se lee en ese instante y el deadline queda fijado.
5. Paso 3: compara el payload con lo que te enseña tu wallet. Deben ser idénticos.
6. Paso 4: firma. La app recupera la dirección y comprueba que es la tuya. Nada se ha enviado.
7. Paso 5a: envía el `permit`. Verás `allowance = 1` y `nonces = 1`.
8. Paso 5b: ejecuta `transferFrom`. Con spender = tú, el saldo no cambia pero la allowance
   vuelve a `0`.
9. Repite con **Ilimitado** para ver el caso peligroso y revuélvelo en 5c.
10. Repite con una **segunda wallet tuya** como spender. Observa que `transferFrom` debe enviarlo
    el spender, no el owner: el botón se desactiva y la app explica por qué.

---

## Errores que este laboratorio hace visibles

| Síntoma | Causa habitual |
| --- | --- |
| `permit` revierte con firma válida | `name`/`version` del dominio distintos a los del token |
| `permit` revierte tras un intento correcto | nonce ya consumido; vuelve a preparar la solicitud |
| La firma recupera otra dirección | la wallet firmó otro `chainId` o cambió el payload |
| `transferFrom` revierte | `msg.sender` no es el `spender` |
| `allowance` no baja tras `transferFrom` | la allowance se consumió hasta el mínimo entre saldo y allowance |
| `v` inválido | algunas wallets devuelven `0/1`; hay que normalizar a `27/28` |

## Detalles que se suelen pasar por alto

- **El nonce se consume, no se “gasta” el permiso**: cada firma sirve una sola vez.
- **Cualquiera puede enviar el permit**. No hace falta ser el owner ni el spender. Por eso un
  buscador de mempool puede adelantar tu transacción, aunque el resultado sea el mismo.
- **El deadline es parte de la firma**. No se puede “ampliar” sin volver a firmar.
- **No todos los ERC-20 implementan EIP-2612**. USDT, por ejemplo, no lo tiene.
- **Una firma no es una transacción**: no cuesta gas, y por eso se firma sin pensar. Ese es
  justamente el vector.

## Cómo distinguir esta demo de un drainer

| | Esta demo | Drainer |
| --- | --- | --- |
| `spender` | tu propia cuenta por defecto | dirección del atacante, fija |
| `value` | 1 por defecto | `2^256 − 1` |
| `deadline` | 30 min | años |
| Quién envía | tú | un relayer con clave privada |
| Servidor | ninguno | API con `transferFrom` automático |
| Contexto | “vas a ver el mecanismo” | “verifica tu cuenta / acceso anticipado” |

Si una web te pide una firma EIP-712 y no te muestra `spender`, `value` y `deadline`, la
respuesta es cerrar la pestaña.

## Estructura

```
app/                 layout, page, providers (wagmi + react-query)
components/          ConnectGate, PermitLab, TokenInspector, DomainPreview, DrainerAnatomy
hooks/useTokenState  lecturas ERC-20 + permit
lib/                 constants, tokens, erc20 ABI, permit (EIP-712), format
contracts/           MockPermitToken.sol (OpenZeppelin ERC20Permit)
```

## Añadir WalletConnect (opcional)

El proyecto usa solo el conector `injected` para no arrastrar dependencias. Para soportar QR:

```bash
npm i @walletconnect/ethereum-provider
```

```ts
import { walletConnect } from "wagmi/connectors";

connectors: [
  injected({ shimDisconnect: true }),
  walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!, showQrModal: true }),
]
```

## Comprobaciones útiles con cast

```bash
cast call $TOKEN "DOMAIN_SEPARATOR()(bytes32)" --rpc-url $RPC
cast call $TOKEN "nonces(address)(uint256)" $OWNER --rpc-url $RPC
cast call $TOKEN "allowance(address,address)(uint256)" $OWNER $SPENDER --rpc-url $RPC
cast call $TOKEN "version()(string)" --rpc-url $RPC
```

## Licencia

MIT. Úsalo en testnet y para aprender.
