// project/src/hooks/util/useTesting.tsx
import { useEffect, useState } from "react";

export function useUI() {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [breakpoint, setBreakPoint] = useState<"sm" | "md" | "lg">("lg");

  // LOG SCREEN SIZE
  useEffect(() => {
    const handleResize = () => {
      // console.log(window.innerWidth, "px");
      setWindowWidth(window.innerWidth);

      const w = window.innerWidth;
      if (w < 768) setBreakPoint("sm");
      else if (w < 1024) setBreakPoint("md");
      else setBreakPoint("lg");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    windowWidth,
    breakpoint,
  };
}
