import { EffectComposer, Bloom, N8AO } from '@react-three/postprocessing';
import type { QualitySettings } from '../lib/quality';

export function SceneEffects({ quality }: { quality: QualitySettings }) {
  if (!quality.ao && !quality.bloom) return null;
  return (
    <EffectComposer enableNormalPass={quality.ao} multisampling={0}>
      {quality.ao ? <N8AO aoRadius={0.85} intensity={1.45} distanceFalloff={1.1} /> : <></>}
      {quality.bloom ? <Bloom luminanceThreshold={0.88} intensity={0.4} mipmapBlur radius={0.45} /> : <></>}
    </EffectComposer>
  );
}
