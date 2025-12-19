// project/src/styles/themeStyles.ts
export const getInnerCardStyle = (theme: "dark" | "light", t: any) => ({
  background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
  border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : "none",
});

export const getCardStyle = (theme: "dark" | "light", t: any) => ({
  background:
    theme === "dark"
      ? "linear-gradient(180deg, #1E1E1E, #1A1A1A)" 
      : t.background_1,
  boxShadow: theme === "dark" ? "none" : "0 0 15px 1px rgba(0, 0, 0, 0.15)",
  border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "none",
});