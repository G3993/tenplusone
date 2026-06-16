import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

/**
 * Record a seamless infinite-loop MP4 (H.264) from a canvas-drawing callback.
 *
 * The identity's idle motion (team3d colour-cycle + scanline scroll, glyph
 * wobble) is NOT cleanly periodic, so instead of trying to land on a period we
 * *boomerang*: play the recorded span forward, then back. The first and last
 * frames are identical by construction, so the clip loops perfectly for any
 * style. We start past the assemble-reveal (startTime ≥ 1.6s) so the loop is
 * pure idle motion, not assemble/disassemble.
 */
export interface LoopMp4Opts {
  /** square video size in px (also the size the drawFrame canvas ends up). */
  size: number;
  fps?: number;
  /** seconds of forward idle motion to capture (boomerang ~doubles wall time). */
  forwardSeconds?: number;
  /** engine time to start at — past the reveal so the loop is idle motion. */
  startTime?: number;
  bitrate?: number;
  /** draw one frame at engine `time` onto `canvas` (renderMotif sizes it). */
  drawFrame: (canvas: HTMLCanvasElement, time: number) => void;
  onProgress?: (done: number, total: number) => void;
}

// Whether the browser can encode H.264 via WebCodecs at all.
export function mp4Supported(): boolean {
  return typeof window !== 'undefined'
    && typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder !== 'undefined'
    && typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame !== 'undefined';
}

// Pick an H.264 codec string the encoder actually supports (main → baseline).
async function pickCodec(width: number, height: number, framerate: number, bitrate: number) {
  const VE = (window as unknown as { VideoEncoder: { isConfigSupported: (c: object) => Promise<{ supported?: boolean }> } }).VideoEncoder;
  for (const codec of ['avc1.4d0028', 'avc1.640028', 'avc1.42E028']) {
    try {
      const r = await VE.isConfigSupported({ codec, width, height, bitrate, framerate });
      if (r?.supported) return codec;
    } catch { /* try next */ }
  }
  return null;
}

export async function recordLoopMp4(opts: LoopMp4Opts): Promise<Blob> {
  const fps = opts.fps ?? 30;
  const fwdSec = opts.forwardSeconds ?? 2.2;
  const t0 = opts.startTime ?? 2;
  const bitrate = opts.bitrate ?? 9_000_000;
  const W = opts.size % 2 ? opts.size + 1 : opts.size;

  const codec = await pickCodec(W, W, fps, bitrate);
  if (!codec) throw new Error('H.264 encoding not supported in this browser');

  const canvas = document.createElement('canvas');

  // boomerang frame times: forward 0..N-1 then reverse N-2..1
  const fwd = Math.max(2, Math.round(fwdSec * fps));
  const times: number[] = [];
  for (let i = 0; i < fwd; i++) times.push(t0 + (i / (fwd - 1)) * fwdSec);
  for (let i = fwd - 2; i >= 1; i--) times.push(t0 + (i / (fwd - 1)) * fwdSec);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: W, height: W, frameRate: fps },
    fastStart: 'in-memory',
  });

  type EncCtor = new (init: { output: (c: unknown, m: unknown) => void; error: (e: unknown) => void }) => {
    configure: (c: object) => void;
    encode: (f: unknown, o?: object) => void;
    flush: () => Promise<void>;
    close: () => void;
    encodeQueueSize: number;
  };
  const VideoEncoder = (window as unknown as { VideoEncoder: EncCtor }).VideoEncoder;
  const VideoFrame = (window as unknown as { VideoFrame: new (src: CanvasImageSource, init: object) => { close: () => void } }).VideoFrame;

  let encErr: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk as never, meta as never),
    error: (e) => { encErr = e; },
  });
  encoder.configure({ codec, width: W, height: W, bitrate, framerate: fps });

  const usPerFrame = 1e6 / fps;
  for (let i = 0; i < times.length; i++) {
    if (encErr) throw encErr;
    opts.drawFrame(canvas, times[i]);
    const frame = new VideoFrame(canvas, { timestamp: Math.round(i * usPerFrame), duration: Math.round(usPerFrame) });
    encoder.encode(frame, { keyFrame: i % fps === 0 });
    frame.close();
    opts.onProgress?.(i + 1, times.length);
    // relieve back-pressure so the encoder queue drains
    if (encoder.encodeQueueSize > fps) await new Promise((r) => setTimeout(r, 0));
  }
  await encoder.flush();
  encoder.close();
  if (encErr) throw encErr;
  muxer.finalize();
  return new Blob([target.buffer], { type: 'video/mp4' });
}
