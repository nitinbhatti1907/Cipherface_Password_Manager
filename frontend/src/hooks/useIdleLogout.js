import { useEffect, useRef, useState } from "react";

const defaultTimeout = Number(import.meta.env.VITE_IDLE_TIMEOUT_MS || 600000);

export default function useIdleLogout({ enabled, onIdle, timeoutMs = defaultTimeout }) {
  const timerRef = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(timeoutMs / 1000));

  useEffect(() => {
    if (!enabled) return undefined;

    const reset = () => {
      window.clearTimeout(timerRef.current);
      const expiresAt = Date.now() + timeoutMs;
      setSecondsLeft(Math.floor(timeoutMs / 1000));

      timerRef.current = window.setTimeout(() => {
        onIdle?.();
      }, timeoutMs);

      const interval = window.setInterval(() => {
        setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      }, 1000);

      return interval;
    };

    let interval = reset();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      if (interval) window.clearInterval(interval);
      interval = reset();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      window.clearTimeout(timerRef.current);
      if (interval) window.clearInterval(interval);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [enabled, onIdle, timeoutMs]);

  return secondsLeft;
}
