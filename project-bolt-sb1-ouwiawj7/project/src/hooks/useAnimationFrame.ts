import { useEffect, useRef } from 'react';

export function useAnimationFrame(callback: (dt: number) => void, active = true) {
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return;
    const loop = (now: number) => {
      const dt = lastRef.current ? Math.min((now - lastRef.current) / 1000, 0.1) : 0.016;
      lastRef.current = now;
      cbRef.current(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);
}
