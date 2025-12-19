// project/src/hooks/util/useTesting.tsx
import { useEffect } from "react";

export function useTesting() {
  // LOG SCREEN SIZE
  useEffect(() => {
    const handleResize = () => {
      console.log(window.innerWidth, "px");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {};
}
