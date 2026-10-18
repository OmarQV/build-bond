# Build Bond · Stellar Apex

Build Bond es un prototipo de inscripción a hackathons con depósitos de compromiso reembolsables en Stellar. La interfaz Stellar Apex permite explorar eventos, completar una solicitud y confirmar la participación mediante un stake firmado con Freighter y registrado en un contrato Soroban.

El mecanismo incentiva la participación: completar un evento permite recuperar el depósito; no entregar congela el principal y completar otro evento puede liberar depósitos anteriores vinculados, según las reglas del contrato.

## Equipo

- Omar Quispe
- Alejandro Cosulich
- Jhamil Mamani
- Saul Choquehuanca

## Contratos desplegados en Testnet

| Despliegue | Dirección | Uso |
| --- | --- | --- |
| BuildBond v1 | [`CA7RKAA7GG6UFVM2XNXNQ26Y7RPQMVHNQNH3QKI53QP5CILJ4M75HQ4P`](https://stellar.expert/explorer/testnet/contract/CA7RKAA7GG6UFVM2XNXNQ26Y7RPQMVHNQNH3QKI53QP5CILJ4M75HQ4P) | Despliegue inicial compartido por el equipo y pruebas del ciclo del contrato. |
| BuildBond v2 | [`CCLJNTWWDKPVT4LFXH7QLZSLV3FKOTRC5DZX3MVPW3C5Y5PFKUH7AVHQ`](https://stellar.expert/explorer/testnet/contract/CCLJNTWWDKPVT4LFXH7QLZSLV3FKOTRC5DZX3MVPW3C5Y5PFKUH7AVHQ) | Contrato configurado actualmente en el frontend; incluye admisión abierta para la demo. |

La configuración por defecto utiliza el evento `1` de v2, con un depósito de **50 XLM**. El historial y las diferencias entre versiones están en [DEPLOYMENTS.md](Contracts/build-bond/DEPLOYMENTS.md). Los activos utilizados pertenecen a Stellar Testnet.

### Prueba de staking

El equipo ya realizó pruebas de staking. Evidencia compartida por Omar:

- [Ver transacción de staking en Stellar Expert](https://stellar.expert/explorer/testnet/tx/e7f693f7f4205dedb9f892d3ea6948a02b2625115ddf91383e9dd8b69f33f526)
- Hash: `e7f693f7f4205dedb9f892d3ea6948a02b2625115ddf91383e9dd8b69f33f526`
- La captura de la prueba muestra **50 XLM**, wallet **Freighter**, evento **BB101 - DEMO/PITCH FINAL(MX)** y estado **CONFIRMADO · REEMBOLSABLE**.

Esta evidencia documenta el depósito. Las pruebas de devolución, congelamiento y recuperación del contrato se describen por separado en [el registro de despliegues](Contracts/build-bond/DEPLOYMENTS.md).

## Probar la aplicación

1. Desde la presentación inicial, pulsa **Probar demo**, abre una hackathon y selecciona el rol **Hacker**.
2. Revisa y envía la solicitud; continúa al paso de staking.
3. Conecta Freighter configurada en **Testnet**. Si la cuenta no está fondeada, la interfaz ofrece Friendbot.
4. Mantén al menos **51.5 XLM** de saldo para el stake de 50 XLM y el margen de reserva/comisiones que exige la interfaz.
5. Firma en Freighter y espera la confirmación. El comprobante incluye un enlace a la transacción en Stellar Expert.

Si la wallet ya tiene un Build Bond en el evento de demo, la aplicación muestra el depósito existente y su estado sin solicitar una nueva firma.

También existe un **modo demo** sin Freighter: simula el flujo de confirmación y no envía una transacción a la red. El staking real integrado actualmente solo acepta XLM.

La lista de hackathons y la aceptación de solicitudes usan datos de demostración. Actualmente todos los eventos de la interfaz depositan en el mismo evento de demo del contrato; todavía no hay una asociación individual entre cada hackathon y un evento on-chain. La devolución y los demás pasos del ciclo del contrato aún no cuentan con interfaz propia.

## Desarrollo local

Requisitos: Node.js compatible con Vite 8 (20.19+ o 22.12+) y pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre la dirección local indicada por Vite.

```bash
pnpm build    # TypeScript y compilación de producción
pnpm lint     # Revisión con Oxlint
pnpm preview  # Vista previa de la compilación
```

### Configuración de Testnet

Los valores predeterminados están en `src/lib/stellar.ts`. Para utilizar otra instancia, copia `.env.example` a `.env.local` y configura:

| Variable | Propósito |
| --- | --- |
| `VITE_BUILD_BOND_CONTRACT_ID` | Dirección del contrato Soroban. |
| `VITE_BUILD_BOND_EVENT_ID` | ID del evento al que se deposita. |
| `VITE_BUILD_BOND_RULES_HASH` | Hash de reglas que debe coincidir con el evento del contrato. |

Reinicia Vite después de cambiar las variables. El monto mostrado por la interfaz está fijado en `BUILD_BOND_AMOUNT_XLM`; si usas otro evento, debe coincidir con su configuración. La aplicación solicita firmas a Freighter y no requiere claves privadas en variables de entorno.

## Tecnologías y estructura

- **Frontend:** React 19, TypeScript y Vite 8.
- **Stellar:** Freighter API, Stellar SDK, Horizon, Soroban RPC y Friendbot de Testnet.
- **Contrato:** Rust con Soroban.

```text
src/App.tsx                  Lista de hackathons y selección de rol
src/Landing.tsx              Presentación inicial de Build Bond
src/HackerApplication.tsx    Solicitud de participación
src/StakeStep.tsx             Conexión, depósito y comprobante
src/lib/stellar.ts            Configuración e integración con Stellar
public/images/hackathons/    Banners de los siete eventos
Contracts/build-bond/        Workspace del contrato Soroban
docs/                        Documentación del proyecto
```

Los banners comparten la paleta negra, amarilla y cian de Stellar Apex. Los títulos permanecen como texto HTML y las imágenes se entregan en WebP. Los prompts y el registro de producción están en [HACKATHON-BANNERS.md](docs/HACKATHON-BANNERS.md).
