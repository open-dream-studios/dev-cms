// project/src/hooks/useAutoSave.tsx
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";
import { useRef, useCallback, useEffect } from "react";

export type DelayType = "fast" | "slow" | number;

export type UseAutoSaveOptions = {
  onSave: () => Promise<void> | void;
  fastDelay?: number;
  slowDelay?: number;
};

export function useAutoSave({
  onSave,
  fastDelay = 200,
  slowDelay = 2000,
}: UseAutoSaveOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getDelay = (delay: DelayType) => {
    if (typeof delay === "number") return delay;
    if (delay === "fast") return fastDelay;
    return slowDelay;
  };

  const startTimer = useCallback(
    (delay: DelayType) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        await onSave();
      }, getDelay(delay));
    },
    [onSave, fastDelay, slowDelay]
  );

  const resetTimer = useCallback(
    (delay: DelayType) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      startTimer(delay);
    },
    [startTimer]
  );

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // ⚠️ Important: run onSave once and only once
        // But defer it to the event loop to avoid React teardown loops
        Promise.resolve().then(() => onSave());
      }
    };
  }, []);

  return { startTimer, resetTimer, cancelTimer };
}
