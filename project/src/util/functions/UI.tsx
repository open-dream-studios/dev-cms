// project/src/util/functions/UI.tsx
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "./Data";
import { appDetails } from "@open-dream/shared";

export const formatDropdownOption = (option: string) => {
  return option
    .split("_")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};

export const showSingleToast = (
  success: boolean,
  key: string,
  message: string,
) => {
  const successKey = `${key}-${success ? "success" : "error"}`;
  if (toast.isActive(successKey)) {
    toast.update(successKey, {
      render: message,
      type: success ? "success" : "warning",
      autoClose: 3000,
      progress: 0,
    });
  } else {
    if (success) {
      toast.success(message, {
        toastId: successKey,
        autoClose: 3000,
      });
    } else {
      toast.warn(message, {
        toastId: successKey,
        autoClose: 3000,
      });
    }
  }
};

export const getClampedViewHeight = (
  minHeight: number,
  maxHeight: number,
  screenHeight: number | undefined,
) => {
  if (typeof screenHeight === "undefined") return minHeight;
  const h = screenHeight - appDetails.nav_height;
  return Math.max(minHeight, Math.min(maxHeight, h));
};
