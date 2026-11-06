# VerseSlots (working name)

A geo/GPS-based virtual mall metaverse, living in this HOMOVERSE repo under `verseslots/`. Walk a digital version of your town's walking mall, see other players' avatars with their status, and play a slot machine on a storefront. You can play remotely from anywhere. Players who are physically near a real storefront get a bonus multiplier.

> **Play money only.** The odds and payouts are placeholders. This demo does not take real money, tokens, or deposits, and it does not promise winnings. Real-money or token-based gambling would require licensing and legal review in each jurisdiction and is not part of this package.

## Stack
Vite + React + TypeScript · React Three Fiber + drei · Liveblocks (presence + broadcast) · Vercel

## Architecture
- **Scene** (`src/components/Scene.tsx`): the street, 4 storefront boxes, and WASD/arrow movement. A storefront glows and gets a fire marker when 2+ avatars cluster at it (a "hot machine").
- **Touch joystick** (`src/components/TouchJoystick.tsx`, `src/lib/moveInput.ts`): an on-screen stick for mobile. It writes an analog move vector that the scene prefers over WASD while the stick is held.
- **Avatars** (`src/components/Avatar.tsx`): capsule avatars with a status dot (green = active, yellow = idle after 30s, grey = offline).
- **SlotMachine** (`src/components/SlotMachine.tsx`): a placeholder machine on the Gold Rush facade. It has 3 reels, a fake spin animation, and a win/lose result. A 3-of-a-kind pays 10 × multiplier in play-money credits. Odds are placeholders, not a real paytable or RTP.
- **Multiplayer** (`src/liveblocks.ts`, `src/App.tsx`): each client publishes `{x, z, color, name, status}` as Liveblocks presence in room `verseslots-mall-1`. Wins are sent with `useBroadcastEvent` to everyone's win feed. With no key, the app runs in **solo mode**.
- **Geo** (`src/hooks/useGeolocation.ts`, `src/lib/geo.ts`): wraps `navigator.geolocation.watchPosition`. Haversine `distanceToBuilding()` and `proximityMultiplier()` give 2x within 50 m, 1.5x within 200 m, and 1x for remote play. Building lat/lng values in `src/lib/buildings.ts` are placeholders.

## File tree
```
verseslots/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── .env.example
├── .gitignore
└── src/
    ├── main.tsx
    ├── App.tsx              # solo vs multiplayer, HUD, win feed, geo multipliers
    ├── liveblocks.ts        # client + typed room context
    ├── components/
    │   ├── Scene.tsx
    │   ├── Avatar.tsx
    │   ├── SlotMachine.tsx
    │   └── TouchJoystick.tsx
    ├── hooks/useGeolocation.ts
    └── lib/
        ├── buildings.ts
        ├── geo.ts
        └── moveInput.ts
```

## Run locally
From the HOMOVERSE repo root:

```bash
cd verseslots
npm install
cp .env.example .env.local   # optional, add your Liveblocks public key
npm run dev                  # http://localhost:5173
```

To test multiplayer, open two browser tabs. Geolocation needs `localhost` or HTTPS and your permission.

## Liveblocks key
1. Create a project at https://liveblocks.io/dashboard.
2. Copy the **public** key (`pk_...`).
3. Set `VITE_LIVEBLOCKS_PUBLIC_KEY=pk_...` in `verseslots/.env.local`. No server is needed. Do not commit `.env` or `.env.local`.

## Deploy to Vercel
1. Push to GitHub, then go to Vercel → New Project → import the HOMOVERSE repo.
2. Set the project **Root Directory** to `verseslots` so this app builds on its own, separate from anything at the repo root.
3. Framework preset: **Vite** (build `npm run build`, output `dist`). `vercel.json` already sets these.
4. Settings → Environment Variables: add `VITE_LIVEBLOCKS_PUBLIC_KEY` (the public key only), then redeploy.

## Next steps
These are product ideas, not implemented behavior and not offers of value:

- Real slot math: reel strips, paytable, target RTP, and a certified RNG — still play-money until a licensed product exists.
- Jackpot logic: progressive and per-building exclusive jackpots for players on-site, plus server-side validation (move spins off the client).
- Map real mall buildings to real coordinates, and add anti-GPS-spoofing checks.
- B2B brand licensing layer: let storefront brands sponsor or skin machines.
- Any ERC-20 or other token integration, only after licensing and legal review. This demo does not include one.
- Auth and persistent profiles/credits (Liveblocks Storage or a backend).
