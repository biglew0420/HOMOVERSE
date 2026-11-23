export const frameStats = { frames: 0, lastStep: 0, maxDt: 0, fps: 0, acc: 0, time: 0 };

export function tickFrameStats(dt: number) {
  frameStats.frames += 1;
  frameStats.maxDt = Math.max(frameStats.maxDt, dt);
  frameStats.lastStep = dt;
  frameStats.acc += 1;
  frameStats.time += dt;
  if (frameStats.time >= 0.5) {
    frameStats.fps = frameStats.acc / frameStats.time;
    frameStats.acc = 0;
    frameStats.time = 0;
  }
}
