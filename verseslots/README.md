# HOMOVERSE walking mall

Local (and preview) build of an open-air dusk promenade for HOMOVERSE: a ring of inward-facing shops around a plaza, a black-marble fountain with a gold H monogram, and five enterable interiors. It runs with no account. Location is optional.

> **Demo credits are not HOMO tokens.** They are simulated play money, granted automatically. They have no cash value and cannot be bought, transferred, or redeemed. The only slot is **Golden Hour**, inside the Golden Hour Lounge. Odds are a placeholder, not certified math.

> **HOMOV membership is read-only.** The optional wallet / paste-address check reads `balanceOf` for HomoVERSE (HOMOV) on Base (`0x1C9819c04C6d8Af322aAd71F56ABF51690173136`) from public RPCs. The app never sends a transaction, never requests an approval, and never moves tokens. A client-side balance at or above 1 HOMOV can unlock a cosmetic **HOMO Member** badge and the Members' Booth inside the lounge. This is not server-enforced. **Read-only. We never move your tokens.** HOMO is a membership emblem, not a financial product, and this check promises no value, yield, or prize.

## Setup

From the HOMOVERSE repo root:

```bash
cd verseslots
npm install
npm test
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Optional Liveblocks presence: copy `.env.example` to `.env.local` and set `VITE_LIVEBLOCKS_PUBLIC_KEY`. Without that key the app stays in solo mode. Do not commit `.env` or `.env.local`.

## How to play

- You spawn in the plaza, facing the fountain. Golden Hour Lounge stands due north, beyond the fountain, with a **DEMO SLOT · GOLDEN HOUR** sign.
- Walk with the bottom-left stick. Drag to look. Q/E or WASD / arrows work on desktop.
- **Search** finds every store (enterable ones are marked). Walk there, or Jump to the door.
- Stand at a door and tap **Enter**. A short fade takes you inside. **Exit** returns you to the door.
- Enterable shops: Golden Hour Lounge (demo slot inside), The Tailor, The Café, Members' Lounge (home of **Homo Bingo**), and homoGAP (link to the real merch shop, new tab). Other façades are window-shopping only.
- Laurent greets at the Golden Hour door, Jules Wren keeps the Tailor, Wes Holloway sits the plaza bench. Thought bubbles are light and not about money.
- **User** holds your local name, avatar shortcut, demo balance, mute, and the read-only HOMOV tools (Connect wallet, or paste an address / basename). A pasted address is a preview; use **Prove wallet** (a free `personal_sign`, no gas) or connect the matching wallet to wear the badge and enter the Members' Booth. Accounts coming soon.
- **Quality** is High, Medium, or Low. High uses the dusk HDRI, shadows, SSAO, bloom, and AgX tone mapping. Medium keeps the HDRI, shadows, and a lighter bloom. Low caps DPR at 1 and drops the heavy passes so mid-range phones can stay near 30 fps. The app picks a default from device memory and whether you are on a phone; you can change it any time. It is remembered on this device.
- **Use my location** is optional and never required for walking, interiors, or the demo slot.
- **Reset local demo** clears the saved avatar, layout, name, and demo-credit balance on this device. Mute is kept.

## Membership ranks (cosmetic only)

Read from the on-chain HOMOV balance, never spent:

| Rank | Whole HOMOV | What it changes |
| --- | --- | --- |
| Guest | 0 | Default visit. Demo slot still plays. |
| Member | ≥ 1 | Gold “HOMO Member” badge and the Members' Booth. |
| Gold | ≥ 1,000 | Gold name-tag color. |
| Velvet | ≥ 10,000 | Mauve name-tag color. |

Thresholds live in `src/lib/homov.ts`. A pasted address is a preview only; connect an injected wallet (or optionally sign a free `personal_sign`) to wear the badge and enter the booth. The gate is checked in the browser. A later production build would need a server or indexer to verify the same `balanceOf` result before granting a session.

## Homo Bingo

A free 5×5 game in the Members' Lounge, also listed in Search and marked on the promenade. Columns are H-O-M-O-V. The center square is a free gold H. Other squares mix numbers, house symbols (gold H, crown, diamond, champagne), and world names (Golden Hour Lounge, The Tailor, The Café, homoGAP, Laurent, Jules Wren, Wes Holloway, Members' Lounge). Laurent or Jules call the next square every few seconds. Tap a called square to daub it. After a BINGO, or any time, **New card** deals a fresh card without touching your real HOMOV.

Each daub spends one **demo HOMOV dauber**, shown as a gold HOMOV coin stamp. You get 25 free demo daubers per card and can refill for free. These are a local counter only. They are never deducted from, and never linked to, a real on-chain HOMOV balance. There are no transactions and no approvals. If a wallet is connected and verified as a member, the coin stamp uses a cosmetic gold-coin skin and the free pack is slightly larger by rank (still demo only). **Demo daubers. Your real HOMOV is never spent.** A BINGO (row, column, or diagonal) throws pink-and-gold confetti and can grant a few demo credits. No real money, no prizes, no token transfers.

## Quality limits

This is a stylized boutique evening, not photoreal architecture and not a GTA-like city. Storefronts use CC0 PBR maps from Poly Haven (see `ASSETS.md`) with gold trim, pilasters, cornices, awnings, and lit glass, plus distance LOD. Interiors are stylized rooms with tiled floors, not scanned spaces. A dusk HDRI (Joburg Central Sunset) lights the plaza on High and Medium, with fog, shadows, optional AO and bloom, and AgX or ACES tone mapping. Characters are still mannequins with better heads, collars, and Laurent's gold H pin — not photogrammetry. Fallback procedural canvases load if a texture fails. The look is closer to a lit stage set than a photograph.

## Safeguards

- Location is off until **Use my location**. Failure does not block walking, avatar, shops, or the demo slot.
- Raw coordinates are not rendered, logged, or stored.
- HOMOV is read with `eth_call` only, through `https://mainnet.base.org` (fallback `https://base-rpc.publicnode.com`). No paid API key. No contract is deployed. No token is transferred or spent. The demo slot still uses demo credits only.
- Incoming multiplayer wins still have to be the known Golden Hour id, a play-money amount from 1 to 20, and at most one accepted win per connection per second.

## Not in this build

- Real mall or street detection, paid maps, or directions.
- Wallets that spend, approve, or transfer HOMOV; cashout; prizes with real value; or any on-chain write.
- Server-side enforcement of the membership gate.
- App Store / Play Store builds and a claim that this is photoreal.
