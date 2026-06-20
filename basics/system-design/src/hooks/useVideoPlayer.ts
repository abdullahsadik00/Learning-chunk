import { useEffect, useRef, useState } from 'react';
import type React from 'react';

interface VideoPlayerState {
  currentLevel: number;
  levels: Array<{ bitrate: number; width: number; height: number }>;
  buffered: number;
  isHLSSupported: boolean;
}

export function useVideoPlayer(
  videoRef: React.RefObject<HTMLVideoElement>,
  src: string
) {
  const [state, setState] = useState<VideoPlayerState>({
    currentLevel: -1,
    levels: [],
    buffered: 0,
    isHLSSupported: false,
  });
  const hlsRef = useRef<import('hls.js').default | null>(null);

  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;

    async function init() {
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported()) {
        setState(s => ({ ...s, isHLSSupported: true }));
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
          setState(s => ({
            ...s,
            levels: data.levels.map(l => ({
              bitrate: l.bitrate,
              width: l.width ?? 0,
              height: l.height ?? 0,
            })),
          }));
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
          setState(s => ({ ...s, currentLevel: data.level }));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
      }
    }

    void init();

    const onProgress = () => {
      if (video.buffered.length) {
        setState(s => ({
          ...s,
          buffered: (video.buffered.end(0) / video.duration) * 100,
        }));
      }
    };
    video.addEventListener('progress', onProgress);

    return () => {
      hlsRef.current?.destroy();
      video.removeEventListener('progress', onProgress);
    };
  }, [src, videoRef]);

  const setLevel = (level: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = level;
    setState(s => ({ ...s, currentLevel: level }));
  };

  return { ...state, setLevel };
}
