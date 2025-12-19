// project/src/hooks/util/useOutsideClick.ts
import { useEffect } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutsideClick: () => void
) {
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [ref, onOutsideClick]);
}