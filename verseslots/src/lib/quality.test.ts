import { describe, expect, it } from 'vitest';
import {
  detectDefaultQuality,
  dprRange,
  isQualityId,
  loadQualityId,
  lodLevel,
  qualitySettings,
} from './quality';

describe('quality tiers', () => {
  it('defaults High on a desktop-class device, Medium on phones, Low on tiny GPUs', () => {
    expect(detectDefaultQuality({ deviceMemory: 8, hardwareConcurrency: 8, userAgent: 'Mozilla/5.0' })).toBe('high');
    expect(detectDefaultQuality({ deviceMemory: 4, hardwareConcurrency: 6, userAgent: 'Mozilla/5.0 (iPhone)' })).toBe('medium');
    expect(detectDefaultQuality({ deviceMemory: 2, hardwareConcurrency: 4, userAgent: 'Mozilla/5.0' })).toBe('low');
    expect(isQualityId('high') && isQualityId('medium') && isQualityId('low')).toBe(true);
    expect(isQualityId('ultra')).toBe(false);
  });

  it('caps device pixel ratio, especially on phones', () => {
    expect(dprRange('high', 3, false)).toEqual([1, 2]);
    expect(dprRange('high', 3, true)).toEqual([1, 1.5]);
    expect(dprRange('medium', 3, false)).toEqual([1, 1.5]);
    expect(dprRange('medium', 3, true)).toEqual([1, 1.25]);
    expect(dprRange('low', 3, true)).toEqual([1, 1]);
  });

  it('turns off the heavy passes on Low and keeps High with AO, bloom, shadows, and the HDRI', () => {
    const high = qualitySettings('high', { devicePixelRatio: 2 });
    const low = qualitySettings('low', { devicePixelRatio: 3, userAgent: 'iPhone' });
    expect(high.ao && high.bloom && high.env && high.shadows && high.softShadows && high.vignette && high.smaa).toBe(true);
    expect(high.toneMapping).toBe('agx');
    expect(low.ao || low.bloom || low.env || low.shadows || low.dust || low.vignette || low.smaa).toBe(false);
    expect(low.dpr).toEqual([1, 1]);
    expect(lodLevel(3, high)).toBe('near');
    expect(lodLevel(12, high)).toBe('mid');
    expect(lodLevel(22, high)).toBe('far');
    expect(loadQualityId('{"v":1,"id":"low"}')).toBe('low');
    expect(loadQualityId(null, { deviceMemory: 16, hardwareConcurrency: 12, userAgent: 'Desktop' })).toBe('high');
  });
});
