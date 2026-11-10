# VerseSlots prototype

Local browser prototype of an open-air pedestrian district for HOMOVERSE. You can walk a promenade and plaza, change a stylized avatar, and spin a slot for demo credits. It runs with no account and no location permission.

The district is **procedural and synthetic**. It is not a scan of a real mall, not a map, and not directions. Storefront names are fictional labels.

> **Demo credits are not HOMO tokens.** They are simulated play money, granted automatically. They have no cash value and cannot be bought, transferred, or redeemed. This build has no wallet, no token balance, no purchase, and no wagering of anything with real value.

## Setup

From the HOMOVERSE repo root:

```bash
cd verseslots
npm install
npm test
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Optional Liveblocks presence: copy `.env.example` to `.env.local` and set `VITE_LIVEBLOCKS_PUBLIC_KEY`. Without that key the app stays in solo mode. Do not commit `.env` or `.env.local`.

## Mobile testing

Use a phone-sized window or the browser’s device toolbar (portrait and landscape). This repo was exercised in desktop Chrome with a mobile viewport and touch emulation, **not** on a physical iPhone or Android device.

- Walk with the bottom-left stick. Up on the stick walks the way the camera faces.
- Drag the view to look. Q and E, or WASD / arrow keys, are the desktop fallback.
- Stand at a gold-trimmed storefront and press **Demo slot**. Walking stops until you close the sheet.
- **Avatar** changes skin, hair, and outfit immediately. Choices stay in `localStorage` on this browser only.
- The district menu switches fictional procedural layouts without using location.
- **Use my location** is the only location control. Nothing prompts on load. Deny, timeout, and unavailable all leave you on the current synthetic district.
- **Reset local demo** clears the saved avatar, layout, and demo-credit balance on this device.

## What this build does

- Open-air plus-shaped promenade, corner parks, plaza, and curved storefronts. Black and gold accents, dusk lighting, one 1024 shadow map, procedural paving and plaster.
- Human-scale follow camera and a smooth mannequin (about 1.75 m). Not a low-poly block character, and not a scanned person.
- Collision so parks, the outer hedge, and an optional fountain are not walkable. Frame steps are capped so a hitch does not throw you across the street.
- Full-screen demo slot on the four named storefronts, using the **Gold Seahorse** cabinet as the default design (`DEFAULT_SLOT_DESIGN` in `src/lib/slotMath.ts`). The balance reads **DEMO CREDITS**, never HOMO. Opening it freezes walking; closing returns to the promenade. Stake is 1 demo credit. The gold panels are the real paytable: three H marks pay 10, jewels 8, arches 6, medallions 4. Two or three seahorses multiply that spin by 2, and a payout never exceeds 20. A sample feature button shows that state without changing the balance. Odds are a placeholder, not certified math. Balance, avatar, and chosen layout persist locally and can be reset.
- Optional one-shot coarse location. The reading is quantized to a roughly 5 km cell, then discarded. A hysteresis band ignores border jitter. The cell is not shown, not logged, and not written to storage.
- Previous multiplayer safeguards still apply: win events are checked, idle is not overwritten while you stand still, keys clear on blur, the joystick ignores other fingers, and a disconnected player stays grey for about 20 seconds.

## Quality limits

This is not photoreal. Slot symbols are original drawings shaded in the browser from a height field (key light, specular, and a darker underside). The seahorse is an upright side view: horse-like head bent down, a long snout, a small rounded coronet, one dorsal fin, subtle belly rings, and a tail that spirals forward. It has no legs. The cabinet is CSS lacquer: a soft vignette, a gold edge, and reel wells with inset shadow. A short reel blur plays during a spin and is skipped when reduced motion is on. It is not a photograph, a path-traced render, or any commercial game's art. The street has no photographic texture set, no HDRI, no real glass refraction, and no photogrammetry. Trees, hedges, and the body are smooth procedural meshes. Shadows are a single map. See `ASSETS.md`.

## Safeguards

- Location is off until **Use my location**. Failure does not block walking, avatar, or slots.
- Raw coordinates are not rendered, logged, or stored. Reloading forgets a coarse anchor; the saved layout is the manual one.
- Local save is prototype state on one browser. It is not an account and not authoritative.
- Incoming multiplayer wins still have to be a known store id, a play-money amount from 1 to 20, and at most one accepted win per connection per second.
- The Liveblocks public key is not authentication. A real deployment would need a secret-key auth endpoint. This prototype does not add one.

## Not in this build

- Real mall or street detection, paid maps, routing, or turn-by-turn guidance.
- On-site distance payouts. Placeholder coordinates in `src/lib/buildings.ts` are unused.
- Wallets, HOMO token balances, purchases, cashout, sweepstakes redemption, or real-value wagering.
- App Store / Play Store builds and production deployment.
- Entering interiors, certified slot math, and accounts.

## Later HOMO-token note

A future idea, **not implemented**, is a separate premium HOMO token used to buy or play higher-value slots, bonuses, or avatar items. That would be a real-value product. It needs a legal review of gambling, money transmission, securities, and store rules in each market **before** any integration. Nothing in this demo is that product. Calling credits “demo” or “cosmetic” is not a substitute for that review, and this repo does not claim the idea is legal.

## Liveblocks and Vercel notes

Liveblocks setup is unchanged and optional. `vercel.json` is only a static config for a possible later deploy. This prototype pass does not deploy.
