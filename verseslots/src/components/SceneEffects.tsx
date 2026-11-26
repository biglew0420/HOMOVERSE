import { EffectComposer, Bloom, N8AO, SMAA, Vignette } from '@react-three/postprocessing';
import type { QualitySettings } from '../lib/quality';

export function SceneEffects({ quality }: { quality: QualitySettings }) {
  if (!quality.ao && !quality.bloom && !quality.vignette && !quality.smaa) return null;
  return (
    <EffectComposer enableNormalPass={quality.ao} multisampling={0}>
      {quality.smaa ? <SMAA /> : <></>}
      {quality.ao ? <N8AO aoRadius={0.55} intensity={1.25} distanceFalloff={1} /> : <></>}
      {quality.bloom ? <Bloom luminanceThreshold={0.78} intensity={0.42} mipmapBlur radius={0.42} /> : <></>}
      {quality.vignette ? <Vignette eskil={false} offset={0.18} darkness={0.46} /> : <></>}
    </EffectComposer>
  );
}
