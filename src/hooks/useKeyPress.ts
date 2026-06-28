import { useEffect, useRef, useCallback } from 'react';

export function useKeyPress(key: string, onPress: () => void, active = true) {
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === key || e.key === key) {
        e.preventDefault();
        onPressRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, active]);
}

export function useKeyHold(key: string, active = true) {
  const heldRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => { if (e.code === key || e.key === key) heldRef.current = true; };
    const up = (e: KeyboardEvent) => { if (e.code === key || e.key === key) heldRef.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [key, active]);

  const isHeld = useCallback(() => heldRef.current, []);
  return isHeld;
}
