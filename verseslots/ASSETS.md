# Asset manifest

Photo textures and the dusk HDRI are CC0 from Poly Haven, compressed to 1K / 512 WebP (or the original 1K HDR). They are not scans of a real street and are tinted toward the house black-and-gold palette. Geometry, characters, and audio stay original to this project. No Kenney kits were used.

| Item | Source | License |
| --- | --- | --- |
| Joburg Central Sunset 1K HDRI (`public/env/sunset_jhbcentral_1k.hdr`) | Poly Haven — photography by Dimitrios Savva, processing by Greg Zaal | CC0 1.0 |
| Cobblestone Floor 13 (plaza paving) | Poly Haven — Rob Tuytel | CC0 1.0 |
| Asphalt 02 (outer ground) | Poly Haven — Rob Tuytel | CC0 1.0 |
| Dark Brick Wall | Poly Haven — photography by Dimitrios Savva, processing by Dario Barresi | CC0 1.0 |
| Stone Tiles | Poly Haven — Christopher Melani | CC0 1.0 |
| Plastered Wall 04 | Poly Haven — Rob Tuytel | CC0 1.0 |
| Granite Tile (color-tinted as black marble) | Poly Haven — Charlotte Baglioni | CC0 1.0 |
| Dark Wooden Planks | Poly Haven — Amal Kumar | CC0 1.0 |
| Velour Velvet | Poly Haven — photography by colormass, processing by Rico Cilliers | CC0 1.0 |
| Storefronts, awnings, cornices, pilasters, door frames, fountain, lamps, trees, bench | Original geometry in `src/components/DistrictView.tsx`, `Storefront.tsx`, and `src/lib/storefrontGeo.ts` | Project code |
| Player and NPC bodies | Original stylized figures in `Avatar.tsx`, `Npc.tsx`, and `CharacterBits.tsx` | Project code |
| Golden Hour symbols (gold H, crown, diamond, champagne) | Original height-field drawings in `src/components/slot/relief.ts` | Project code |
| Sign type | `@react-three/drei` `Text` (troika), already a dependency | Package license |
| Ambient sound | Original Web Audio oscillators and filtered noise in `src/lib/audio.ts` | Project code |
| Fallback canvases if a texture fails to load | Procedural maps in `src/lib/textures.ts` | Project code |

Poly Haven maps shipped as WebP (albedo at 1024, or 512 for the outer ground; normal and ARM packed maps at 512). KTX2 was skipped in this pass because a `toktx` toolchain was not available in the build environment; WebP keeps the payload near 1.1 MB plus a 1.5 MB HDRI.

The look is a lit, textured dusk boutique with PBR maps, an HDRI, shadows, optional AO and bloom, and AgX or ACES tone mapping. It is still a stylized stage set, not photoreal and not GTA.
