// project/src/util/functions/UI.tsx
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "./Data";

export const formatDropdownOption = (option: string) => {
  return option
    .split("_")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};

export const showRotatedToast = (ID: string) => {
  if (toast.isActive(ID)) {
    toast.update(ID, {
      render: "Image rotated",
      type: "success",
      autoClose: 3000,
      progress: 0,
    });
  } else {
    toast.success("Image rotated", {
      toastId: ID,
      autoClose: 3000,
    });
  }
};
