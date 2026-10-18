# Despliegues

## Testnet — v2 (actual, usado por el frontend)

`v2` añade `EventConfig.open_admission`: cuando es `true`, `join` no exige que
el organizador llame antes a `authorize_participant` para esa dirección. Se
agregó porque el frontend no tiene backend propio para aprobar cada wallet
que se conecta — un evento público de demo necesita admisión abierta. Los
eventos "reales" (con revisión de solicitud) deben seguir creándose con
`open_admission: false` y usar `authorize_participant`.

| Campo | Valor |
|---|---|
| Contrato `BuildBond` v2 | `CCLJNTWWDKPVT4LFXH7QLZSLV3FKOTRC5DZX3MVPW3C5Y5PFKUH7AVHQ` |
| Evento público de demo | `event_id = 1`, `open_admission = true`, monto `50 XLM` (`500000000` stroops), ventana de inscripción ~90 días desde el despliegue (2026-10-18) |
| Verificado con wallet nunca autorizada | tx `fb1fe94c…` — depósito de 50 XLM confirmado sin llamada previa a `authorize_participant` |

Reutiliza las mismas direcciones de gobernanza/organizador/revisor/árbitro y
el mismo SAC de XLM nativo que la v1 (ver abajo). La v1 sigue desplegada y
con sus bonds de prueba intactos, pero el frontend debe apuntar a **v2**.

## Testnet — v1 (verificación inicial del ciclo completo)

| Campo | Valor |
|---|---|
| Red | Stellar Testnet (`Test SDF Network ; September 2015`) |
| RPC | `https://soroban-testnet.stellar.org` |
| Contrato `BuildBond` | `CA7RKAA7GG6UFVM2XNXNQ26Y7RPQMVHNQNH3QKI53QP5CILJ4M75HQ4P` |
| Wasm hash | `69b37c492cc6cc178779ab7d01244306aad992453e4d037473a10c61e6878d9f` |
| Token permitido | XLM nativo vía SAC: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Gobernanza | `GAANQHDRLYGBPMA4SZ4KODY4SSFXJHJFBFX6I5R7HH7FDGFPTJDWFBA3` (alias `buildbond-gov`, solo testnet) |
| Organizador demo | `GCNKNFKBAAV2LTJYQTJRUDHCYOK3QQS3VOVDEXX3J5YALZKJ5OOBRHCR` (alias `buildbond-organizer`) |
| Revisor demo | `GDOAALE7WWHLYTPIFLSVBHHW4BYCP6S4CJ4QZVD7V6EMEJYI6EDDDDZR` (alias `buildbond-reviewer`) |
| Árbitro demo | `GBP3JKSDAHOHP3X3URU255JRPEV5TP5JCI2YYOQL7HOZUDF4HV7LEBAH` (alias `buildbond-arbiter`) |

Todas las identidades anteriores viven solo en el keystore local de `stellar-cli`
(`~/.config/stellar/identity/*.toml`, ignorado por git) y están fondeadas con
Friendbot — no custodian ni representan valor real. Deben regenerarse para
cualquier despliegue fuera de este demo.

### Evento 1 — demo pública de larga duración

Creado para que la app pueda usarse durante un rato sin prisa: ventana de
inscripción de 1 hora, inicio y entrega con margen de horas. `event_id = 1`,
monto 1 XLM (`10000000` stroops), `recovery_enabled = true`.

### Verificación end-to-end realizada en testnet (2026-10-18)

Replica los criterios de aceptación de la sección 13.1 de `contrato.md`, con
eventos de ciclo corto creados solo para esta verificación (`event_id 2`
quedó sin usar por una ventana de tiempo demasiado ajustada; `event_id 3` y
`event_id 4` sí se usaron):

1. `event_id 3`: dos hackers (`buildbond-hacker1`, `buildbond-hacker2`)
   depositan 1 XLM cada uno → `bond_id 1` y `bond_id 2`. Transferencia real
   confirmada hacia el contrato (tx `cb314c82…`, `07f73fff…`).
2. Hacker1 entrega, el revisor aprueba (`bond_id 1`) y reclama → recibe su
   1 XLM de vuelta (tx `51752d53…`).
3. Hacker2 no entrega; al pasar el plazo, `finalize` lo deja `Frozen` sin
   pérdida de principal (tx `a9517e93…`).
4. `event_id 4`: hacker2 se inscribe de nuevo, vincula el bond congelado
   (`link_recovery` implícito en `join` vía `old_bond_ids: [2]` → evento
   `RecoveryLinked old_bond_id=2 target_bond_id=3`, tx `c630db70…`).
5. Hacker2 entrega en el evento 4, el revisor aprueba (`bond_id 3`),
   `sync_recovery([2])` libera también el bond congelado del evento 3
   (tx `651743a3…`).
6. `claim(hacker2, [2,3])` transfiere **2 XLM en una sola operación**
   agrupada por token — el principal de ambos eventos devuelto de una vez
   (tx `88ed82a8…`).

Esto confirma en cadena real la regla central del producto: nunca se pierde
principal por no entregar, y completar un evento posterior recupera también
los depósitos congelados vinculados.

Todas las transacciones son visibles en
`https://stellar.expert/explorer/testnet/tx/<hash>`.
