// project/src/functions/Variables.tsx
import { capitalizeFirstLetter } from "./Data";

export const cleanVariableKey = (key: string) => {
  return capitalizeFirstLetter(key.replace("_", " "));
};
