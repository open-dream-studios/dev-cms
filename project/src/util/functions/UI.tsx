// project/src/util/functions/UI.tsx
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "./Data";
import appDetails from "@/util/appDetails.json";

export const formatDropdownOption = (option: string) => {
  return option
    .split("_")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};

export const showSuccessToast = (ID: string, message: string) => {
  if (toast.isActive(ID)) {
    toast.update(ID, {
      render: message,
      type: "success",
      autoClose: 3000,
      progress: 0,
    });
  } else {
    toast.success(message, {
      toastId: ID,
      autoClose: 3000,
    });
  }
};

export const getClampedViewHeight = (
  minHeight: number,
  maxHeight: number,
  screenHeight: number | undefined
) => {
  if (typeof screenHeight === "undefined") return minHeight;
  const h = screenHeight - appDetails.nav_height;
  return Math.max(minHeight, Math.min(maxHeight, h));
};
