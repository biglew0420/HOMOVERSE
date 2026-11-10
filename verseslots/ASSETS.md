# Asset manifest

This prototype does not download meshes, photo textures, HDRIs, or avatar packs.

| Item | Source | License |
| --- | --- | --- |
| Storefront arches, glass, awnings, fountain, lamps, hedges, trees | Original geometry in `src/lib/storefrontGeo.ts` and `src/components/DistrictView.tsx` | Project code |
| Paving, park, and plaster textures | Original procedural canvases in `src/lib/textures.ts` | Project code |
| Player body | Original smooth mannequin in `src/components/Avatar.tsx` | Project code |
| Seahorse, H mark, jewel, arch, medallion | Original shapes in `src/components/slot/relief.ts`, shaded locally from a height field | Project code |
| Sign type | `@react-three/drei` `Text` (troika), already a dependency of this app | Package license |

No photogrammetry, no scanned streets, and no third-party character models. The look is a lit, textured 3D scene with curved storefronts. It is not photoreal.
