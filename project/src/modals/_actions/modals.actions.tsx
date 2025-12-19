// project/src/hooks/useModals.tsx
"use client";
import Modal2Continue from "@/modals/Modal2Continue";
import { useUiStore } from "@/store/useUIStore";

export type PopupDisplayItem = {
  type: string;
  id: number;
  title: string;
};

export const promptContinue = async (
  text: string,
  threeOptions: boolean,
  onNoSave: () => void,
  onContinue: () => void,
  displayItems?: PopupDisplayItem[]
) => {
  const { modal2, setModal2 } = useUiStore.getState();
  setModal2({
    ...modal2,
    open: true,
    showClose: false,
    offClickClose: true,
    width: "w-[320px]",
    maxWidth: "max-w-[400px]",
    aspectRatio: "",
    borderRadius: "rounded-[12px] md:rounded-[15px]",
    content: (
      <Modal2Continue
        text={text}
        onContinue={onContinue}
        threeOptions={threeOptions}
        onNoSave={onNoSave}
        displayItems={displayItems}
      />
    ),
  });
};
