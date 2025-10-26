// project/src/hooks/useModals.tsx
"use client";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";

export type PopupDisplayItem = {
  type: string;
  id: number;
  title: string;
};

export function useModals() {
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const promptContinue = async (
    text: string,
    threeOptions: boolean,
    onNoSave: () => void,
    onContinue: () => void,
    displayItems?: PopupDisplayItem[]
  ) => {
    setModal2({
      ...modal2,
      open: !modal2.open,
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

  return {
    promptContinue,
  };
}
