// project/src/util/functions/UI.tsx
import { capitalizeFirstLetter } from "./Data";

export const formatDropdownOption = (option: string) => {
  return option
    .split("_")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};
