# Asset manifest

This build does not download photo textures, HDRIs, or avatar packs. Materials are original procedural canvases, not CC0 photos and not scans of a real street. If photo textures are added later, credit them here and keep them compressed.

| Item | Source | License |
| --- | --- | --- |
| Storefronts, awnings, cornices, door frames, fountain, lamps, trees, bench | Original geometry in `src/components/DistrictView.tsx` and `src/lib/storefrontGeo.ts` | Project code |
| Paving, park, plaster, brick, stone, stucco, marble, wood, velvet | Original procedural canvases in `src/lib/textures.ts` | Project code |
| Player and NPC bodies | Original stylized mannequins in `src/components/Avatar.tsx` and `src/components/Npc.tsx` | Project code |
| Golden Hour symbols (gold H, crown, diamond, champagne) | Original height-field drawings in `src/components/slot/relief.ts` | Project code |
| Sign type | `@react-three/drei` `Text` (troika), already a dependency | Package license |
| Ambient sound | Original Web Audio oscillators and filtered noise in `src/lib/audio.ts` | Project code |

No photogrammetry, no scanned streets, and no third-party character models. The look is a lit, textured 3D scene with stylized boutique fronts. It is not photoreal.
